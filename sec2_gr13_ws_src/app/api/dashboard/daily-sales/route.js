import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request) {
  try {
    // 1. รับค่าจาก URL (Query Parameters)
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // เช่น '11'
    const year = searchParams.get('year');   // เช่น '2025'

    let sql = "";
    let params = [];

    // 2. ถ้ามีการส่งเดือน/ปีมา ให้กรองตามนั้น
    if (month && year) {
      sql = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as date, 
          SUM(total_amount) as total 
        FROM OrderCart 
        WHERE MONTH(created_at) = ? 
          AND YEAR(created_at) = ?
          AND status != 'Cancelled'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC;
      `;
      params = [month, year];
    } else {
      // 3. (Default) ถ้าไม่เลือกอะไรเลย ให้ดึงเดือนปัจจุบัน
      sql = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as date, 
          SUM(total_amount) as total 
        FROM OrderCart 
        WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
          AND YEAR(created_at) = YEAR(CURRENT_DATE())
          AND status != 'Cancelled'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC;
      `;
    }

    const [rows] = await pool.query(sql, params);
    return NextResponse.json(rows);
    
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}