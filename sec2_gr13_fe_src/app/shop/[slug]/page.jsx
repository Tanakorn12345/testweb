"use client";

import { useParams } from 'next/navigation';
// 🎯 1. แก้ไข import: ลบ 'use' ที่ไม่จำเป็นออก
import React, { useState, useEffect } from 'react'; 
import { Loader2, Navigation } from 'lucide-react'; 
import dynamic from 'next/dynamic'; 

// Import Components
import Navbar from '../../components/Navbar'; 
import Footer from '../../components/Footer'; 
import StoreBanner from '../../components/StoreBanner';
import MenuTabs from '../../components/MenuTabs';
import MenuSection from '../../components/MenuSection';
import ReviewSection from '../../components/ReviewSection';


// 🎯 2. [แก้ไข] Helper Function ให้ใช้เวลาประเทศไทย (GMT+7) เสมอ
function getDynamicOpenStatus(dbIsOpen, hoursString) {
  // 1. ถ้าเจ้าของร้าน "ปิดร้าน" เอง (is_open = false) ให้ปิดทันที
  if (dbIsOpen === false) { 
      return { isOpen: false, text: "Closed" };
  }
  // 2. ถ้าไม่มีข้อมูลเวลา หรือข้อมูลผิดพลาด
  if (typeof hoursString !== 'string' || !hoursString.includes('-')) {
      return { isOpen: true, text: "Open" }; 
  }
  
  try {
      // 3. พยายามแยกส่วนเวลา (รองรับ "10:00" และ "10.00")
      const parts = hoursString.split('-').map(s => s.trim());
      
      // 🎯 [แก้ไข] ใช้ Regex
      //    split(/[:.]/) จะแยก "10:00" -> ["10", "00"]
      //    และแยก "10.00" -> ["10", "00"]
      const [openHourStr, openMinStr] = parts[0].split(/[:.]/);
      const [closeHourStr, closeMinStr] = parts[1].split(/[:.]/);

      const openHour = parseInt(openHourStr, 10);
      const openMin = parseInt(openMinStr, 10) || 0; // ถ้าไม่มีนาที ให้เป็น 0
      const closeHour = parseInt(closeHourStr, 10);
      const closeMin = parseInt(closeMinStr, 10) || 0;

      // 🎯 4. [สำคัญ] ดึงเวลาปัจจุบันใน Timezone "Asia/Bangkok"
      const now = new Date();
      
      // ใช้ toLocaleString เพื่อดึง "ชั่วโมง" ในเขตเวลาไทย (แบบ 24-hour)
      const thaiHour = parseInt(now.toLocaleString('en-US', {
          timeZone: 'Asia/Bangkok',
          hour: '2-digit',
          hour12: false // ใช้ 24-hour format
      }), 10);
      
      // ใช้ toLocaleString เพื่อดึง "นาที" ในเขตเวลาไทย
      const thaiMinute = parseInt(now.toLocaleString('en-US', {
          timeZone: 'Asia/Bangkok',
          minute: '2-digit'
      }), 10);
      
      // 5. คำนวณนาที (จากเวลาไทย)
      const nowInMinutes = (thaiHour * 60) + thaiMinute;
      const openInMinutes = (openHour * 60) + openMin;
      const closeInMinutes = (closeHour * 60) + closeMin;

      // 6. ตรวจสอบเวลา (Logic เดิม)
      if (closeInMinutes < openInMinutes) { // กรณีปิดข้ามคืน (เช่น 22:00 - 02:00)
          if (nowInMinutes >= openInMinutes || nowInMinutes < closeInMinutes) {
              return { isOpen: true, text: `Open (until ${parts[1]})` };
          }
      } else { // กรณีปกติ (เช่น 10:00 - 22:00)
          if (nowInMinutes >= openInMinutes && nowInMinutes < closeInMinutes) {
              return { isOpen: true, text: `Open (until ${parts[1]})` };
          }
      }
      
      // 7. ถ้าไม่เข้าเงื่อนไข = ปิด
      return { isOpen: false, text: `Closed (Opens at ${parts[0]})` };

  } catch (e) {
      // ถ้า parsing ล้มเหลว (เช่น "Open 24 hours")
      console.error("Error parsing opening hours:", e);
      return { isOpen: true, text: hoursString || "Open" }; 
  }
}
// --- สิ้นสุด Helper Function ---


