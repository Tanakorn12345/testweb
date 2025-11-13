import { NextResponse } from 'next/server';
import pool from '../../../../../lib/db';
import { cookies } from 'next/headers'; // (จำเป็นสำหรับ verifyCustomer)
import jwt from 'jsonwebtoken'; // (จำเป็นสำหรับ verifyCustomer)

// --- คัดลอกฟังก์ชัน verifyCustomer มา (เหมือนใน API อื่นๆ) ---
async function verifyCustomer(request) {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('auth-token');
    if (!token) return { isCustomer: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        if (decoded.role !== 'customer') { 
            return { isCustomer: false, error: 'Forbidden: Customer access required.', status: 403 };
        }
        return { isCustomer: true, customerUser: decoded };
    } catch (error) {
        return { isCustomer: false, error: 'Invalid or expired token.', status: 401 };
    }
}


export async function GET(request, context) {
    const { params } = await context;       // 👈 2. Await context
    const { orderId } = params;             // 👈 3. ตอนนี้ orderId ปลอดภัยแล้ว

    // --- 1. ตรวจสอบสิทธิ์ ---
    const authCheck = await verifyCustomer(request);
    if (!authCheck.isCustomer) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }
    const customerUserId = authCheck.customerUser.id;

    let connection;
    try {
        connection = await pool.getConnection();

        // --- 2. ตรวจสอบว่า Order นี้เป็นของ User คนนี้จริง ---
        const [orderCheck] = await connection.execute(
            'SELECT OrderCart_Id FROM OrderCart WHERE OrderCart_Id = ? AND User_Id = ?',
            [orderId, customerUserId]
        );

        if (orderCheck.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Order not found or access denied.' }, { status: 404 });
        }

        // --- 3. ดึงรายการเมนูใน Order นั้น (JOIN กับตาราง Menu เพื่อเอาชื่อและรูป) ---
        const [items] = await connection.execute(
            `SELECT 
                oi.Menu_Id, 
                m.name as menuName, 
                m.image_url as menuImage
             FROM OrderItem oi
             JOIN Menu m ON oi.Menu_Id = m.Menu_Id
             WHERE oi.OrderCart_Id = ?`,
            [orderId]
        );
        
        connection.release();

        // --- 4. ตรวจสอบว่ามีรีวิวสำหรับรายการเหล่านี้หรือยัง ---
        // (ขั้นตอนนี้สำคัญมาก เพื่อไม่ให้ลูกค้ารีวิวซ้ำ)
        const reviewsConnection = await pool.getConnection();
        const [existingReviews] = await reviewsConnection.execute(
            'SELECT Menu_Id FROM Review WHERE OrderCart_Id = ?',
            [orderId]
        );
        reviewsConnection.release();
        
        // สร้าง Set ของ Menu_Id ที่รีวิวไปแล้ว
        const reviewedMenuIds = new Set(existingReviews.map(r => r.Menu_Id));

        // กรองเอาเฉพาะเมนูที่ "ยังไม่ได้รีวิว"
        const itemsToReview = items.filter(item => !reviewedMenuIds.has(item.Menu_Id));

        return NextResponse.json({ items: itemsToReview });

    } catch (error) {
        if (connection) connection.release();
        console.error(`GET /api/orders/${orderId}/items error:`, error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}