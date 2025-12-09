// components/StoreBanner.jsx

import { Star } from 'lucide-react';

export default function StoreBanner({
  imageUrl,
  title,
  rating,
  reviewCount,
  details,
  isOpen,      
  statusText   
}) {
  return (
    <section className="relative w-full h-64 md:h-80 lg:h-96">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')` }}
        role="img" 
        aria-label={`Banner for ${title}`} 
      />
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end text-white p-4 md:p-6 lg:p-8">
        <div className="text-left">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold">{title}</h2>
          
          {/* 🎯 [แก้ไข] ห่อหุ้ม Badges ทั้งหมด */}
          {/* จะแสดงผล Badges ทั้ง 3 อันพร้อมกัน
               ก็ต่อเมื่อ statusText (ที่คำนวณแล้ว) ไม่ใช่ null
          */}
          {statusText ? (
            <div className="flex items-center flex-wrap gap-3 mt-3">
              {/* Badge สถานะ Open/Closed */}
              <span className={`
                ${isOpen ? 'bg-green-500/80' : 'bg-red-500/80'} 
                backdrop-blur-sm text-white px-3 py-1 rounded text-sm font-semibold
              `}>
                {statusText}
              </span>

              {/* Badge Rating */}
              <span className="flex items-center bg-yellow-400 text-black px-2 py-1 rounded text-sm font-semibold">
                <Star className="w-4 h-4 mr-1.5" /> {rating} ({reviewCount})
              </span>
              
              {/* Badge Details */}
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded text-sm">
                {details}
              </span>
            </div>
          ) : (
            // [ใหม่] แสดง "กล่องจองที่" ที่มีความสูงเท่ากัน ขณะรอคำนวณ
            <div className="h-[34px] mt-3"> 
              {/* (เว้นว่างไว้ ไม่ให้กระโดด) */}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}