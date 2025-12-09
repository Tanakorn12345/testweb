import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db'; // ตรวจสอบ path ว่าถูกต้อง

// ... (ฟังก์ชัน verifyShopOwner คงเดิมไม่ต้องแก้) ...
async function verifyShopOwner(request) {
    // ... (code เดิม) ...
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
        return { isShopOwner: false, error: 'Invalid or expired token.', status: 401 };
    }
}

export async function GET(request) {
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    const ownerUserId = authCheck.shopUser.id;
    let connection;

    try {
        connection = await pool.getConnection();

        // 1. ดึงข้อมูลร้านค้า (เหมือนเดิม)
        const [rows] = await connection.execute(
            'SELECT * FROM Restaurant WHERE owner_user_id = ?',
            [ownerUserId]
        );

        if (rows.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Restaurant not found for this user.' }, { status: 404 });
        }

        const restaurantData = rows[0];

        // --- 🟢 ส่วนที่เพิ่มใหม่: คำนวณยอดขายวันนี้ (Today's Sales) ---
        // เลือกผลรวมของ total_amount จาก OrderCart ที่เป็นของร้านนี้ และวันที่ created_at คือวันนี้
        // และสถานะต้องไม่เป็น 'Cancelled'
        const [salesRows] = await connection.execute(
            `SELECT COALESCE(SUM(total_amount), 0) as total_sales 
             FROM OrderCart 
             WHERE Restaurant_Id = ? 
             AND DATE(created_at) = CURDATE() 
             AND status != 'Cancelled'`, 
            [restaurantData.Restaurant_Id]
        );
        
        const todaySales = salesRows[0].total_sales || 0;
        // -----------------------------------------------------------

        connection.release();

        // ส่งข้อมูลกลับไปทั้ง restaurant และ todaySales
        return NextResponse.json({ 
            restaurant: restaurantData,
            todaySales: todaySales 
        }, { status: 200 });

    } catch (error) {
        console.error('GET /api/manage/restaurant error:', error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}



//  เพิ่ม Method PATCH สำหรับอัปเดตข้อมูลร้านค้า
export async function PATCH(request) {
    // 1. ตรวจสอบสิทธิ์
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    const ownerUserId = authCheck.shopUser.id;

    try {
        const body = await request.json();
        // รับค่า opening_hours (เช่น "10:00 - 22:00") และ is_open (true/false)
        const { opening_hours, is_open } = body;

        const connection = await pool.getConnection();

        // 2. อัปเดตข้อมูลลง DB
        // ใช้ COALESCE เพื่อให้: ถ้าไม่ส่งค่ามา ให้ใช้ค่าเดิมใน DB (ไม่ทับด้วย null)
        await connection.execute(
            `UPDATE Restaurant 
             SET opening_hours = COALESCE(?, opening_hours), 
                 is_open = COALESCE(?, is_open) 
             WHERE owner_user_id = ?`,
            [opening_hours, is_open, ownerUserId]
        );

        connection.release();

        return NextResponse.json({ message: 'Restaurant updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error("PATCH /api/manage/restaurant error:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}