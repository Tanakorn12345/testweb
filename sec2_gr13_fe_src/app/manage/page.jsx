"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation"; // 🟢 1. ต้อง Import ตัวนี้
import { Loader2, Edit, X, Clock, Store } from "lucide-react";

// Component: Modal สำหรับตั้งเวลาเปิด-ปิด (เหมือนเดิม)
function TimeSettingModal({ currentHours, onClose, onSave, isSaving }) {
  const initialTimes = currentHours ? currentHours.split(' - ') : ["09:00", "18:00"];
  const [openTime, setOpenTime] = useState(initialTimes[0]?.trim() || "09:00");
  const [closeTime, setCloseTime] = useState(initialTimes[1]?.trim() || "18:00");

  const handleSubmit = () => {
    const formattedHours = `${openTime} - ${closeTime}`;
    onSave(formattedHours);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock size={20} className="text-blue-500" /> Set Opening Hours
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
            <input 
              type="time" 
              value={openTime} 
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
            <input 
              type="time" 
              value={closeTime} 
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            Save Hours
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageHome() {
  const router = useRouter(); // 🟢 2. เรียกใช้ Hook ตรงนี้ (สำคัญมาก!)
  
  const [todaySales, setTodaySales] = useState(0);
  const [restaurantData, setRestaurantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Function โหลดข้อมูล
  const fetchRestaurantData = async () => {
    setLoading(true);
      try {
        const res = await fetch("/api/manage/restaurant", { cache: "no-store" });
        
        // ถ้า 404 (ยังไม่มีร้าน) -> สั่ง Router ให้เด้งไปหน้าสร้างร้าน
        if (res.status === 404) {
          router.push('/manage/create'); 
          return;
        }

        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setRestaurantData(data.restaurant);
        setTodaySales(Number(data.todaySales) || 0);
      } catch (err) {
        // ถ้าเป็น error 404 เราจัดการไปแล้ว ไม่ต้อง set error
        if (err.message !== "Failed to load") { 
            setError(err.message);
        }
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  // Function บันทึกเวลาเปิด-ปิด
  const handleSaveHours = async (newHours) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/manage/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_hours: newHours })
      });

      if (!res.ok) throw new Error('Failed to update');

      setRestaurantData(prev => ({ ...prev, opening_hours: newHours }));
      setShowTimeModal(false);

    } catch (err) {
      alert("Error updating hours: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Function สลับเปิด/ปิดร้าน
  const toggleShopStatus = async () => {
    const newStatus = !restaurantData.is_open;
    setRestaurantData(prev => ({ ...prev, is_open: newStatus }));
    
    try {
      await fetch('/api/manage/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: newStatus })
      });
    } catch (err) {
      alert("Error toggling status");
      setRestaurantData(prev => ({ ...prev, is_open: !newStatus }));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-500 w-10 h-10"/></div>;
  
  // 🟢 เพิ่มการเช็ค: ถ้าไม่มีข้อมูล (และไม่ใช่ loading) แสดงว่ากำลัง Redirect หรือ Error
  if (!restaurantData) return null; 

  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {showTimeModal && (
        <TimeSettingModal 
          currentHours={restaurantData.opening_hours} 
          onClose={() => setShowTimeModal(false)}
          onSave={handleSaveHours}
          isSaving={isSaving}
        />
      )}

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="border-b border-gray-200 pb-5 mb-5 flex flex-col md:flex-row items-start md:items-center gap-4 relative">
          <div className="flex items-start gap-4 flex-grow w-full md:w-auto">
            <img
              src={restaurantData.image_url || "https://via.placeholder.com/150"}
              alt="Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-gray-300 object-contain bg-gray-100"
            />
            <div className="flex-grow min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">{restaurantData.name}</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                {restaurantData.branch || restaurantData.address || "No address"}
              </p>
              
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${restaurantData.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {restaurantData.is_open ? 'Open Now' : 'Closed'}
                </span>

                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                   <Clock size={14} />
                   <span>{restaurantData.opening_hours || "Set hours"}</span>
                   <button 
                     onClick={() => setShowTimeModal(true)} 
                     className="text-blue-500 hover:text-blue-700 ml-1 p-1 rounded-full hover:bg-blue-50 transition"
                     title="Edit Hours"
                   >
                     <Edit size={14} />
                   </button>
                </div>

                <button 
                  onClick={toggleShopStatus}
                  className={`text-xs font-medium px-4 py-1 rounded-full border transition duration-200 ${restaurantData.is_open ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                >
                  {restaurantData.is_open ? "Close Shop" : "Open Shop"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 w-full md:w-auto">
             <button onClick={() => window.location.href="/manage/orders"} className="bg-blue-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2">
                <span></span> MANAGE ORDERS
             </button>
             <button onClick={() => window.location.href="/manage/overview"} className="bg-green-500 text-white font-bold py-3 px-5 rounded-lg hover:bg-green-600 shadow-sm">
                MANAGEMENT MODE
             </button>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-5 mb-5">
          <h3 className="text-gray-500 text-base">Today's Sales</h3>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 text-green-700">฿{todaySales.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="border-b border-gray-200 pb-5 mb-5">
          <h3 className="text-gray-500 text-base">Last Week's Order Quality</h3>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 text-blue-700">- %</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button className="p-4 text-left border-l-4 border-yellow-500 hover:bg-gray-50 transition shadow-sm rounded-r-lg">
                <div className="flex items-center gap-3"><span className="text-2xl">📢</span><div><p className="text-lg font-semibold">Campaigns</p><p className="text-sm text-gray-500">Manage discounts</p></div></div>
            </button>
            <button className="p-4 text-left border-l-4 border-red-500 hover:bg-gray-50 transition shadow-sm rounded-r-lg">
                <div className="flex items-center gap-3"><span className="text-2xl">🎯</span><div><p className="text-lg font-semibold">Advertisements</p><p className="text-sm text-gray-500">Promote your store</p></div></div>
            </button>
        </div>
      </main>
    </div>
  );
}

export default ManageHome;