import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db'; // <-- ตรวจสอบ Path
import { writeFile } from 'fs/promises'; // <-- สำหรับบันทึกรูป
import path from 'path';                // <-- สำหรับบันทึกรูป
import { mkdir } from 'fs/promises';   // <-- สำหรับบันทึกรูป

// --- ใช้ฟังก์ชัน verifyShopOwner เดิม ---
async function verifyShopOwner(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    if (!token) return { isShopOwner: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        // --- 🎯 ตรวจสอบ Role ---
        if (decoded.role !== 'shop') { // หรือ 'restaurant'
            return { isShopOwner: false, error: 'Forbidden: Shop owner access required.', status: 403 };
        }
        return { isShopOwner: true, shopUser: decoded };
    } catch (error) {
        console.error("[API /manage/menus] Token verification error:", error.message);
        return { isShopOwner: false, error: 'Invalid or expired token.', status: 401 };
    }
}

// (Test Cases ... )

// --- API Handler สำหรับ GET (ดึงเมนูทั้งหมดของร้าน) ---
export async function GET(request) {
    // --- 1. ตรวจสอบสิทธิ์ ---
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    const ownerUserId = authCheck.shopUser.id;

    // --- 2. ค้นหา Restaurant_Id ของร้านค้า ---
    let connection;
    let restaurantId = null;
    try {
        connection = await pool.getConnection();
        const [restaurantRows] = await connection.execute(
            // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            'SELECT Restaurant_Id FROM Restaurant WHERE owner_user_id = ?',
            [ownerUserId]
        );

        if (restaurantRows.length === 0) {
            connection.release();
            // ถ้า User ยังไม่มีร้านค้า ก็ไม่มีเมนูให้ดึง
            return NextResponse.json({ message: 'Restaurant not found for this user.' }, { status: 404 });
        }
        restaurantId = restaurantRows[0].Restaurant_Id; // <-- เก็บ ID ร้านค้าไว้

        // --- 3. Query เมนูทั้งหมดของร้านค้านี้ ---
        const [menuRows] = await connection.execute(
            // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            'SELECT * FROM Menu WHERE Restaurant_Id = ? ORDER BY category, name', // เรียงตาม category และ name
            [restaurantId]
        );
        connection.release();

        // --- 4. ส่งข้อมูลเมนูกลับไป ---
        return NextResponse.json({ menus: menuRows }, { status: 200 });

    } catch (error) {
        console.error('GET /api/manage/menus error:', error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}


export async function POST(request) {
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    const ownerUserId = authCheck.shopUser.id;

    let connection;
    try {
        // --- 1. [HYBRID LOGIC] ตรวจสอบ Content-Type ---
        let name, description, price, category, is_available;
        let imageFile = null; // สำหรับ FormData
        let imageBase64 = null; // สำหรับ JSON

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // --- Path 1: Frontend ส่งมา (หรือ Postman ที่ถูกต้อง) ---
            console.log("--- [API POST Menu] Received multipart/form-data ---");
            const formData = await request.formData();
            name = formData.get('name');
            description = formData.get('description');
            price = formData.get('price');
            category = formData.get('category');
            is_available = formData.get('is_available') === 'true';
            imageFile = formData.get('image'); // นี่คือ File object

        } else if (contentType.includes('application/json')) {
            // --- Path 2: Postman ส่ง JSON มา ---
            console.log("--- [API POST Menu] Received application/json ---");
            const data = await request.json();
            name = data.name;
            description = data.description;
            price = data.price;
            category = data.category;
            is_available = data.is_available;
            imageBase64 = data.imageBase64; // นี่คือ String (หรือ null)

        } else {
            return NextResponse.json({ message: 'Unsupported Content-Type. Use JSON or FormData.' }, { status: 415 });
        }
        // --- [END HYBRID LOGIC] ---


        // --- 2. Validation (เหมือนเดิม) ---
        if (!name || !price || !category) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

        // --- 3. Get Restaurant ID (เหมือนเดิม) ---
        connection = await pool.getConnection();
        const [restaurantRows] = await connection.execute(
            'SELECT Restaurant_Id FROM Restaurant WHERE owner_user_id = ?',
            [ownerUserId]
        );
        if (restaurantRows.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Restaurant not found.' }, { status: 404 });
        }
        const restaurantId = restaurantRows[0].Restaurant_Id;


        // --- 4. [HYBRID IMAGE LOGIC] (จัดการรูปภาพ) ---
        let imageUrl = null;
        
        // Priority 1: ถ้ามีไฟล์จาก FormData
        if (imageFile && imageFile.name) {
            console.log("--- [API POST Menu] Processing File Upload ---");
            const filename = `menu-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
            const uploadDir = path.join(process.cwd(), 'public/uploads/menus');
            await mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, filename);
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            await writeFile(filePath, buffer);
            imageUrl = `/uploads/menus/${filename}`;
        
        // Priority 2: ถ้ามี Base64 จาก JSON
        } else if (imageBase64) { 
            console.log("--- [API POST Menu] Processing Base64 Upload ---");
            const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
            if (matches) {
                const ext = matches[1].split('/')[1]; // e.g., png, jpg
                const buffer = Buffer.from(matches[2], 'base64');
                const filename = `menu-${Date.now()}.${ext}`;
                const uploadDir = path.join(process.cwd(), 'public/uploads/menus');
                await mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, filename);
                await writeFile(filePath, buffer);
                imageUrl = `/uploads/menus/${filename}`;
            }
        }
        // --- [END HYBRID IMAGE LOGIC] ---

        // --- 5. บันทึกเมนูลง DB (เหมือนเดิม) ---
        const [insertResult] = await connection.execute(
            `INSERT INTO Menu (Restaurant_Id, name, description, price, image_url, is_available, category, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [restaurantId, name, description || null, price, imageUrl, is_available, category]
        );
        connection.release();

        return NextResponse.json({
            message: 'Menu added successfully.',
            menuId: insertResult.insertId,
            imageUrl
        }, { status: 201 });

    } catch (err) {
        if (connection) connection.release();
        console.error('POST /api/manage/menus error:', err);
        return NextResponse.json({ message: 'Internal server error.', error: err.message }, { status: 500 });
    }
}


// ‼️‼️‼️ ลบฟังก์ชัน PUT ที่หลงเหลืออยู่ออกจากไฟล์นี้ ‼️‼️‼️
// (ฟังก์ชัน PUT อยู่ในไฟล์ [menuId]/route.js ซึ่งถูกต้องแล้ว)


// ‼️ (ฟังก์ชัน PUT เดิมที่อยู่ในไฟล์นี้ ถูกย้ายไปที่ [menuId]/route.js แล้ว) ‼️

// // Testing Shop Login
// // method: POST
// // URL: http://localhost:3001/api/auth/shop-login
// // body: raw JSON
// // {
// //   "username": "test_shop_1",
// //   "password": "password123"
// // }
//


// // Testing Get All Menus (Shop Owner)
// // method: GET
// // URL: http://localhost:3001/api/manage/menus
// // (ต้อง Login เป็น Shop ก่อน)
//


// // Testing Get  Menus (id) (Shop Owner)
// // method: GET
// // URL: http://localhost:3001/api/manage/menus/1
// // (ต้อง Login เป็น Shop ก่อน)
//


// // Testing Insert a new Menu (Shop Owner)
// // method: POST
// // URL: http://localhost:3001/api/manage/menus
// // Body Type: JSON
// //
// //  "name": "chicken fire (from JSON)",
// //  "description": "Chicken fire",
// //  "price": 35,
// //  "category": "Main course",
// //  "is_available": true
// //  "imageBase64": null
//

// // Testing Update Menu (Shop Owner)
// // method: PUT
// // URL: http://localhost:3001/api/manage/menus/1
// // Body Type: form-data (ไม่ใช่ JSON)
// //
// //  "name": "pork fire (from JSON)",
// //  "description": "pork fire",
// //  "price": 85,
// //  "category": "Main course",
// //  "is_available": true
// //  "imageBase64": null
//




// // Testing Delete  Menu (Shop Owner)
// // method: DELETE
// // URL: http://localhost:3001/api/manage/menus/1



