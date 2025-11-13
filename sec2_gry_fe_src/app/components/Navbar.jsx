"use client";
import React, { useState, useEffect } from "react"; // 👈 1. เพิ่ม useEffect
import Link from "next/link";
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout, loading } = useAuth();
  
  // 👇 2. สร้าง state และฟังก์ชันสำหรับคำทักทายตามช่วงเวลา
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) {
        return 'Morning';
      } else if (currentHour >= 12 && currentHour < 18) {
        return 'Afternoon';
      } else {
        return 'Evening';
      }
    };
    // ตั้งค่าคำทักทายเมื่อ Component โหลดเสร็จ (ทำงานฝั่ง Client)
    setGreeting(getGreeting());
  }, []); // `[]` หมายถึงให้ Effect นี้ทำงานแค่ครั้งเดียว

  return (
    <nav className="bg-white p-2 flex flex-row justify-between items-center relative z-50 shadow-sm">
      {/* โลโก้ (ด้านซ้าย) */}
      <Link href="/" className="p-2 text-black font-bold text-base sm:text-xl">
        LINE GIRL
      </Link>

      {/* ส่วนขวา: รวมเมนูหลักและโปรไฟล์ไว้ด้วยกัน */}
      <div className="flex items-center gap-4">
        
        {/* เมนู (desktop) */}
        <ul className="hidden sm:flex flex-row space-x-4 p-2 text-black font-bold">
          <li><Link href="/">HOME</Link></li>
          <li><Link href="/order">ORDER</Link></li>
          <li><Link href="/aboutus">ABOUT</Link></li>
          <li><Link href="/search">SEARCH</Link></li>
          <li><Link href="#">INBOX</Link></li>
        </ul>

        {/* ส่วนของโปรไฟล์และปุ่ม Login/Logout */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
          ) : isAuthenticated && user ? (
            // --- ถ้าล็อกอินแล้ว ---
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {/* 👇 3. แก้ไขการแสดงผลตรงนี้ */}
                Hello {greeting}, {user.username || user.email}
              </span>
              <button
                onClick={logout}
                className="bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-full hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            // --- ถ้ายังไม่ได้ล็อกอิน ---
            <Link href="/login">
              <svg xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5} stroke="currentColor"
                className="w-8 h-8 sm:w-9 sm:h-9 text-black bg-green-400 rounded-full p-1 cursor-pointer">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 
                  9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 
                  21a8.966 8.966 0 0 1-5.982-2.275M15 
                  9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </Link>
          )}

          {/* ปุ่มแฮมเบอร์เกอร์ (มือถือเท่านั้น) */}
          <button
            className="sm:hidden p-2 text-black focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* เมนู (mobile dropdown) */}
      {isOpen && (
        <ul className="absolute top-full left-0 w-full bg-white flex flex-col items-center space-y-4 py-4 sm:hidden shadow-md">
          <li><Link href="/">HOME</Link></li>
          <li><Link href="/order">ORDER</Link></li>
          <li><Link href="#">ABOUT</Link></li>
          <li><Link href="/search">SEARCH</Link></li>
          <li><Link href="#">INBOX</Link></li>
        </ul>
      )}
    </nav>
  );
}

export default Navbar;
