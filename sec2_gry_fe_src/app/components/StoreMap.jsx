"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet'; // 👈 Import L เพื่อแก้ปัญหา Icon

// 🎯 แก้ปัญหา Icon ของ Marker ไม่แสดง
// (Leaflet ไม่ได้ออกแบบมาสำหรับ Webpack/Next.js โดยตรง)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});
// --- สิ้นสุดการแก้ปัญหา Icon ---


// --- พิกัดเริ่มต้น (กทม.) เผื่อไม่มีพิกัดร้าน ---
const defaultCenter = [13.7563, 100.5018];

// --- สไตล์ของแผนที่ ---
const mapStyle = {
  height: '400px',
  width: '100%'
};

export default function StoreMap({ lat, lng, storeName }) {
  // แปลง lat, lng ที่อาจจะเป็น string ให้เป็นตัวเลข
  const position = [parseFloat(lat) || defaultCenter[0], parseFloat(lng) || defaultCenter[1]];

  return (
    <MapContainer center={position} zoom={16} style={mapStyle}>
      {/* TileLayer คือผู้ให้บริการลายแผนที่
        ตัวนี้คือ OpenStreetMap แบบมาตรฐาน (ฟรี)
      */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* ปักหมุดตามพิกัดที่ได้รับมา */}
      <Marker position={position}>
        <Popup>
          {storeName || "Store Location"}
        </Popup>
      </Marker>
    </MapContainer>
  );
}