"use client";

import React, { useState, useRef, useEffect, useMemo } from "react"; 
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Card from "../components/Card";
import { Loader2 } from "lucide-react"; 

//  ฟังก์ชันคำนวณระยะทาง (Haversine formula)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return Infinity; // ถ้าไม่มีพิกัด ให้ถือว่าไกลมาก
  }
  var R = 6371; // รัศมีของโลก (km)
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // ระยะทาง (km)
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
// ---



function Page() {
  // --- State สำหรับ Filter/Search (เหมือนเดิม) ---
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const distances = ["1-2KM", "3-4KM", "4-6KM", "6KM+"];
  const types = ["Thai Food", "Chinese Food", "Japanese Food", "American Food", "Dessert", "Beverage"];
  const ratings = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);

  // --- 2. State สำหรับ Data Fetching ---
  const [allRestaurants, setAllRestaurants] = useState([]); // <-- เก็บข้อมูลจริง
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //  State สำหรับเก็บตำแหน่งผู้ใช้
  const [userLocation, setUserLocation] = useState(null); // { lat: ..., lng: ... }
  const [locationError, setLocationError] = useState(null);

  // --- 3. useEffect สำหรับ Fetch ข้อมูลร้านค้า ---
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/restaurants', { cache: 'no-store' }); // <-- เรียก API
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
  }, []); // [] = ทำงานครั้งเดียว


  // useEffect (ขอตำแหน่งผู้ใช้)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (err) => {
          // ถ้าผู้ใช้ปฏิเสธ หรือหาตำแหน่งไม่ได้
          console.warn("Geolocation error:", err.message);
          setLocationError("Could not get your location. Distance filter is disabled.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []); // ทำงานครั้งเดียว



  // --- useEffect สำหรับ Click Outside (เหมือนเดิม) ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]); // <-- เพิ่ม dependency

  // --- Active Filters (เหมือนเดิม) ---
  const activeFilters = [
    selectedDistance && { type: "distance", value: selectedDistance },
    selectedType && { type: "type", value: selectedType },
    selectedRating && { type: "rating", value: selectedRating },
  ].filter(Boolean);

  const removeFilter = (filterType) => {
    if (filterType === "distance") setSelectedDistance(null);
    if (filterType === "type") setSelectedType(null);
    if (filterType === "rating") setSelectedRating(null);
  };

  // --- Logic การกรอง (filteredRestaurants) (รวมโค้ด 2 ส่วน) ---
  const filteredRestaurants = useMemo(() => {
    // 1. ถ้ากำลังโหลดร้านค้า ให้ trả về mảng rỗng
    if (loading) {
      return [];
    }
    
    // 2. ถ้าเลือกกรองระยะทาง แต่ยังไม่ได้ตำแหน่ง (และยังไม่มี Error) ให้ trả về mảng rỗng
    if (selectedDistance && !userLocation && !locationError) {
      return []; 
    }

    // 3. เริ่มกรอง
    return allRestaurants.filter(restaurant => {
      
      // กรองด้วย Query (จาก Logic เดิม)
      if (query && !restaurant.name.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      
      // กรองด้วย Type (จาก Logic เดิม)
      if (selectedType && restaurant.type !== selectedType) {
        return false;
      }
      
      // กรองด้วย Rating (แก้ไขให้ใช้ restaurant.rating)
      if (selectedRating && Math.floor(restaurant.rating) !== selectedRating.length) { 
        return false;
      }
      
      // กรองด้วย Distance (ใช้ Logic ใหม่)
      if (selectedDistance) {
        // ถ้าผู้ใช้ปิด Location หรือ ร้านไม่มีพิกัด ให้ซ่อน
        if (locationError || !userLocation || !restaurant.latitude || !restaurant.longitude) {
            return false;
        }

        // คำนวณระยะทาง
        const distance = getDistanceFromLatLonInKm(
          userLocation.lat,
          userLocation.lng,
          restaurant.latitude,
          restaurant.longitude
        );
        
        // (ใช้ Logic เดิมของคุณ)
        if (selectedDistance === "1-2KM" && (distance < 1 || distance > 2)) return false;
        if (selectedDistance === "3-4KM" && (distance < 3 || distance > 4)) return false;
        if (selectedDistance === "4-6KM" && (distance < 4 || distance > 6)) return false;
        if (selectedDistance === "6KM+" && distance <= 6) return false;
      }
      
      // 4. ผ่านทุกเงื่อนไข
      return true;
    });
  }, [allRestaurants, query, selectedType, selectedRating, selectedDistance, loading, userLocation, locationError]); // <-- Dependencies ที่ถูกต้อง


  return (
    <div>
      <Navbar />
  
      <form
        onSubmit={(e) => e.preventDefault()}
        ref={wrapperRef}
        className="w-full max-w-[90%] mx-auto mb-40 mt-10 md:max-w-lg md:ml-20 relative"
      >
        {/* Tag Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {activeFilters.map((f, index) => (
              <span key={index} className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs md:text-sm">
                {f.value}
                <button
                  type="button"
                  onClick={() => removeFilter(f.type)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
  
        {/* Search Input */}
        <div className="relative">
          <input
            type="search"
            id="default-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="block w-full p-3 md:p-4 text-sm md:text-base text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500"
            placeholder="Search Restaurant , menu."
          />
          <button
            type="submit"
            className="text-white absolute right-2 bottom-2 bg-green-400 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xs md:text-sm px-3 py-2"
          >
            Search
          </button>
        </div>
  
        {/* Status Text */}
        {selectedDistance && !userLocation && !locationError && (
          <div className="mt-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 inline animate-spin mr-1" />
            Getting your location for distance filter...
          </div>
        )}
        {locationError && (
          <div className="mt-2 text-sm text-red-600">
            {locationError}
          </div>
        )}
  
        {/* Dropdown Filter */}
        {showDropdown && (
          <div className="absolute z-40 w-full bg-white border border-gray-200 rounded-lg shadow-md mt-2 p-4 space-y-4 max-h-64 overflow-y-auto md:max-h-none">
            
            {/* Distance */}
            <div>
              <p className="font-semibold mb-2 text-sm md:text-base">📍 Distance</p>
              <div className="flex flex-wrap gap-2">
                {distances.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDistance(selectedDistance === d ? null : d)}
                    className={`px-2 py-1 md:px-3 md:py-1 rounded-lg border text-xs md:text-sm ${
                      selectedDistance === d ? "bg-green-400 text-white" : "bg-gray-100"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
  
            {/* Type */}
            <div>
              <p className="font-semibold mb-2 text-sm md:text-base">🍴 Type</p>
              <div className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(selectedType === t ? null : t)}
                    className={`px-2 py-1 md:px-3 md:py-1 rounded-lg border text-xs md:text-sm ${
                      selectedType === t ? "bg-green-400 text-white" : "bg-gray-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
  
            {/* Rating */}
            <div>
              <p className="font-semibold mb-2 text-sm md:text-base">⭐ Rating</p>
              <div className="flex flex-wrap gap-2">
                {ratings.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRating(selectedRating === r ? null : r)}
                    className={`px-2 py-1 md:px-3 md:py-1 rounded-lg border text-xs md:text-sm ${
                      selectedRating === r ? "bg-green-400 text-white" : "bg-gray-100"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
  
          </div>
        )}
      </form>
  
      {/* Results Section */}
      <div className="w-full max-w-[90%] mx-auto mb-11 mt-10 md:max-w-7xl">
  
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 mx-auto text-green-500 animate-spin" />
            <p className="mt-4 text-gray-500">Loading restaurants...</p>
          </div>
        )}
  
        {error && (
          <div className="text-center py-20">
            <p className="text-xl text-red-500">😢 Error: {error}</p>
          </div>
        )}
  
        {!loading && !error && (
          <>
            {filteredRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredRestaurants.map((resto) => (
                  <Card key={resto.id} restaurant={resto} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                {(selectedDistance && !userLocation && !locationError) ? (
                  <p className="text-xl text-gray-500">Finding restaurants near you...</p>
                ) : (
                  <p className="text-xl text-gray-500">😢 No restaurants found that match the criteria.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
  
      <Footer />
    </div>
  );
  
}

export default Page;