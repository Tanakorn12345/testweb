import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and Year required' }, { status: 400 });
    }

    // แก้ไข SQL: เพิ่ม day_num ลงไปใน GROUP BY
    const sql = `
      SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m-%d') as full_date,
        DAY(o.created_at) as day_num,
        r.name as shop_name,
        SUM(o.total_amount) as total
      FROM OrderCart o
      JOIN Restaurant r ON o.Restaurant_Id = r.Restaurant_Id
      WHERE MONTH(o.created_at) = ? 
        AND YEAR(o.created_at) = ?
        AND o.status != 'Cancelled'
      GROUP BY full_date, day_num, shop_name  
      ORDER BY full_date ASC;
    `;
    
    const [rows] = await pool.query(sql, [month, year]);
    return NextResponse.json(rows);
    
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}