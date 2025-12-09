import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db'; //
import { writeFile } from 'fs/promises'; //
import path from 'path';                //
import { mkdir } from 'fs/promises';    //

// --- 1. คัดลอกฟังก์ชัน verifyAdmin มา (เหมือนใน app/api/admin/users/route.js) ---
//
async function verifyAdmin(request) {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('auth-token');
    if (!token) return { isAdmin: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') { 
            return { isAdmin: false, error: 'Forbidden: Admin access required.', status: 403 };
        }
        return { isAdmin: true, adminUser: decoded };
    } catch (error) {
        return { isAdmin: false, error: 'Invalid or expired token.', status: 401 };
    }
}

// --- 2. API สำหรับ GET (ดึง Banner ทั้งหมดให้ Admin เห็น) ---
export async function GET(request) {
    const authCheck = await verifyAdmin(request);
    if (!authCheck.isAdmin) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }
    
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM hero_banners ORDER BY sort_order ASC, created_at DESC');
        connection.release();
        return NextResponse.json({ banners: rows });
    } catch (error) {
        if (connection) connection.release();
        return NextResponse.json({ message: 'Failed to fetch banners' }, { status: 500 });
    }
}

// --- 3. API สำหรับ POST (Admin อัปโหลดรูปใหม่) ---
export async function POST(request) {
    const authCheck = await verifyAdmin(request);
    if (!authCheck.isAdmin) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    let connection;
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image');

        if (!imageFile || !imageFile.name) {
            return NextResponse.json({ message: 'Image file is required.' }, { status: 400 });
        }

        // --- 4. บันทึกไฟล์ (เหมือนตอนสร้างร้าน/เมนู แต่เปลี่ยน Path) ---
        const filename = `banner-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/banners'); // 👈 โฟลเดอร์ใหม่
        const filePath = path.join(uploadDir, filename);
        
        try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

        const buffer = Buffer.from(await imageFile.arrayBuffer());
        await writeFile(filePath, buffer);
        const imageUrl = `/uploads/banners/${filename}`; // 👈 Path ที่จะเก็บลง DB

        // --- 5. บันทึกลง DB ---
        connection = await pool.getConnection();
        const [insertResult] = await connection.execute(
            'INSERT INTO hero_banners (image_url, is_active, sort_order, created_at) VALUES (?, true, 0, NOW())',
            [imageUrl]
        );
        const newBannerId = insertResult.insertId;
        connection.release();

        return NextResponse.json({ 
            message: 'Banner uploaded successfully.', 
            newBanner: {
                Banner_Id: newBannerId,
                image_url: imageUrl,
                is_active: true,
                sort_order: 0
            }
        }, { status: 201 });

    } catch (error) {
        if (connection) connection.release();
        console.error('POST /api/admin/banners error:', error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}