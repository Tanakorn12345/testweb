import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../../lib/db'; //
import { unlink } from 'fs/promises'; ///route.js]
import path from 'path';              ///route.js]

// --- (คัดลอกฟังก์ชัน verifyAdmin มาไว้ที่นี่ด้วย) ---
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

export async function DELETE(request, context) {
    const { params } = await context; // 👈 Await context
    const { bannerId } = params;

    const authCheck = await verifyAdmin(request);
    if (!authCheck.isAdmin) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        // --- 1. ค้นหา Path รูปที่จะลบ (ก่อนลบ) ---
        const [rows] = await connection.execute('SELECT image_url FROM hero_banners WHERE banner_Id = ?', [bannerId]);
        if (rows.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Banner not found.' }, { status: 404 });
        }
        const imageUrlToDelete = rows[0].image_url;

        // --- 2. ลบออกจาก DB ---
        await connection.execute('DELETE FROM hero_banners WHERE banner_Id = ?', [bannerId]);
        connection.release();

        // --- 3. ลบไฟล์จริงออกจาก Server ---
        if (imageUrlToDelete && imageUrlToDelete.startsWith('/uploads/')) {
            try {
               const imagePath = path.join(process.cwd(), 'public', imageUrlToDelete);
               await unlink(imagePath);
               console.log(`Deleted banner image: ${imagePath}`);
            } catch (deleteError) {
                // ถ้าลบไฟล์ไม่สำเร็จ ไม่เป็นไร แค่ Log ไว้
                console.error(`Could not delete banner image file ${imageUrlToDelete}:`, deleteError);
            }
        }
        
        return new Response(null, { status: 204 }); // 204 No Content = ลบสำเร็จ

    } catch (error) {
        if (connection) connection.release();
        console.error(`DELETE /api/admin/banners/${bannerId} error:`, error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}