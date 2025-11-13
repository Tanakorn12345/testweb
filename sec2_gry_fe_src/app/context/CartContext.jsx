"use client";

import React, { createContext, useState, useContext } from 'react';

// 1. สร้าง Context เพื่อเป็นที่เก็บข้อมูลส่วนกลาง
const CartContext = createContext();

// 2. สร้าง Provider ซึ่งเป็น Component ที่ทำหน้าที่จัดการข้อมูลในตะกร้า
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // ฟังก์ชันเพิ่มสินค้าลงตะกร้า (หรือเพิ่มจำนวนถ้ามีอยู่แล้ว)
  const addToCart = (item,restaurant) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // ถ้ามีสินค้านี้อยู่แล้ว ให้อัปเดตจำนวน +1
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // ถ้ายังไม่มี ให้เพิ่มเข้าไปใหม่พร้อมกับจำนวนเริ่มต้นที่ 1
        return [...prevItems, { ...item, quantity: 1,
          restaurant: { id: restaurant.id, name: restaurant.name }  }];
      }
    });
  };

  // ฟังก์ชันลบสินค้าออกจากตะกร้า
  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  
  // ฟังก์ชันอัปเดตจำนวน (เพิ่ม/ลด)
  const updateQuantity = (itemId, amount) => {
    setCartItems(prevItems => 
        prevItems.map(item => 
            item.id === itemId ? {...item, quantity: Math.max(0, item.quantity + amount) } : item
        ).filter(item => item.quantity > 0) // ลบสินค้าออกจากตะกร้าถ้าจำนวนกลายเป็น 0
    );
  };

  // ฟังก์ชันล้างตะกร้าสินค้าทั้งหมด
  const clearCart = () => {
    setCartItems([]);
  };

  // ส่งข้อมูล (state) และฟังก์ชันทั้งหมดออกไปให้ Component อื่นๆ ใช้งาน
  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

// 3. สร้าง Custom Hook เพื่อให้เรียกใช้งาน Context ได้ง่ายขึ้น
export function useCart() {
  return useContext(CartContext);
}