"use client";

import React from 'react';
import { useCart } from '../context/CartContext'; // ✅ 1. Import ตะกร้าสินค้า

// เราจะเรียก Component นี้ว่า MenuCard เพื่อให้ตรงกับที่คุณเรียกใช้
export default function MenuCard({ item,restaurant}) {
  // ✅ 2. ดึงฟังก์ชัน addToCart มาจากตะกร้า
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105">
      <img src={item.image} alt={item.name} className="w-full h-32 object-cover" />
      <div className="p-3 flex-grow flex flex-col">
        <h4 className="font-bold text-sm flex-grow">{item.name}</h4>
        <p className="text-gray-600 text-sm mt-1">{item.price}</p>
        
        {/* ✅ 3. เพิ่มปุ่ม Order และเชื่อมต่อกับฟังก์ชัน addToCart */}
        <div className="mt-2">
           <button
             onClick={() => addToCart(item,restaurant)}
             className="w-full bg-green-500 text-white font-semibold py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-xs"
           >
             Order
           </button>
        </div>
      </div>
    </div>
  );
}