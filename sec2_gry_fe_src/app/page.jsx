"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic"; // <-- 1. Uncomment
import Navbar from "./components/Navbar"; // <-- 1. Uncomment
import Card from "./components/Card"; // <-- 1. Uncomment
import Footer from "./components/Footer"; // <-- 1. Uncomment
import Category from "./components/Category"; // <-- 1. Uncomment
import { Loader2 } from "lucide-react"; 

export default function Home() {
  const Background = dynamic(() => import("./components/Background"), { ssr: false }); // <-- 1. Uncomment

  // --- State ---
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // --- 🎯 State ใหม่สำหรับเก็บข้อมูลร้านค้า ---
  const [allRestaurants, setAllRestaurants] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 🎯 Fetch ข้อมูลร้านค้าจาก Backend ---
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/restaurants', { cache: 'no-store' }); // <-- เรียก API ใหม่
        if (!res.ok) {
          throw new Error(`Failed to fetch restaurants. Status: ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data.restaurants)) {
          setAllRestaurants(data.restaurants); // <-- เก็บข้อมูลลง State
        }
      } catch (err) {
        console.error("Fetch restaurants error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []); // `[]` = ทำงานครั้งเดียวตอนโหลดหน้า

  // --- Handlers (เหมือนเดิม) ---
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  // --- Filter Logic (ตอนนี้จะทำงานกับข้อมูลจริงจาก State) ---
  const filteredRestaurants = useMemo(() => {
     const term = selectedCategory;
     if (!term) return allRestaurants; // ถ้าไม่เลือก Category ก็แสดงทั้งหมด
     return allRestaurants.filter((restaurant) => restaurant.type === term);
  }, [allRestaurants, selectedCategory]); // <-- คำนวณใหม่เมื่อข้อมูลเปลี่ยน


  // --- 🎯 อัปเดต Recommended (ใช้ State) ---
  const recommendedRestaurants = useMemo(() => {
     // (ในอนาคต อาจจะเรียงตาม Rating จริง)
     // ตอนนี้เอา 4 ร้านแรกที่ดึงมาได้
     return allRestaurants.slice(0, 4);
  }, [allRestaurants]);


  return (
    // --- 2. ใช้ Style เดิม ---
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <Background />

      {/* --- Section 1: Recommended Restaurants --- */}
      <section className="px-4 sm:px-8 lg:px-16 py-10">
        <h2 className="text-center mb-8 font-extrabold text-2xl sm:text-3xl text-gray-800">
          🍽️ RECOMMENDED RESTAURANTS
        </h2>

        {/* --- 🎯 เพิ่ม Loading/Error --- */}
        {loading && (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin"/></div>
        )}
        {error && (
            <div className="text-center py-10 text-red-500">Error: {error}</div>
        )}
        {!loading && !error && recommendedRestaurants.length > 0 && (
             // --- 3. ใช้ Component Card ---
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center">
              {recommendedRestaurants.map((restaurant) => (
                <Card key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
        )}
         {!loading && !error && recommendedRestaurants.length === 0 && (
            <p className="text-center text-gray-500 py-10 text-lg">No recommended restaurants found.</p>
         )}
      </section>

      <hr className="my-8 border-gray-300 max-w-5xl mx-auto" />

      {/* --- Section 2: Filterable Restaurants --- */}
      <section className="px-4 sm:px-8 lg:px-16 pb-12">
        {/* --- 3. ใช้ Component Category --- */}
        <Category
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
        
        <h2 className="text-center mt-10 mb-6 font-extrabold text-2xl sm:text-3xl text-gray-800">
          {selectedCategory ? `Result for "${selectedCategory}"` : "All Restaurants"}
        </h2>

        {/* --- 🎯 เพิ่ม Loading/Error --- */}
        {loading && (
            <div className="text-center py-10"><Loader2 className="w-8 h-8 mx-auto text-gray-400 animate-spin"/></div>
        )}
        {/* (ไม่ต้องแสดง Error ซ้ำ) */}
        {!loading && !error && (
          // --- 3. ใช้ Component Card ---
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 place-items-center">
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((restaurant) => (
                <Card key={restaurant.id} restaurant={restaurant} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-10 text-lg">
                ไม่พบร้านอาหารในหมวดหมู่นี้
              </p>
            )}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

