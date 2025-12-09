import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db'; 

async function verifyCustomer(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    if (!token) return { isCustomer: false, error: 'Authentication required.', status: 401 };
    try {
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        return { isCustomer: true, user: decoded };
    } catch (error) {
        return { isCustomer: false, error: 'Invalid token', status: 401 };
    }
}

export async function GET(request) {
    const authCheck = await verifyCustomer(request);
    if (!authCheck.isCustomer) return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });

    const userId = authCheck.user.id;

    let connection;
    try {
        connection = await pool.getConnection();

        // ดึงออเดอร์ทั้งหมดของ User นี้ พร้อมข้อมูลร้านค้า
        const [rows] = await connection.execute(
            `SELECT oc.*, r.name as restaurant_name, r.image_url as restaurant_image
             FROM OrderCart oc
             JOIN Restaurant r ON oc.Restaurant_Id = r.Restaurant_Id
             WHERE oc.User_Id = ?
             ORDER BY oc.created_at DESC`, // เรียงจากล่าสุดไปเก่าสุด
            [userId]
        );

        connection.release();
        return NextResponse.json({ orders: rows }, { status: 200 });

    } catch (error) {
        if (connection) connection.release();
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}