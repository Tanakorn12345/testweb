import { NextResponse } from 'next/server';
import pool from '../../../lib/db'; //

export const dynamic = 'force-dynamic'; // บอก Next.js ให้ดึงข้อมูลใหม่เสมอ

export async function GET(request) {
    let connection;
    try {
        connection = await pool.getConnection();
        
        // ดึงเฉพาะ image_url ของ Banner ที่ is_active = true
        const [rows] = await connection.execute(
            'SELECT image_url FROM hero_banners WHERE is_active = true ORDER BY sort_order ASC, created_at DESC'
        );
        connection.release();
        
        // ส่งกลับไปเป็น Array ของ URLs
        const imageUrls = rows.map(row => row.image_url);
        return NextResponse.json({ images: imageUrls });

    } catch (error) {
        if (connection) connection.release();
        console.error('GET /api/banners error:', error);
        return NextResponse.json({ message: 'Failed to fetch banners' }, { status: 500 });
    }
}