import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

// --- Helper: จัดกลุ่มเมนูตาม Category ---
function groupMenus(menuRows) {
    const categories = {};
    menuRows.forEach(item => {
        const catName = item.category || "Uncategorized";
        if (!categories[catName]) {
            categories[catName] = { category: catName, items: [] };
        }
        categories[catName].items.push({
            id: item.Menu_Id,
            name: item.name,
            price: `฿${Number(item.price).toFixed(2)}`,
            image: item.image_url || 'https://placehold.co/300x200/F3EFEF/AAAAAA?text=No+Image'
        });
    });
    return Object.values(categories);
}

// --- API GET /api/shop/[slug] ---
export async function GET(request, context) {
    // 🟢 แก้ไขตรงนี้: ดึง params จาก context แล้วค่อย await
    const params = await context.params; 
    const slug = params.slug;

    if (!slug) {
        return NextResponse.json({ message: 'Slug is required.' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Query ร้านโดย slug
        const [restaurantRows] = await connection.execute(
            `SELECT 
                Restaurant_Id as id,
                name,
                description,
                address,
                image_url as image,
                is_open,
                slug,
                branch,
                type,
                rating,
                reviewCount,
                opening_hours,
                latitude,   
                longitude  
             FROM Restaurant
             WHERE slug = ? `,
            [slug]
        );

        if (restaurantRows.length === 0) {
            return NextResponse.json({ message: 'Restaurant not found or is closed.' }, { status: 404 });
        }

        const restaurantData = restaurantRows[0];

        // --- 🚀 โค้ดที่เพิ่มเข้ามา: Query รีวิว ---
const [reviewRows] = await connection.execute(
    `SELECT R.rating, R.comment, R.created_at, U.username 
     FROM Review R
     JOIN users U ON R.User_Id = U.id
     WHERE R.Restaurant_Id = ?
     ORDER BY R.created_at DESC
     LIMIT 10`, // <-- ดึงมาแค่ 10 รีวิวล่าสุด (หรือตามต้องการ)
    [restaurantData.id]
);
// --- 🚀 สิ้นสุดโค้ดที่เพิ่มเข้ามา ---



        // Query เมนู
        const [menuRows] = await connection.execute(
            `SELECT * FROM Menu 
             WHERE Restaurant_Id = ? AND is_available = true 
             ORDER BY category, name`,
            [restaurantData.id]
        );

        const formattedMenu = groupMenus(menuRows);

        const fullRestaurantData = {
            ...restaurantData,
            menu: formattedMenu,
            reviews: reviewRows, // <-- 🚀 เพิ่ม reviews เข้าไปใน object ที่ส่งกลับ
            details: `${restaurantData.type || ''} | ${restaurantData.opening_hours || 'N/A'}`
        };

        return NextResponse.json({ restaurant: fullRestaurantData }, { status: 200 });
    } catch (error) {
        console.error(`GET /api/shop/${slug} error:`, error);
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
