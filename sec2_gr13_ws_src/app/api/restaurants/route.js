import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../lib/db';
import { writeFile, unlink } from 'fs/promises'; 
import path from 'path';                
import { mkdir } from 'fs/promises'; 

// --- ฟังก์ชัน verifyShopOwner (เหมือนเดิม) ---
async function verifyShopOwner(request) {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('auth-token');
    if (!token) return { isShopOwner: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        if (decoded.role !== 'shop') {
            return { isShopOwner: false, error: 'Forbidden: Shop owner access required.', status: 403 };
        }
        return { isShopOwner: true, shopUser: decoded };
    } catch (error) {
        console.error("Token verification error:", error.message);
        return { isShopOwner: false, error: 'Invalid or expired token.', status: 401 };
    }
}

// --- POST: สร้างร้านค้า ---
export async function POST(request) {
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }
    const ownerUserId = authCheck.shopUser.id; 
    let connection;
    try {
        // รับ FormData
        const formData = await request.formData();
        const name = formData.get('name');
        const description = formData.get('description');
        const opening_hours = formData.get('opening_hours');
        const phone = formData.get('phone');
        const address = formData.get('address');
        const branch = formData.get('branch');
        const slug = formData.get('slug');
        const type = formData.get('type');
        const imageFile = formData.get('image'); 
        // 1. ดึงค่า latitude และ longitude จาก formData
        const latitude = formData.get('latitude');
        const longitude = formData.get('longitude');

        // Validation
        if (!name || !address || !phone) {
             return NextResponse.json({ message: 'Missing required fields (name, address, phone).' }, { status: 400 });
        }
        
        // ตรวจสอบร้านซ้ำ
        connection = await pool.getConnection();
        const [existingRestaurants] = await connection.execute(
            'SELECT Restaurant_Id FROM Restaurant WHERE owner_user_id = ?', 
            [ownerUserId]
        );
        if (existingRestaurants.length > 0) {
            connection.release(); 
            return NextResponse.json({ message: 'User already has a restaurant.' }, { status: 409 }); 
        }

        // จัดการรูปภาพ
        let imageUrl = null; 
        if (imageFile && imageFile.name) {
            const filename = `restaurant-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
            const uploadDir = path.join(process.cwd(), 'public/uploads/restaurants');
            const filePath = path.join(uploadDir, filename);
            try { await mkdir(uploadDir, { recursive: true }); } catch (e) { console.error("mkdir error", e); }
            const buffer = Buffer.from(await imageFile.arrayBuffer());
             try {
                await writeFile(filePath, buffer);
                imageUrl = `/uploads/restaurants/${filename}`; 
             } catch (writeError) { console.error(`Failed to write image file ${filePath}:`, writeError); }
        }

        // บันทึกลง DB (รวม branch, slug, type)
        const [insertResult] = await connection.execute(
            `INSERT INTO Restaurant 
                (name, description, opening_hours, phone, address, branch, slug, type, image_url, owner_user_id, created_at, is_open,latitude, longitude) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?,?, ?)`,
            [
                name,
                description || null,
                opening_hours || null,
                phone,
                address,
                branch || null,
                slug || null,
                type || null,
                imageUrl,
                ownerUserId,
                true,
                latitude || null, 
                longitude || null  
            ]
        );
        const newRestaurantId = insertResult.insertId;
        connection.release(); 

        return NextResponse.json({
            message: 'Restaurant created successfully.',
            restaurantId: newRestaurantId,
            imageUrl: imageUrl
        }, { status: 201 }); 

    } catch (error) {
        console.error('POST /api/restaurants error:', error);
        if (connection) connection.release(); 
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}

// --- GET: ดึงร้านค้าทั้งหมด ---
export async function GET(request) {
    let connection;
    try {
        connection = await pool.getConnection();

        // ดึงข้อมูลจริงจาก DB รวม branch, slug, type
        const [rows] = await connection.execute(
            `SELECT 
                Restaurant_Id as id,
                name,
                description,
                address,
                branch,
                slug,
                type,
                image_url as image,
                is_open,
                latitude,   -- 👈 เพิ่ม
                longitude,  -- 👈 เพิ่ม
                rating      -- 👈 เพิ่ม (สำหรับฟิลเตอร์ดาว)
            FROM Restaurant
            WHERE is_open = true`
        );
        connection.release();

        return NextResponse.json({ restaurants: rows }, { status: 200 });

    } catch (error) {
        console.error('GET /api/restaurants error:', error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}
