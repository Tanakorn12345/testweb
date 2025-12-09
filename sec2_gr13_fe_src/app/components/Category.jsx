import React from "react";

const categories = [
  { name: "Thai Food", icon: "🇹🇭" }, // Changed icons for clarity
  { name: "Chinese Food", icon: "🇨🇳" },
  { name: "Japanese Food", icon: "🇯🇵" },
  { name: "American Food", icon: "🇺🇸" },
  { name: "Dessert", icon: "🍰" },
  { name: "Beverage", icon: "🥤" }
];

// ✅ 1. รับ props เข้ามา
function Category({ selectedCategory, onSelectCategory }) {
  return (
    <div className="bg-white py-4">
      <h2 className="text-lg sm:text-xl font-bold text-center pb-4">
        CATEGORY
      </h2>

      <div className="flex flex-wrap justify-center gap-4 px-4">
        {categories.map((cat, index) => (
          <div
            key={index}
            // ✅ 2. เมื่อคลิก ให้เรียกใช้ฟังก์ชัน onSelectCategory ที่ได้รับมา
            onClick={() => onSelectCategory(cat.name)}
            // ✅ 3. เช็คว่า category นี้กำลังถูกเลือกอยู่หรือไม่ เพื่อเปลี่ยนสี
            className={`flex flex-col items-center justify-center w-[100px] sm:w-[120px] rounded-2xl p-3 shadow-md cursor-pointer transition-all duration-200
              ${selectedCategory === cat.name 
                ? 'bg-green-500 text-white scale-105' // สไตล์เมื่อถูกเลือก
                : 'bg-gray-100 hover:bg-green-100'   // สไตล์ปกติ
              }`
            }
          >
            <span className="text-2xl sm:text-3xl">{cat.icon}</span>
            <span className="text-sm sm:text-base font-medium mt-1 text-center">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Category;