// (เรียก Map Component แบบ Dynamic - เหมือนเดิม)
const StoreMap = dynamic(() => import('../../components/StoreMap'), { 
  ssr: false,
  loading: () => <div style={{height: '400px', background: '#f0f0f0'}} className="flex items-center justify-center">Loading map...</div>
});


export default function ShopDetailPage() {
  const params = useParams(); 
  const slug = params?.slug;

  // (State - restaurant, loading, error, activeTab - เหมือนเดิม)
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null); 
  
  // 🎯 [แก้ไข] เปลี่ยนค่าเริ่มต้นเป็น null
  const [storeStatus, setStoreStatus] = useState(null);


  // (useEffect สำหรับ Fetch ข้อมูล - เหมือนเดิม)
  useEffect(() => {
    if (!slug) {
        setError("Restaurant slug not found.");
        setLoading(false);
        return;
    }

    const fetchRestaurantDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/shop/${slug}`, { cache: 'no-store' }); 
            if (!res.ok) {
                let errorMsg = `Failed to fetch restaurant. Status: ${res.status}`;
                try { const e = await res.json(); errorMsg = e.message || errorMsg; } catch (_) {}
                throw new Error(errorMsg);
            }
            const data = await res.json();
            
            if (data.restaurant) {
                setRestaurant(data.restaurant); 
                if (data.restaurant.menu && data.restaurant.menu.length > 0) {
                    setActiveTab(data.restaurant.menu[0].category);
                }

                // (เรียกใช้ getDynamicOpenStatus - เหมือนเดิม)
                const status = getDynamicOpenStatus(
                    data.restaurant.is_open, 
                    data.restaurant.opening_hours
                );
                setStoreStatus(status); 
                
            } else {
                throw new Error("Restaurant data not found in response.");
            }
        } catch (err) {
            console.error("Fetch shop detail error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    fetchRestaurantDetails();
  }, [slug]); 


  // (UI Loading / Error / !restaurant - เหมือนเดิม)
  if (loading) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="ml-3 text-gray-600">Loading restaurant details...</p>
        </div>
    );
  }
  if (error) {
     return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <p className="text-xl text-red-600 mb-4 text-center">Error: {error}</p>
        </div>
     );
  }
  if (!restaurant) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
             <p className="text-gray-600">404: Restaurant not found.</p>
        </div>
    );
  }

  // (Logic แสดงผล - เหมือนเดิม)
  const menuCategories = restaurant.menu?.map(cat => cat.category) || [];
  const activeMenuItems = restaurant.menu?.find(cat => cat.category === activeTab)?.items || [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar /> 

      {/* (ส่ง props (isOpen, statusText) ไปให้ StoreBanner - เหมือนเดิม) */}
      <StoreBanner
        imageUrl={restaurant.image || 'https://placehold.co/1200x400/F3EFEF/AAAAAA?text=No+Banner'}
        title={`${restaurant.name} - ${restaurant.branch}`}
        rating={restaurant.rating}
        reviewCount={restaurant.reviewCount}
        details={restaurant.type || ''} 
        isOpen={storeStatus ? storeStatus.isOpen : true} // 👈 [แก้ไข] ส่งค่า default
        statusText={storeStatus ? storeStatus.text : null} // 👈 [แก้ไข] ส่ง null ถ้ายังไม่พร้อม
      />
      
      <MenuTabs 
        categories={menuCategories}
        activeTab={activeTab}
        onTabClick={setActiveTab} 
      />

      {activeMenuItems.length > 0 ? (
        <MenuSection 
            title={activeTab} 
            items={activeMenuItems} 
            restaurant={{id: restaurant.id, name: restaurant.name}} 
        />
      ) : (
        <div className="text-center py-10 text-gray-500">
          This restaurant has no menu items available in this category.
        </div>
      )}
      
      {/* (ReviewSection - เหมือนเดิม) */}
      <ReviewSection 
        title="Customer Reviews"
        reviews={restaurant.reviews || []}
      />

      {/* (Map Section - เหมือนเดิม) */}
      {restaurant.latitude && restaurant.longitude && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-2xl font-bold">Location</h3>
            <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </a>
          </div>
          <div className="rounded-lg overflow-hidden shadow-md z-0 relative">
            <StoreMap 
              lat={restaurant.latitude} 
              lng={restaurant.longitude}
              storeName={restaurant.name}
            />
          </div>
        </section>
      )}
      
      <Footer /> 
    </div>
  );
}