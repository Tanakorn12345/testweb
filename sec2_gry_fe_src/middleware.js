// middleware.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken'; // 👈 1. Import jwt

// Helper function เพื่อถอดรหัส Token
async function verifyToken(token) {
  if (!token) return null;
  try {
    // ต้องแน่ใจว่า JWT_SECRET ใน .env.local ถูกต้อง
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

  // หน้าสาธารณะ
  const isPublicPage = pathname === '/login' || pathname.startsWith('/register');
  const homePage = new URL('/', request.url);
  const loginPage = new URL('/login', request.url);

  // 1. ถ้ายังไม่ล็อกอิน และพยายามไปหน้าที่ไม่ใช่หน้าสาธารณะ (และไม่ใช่หน้า Home)
  if (!authToken && !isPublicPage && pathname !== '/') {
    return NextResponse.redirect(loginPage);
  }

  // 2. ถ้าล็อกอินแล้ว แต่พยายามจะกลับไปหน้า login/register
  if (authToken && isPublicPage) {
    return NextResponse.redirect(homePage);
  }

  // --- 3. 🚀 ตรรกะใหม่: ล็อคหน้าตาม Role ---

  // ถ้าเข้าหน้า Admin (แต่ Role ไม่ใช่ 'admin')
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(homePage); // เด้งกลับหน้าหลัก
  }

  // ถ้าเข้าหน้า Manage (แต่ Role ไม่ใช่ 'shop')
  if (pathname.startsWith('/manage') && userRole !== 'shop') {
    return NextResponse.redirect(homePage); // เด้งกลับหน้าหลัก
  }

  // ------------------------------------------

  // กรณีอื่นๆ ทั้งหมด ให้ไปต่อได้เลย
  return NextResponse.next();
}

// Config เหมือนเดิม
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};