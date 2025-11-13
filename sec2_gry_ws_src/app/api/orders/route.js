import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../lib/db'; // <-- ตรวจสอบ Path

// --- ฟังก์ชัน Helper สำหรับตรวจสอบ Customer ---
async function verifyCustomer(request) {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('auth-token');
    if (!token) return { isCustomer: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        // --- 🎯 ตรวจสอบ Role ---
        if (decoded.role !== 'customer') { // <-- 🎯 เช็คว่าเป็น 'customer'
            return { isCustomer: false, error: 'Forbidden: Customer access required.', status: 403 };
        }
        return { isCustomer: true, customerUser: decoded };
    } catch (error) {
        console.error("[API Verify Customer] Token verification error:", error.message);
        return { isCustomer: false, error: 'Invalid or expired token.', status: 401 };
    }
}

// --- API Handler สำหรับ POST (สร้าง Order ใหม่) ---
export async function POST(request) {
    // --- 1. ตรวจสอบสิทธิ์ Customer ---
    const authCheck = await verifyCustomer(request);
    if (!authCheck.isCustomer) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    const customerUserId = authCheck.customerUser.id; // ID ของลูกค้าที่สั่ง
    let connection;

    try {
        const { cartItems, total, paymentMethod } = await request.json();

        // --- 2. Validation ข้อมูล (เบื้องต้น) ---
        if (!cartItems || cartItems.length === 0 || !total || !paymentMethod) {
            return NextResponse.json({ message: 'Missing required order data (cartItems, total, paymentMethod).' }, { status: 400 });
        }
        
        // --- 3. (สำคัญ) เริ่มต้น Database Transaction ---
        // เราต้องใช้ Transaction เพราะเราจะ Insert ลง 3 ตาราง (OrderCart, Payment, OrderItem)
        // ถ้าตารางใดตารางหนึ่งพลาด ต้อง Rollback (ยกเลิก) ทั้งหมด
        connection = await pool.getConnection();
        await connection.beginTransaction(); // <-- เริ่ม Transaction

        // --- 4. ดึง Restaurant_Id จากเมนูแรก (สมมติว่า 1 ตะกร้า = 1 ร้าน) ---
        // (ERD ของคุณ  บอกว่า OrderCart เชื่อมกับ Restaurant_Id)
        if (!cartItems[0].restaurant || !cartItems[0].restaurant.id) {
             throw new Error('Restaurant ID missing from cart item.');
        }
        const restaurantId = cartItems[0].restaurant.id; // <-- 🎯 ตรวจสอบว่า `restaurant.id` ถูกส่งมาใน cartItems

        // --- 5. Insert ลงตาราง OrderCart ---
        const [orderCartResult] = await connection.execute(
            // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            'INSERT INTO OrderCart (User_Id, Restaurant_Id, total_amount, status, payment_status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [
                customerUserId,
                restaurantId,
                total,
                'Pending', // สถานะ Order เริ่มต้น
                'Unpaid'   // สถานะการจ่ายเงินเริ่มต้น (อาจจะเปลี่ยนเป็น 'Paid' ถ้าจ่ายเงินเลย)
            ]
        );
        const newOrderCartId = orderCartResult.insertId; // <-- เอา ID ที่เพิ่งสร้าง
        console.log(`OrderCart created with ID: ${newOrderCartId}`);

        // --- 6. Insert ลงตาราง Payment ---
        await connection.execute(
             // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            'INSERT INTO Payment (OrderCart_Id, payment_method, amount, status, created_at) VALUES (?, ?, ?, ?, NOW())',
            [
                newOrderCartId,
                paymentMethod, // 'cash' หรือ 'promptpay'
                total,
                'Pending' // สถานะการจ่ายเงิน
            ]
        );
        console.log(`Payment record created for OrderCart ID: ${newOrderCartId}`);

        // --- 7. Loop Insert ลงตาราง OrderItem ---
        const orderItemPromises = cartItems.map(item => {
            // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            // (ต้องแน่ใจว่า item.id คือ Menu_Id)
            return connection.execute(
                'INSERT INTO OrderItem (OrderCart_Id, Menu_Id, quantity, price) VALUES (?, ?, ?, ?)',
                [
                    newOrderCartId,
                    item.id, // <-- ID ของเมนู
                    item.quantity,
                    parseFloat(item.price.replace('฿', '')) // <-- ราคาต่อชิ้น
                ]
            );
        });
        
        await Promise.all(orderItemPromises); // รัน Insert ทั้งหมดพร้อมกัน
        console.log(`Inserted ${cartItems.length} items into OrderItem for OrderCart ID: ${newOrderCartId}`);
        
        // --- 8. ถ้าทุกอย่างสำเร็จ -> Commit Transaction ---
        await connection.commit();
        connection.release();

        console.log(`Order ${newOrderCartId} committed successfully.`);
        return NextResponse.json({ message: 'Order created successfully.', orderCartId: newOrderCartId }, { status: 201 });

    } catch (error) {
        // --- 9. ถ้ามี Error -> Rollback Transaction ---
        if (connection) {
            console.error('Order creation failed. Rolling back transaction...', error);
            await connection.rollback(); // <-- ยกเลิกทั้งหมด
            connection.release();
        } else {
            console.error('POST /api/orders error:', error);
        }
        if (error instanceof SyntaxError) { return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 }); }
        return NextResponse.json({ message: `An internal server error occurred: ${error.message}` }, { status: 500 });
    }
}
