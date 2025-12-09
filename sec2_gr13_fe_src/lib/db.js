// lib/db.js
import mysql from 'mysql2/promise';

// 🎯 ดึงค่าจาก process.env ซึ่งจะอ่านมาจากไฟล์ .env.local โดยอัตโนมัติ
const pool = mysql.createPool({
  host: 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;