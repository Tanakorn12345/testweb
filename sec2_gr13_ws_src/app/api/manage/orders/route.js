import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db'; 

async function verifyShopOwner(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    if (!token) return { isShopOwner: false, error: 'Authentication required.', status: 401 };
    try {
        // เช็คว่ามี Secret Key ไหม
        if (!process.env.JWT_SECRET) {
            console.error("❌ Error: JWT_SECRET is missing in .env");
            throw new Error('JWT_SECRET is not configured.');
        }
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        if (decoded.role !== 'shop') return { isShopOwner: false, error: 'Forbidden', status: 403 };
        return { isShopOwner: true, shopUser: decoded };
    } catch (error) {
        console.error("❌ Auth Error:", error.message);
        return { isShopOwner: false, error: 'Invalid token', status: 401 };
    }
}

export async function GET(request) {
    console.log("🔍 [GET /api/manage/orders] Request received...");

    try {
        const authCheck = await verifyShopOwner(request);
        if (!authCheck.isShopOwner) {
            console.log("❌ Auth failed:", authCheck.error);
            return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
        }

        const ownerUserId = authCheck.shopUser.id;
        console.log("✅ Auth success. Owner ID:", ownerUserId);

        const connection = await pool.getConnection();
        console.log("✅ DB Connected");

        try {
            // 1. หา Restaurant_Id
            const [shops] = await connection.execute('SELECT Restaurant_Id FROM Restaurant WHERE owner_user_id = ?', [ownerUserId]);
            
            if (shops.length === 0) {
                console.log("❌ Restaurant not found for user:", ownerUserId);
                connection.release();
                return NextResponse.json({ message: 'Restaurant not found' }, { status: 404 });
            }
            const restaurantId = shops[0].Restaurant_Id;
            console.log("✅ Found Restaurant ID:", restaurantId);

            // 2. SQL Query (เช็คชื่อตารางและชื่อ Column ให้ดี)
            const sql = `
                SELECT 
                    oc.OrderCart_Id, 
                    oc.status, 
                    oc.payment_status, 
                    oc.total_amount, 
                    oc.created_at,
                    u.username,    
                    u.phone,       
                    oi.quantity, 
                    oi.special_instructions,
                    m.name as menu_name,
                    m.image_url
                FROM OrderCart oc
                JOIN users u ON oc.User_Id = u.id 
                JOIN OrderItem oi ON oc.OrderCart_Id = oi.OrderCart_Id
                JOIN Menu m ON oi.Menu_Id = m.Menu_Id
                WHERE oc.Restaurant_Id = ? 
                AND DATE(oc.created_at) = CURDATE() 
                ORDER BY oc.created_at DESC
            `;

            console.log("⏳ Executing SQL Query...");
            const [rows] = await connection.execute(sql, [restaurantId]);
            console.log(`✅ Query Success. Found ${rows.length} rows.`);

            connection.release();

            // 3. Map Data
            const ordersMap = new Map();
            rows.forEach(row => {
                if (!ordersMap.has(row.OrderCart_Id)) {
                    ordersMap.set(row.OrderCart_Id, {
                        id: row.OrderCart_Id,
                        status: row.status,
                        payment_status: row.payment_status,
                        total: row.total_amount,
                        time: row.created_at,
                        customer: row.username, 
                        phone: row.phone,       
                        items: []
                    });
                }
                ordersMap.get(row.OrderCart_Id).items.push({
                    name: row.menu_name,
                    quantity: row.quantity,
                    note: row.special_instructions,
                    image: row.image_url
                });
            });

            const orders = Array.from(ordersMap.values());
            return NextResponse.json({ orders }, { status: 200 });

        } catch (dbError) {
            connection.release(); // อย่าลืมคืน connection แม้จะ error
            console.error("❌ Database/SQL Error:", dbError); // <--- ดู Error ตรงนี้ใน Terminal
            throw dbError; // โยน error ไปให้ catch ด้านนอกจัดการ
        }

    } catch (error) {
        console.error("❌ Final Server Error:", error);
        return NextResponse.json({ 
            message: 'Internal Server Error', 
            details: error.message // ส่ง error message กลับไปให้ frontend ด้วย (เพื่อช่วย debug)
        }, { status: 500 });
    }
}