// middleware.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

// ✅ Helper: ตรวจสอบ JWT
async function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error("Middleware token verify error:", error.message);
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth-token')?.value;
  const decoded = await verifyToken(authToken);
  const userRole = decoded?.role;

  const isPublicPage = pathname === '/login' || pathname.startsWith('/register');
  const homePage = new URL('/', request.url);
  const loginPage = new URL('/login', request.url);

  // 1️⃣ ยังไม่ล็อกอิน → ห้ามเข้าหน้า protected
  if (!authToken && !isPublicPage && pathname !== '/') {
    return NextResponse.redirect(loginPage);
  }

  // 2️⃣ ล็อกอินแล้ว → ห้ามเข้าหน้า login/register
  if (authToken && isPublicPage) {
    return NextResponse.redirect(homePage);
  }

  // 3️⃣ ตรวจ role
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(homePage);
  }

  if (pathname.startsWith('/manage') && userRole !== 'shop') {
    return NextResponse.redirect(homePage);
  }

  // ✅ ผ่านทุกเงื่อนไข → ไปต่อ
  return NextResponse.next();
}

// ✅ ยกเว้นไม่ให้ middleware วิ่งกับ API หรือไฟล์ static
export const config = {
  matcher: [
    // ตัดออก: /api, _next, favicon.ico, และ uploads
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
