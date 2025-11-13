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
// // body: raw JSON
// // {
// //    "name": "French Fries",
 // //   "description": "Crispy fries",
// //    "price": 80,
 // //   "category": "Main course",
  // //  "is_available": true,
 // //   "imageBase64": null
// //    }
//


// // Testing Update  Menu (Shop Owner)
// // method: PUT
// // URL: http://localhost:3001/api/manage/menus/1
// // body: raw JSON
// // {
// //    "name": "French Friessss",
 // //   "description": "Crispy friessss",
// //    "price": 802,
 // //   "category": "Main course",
  // //  "is_available": true,
 // //   "imageBase64": null
// //    }
//




// // Testing Delete  Menu (Shop Owner)
// // method: DELETE
// // URL: http://localhost:3001/api/manage/menus/1




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









// --- 🚀 ฟังก์ชัน POST ใหม่ (เพิ่มเมนู) ---
export async function POST(request) {
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    const ownerUserId = authCheck.shopUser.id;

    let connection;
    try {
        const data = await request.json();
        const { name, description, price, category, is_available, imageBase64 } = data;

        if (!name || !price || !category) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

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

        // --- จัดการรูปภาพ base64 ---
        let imageUrl = null;
        if (imageBase64) {
            const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
            if (matches) {
                const ext = matches[1].split('/')[1]; // เช่น png, jpg
                const buffer = Buffer.from(matches[2], 'base64');

                const filename = `menu-${Date.now()}.${ext}`;
                const uploadDir = path.join(process.cwd(), 'public/uploads/menus');
                await mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, filename);

                await writeFile(filePath, buffer);
                imageUrl = `/uploads/menus/${filename}`;
            }
        }

        // --- บันทึกเมนูลง DB ---
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
        return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
    }
}



export async function PUT(request,context) {
    const params = await context.params;
    const menuId = params.menuId;
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    const ownerUserId = authCheck.shopUser.id;

    let connection;
    try {
        const data = await request.json(); // <-- เปลี่ยนจาก formData() เป็น json
        const { name, description, price, category, is_available, imageBase64 } = data;

        if (!name || !price || !category) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

        connection = await pool.getConnection();
        // ตรวจสอบ Restaurant_Id ของเจ้าของร้าน
        const [restaurantRows] = await connection.execute(
            'SELECT Restaurant_Id FROM Restaurant WHERE owner_user_id = ?',
            [ownerUserId]
        );
        if (restaurantRows.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Restaurant not found.' }, { status: 404 });
        }
        const restaurantId = restaurantRows[0].Restaurant_Id;

        // ดึงข้อมูลเมนูเดิม
        const [menuRows] = await connection.execute(
            'SELECT * FROM Menu WHERE Menu_Id = ? AND Restaurant_Id = ?',
            [menuId, restaurantId]
        );
        if (menuRows.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Menu not found.' , status: 404});
        }

        let imageUrl = menuRows[0].image_url; // ใช้รูปเดิม
        // ถ้ามี imageBase64 ใหม่ → decode และบันทึก
        if (imageBase64) {
            const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
            if (matches) {
                const ext = matches[1].split('/')[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const filename = `menu-${Date.now()}.${ext}`;
                const uploadDir = path.join(process.cwd(), 'public/uploads/menus');
                await mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, filename);
                await writeFile(filePath, buffer);
                imageUrl = `/uploads/menus/${filename}`;
            }
        }

        // Update menu
        await connection.execute(
            `UPDATE Menu 
             SET name = ?, description = ?, price = ?, category = ?, is_available = ?, image_url = ?
             WHERE Menu_Id = ? AND Restaurant_Id = ?`,
            [name, description, price, category, is_available, imageUrl, menuId, restaurantId]
        );

        connection.release();
        return NextResponse.json({
            message: 'Menu updated successfully.',
            menuId,
            imageUrl
        }, { status: 200 });

    } catch (err) {
        if (connection) connection.release();
        console.error('[API PUT /menus/:id] error:', err);
        return NextResponse.json({ message: 'Internal server error.', error: err.message }, { status: 500 });
    }
}
