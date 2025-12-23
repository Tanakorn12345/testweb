import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function GET() {
  try {
    // SQL: รวมยอดขาย (total_amount) แบ่งตามร้านค้า (Restaurant)
    // เรียงจากมากไปน้อย (DESC) เอาแค่ 5 อันดับแรก
    const sql = `
      SELECT 
        r.name as shop_name, 
        SUM(o.total_amount) as total_sales
      FROM OrderCart o
      JOIN Restaurant r ON o.Restaurant_Id = r.Restaurant_Id
      WHERE o.status != 'Cancelled'
      GROUP BY r.Restaurant_Id
      ORDER BY total_sales DESC
      ;
    `;

    const [rows] = await pool.query(sql);
    return NextResponse.json(rows);
    
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}