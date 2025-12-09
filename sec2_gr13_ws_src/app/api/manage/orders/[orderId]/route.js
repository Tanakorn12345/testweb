import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../../lib/db'; // ปรับ path ให้ถูกตามโครงสร้างโฟลเดอร์

// (ใส่ฟังก์ชัน verifyShopOwner เหมือนเดิม หรือ import มาก็ได้)
async function verifyShopOwner(request) { /* ...Code เดียวกับข้างบน... */ 
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    if (!token) return { isShopOwner: false, error: 'Authentication required.', status: 401 };
    try {
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        if (decoded.role !== 'shop') return { isShopOwner: false, error: 'Forbidden', status: 403 };
        return { isShopOwner: true, shopUser: decoded };
    } catch (error) {
        return { isShopOwner: false, error: 'Invalid token', status: 401 };
    }
}

export async function PATCH(request, { params }) {
    // 1. ตรวจสอบสิทธิ์
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });

    const { orderId } = params;
    const { status } = await request.json(); // รับค่า status ใหม่จากหน้าเว็บ

    // ตรวจสอบค่า Status ว่าถูกต้องตาม ENUM ใน DB ไหม
    const validStatuses = ['Pending', 'Cooking', 'Ready', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        // 2. อัปเดตสถานะใน DB
        await connection.execute(
            'UPDATE OrderCart SET status = ? WHERE OrderCart_Id = ?',
            [status, orderId]
        );
        connection.release();

        return NextResponse.json({ message: 'Status updated', status }, { status: 200 });
    } catch (error) {
        if (connection) connection.release();
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}