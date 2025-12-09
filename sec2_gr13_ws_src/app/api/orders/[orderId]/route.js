import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db'; 

// ฟังก์ชันตรวจสอบสิทธิ์ลูกค้า
async function verifyCustomer(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    if (!token) return { isCustomer: false, error: 'Authentication required.', status: 401 };
    try {
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        // อนุญาตทั้ง Customer และ Shop (เผื่อร้านอยากดู) แต่หลักๆ คือ Customer
        return { isCustomer: true, user: decoded };
    } catch (error) {
        return { isCustomer: false, error: 'Invalid token', status: 401 };
    }
}

export async function GET(request, { params }) {
    const authCheck = await verifyCustomer(request);
    if (!authCheck.isCustomer) return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });

    const { orderId } = params;
    const userId = authCheck.user.id;

    let connection;
    try {
        connection = await pool.getConnection();

        // ดึงข้อมูลออเดอร์ + เช็คว่าเป็นของ User นี้จริงไหม
        const [rows] = await connection.execute(
            `SELECT oc.*, r.name as restaurant_name, r.phone as restaurant_phone
             FROM OrderCart oc
             JOIN Restaurant r ON oc.Restaurant_Id = r.Restaurant_Id
             WHERE oc.OrderCart_Id = ? AND oc.User_Id = ?`,
            [orderId, userId]
        );

        if (rows.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Order not found or access denied' }, { status: 404 });
        }

        const orderData = rows[0];
        connection.release();

        return NextResponse.json({ order: orderData }, { status: 200 });

    } catch (error) {
        if (connection) connection.release();
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}