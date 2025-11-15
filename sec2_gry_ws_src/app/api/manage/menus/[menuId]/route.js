import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../../lib/db'; 
// 1. ⭐️ Import เพิ่มสำหรับจัดการไฟล์
import { writeFile, unlink } from 'fs/promises'; 
import path from 'path';
import { mkdir } from 'fs/promises';

// --- ฟังก์ชัน verifyShopOwner (เหมือนเดิม) ---
async function verifyShopOwner(request) {
    // ... (โค้ดเหมือนเดิม) ...
    const cookieStore = await cookies(); 
    const token = cookieStore.get('auth-token');
    if (!token) return { isShopOwner: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        if (decoded.role !== 'shop') { 
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


// --- API Handler สำหรับ GET (เหมือนเดิม) ---
export async function GET(request, { params }) {
    // ... (โค้ด GET เหมือนเดิม) ...
    const { menuId } = await params; 
    console.log(`[API GET /menus/${menuId}] Received request`); 
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }
    const ownerUserId = authCheck.shopUser.id;
    
    let connection;
    try {
        connection = await pool.getConnection();
        const restaurantId = await getRestaurantId(connection, ownerUserId);
        if (!restaurantId) {
            connection.release();
            return NextResponse.json({ message: 'Restaurant not found for this user.' }, { status: 404 });
        }

        console.log(`[API GET /menus/${menuId}] Querying for menu ID: ${menuId}, Restaurant ID: ${restaurantId}`); 
        const [menuRows] = await connection.execute(
            'SELECT * FROM Menu WHERE Menu_Id = ? AND Restaurant_Id = ?',
            [menuId, restaurantId] 
        );
        connection.release();
        console.log(`[API GET /menus/${menuId}] Query found ${menuRows.length} rows.`); 


        if (menuRows.length === 0) {
            return NextResponse.json({ message: 'Menu item not found or access denied.' }, { status: 404 });
        }

        console.log(`[API GET /menus/${menuId}] Returning menu data.`); 
        return NextResponse.json({ menu: menuRows[0] }, { status: 200 });

    } catch (error) {
        console.error(`GET /api/manage/menus/${menuId} error:`, error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}



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
        // --- 1. [HYBRID LOGIC] ตรวจสอบ Content-Type ---
        let name, description, price, category, is_available;
        let imageFile = null; // สำหรับ FormData
        let imageBase64 = null; // สำหรับ JSON

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            console.log("--- [API PUT Menu] Received multipart/form-data ---");
            const formData = await request.formData();
            name = formData.get('name');
            description = formData.get('description');
            price = formData.get('price');
            category = formData.get('category');
            is_available = formData.get('is_available') === 'true';
            imageFile = formData.get('image'); 

        } else if (contentType.includes('application/json')) {
            console.log("--- [API PUT Menu] Received application/json ---");
            const data = await request.json();
            name = data.name;
            description = data.description;
            price = data.price;
            category = data.category;
            is_available = data.is_available;
            imageBase64 = data.imageBase64; 

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
        const restaurantId = await getRestaurantId(connection, ownerUserId);
        
        if (!restaurantId) {
            connection.release();
            return NextResponse.json({ message: 'Restaurant not found.' }, { status: 404 });
        }

        // --- 4. ดึงข้อมูลเมนูเดิม (เพื่อเอา path รูปเก่ามาลบ) ---
        const [menuRows] = await connection.execute(
            'SELECT image_url FROM Menu WHERE Menu_Id = ? AND Restaurant_Id = ?',
            [menuId, restaurantId]
        );
        if (menuRows.length === 0) {
            connection.release();
            return NextResponse.json({ message: 'Menu not found.' , status: 404});
        }
        
        const oldImageUrl = menuRows[0].image_url;
        let imageUrl = oldImageUrl; // ใช้รูปเดิมเป็นค่าเริ่มต้น

        // --- 5. [HYBRID IMAGE LOGIC (PUT)] ---
        
        // Priority 1: ถ้ามีไฟล์จาก FormData
        if (imageFile && imageFile.name) {
            console.log("--- [API PUT Menu] Processing File Upload ---");
            const filename = `menu-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(imageFile.name)}`;
            const uploadDir = path.join(process.cwd(), 'public/uploads/menus');
            await mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, filename);
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            await writeFile(filePath, buffer);
            imageUrl = `/uploads/menus/${filename}`; // 👈 อัปเดตเป็น URL รูปใหม่
            
            // ลบรูปเก่า (ถ้ามี)
            if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
                try {
                    await unlink(path.join(process.cwd(), 'public', oldImageUrl));
                } catch (delErr) { console.error("Failed to delete old image:", delErr.message); }
            }

        // Priority 2: ถ้ามี Base64 จาก JSON (และ *ไม่ใช่* null)
        } else if (imageBase64) { 
            console.log("--- [API PUT Menu] Processing Base64 Upload ---");
            const matches = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
            if (matches) {
                const ext = matches[1].split('/')[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const filename = `menu-${Date.now()}.${ext}`;
                const uploadDir = path.join(process.cwd(), 'public/uploads/menus');
                await mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, filename);
                await writeFile(filePath, buffer);
                imageUrl = `/uploads/menus/${filename}`; // 👈 อัปเดตเป็น URL รูปใหม่

                // ลบรูปเก่า (ถ้ามี)
                if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
                     try {
                        await unlink(path.join(process.cwd(), 'public', oldImageUrl));
                    } catch (delErr) { console.error("Failed to delete old image:", delErr.message); }
                }
            }
        }
        // ถ้า imageFile และ imageBase64 เป็น null ทั้งคู่: imageUrl ก็จะยังเป็น oldImageUrl (ไม่เปลี่ยนรูป)
        // --- [END HYBRID IMAGE LOGIC] ---


        // --- 6. Update database (เหมือนเดิม) ---
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


// --- API Handler สำหรับ DELETE (เหมือนเดิม) ---
export async function DELETE(request, { params }) {
    // ... (โค้ด DELETE เหมือนเดิม) ...
    const { menuId } = await params; 
    const authCheck = await verifyShopOwner(request);
    if (!authCheck.isShopOwner) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }
    const ownerUserId = authCheck.shopUser.id;
    let connection;
    let imageUrlToDelete = null;
    try {
        connection = await pool.getConnection();
        const restaurantId = await getRestaurantId(connection, ownerUserId);
        if (!restaurantId) {
            connection.release();
            return NextResponse.json({ message: 'Restaurant not found for this user.' }, { status: 404 });
        }
        const [menuRows] = await connection.execute(
             'SELECT image_url FROM Menu WHERE Menu_Id = ? AND Restaurant_Id = ?',
             [menuId, restaurantId]
        );
         if (menuRows.length === 0) {
             connection.release();
             return NextResponse.json({ message: 'Menu item not found or access denied for deletion.' }, { status: 404 });
         }
         imageUrlToDelete = menuRows[0].image_url; 
        const [deleteResult] = await connection.execute(
            'DELETE FROM Menu WHERE Menu_Id = ? AND Restaurant_Id = ?',
            [menuId, restaurantId]
        );
        connection.release(); 
        if (deleteResult.affectedRows === 0) {
             return NextResponse.json({ message: 'Menu item deletion failed (not found).' }, { status: 404 });
        }
        console.log(`Menu ID: ${menuId} deleted successfully from database.`);
        if (imageUrlToDelete && imageUrlToDelete.startsWith('/uploads/')) {
            try {
               const imagePath = path.join(process.cwd(), 'public', imageUrlToDelete);
               await unlink(imagePath);
               console.log(`Menu image file deleted: ${imagePath}`);
            } catch (deleteError) {
                console.error(`Could not delete menu image file ${imageUrlToDelete}:`, deleteError);
            }
        }
        return new Response(null, { status: 204 }); 
    } catch (error) {
        console.error(`DELETE /api/manage/menus/${menuId} error:`, error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred during deletion.' }, { status: 500 });
    }
}