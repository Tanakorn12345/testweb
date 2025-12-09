"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { GiFoodTruck } from "react-icons/gi";
import { History, Store } from "lucide-react"; // 🟢 1. Import Icon Store

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout, loading } = useAuth();
  const { cartItems } = useCart();
  const [greeting, setGreeting] = useState('');

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
    setGreeting(getGreeting());
  }, []);

  return (
    <nav className="bg-white p-2 flex flex-row justify-between items-center relative z-50 shadow-sm">
      {/* โลโก้ */}
      <Link
        href="/"
        className="p-2 text-black font-bold text-base sm:text-xl flex items-center gap-2"
      >
        <GiFoodTruck className="text-green-500 size-8" />
        LINE GIRL
      </Link>

      {/* ส่วนขวา: รวมเมนูหลักและโปรไฟล์ */}
      <div className="flex items-center gap-4">

        {/* เมนู (Desktop) */}
        <ul className="hidden sm:flex flex-row space-x-4 p-2 text-black font-bold items-center">
          <li><Link href="/" className="hover:text-green-600 transition">HOME</Link></li>
          <li>
            <Link href="/order" className="relative flex items-center hover:text-green-600 transition">
              ORDER
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
          </li>
          
          {/* 🟢 2. ปุ่ม My Orders (เฉพาะ Customer) */}
          {isAuthenticated && user?.role === 'customer' && (
             <li>
               <Link href="/order/history" className="flex items-center gap-1 text-orange-500 hover:text-orange-600 transition">
                 <History size={18} /> MY ORDERS
               </Link>
             </li>
          )}

          {/* 🟢 3. ปุ่ม Manage (เฉพาะ Shop) */}
          {isAuthenticated && user?.role === 'shop' && (
             <li>
               <Link href="/manage" className="flex items-center gap-1 text-green-600 hover:text-green-700 transition">
                 <Store size={18} /> MANAGE
               </Link>
             </li>
          )}

          <li><Link href="/aboutus" className="hover:text-green-600 transition">ABOUT</Link></li>
          <li><Link href="/search" className="hover:text-green-600 transition">SEARCH</Link></li>
        </ul>

        {/* ส่วนของโปรไฟล์และปุ่ม Login/Logout */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
          ) : isAuthenticated && user ? (
            // --- ถ้าล็อกอินแล้ว ---
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
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
                className="w-8 h-8 sm:w-9 sm:h-9 text-black bg-green-400 rounded-full p-1 cursor-pointer hover:bg-green-500 transition">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 
                  9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 
                  21a8.966 8.966 0 0 1-5.982-2.275M15 
                  9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </Link>
          )}

          {/* ปุ่มแฮมเบอร์เกอร์ (Mobile) */}
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

      {/* เมนู (Mobile Dropdown) */}
      {isOpen && (
        <ul className="absolute top-full left-0 w-full bg-white flex flex-col items-center space-y-4 py-4 sm:hidden shadow-md border-t z-40">
          <li><Link href="/" onClick={() => setIsOpen(false)}>HOME</Link></li>
          
          {/* 🟢 4. เพิ่มปุ่ม My Orders ใน Mobile */}
          {isAuthenticated && user?.role === 'customer' && (
             <li>
               <Link href="/order/history" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-orange-500 font-bold">
                 <History size={20} /> MY ORDERS
               </Link>
             </li>
          )}

          {/* 🟢 5. เพิ่มปุ่ม Manage ใน Mobile */}
          {isAuthenticated && user?.role === 'shop' && (
             <li>
               <Link href="/manage" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-green-600 font-bold">
                 <Store size={20} /> MANAGE
               </Link>
             </li>
          )}

          <li>
            <Link href="/order" onClick={() => setIsOpen(false)} className="relative">
              ORDER
              {totalItems > 0 && (
                <span className="absolute -top-3 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>
          </li>
          <li><Link href="/aboutus" onClick={() => setIsOpen(false)}>ABOUT</Link></li>
          <li><Link href="/search" onClick={() => setIsOpen(false)}>SEARCH</Link></li>
        </ul>
      )}
    </nav>
  );
}

export default Navbar;