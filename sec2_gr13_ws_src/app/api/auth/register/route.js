import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '../../../../lib/db';

export async function POST(request) {
    let connection;
    try {
        const { username, password, email, role, phone, shopName } = await request.json(); // 🟢 รับ shopName เพิ่ม (ถ้ามี)

        // 1. Validation (ตรวจสอบค่าว่าง)
        if (!username || !password || !email || !role) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction(); // เริ่ม Transaction (ทำพร้อมกัน ถ้าพังให้ยกเลิกหมด)

        // 2. เช็คว่ามี User นี้หรือยัง
        const [existingUser] = await connection.execute(
            'SELECT id FROM Users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            await connection.release();
            return NextResponse.json({ message: 'Username or Email already exists' }, { status: 409 });
        }

        // 3. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. สร้าง User ใหม่
        const [result] = await connection.execute(
            'INSERT INTO users (username, password, email, role, phone) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, email, role, phone || '']
        );

        const newUserId = result.insertId; // ได้ ID ของ User ที่เพิ่งสร้าง

        
       
        await connection.commit(); // บันทึกข้อมูลทั้งหมด
        connection.release();

        return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });

    } catch (error) {
        if (connection) await connection.rollback(); // ถ้า Error ให้ย้อนกลับ ไม่บันทึกอะไรเลย
        if (connection) connection.release();
        console.error("Register Error:", error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}