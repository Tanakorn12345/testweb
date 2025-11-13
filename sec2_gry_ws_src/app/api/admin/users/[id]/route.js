import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '../../../../../lib/db'; // <-- 🎯 ตรวจสอบ Path นี้! (อาจจะต้องเป็น 5 ../)
import bcrypt from 'bcrypt';

// --- ฟังก์ชัน Helper สำหรับตรวจสอบ Admin (เหมือนเดิม) ---
async function verifyAdmin(request) {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('auth-token');
    if (!token) return { isAdmin: false, error: 'Authentication required.', status: 401 };
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
        const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') { 
            return { isAdmin: false, error: 'Forbidden: Admin access required.', status: 403 };
        }
        return { isAdmin: true, adminUser: decoded };
    } catch (error) {
        console.error("[API Verify Admin] Token verification error:", error.message);
        return { isAdmin: false, error: 'Invalid or expired token.', status: 401 };
    }
}


// // Testing Get User by ID (Admin)
// // method: GET
// // URL: http://localhost:3000/api/admin/users/1
// // (ต้อง Login เป็น Admin ก่อน / เลข 1 คือ ID ของ user ที่มีอยู่)
//




// --- 1. API Handler สำหรับ GET (ดึงข้อมูล User คนเดียว) ---
// (สำหรับหน้า Update Form)
export async function GET(request, { params }) {
    const { id: userIdToGet } = await params; // ✅ ต้อง await

    // ตรวจสอบสิทธิ์ Admin
    const authCheck = await verifyAdmin(request);
    if (!authCheck.isAdmin) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            // (ไม่ดึง Password กลับไป)
            'SELECT id, username, email, phone,role FROM users WHERE id = ?',
            [userIdToGet]
        );
        connection.release();

        if (rows.length === 0) {
            return NextResponse.json({ message: 'User not found.' }, { status: 404 });
        }

        return NextResponse.json({ user: rows[0] }, { status: 200 });

    } catch (error) {
        console.error(`GET /api/admin/users/${userIdToGet} error:`, error);
        if (connection) connection.release();
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}







// --- 2. API Handler สำหรับ PUT (อัปเดตข้อมูล User) ---
// (สำหรับหน้า Update Form)
export async function PUT(request, { params }) {
    const { id: userIdToUpdate } = await params; //  ต้อง await

    // ตรวจสอบสิทธิ์ Admin
    const authCheck = await verifyAdmin(request);
    if (!authCheck.isAdmin) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    let connection;
    try {
        const { username, email, phone, role, password } = await request.json();

        // --- Validation ข้อมูล ---
        if (!username || !email || !role) {
            return NextResponse.json({ message: 'Username, email, and role are required.' }, { status: 400 });
        }
        // ---  ตรวจสอบ Role ที่ส่งมา ---
        const allowedRoles = ['customer', 'shop', 'admin']; // หรือ 'restaurant'
        if (!allowedRoles.includes(role.toLowerCase())) {
            return NextResponse.json({ message: 'Invalid role specified.' }, { status: 400 });
        }

        connection = await pool.getConnection();

        // --- ตรวจสอบ Email ซ้ำ (ถ้ามีการเปลี่ยน Email) ---
        const [existingUsers] = await connection.execute(
             // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            'SELECT id FROM users WHERE email = ? AND id != ?', // != คือ ไม่ใช่ User คนนี้
            [email, userIdToUpdate]
        );
        if (existingUsers.length > 0) {
            connection.release();
            return NextResponse.json({ message: 'Email already in use by another user.' }, { status: 409 });
        }

        // --- สร้าง Query สำหรับอัปเดต ---
        let queryParams = [username, email, phone || null, role.toLowerCase()];
        let queryFields = 'username = ?, email = ?, phone = ?, role = ?';

        // --- (สำคัญ) ตรวจสอบว่ามีการส่ง Password ใหม่มาหรือไม่ ---
        if (password && password.length >= 6) {
            // ถ้ามี Password ใหม่, Hash แล้วเพิ่มเข้าไปใน Query
            const hashedPassword = await bcrypt.hash(password, 10);
            queryFields += ', password = ?';
            queryParams.push(hashedPassword);
        } else if (password && password.length > 0) {
            // ถ้าส่ง Password มาแต่สั้นไป
             connection.release();
             return NextResponse.json({ message: 'Password must be at least 6 characters long if provided.' }, { status: 400 });
        }
        // ถ้าไม่ส่ง Password มา (ว่าง หรือ null), ก็ไม่ต้องอัปเดต Password

        queryParams.push(userIdToUpdate); // เพิ่ม ID ที่จะ Update เป็นตัวสุดท้าย

        const [updateResult] = await connection.execute(
             // --- 🎯 ตรวจสอบชื่อตาราง/คอลัมน์ ---
            `UPDATE users SET ${queryFields} WHERE id = ?`,
            queryParams
        );
        connection.release();

        if (updateResult.affectedRows === 0) {
            return NextResponse.json({ message: 'User not found or no changes made.' }, { status: 404 });
        }

        console.log(`Admin (${authCheck.adminUser.username}) updated user ID: ${userIdToUpdate}`);
        return NextResponse.json({ message: 'User updated successfully.' }, { status: 200 });

    } catch (error) {
        console.error(`PUT /api/admin/users/${userIdToUpdate} error:`, error);
        if (connection) connection.release();
        if (error instanceof SyntaxError) { return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 }); }
        return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
    }
}





// --- 3. API Handler สำหรับ DELETE (ลบ User) ---
// (สำหรับปุ่ม Delete ที่หน้า Admin Home)
export async function DELETE(request, { params }) {
    const { id: userId } = await params; // ต้อง await

    //  ตรวจสอบสิทธิ์ Admin
    const authCheck = await verifyAdmin(request);
    if (!authCheck.isAdmin) {
        return NextResponse.json({ message: authCheck.error }, { status: authCheck.status });
    }

    //  ป้องกัน Admin ลบตัวเอง
    const adminUserId = authCheck.adminUser.id;
    if (adminUserId.toString() === userId.toString()) {
        return NextResponse.json({ message: "You cannot delete your own account." }, { status: 403 });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        const [deleteResult] = await connection.execute(
            "DELETE FROM users WHERE id = ?",
            [userId]
        );

        connection.release();

        if (deleteResult.affectedRows === 0) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        console.log(`Admin (${authCheck.adminUser.username}) deleted user ID: ${userId}`);
        return new Response(null, { status: 204 }); //  สำเร็จ

    } catch (error) {
        console.error(`DELETE /api/admin/users/${userId} error:`, error);
        if (connection) connection.release();

        //  ตรวจจับ Foreign Key Error
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return NextResponse.json({
                message:
                    "Cannot delete user: This user has associated data (like restaurants or orders). Please delete those first.",
            }, { status: 409 });
        }

        return NextResponse.json({ message: "An internal server error occurred." }, { status: 500 });
    }
}

