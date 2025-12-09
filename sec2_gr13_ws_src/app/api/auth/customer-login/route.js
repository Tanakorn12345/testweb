import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import bcrypt from 'bcrypt'; // 👈 1. Import bcrypt
import pool from '../../../../lib/db'; // 👈 2. Import connection pool

// // Testing Customer Login
// // method: POST
// // URL: http://localhost:3000/api/auth/customer-login
// // body: raw JSON
// // {
// //   "username": "Pimpitcha",
// //   "password": "Pimmie123"
// // }
//



export async function POST(request) {
    console.log("\n--- [API /customer-login] Checking JWT_SECRET ---");
    console.log("Value of process.env.JWT_SECRET:", process.env.JWT_SECRET);
    let connection;
    try {
        const { username, password } = await request.json();
        // --- Logic ใหม่: ตรวจสอบกับฐานข้อมูล ---
        connection = await pool.getConnection();

        // 3. ค้นหาผู้ใช้จาก email ในตาราง users
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE username = ?', [username]
            
        );

        // ถ้าไม่เจอผู้ใช้ หรือเจอมากกว่า 1 (ซึ่งไม่ควรเกิด) ให้ปฏิเสธ
        if (users.length !== 1) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const user = users[0];

        // 4. ตรวจสอบว่าผู้ใช้ที่เจอมี role เป็น 'customer' หรือไม่
        if (user.role !== 'customer') {
            return NextResponse.json({ message: 'Access denied for this role' }, { status: 403 }); // 403 Forbidden
        }

        // 5. เปรียบเทียบรหัสผ่านที่ส่งมากับ hash ในฐานข้อมูล
        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
        // ---------------------------------------------

        // (ส่วนสร้าง Token และ Cookie เหมือนเดิมทุกอย่าง)
        const token = jwt.sign(
            { id: user.id, username: user.username , email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const serializedCookie = serialize('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 60 * 60,
            path: '/',
        });

        const response = NextResponse.json({ message: 'Login successful' });
        response.headers.set('Set-Cookie', serializedCookie);
        
        return response;

    } catch (error) {
        console.error('Customer Login API error:', error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    } finally {
        if (connection) {
            connection.release(); // คืน connection กลับสู่ pool
        }
    }
}