import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db'; // ปรับ Path ตามโครงสร้างโปรเจกต์ของคุณ

// --- ใช้ฟังก์ชัน verifyShopOwner เดิม ---
async function verifyShopOwner(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    if (!token) return { isShopOwner: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        // --- 🎯 ตรวจสอบ Role ให้ตรงกับ DB ---
        if (decoded.role !== 'shop') { // หรือ 'restaurant'
            return { isShopOwner: false, error: 'Forbidden: Shop owner access required.', status: 403 };
        }
        console.log("[API /manage/restaurant] User Verified:", decoded.id, decoded.role); // <-- Log เพิ่ม
        return { isShopOwner: true, shopUser: decoded };
    } catch (error) {
        console.error("[API /manage/restaurant] Token verification error:", error.message);
        return { isShopOwner: false, error: 'Invalid or expired token.', status: 401 };
    }
}

// --- API Handler สำหรับ GET (ดึงข้อมูลร้านค้าของตัวเอง) ---
export async function GET(request) {
    // --- 1. ตรวจสอบสิทธิ์ ---
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        console.log("[API /manage/restaurant] Auth check failed:", authCheck.error, authCheck.status); // <-- Log เพิ่ม
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    const ownerUserId = authCheck.shopUser.id; // ID ของเจ้าของร้านที่ล็อกอินอยู่
    console.log(`[API /manage/restaurant] Attempting to fetch restaurant for owner_user_id: ${ownerUserId}`); // <-- Log เพิ่ม

    // --- 2. Query ข้อมูลร้านค้า ---
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("[API /manage/restaurant] Database connection acquired."); // <-- Log เพิ่ม
        const [rows] = await connection.execute(
            // --- 🎯 ตรวจสอบชื่อตารางและคอลัมน์ให้ตรงกับ DB ---
            'SELECT * FROM Restaurant WHERE owner_user_id = ?',
            [ownerUserId]
        );
        connection.release();
        console.log(`[API /manage/restaurant] Query executed. Found ${rows.length} rows.`); // <-- Log เพิ่ม

        // --- 3. ตรวจสอบผลลัพธ์ ---
        if (rows.length === 0) {
            console.log(`[API /manage/restaurant] No restaurant found for owner_user_id: ${ownerUserId}. Returning 404.`); // <-- Log เพิ่ม
            return NextResponse.json({ message: 'Restaurant not found for this user.' }, { status: 404 });
        }

        // ... (ส่วนจัดการ rows.length > 1 เหมือนเดิม) ...
        if (rows.length > 1) {
             console.warn(`User ID ${ownerUserId} has multiple restaurants. Returning the first one.`);
        }


        const restaurantData = rows[0];
        console.log(`[API /manage/restaurant] Found restaurant: ${restaurantData.Restaurant_Id}, Name: ${restaurantData.name}`); // <-- Log เพิ่ม

        // --- 4. ส่งข้อมูลร้านค้ากลับไป ---
        return NextResponse.json({ restaurant: restaurantData }, { status: 200 });

    } catch (error) {
        console.error('GET /api/manage/restaurant error:', error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}

