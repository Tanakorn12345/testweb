import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../lib/db';

// --- (ฟังก์ชัน verifyCustomer เหมือนเดิม) ---
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

export async function POST(request) {
    const authCheck = await verifyCustomer(request);
    if (!authCheck.isCustomer) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }
    const customerUserId = authCheck.customerUser.id;
    let connection;

    try {
        // --- ⭐️ 1. รับข้อมูลแบบใหม่ (เป็น Array) ---
        const { orderCartId, reviews } = await request.json(); 

        if (!orderCartId || !Array.isArray(reviews) || reviews.length === 0) {
            return NextResponse.json({ message: 'Order ID and a list of reviews are required.' }, { status: 400 });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // --- 2. ตรวจสอบสิทธิ์ (เหมือนเดิม) ---
        const [orderRows] = await connection.execute(
            'SELECT Restaurant_Id FROM OrderCart WHERE OrderCart_Id = ? AND User_Id = ?',
            [orderCartId, customerUserId]
        );

        if (orderRows.length === 0) {
            await connection.rollback();
            connection.release();
            return NextResponse.json({ message: 'Order not found or access denied.' }, { status: 404 });
        }
        const restaurantId = orderRows[0].Restaurant_Id;

        // --- 3. Loop เพื่อ Insert รีวิวทีละเมนู ---
        for (const review of reviews) {
            const { menuId, rating, comment } = review;
            
            // Validation
            const numericRating = parseInt(rating, 10);
            if (!menuId || !rating || isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
                // ถ้ามีข้อมูลไม่ครบ ข้ามไป
                console.warn(`Skipping invalid review item: menuId=${menuId}, rating=${rating}`);
                continue;
            }

            // (ไม่จำเป็นต้องเช็ครีวิวซ้ำ เพราะ API GET ตอนนี้กรองให้แล้ว)
            // ⭐️ 4. INSERT โดยมี Menu_Id แล้ว ⭐️
            await connection.execute(
                'INSERT INTO Review (User_Id, Restaurant_Id, Menu_Id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [customerUserId, restaurantId, menuId, numericRating, comment || null]
            );
        }

        // --- 5. อัปเดต Rating เฉลี่ยของร้าน (ทำครั้งเดียว) ---
        const [avgRatingRows] = await connection.execute(
            'SELECT AVG(rating) as averageRating, COUNT(*) as reviewCount FROM Review WHERE Restaurant_Id = ?',
            [restaurantId]
        );
        // 1. ดึงค่าจาก DB (อาจจะเป็น String "4.5000" หรือ null)
        const avgRatingFromDB = avgRatingRows[0].averageRating;
        
        // 2. แปลงเป็นตัวเลข JavaScript (ถ้าเป็น null จะได้ 0)
        const newAverageRating = parseFloat(avgRatingFromDB) || 0; 
        const newReviewCount = avgRatingRows[0].reviewCount || 0;

        await connection.execute(
            'UPDATE Restaurant SET rating = ?, reviewCount = ? WHERE Restaurant_Id = ?',
            [newAverageRating.toFixed(2), newReviewCount, restaurantId]
        );

        // --- 6. ยืนยัน Transaction ---
        await connection.commit();
        connection.release();

        return NextResponse.json({ message: 'Reviews submitted successfully.' }, { status: 201 });

    } catch (error) {
        if (connection) {
            console.error('Review creation failed. Rolling back transaction...', error);
            await connection.rollback();
            connection.release();
        } else {
            console.error('POST /api/reviews error:', error);
        }
        // ⭐️ 7. ตอบกลับ Error ที่แท้จริง ⭐️
        return NextResponse.json({ message: `An internal server error occurred: ${error.message}` }, { status: 500 });
    }
}