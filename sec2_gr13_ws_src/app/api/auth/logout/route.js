// app/api/auth/logout/route.js

import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST(request) {
  // สร้าง cookie ที่มีชื่อเดียวกันกับตอนล็อกอิน แต่กำหนดให้อายุหมดลงทันที
  const serializedCookie = serialize('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: -1, // 👈 จุดสำคัญ: การตั้งค่า maxAge เป็น -1 คือคำสั่งให้ Browser ลบ Cookie นี้ทิ้ง
    path: '/',
  });

  const response = NextResponse.json({ message: 'Logout successful' });

  // ส่ง Header "Set-Cookie" กลับไปพร้อมกับ cookie ที่หมดอายุแล้ว
  response.headers.set('Set-Cookie', serializedCookie);
  
  return response;
}