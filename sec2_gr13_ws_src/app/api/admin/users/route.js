import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db'; // <-- ตรวจสอบ Path
import bcrypt from 'bcrypt';

// --- ฟังก์ชัน Helper สำหรับตรวจสอบ Admin ---
async function verifyAdmin(request) {
    const cookieStore = await cookies(); // <-- Added await
    const token = cookieStore.get('auth-token');
    if (!token) return { isAdmin: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        // --- 🎯 ตรวจสอบ Role ---
        if (decoded.role !== 'admin') { // <-- เช็คว่าเป็น admin
            return { isAdmin: false, error: 'Forbidden: Admin access required.', status: 403 };
        }
        // ส่งข้อมูล Admin กลับไป (เผื่อต้องใช้ ID)
        return { isAdmin: true, adminUser: decoded };
    } catch (error) {
        console.error("[API Verify Admin] Token verification error:", error.message);
        return { isAdmin: false, error: 'Invalid or expired token.', status: 401 };
    }
}

// // Testing Get All Users (Admin)
// // method: GET
// // URL: http://localhost:3001/api/admin/users
// // (ต้อง Login เป็น Admin ก่อน)
//


// // Testing Get  Users (id)
// // method: GET
// // URL: http://localhost:3001/api/admin/users/1
// // (ต้อง Login เป็น Admin ก่อน)
//


// // Testing update users 
// // method: PUT
// // URL: http://localhost:3001/api/admin/users/1
// // Body (raw, JSON): {
//      "username": "postman_UPDATED",
//      "email": "test@postman.com",
 //     "phone": "0811111111",
 //     "role": "shop"
//            }




// // Testing Insert a new User (Admin)
// // method: POST
// // URL: http://localhost:3001/api/admin/users
// // body: raw JSON
// // {
// //   "username": "postman_test_user",
// //   "email": "test@postman.com",
// //   "phone": "0899999999",
// //   "password": "password123",
// //   "role": "customer"
// // 
// // 
//

// // Testing Delete User (Admin)
// // method: DELETE
// // URL: http://localhost:3001/api/admin/users/1
// // (ต้อง Login เป็น Admin ก่อน / เลข 1 คือ ID ของ user ที่ต้องการลบ และต้องไม่ใช่ Admin ที่กำลัง Login อยู่)
//

// --- API Handler สำหรับ GET (ดึง User ทั้งหมด) ---
export async function GET(request) {
    // --- 1. ตรวจสอบสิทธิ์ Admin ---
    const authCheck = await verifyAdmin(request);
    if (!authCheck.isAdmin) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    // --- 2. Query ข้อมูล User ทั้งหมด ---
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("[API GET /admin/users] Fetching all users for Admin:", authCheck.adminUser.username);

        // --- 🎯 ตรวจสอบชื่อตารางและคอลัมน์ให้ตรงกับ ERD ---
        // เลือกเฉพาะคอลัมน์ที่จำเป็นสำหรับแสดงในตาราง Admin
        // ERD ของคุณมี User_Id, username, email, user_role (ไม่มี status แยก)
        const [rows] = await connection.execute(
            'SELECT id, username, email, role FROM users ORDER BY created_at DESC', // <-- ใช้ชื่อคอลัมน์จาก ERD และตั้งชื่อ Alias (as) ให้ตรงกับ Frontend
            // 'SELECT User_Id as id, username, email, user_role as role, status FROM User ORDER BY created_at DESC' // <-- ถ้ามีคอลัมน์ status
        );
        connection.release();

        // --- 3. ส่งข้อมูล Users กลับไป ---
        // Frontend คาดหวัง field: id, name (ใช้ username แทน), email, role, status (ตอนนี้ยังไม่มี status จาก DB)
        // เราจะส่งข้อมูลตามที่ Query มาก่อน
        return NextResponse.json({ users: rows }, { status: 200 });

    } catch (error) {
        console.error('GET /api/admin/users error:', error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}




export async function POST(request) {
    // 1. ตรวจสอบสิทธิ์ Admin
    const authCheck = await verifyAdmin(request);
    if (!authCheck.isAdmin) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    let connection;
    try {
        const { username, email, phone, password, role } = await request.json();

        // 2. Validation
        if (!username || !email || !password || !role) {
            return NextResponse.json({ message: 'Username, email, password, and role are required.' }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
        }
        const allowedRoles = ['customer', 'shop', 'admin'];
        if (!allowedRoles.includes(role.toLowerCase())) {
            return NextResponse.json({ message: 'Invalid role specified.' }, { status: 400 });
        }

        connection = await pool.getConnection();

        // 3. ตรวจสอบ Email ซ้ำ
        const [existingUsers] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            connection.release();
            return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
        }

        // 4. Hash รหัสผ่าน และ Insert
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute(
            'INSERT INTO users (username, email, phone, password, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [username, email, phone || null, hashedPassword, role.toLowerCase()]
        );
        connection.release();

        return NextResponse.json({ message: 'User created successfully by admin.' }, { status: 201 });

    } catch (error) {
        console.error('POST /api/admin/users error:', error);
        if (connection) connection.release();
        if (error instanceof SyntaxError) { return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 }); }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}

