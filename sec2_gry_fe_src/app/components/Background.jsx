'use client';

import { Carousel } from 'flowbite-react';
import { useState, useEffect } from 'react'; // 👈 1. Import Hooks

export default function Background() {
  
  
  
  // 👈 3. สร้าง State สำหรับเก็บรูปภาพ
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👈 4. ใช้ useEffect เพื่อดึงข้อมูล Banner
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/banners'); // 👈 5. เรียก API (ขั้นตอน 2.1)
        
        if (!res.ok) {
          throw new Error('Failed to fetch banners');
        }
        
        const data = await res.json();
        
        if (data.images && data.images.length > 0) {
            setImages(data.images); // 👈 6. เก็บ URLs ลง State
        } else {
            // (Optional) ใส่รูป Default ถ้า API ทำงานสำเร็จแต่ไม่มีรูปใน DB
            setImages(["https://images.pexels.com/photos/1107717/pexels-photo-1107717.jpeg"]);
        }

      } catch (error) {
        console.error(error);
        // (Optional) ใส่รูป Default ถ้า API ล่ม
        setImages(["https://images.pexels.com/photos/1107717/pexels-photo-1107717.jpeg"]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []); // [] = ทำงานครั้งเดียว

  // 👈 7. ถ้ากำลังโหลด หรือไม่มีรูป (กรณี Default) ให้ return null (หรือ <Loading...>)
  if (loading) {
    return (
        <div className="w-full aspect-video bg-gray-200 animate-pulse" /> // แสดงกล่องเทาๆ จองที่ไว้
    );
  }

  // ถ้ามีรูปเดียว ไม่ต้องใช้ Carousel
  if (images.length === 1) {
    return (
      <div className="w-full aspect-video">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${images[0]})` }}
          aria-label="Slide 1"
        />
      </div>
    );
  }

  // ถ้ามีหลายรูป ใช้ Carousel
  return (
    <div className="w-full aspect-video"> 
      <Carousel
        slideInterval={4000}
        pauseOnHover={false}
      >
        {/* 👈 8. Map ข้อมูลจาก State (ไม่ใช่จาก Array ที่ Hardcode) */}
        {images.map((src, index) => (
          <div
            key={index}
            className="w-full h-full bg-contain bg-center bg-no-repeat bg-white"
            style={{ backgroundImage: `url(${src})` }}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </Carousel>
    </div>
  );
}