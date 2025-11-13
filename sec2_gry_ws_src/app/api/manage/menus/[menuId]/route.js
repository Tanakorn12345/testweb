import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../../lib/db'; // <-- ตรวจสอบ Path ให้ถูกต้องมากๆ
import { writeFile, unlink } from 'fs/promises'; 
import path from 'path';
import { mkdir } from 'fs/promises';

// --- ฟังก์ชัน verifyShopOwner (เหมือนเดิม) ---
async function verifyShopOwner(request) {
    // *** แก้ไข: เพิ่ม await cookies() ***
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
        console.error("Token verification error:", error.message);
        return { isShopOwner: false, error: 'Invalid or expired token.', status: 401 };
    }
}

// --- Helper Function: หา Restaurant ID (เหมือนเดิม) ---
async function getRestaurantId(connection, ownerUserId) {
     const [restaurantRows] = await connection.execute(
        'SELECT Restaurant_Id FROM Restaurant WHERE owner_user_id = ?',
        [ownerUserId]
     );
     if (restaurantRows.length === 0) return null; 
     return restaurantRows[0].Restaurant_Id;
}


// // Testing Get Menu by ID (Shop Owner)
// // method: GET
// // URL: http://localhost:3000/api/manage/menus/101
// // (ต้อง Login เป็น Shop เจ้าของเมนู / 101 คือ Menu_Id ที่มีอยู่)
//



// --- API Handler สำหรับ GET (ดึงข้อมูลเมนูชิ้นเดียว) ---
export async function GET(request, { params }) {
    // *** แก้ไข: ดึง menuId หลัง await อื่นๆ ***
    // const menuId = params.menuId; // <-- ย้ายไปทำหลัง await verifyShopOwner

    // 1. ตรวจสอบสิทธิ์
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }
    const ownerUserId = authCheck.shopUser.id;
    
    // *** แก้ไข: ดึง menuId ตรงนี้ ***
    const { menuId } = await params; // ✅ ต้องรอ params ก่อน
    console.log(`[API GET /menus/${menuId}] Received request`); // Log เพิ่ม

    // 2. Query ข้อมูลเมนู
    let connection;
    try {
        connection = await pool.getConnection();
        const restaurantId = await getRestaurantId(connection, ownerUserId);
        if (!restaurantId) {
            connection.release();
            return NextResponse.json({ message: 'Restaurant not found for this user.' }, { status: 404 });
        }

        console.log(`[API GET /menus/${menuId}] Querying for menu ID: ${menuId}, Restaurant ID: ${restaurantId}`); // Log เพิ่ม
        const [menuRows] = await connection.execute(
            // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            'SELECT * FROM Menu WHERE Menu_Id = ? AND Restaurant_Id = ?',
            [menuId, restaurantId] 
        );
        connection.release();
        console.log(`[API GET /menus/${menuId}] Query found ${menuRows.length} rows.`); // Log เพิ่ม


        // 3. ตรวจสอบผลลัพธ์
        if (menuRows.length === 0) {
            return NextResponse.json({ message: 'Menu item not found or access denied.' }, { status: 404 });
        }

        // 4. ส่งข้อมูลเมนูกลับไป
        console.log(`[API GET /menus/${menuId}] Returning menu data.`); // Log เพิ่ม
        return NextResponse.json({ menu: menuRows[0] }, { status: 200 });

    } catch (error) {
        console.error(`GET /api/manage/menus/${menuId} error:`, error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}


// // Testing Update Menu (Shop Owner)
// // method: PUT
// // URL: http://localhost:3000/api/manage/menus/101
// // body: form-data (ไม่ใช่ JSON)
// // - name: "Updated Test Menu"
// // - description: "Updated description."
// // - price: "160"
// // - category: "Main Course"
// // - is_available: "true"
// // - image: (แนบไฟล์ใหม่ หรือ เว้นว่างไว้เพื่อใช้รูปเดิม)
// // (ต้อง Login เป็น Shop เจ้าของเมนู / 101 คือ Menu_Id ที่มีอยู่)
//





// --- API Handler สำหรับ PUT (อัปเดตเมนู) ---
export async function PUT(request, context) {
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



// // Testing Delete Menu (Shop Owner)
// // method: DELETE
// // URL: http://localhost:3000/api/manage/menus/101
// // (ต้อง Login เป็น Shop เจ้าของเมนู / 101 คือ Menu_Id ที่มีอยู่)
//


export async function DELETE(request, { params }) {
    const { menuId } = await params; // ต้อง await ก่อน

    // 1. ตรวจสอบสิทธิ์
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }
    const ownerUserId = authCheck.shopUser.id;

    // 2. ดึงข้อมูลเมนู (เพื่อเอา image_url) และตรวจสอบ Ownership
    let connection;
    let imageUrlToDelete = null;
    try {
        connection = await pool.getConnection();
        const restaurantId = await getRestaurantId(connection, ownerUserId);
        if (!restaurantId) {
            connection.release();
            return NextResponse.json({ message: 'Restaurant not found for this user.' }, { status: 404 });
        }

        // --- ดึง image_url ก่อนลบ ---
        const [menuRows] = await connection.execute(
             'SELECT image_url FROM Menu WHERE Menu_Id = ? AND Restaurant_Id = ?',
             [menuId, restaurantId]
        );

         if (menuRows.length === 0) {
             connection.release();
             return NextResponse.json({ message: 'Menu item not found or access denied for deletion.' }, { status: 404 });
         }
         imageUrlToDelete = menuRows[0].image_url; // <-- เก็บ URL รูปที่จะลบ

        // 3. ลบข้อมูลเมนูออกจาก Database
        const [deleteResult] = await connection.execute(
            'DELETE FROM Menu WHERE Menu_Id = ? AND Restaurant_Id = ?',
            [menuId, restaurantId]
        );
        connection.release(); // คืน Connection หลัง Query เสร็จ

        if (deleteResult.affectedRows === 0) {
             // ไม่ควรเกิดถ้าเช็คข้างบนผ่านแล้ว
             return NextResponse.json({ message: 'Menu item deletion failed (not found).' }, { status: 404 });
        }

        console.log(`Menu ID: ${menuId} deleted successfully from database.`);

        // 4. (พยายาม) ลบไฟล์รูปภาพออกจาก Server (ถ้ามี URL)
        if (imageUrlToDelete && imageUrlToDelete.startsWith('/uploads/')) {
            try {
               const imagePath = path.join(process.cwd(), 'public', imageUrlToDelete);
               await unlink(imagePath);
               console.log(`Menu image file deleted: ${imagePath}`);
            } catch (deleteError) {
                // ถ้าลบไฟล์ไม่สำเร็จ ไม่ต้องหยุด แค่ Log ไว้
                console.error(`Could not delete menu image file ${imageUrlToDelete}:`, deleteError);
            }
        }

        // 5. ส่ง Response สำเร็จ
        return new Response(null, { status: 204 }); // 204 No Content เหมาะกับการ Delete สำเร็จ

    } catch (error) {
        console.error(`DELETE /api/manage/menus/${menuId} error:`, error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred during deletion.' }, { status: 500 });
    }
}


