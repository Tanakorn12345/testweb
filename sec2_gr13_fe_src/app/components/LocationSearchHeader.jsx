"use client";

import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

export default function AddressHeader() {
  const [locationName, setLocationName] = useState("Locating..."); 
  const [error, setError] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // ดึงชื่อสถานที่จาก OpenStreetMap
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
            );
            const data = await response.json();
            const address = data.address;
            
            // เลือกชื่อที่จะโชว์ (ถนน > แขวง > เขต > จังหวัด)
            const displayName = address.road || address.suburb || address.city || address.town || address.state || "Unknown Location";
            
            setLocationName(displayName);
          } catch (err) {
            console.error(err);
            setLocationName("Location unavailable");
          }
        },
        (err) => {
          console.error(err);
          setLocationName("Please enable location");
          setError(true);
        }
      );
    } else {
      setLocationName("Geolocation not supported");
    }
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-1">
      <div className="flex items-center gap-3">
        {/* Icon หมุด */}
        <div className={`p-2 rounded-full ${error ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
           <MapPin size={24} strokeWidth={2.5} />
        </div>
        
        {/* Text ที่อยู่ */}
        <div>
            <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mb-0.5">
                YOUR ADDRESS NOW
            </p>
            <p className="text-base sm:text-lg font-bold text-gray-900 leading-none truncate max-w-[250px] sm:max-w-md">
                {locationName}
            </p>
        </div>
      </div>
    </div>
  );
}