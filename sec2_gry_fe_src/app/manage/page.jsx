"use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <-- Commented out for Canvas
import Navbar from "../components/Navbar"; // <-- Commented out for Canvas
import { Loader2 } from "lucide-react"; // <-- Import Loader icon

function ManageHome() {
  const router = useRouter(); // <-- Commented out for Canvas

  const [restaurantData, setRestaurantData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      setLoading(true);
      setError(null);
      console.log("[ManageHome] Starting to fetch restaurant data..."); // <-- Log เพิ่ม
      try {
        const res = await fetch('/api/manage/restaurant', { cache: 'no-store' }); 
        console.log(`[ManageHome] Fetch response status: ${res.status}`); // <-- Log เพิ่ม

        if (!res.ok) {
          // --- 👇 ตรวจสอบ Status Code ที่ละเอียดขึ้น ---
          const errorStatus = res.status;
          let errorMessage = `Failed to fetch restaurant data. Status: ${errorStatus}`;
          try {
             // ลองอ่าน body ถ้ามี (อาจจะเป็น JSON หรือ Text)
             const errorBody = await res.text(); 
             console.error("[ManageHome] Fetch error response body:", errorBody);
             // ลอง parse เป็น JSON ถ้าทำได้
             try { errorMessage = JSON.parse(errorBody).message || errorMessage; } catch (e) {}
          } catch (bodyError) {
             console.error("[ManageHome] Could not read error response body:", bodyError);
          }

          // --- เช็ค 404 ก่อน ---
          if (errorStatus === 404) {
             console.log("[ManageHome] Received 404, redirecting to create page...");
             window.location.replace('/manage/create'); 
             return; 
          } 
          // --- เช็ค 401/403 (เผื่อกรณี Auth มีปัญหาหลัง Redirect) ---
          else if (errorStatus === 401 || errorStatus === 403) {
             console.warn(`[ManageHome] Received ${errorStatus}. Authentication issue? Redirecting to login.`);
             // อาจจะ Redirect ไป Login แทน ถ้าเป็น 401/403
             // window.location.replace('/login'); 
             // return;
          }
          // Error อื่นๆ โยน Error พร้อม Message ที่อ่านมา
          throw new Error(errorMessage); 
        }

        const data = await res.json();
        console.log("[ManageHome] Fetch successful, received data:", data.restaurant?.Restaurant_Id); // <-- Log เพิ่ม
        setRestaurantData(data.restaurant); 

      } catch (err) {
        console.error("[ManageHome] Fetch restaurant error:", err);
        setError(err.message);
      } finally {
        setLoading(false); 
      }
    };

    fetchRestaurantData();
  }, []); 


  // --- UI (เหมือนเดิม) ---
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
          <p className="ml-3 text-gray-600">Loading restaurant data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
          <p className="text-xl text-red-600 mb-4 text-center">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gray-500 text-white font-semibold px-6 py-2 rounded-full"
          >
              Try Again
          </button>
      </div>
    );
  }

  if (!restaurantData) {
      // ส่วนนี้อาจจะไม่ค่อยเห็นแล้ว เพราะถ้า 404 จะ Redirect ไปก่อน
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <p className="text-gray-600">No restaurant data available (or still loading initial state).</p>
        </div>
      );
  }

  // --- UI หลัก (ใช้ข้อมูลจาก restaurantData - เหมือนเดิม) ---
  return (
    <div className="bg-white min-h-screen">
      <Navbar/> 
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* ... (ส่วนแสดงข้อมูลร้าน เหมือนเดิม) ... */}
         <div className="border-b border-gray-200 pb-5 mb-5 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-5 relative">
          
          <div className="flex items-start gap-4 flex-grow w-full md:w-auto">
            {/* Logo: ใช้ image_url จาก API */}
            <img
              src={restaurantData.image_url || 'https://via.placeholder.com/150'} 
              alt={`${restaurantData.name} Logo`}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-gray-300 object-contain flex-shrink-0 bg-gray-100" 
            />
            {/* Text Info */}
            <div className="flex-grow min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">{restaurantData.name}</h2>
              <p className="text-gray-600 text-sm sm:text-base">{restaurantData.branch || restaurantData.address || 'No address provided'}</p> 
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Status Badge */}
                {restaurantData.is_open ? (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    Open {restaurantData.opening_hours ? `(until ${restaurantData.opening_hours.split('-')[1]?.trim() || restaurantData.opening_hours})` : ''} 
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    Closed 
                  </span>
                )}
                {/* Close Button */}
                <button className="text-gray-600 border border-gray-300 text-xs font-medium px-4 py-1 rounded-full hover:bg-gray-100 transition duration-200 whitespace-nowrap">
                  {restaurantData.is_open ? 'Close Shop' : 'Open Shop'} 
                </button>
              </div>
            </div>
          </div>

          {/* MANAGEMENT MODE Button */}
          <button
            className="bg-green-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-green-600 transition duration-200 w-full md:w-auto whitespace-nowrap mt-4 md:mt-0"
            onClick={() => { window.location.href="/manage/overview"; }} 
          >
            MANAGEMENT MODE
          </button>
        </div>

        {/* Sales Summary */}
        <div className="border-b border-gray-200 pb-5 mb-5">
            <h3 className="text-gray-500 text-base">Today's Sales</h3> 
            <p className="text-3xl sm:text-4xl font-extrabold mt-1 text-green-700">
                ฿... (Data not available yet) ... 
            </p>
        </div>

        {/* Quality Section */}
        <div className="border-b border-gray-200 pb-5 mb-5">
            <h3 className="text-gray-500 text-base">Last Week's Order Quality</h3> 
            <p className="text-3xl sm:text-4xl font-extrabold mt-1 text-blue-700">
                ... (Data not available yet) ... %
            </p>
        </div>


        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button 
              className="p-4 text-left border-l-4 border-yellow-500 hover:bg-gray-50 transition duration-200"
              onClick={() => console.log('Go to Campaign')}
            >
                {/* ... (Icon and Text) ... */}
                 <div className="flex items-center gap-3">
                    <span className="text-2xl">📢</span>
                    <div>
                        <p className="text-lg font-semibold">Campaigns</p> 
                        <p className="text-sm text-gray-500">Manage discounts and promotions</p> 
                    </div>
                </div>
            </button>
            <button 
              className="p-4 text-left border-l-4 border-red-500 hover:bg-gray-50 transition duration-200"
              onClick={() => console.log('Go to Ads')}
            >
                {/* ... (Icon and Text) ... */}
                 <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                        <p className="text-lg font-semibold">Advertisements</p> 
                        <p className="text-sm text-gray-500">Boost sales by promoting your store</p> 
                    </div>
                </div>
            </button>
        </div>


      </main>
     
    </div>
  );
}

export default ManageHome;

