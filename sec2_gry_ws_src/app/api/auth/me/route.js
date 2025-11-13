// app/api/auth/me/route.js
import pool from '../../../../lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// 👇 บอก Next.js ว่าให้รันแบบ dynamic เสมอ
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
  
    const cookieStore = await cookies();
    const token = await cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // ✅ ตรวจสอบว่า JWT_SECRET มีจริง
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    // ✅ ถอดรหัส JWT
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);

    // ✅ ตรวจสอบว่าเป็นร้านค้าหรือไม่
    let hasRestaurant = false;

    if (decoded.role === 'shop') {
      const connection = await pool.getConnection();
      try {
        const [restaurantRows] = await connection.execute(
          'SELECT COUNT(*) AS count FROM Restaurant WHERE owner_user_id = ?',
          [decoded.id]
        );
        hasRestaurant = restaurantRows[0]?.count > 0;
      } finally {
        connection.release(); // ป้องกัน connection ค้าง
      }
    }

    // ✅ ส่งข้อมูลผู้ใช้กลับ
    return NextResponse.json({
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        hasRestaurant, // 👈 เพิ่ม flag ตรงนี้ด้วย
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error.message);

    // ✅ ตรวจสอบประเภท error จาก JWT
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ user: null, message: 'Token expired' }, { status: 401 });
    }

    return NextResponse.json(
      { user: null, message: `Invalid token: ${error.message}` },
      { status: 401 }
    );
  }
}
