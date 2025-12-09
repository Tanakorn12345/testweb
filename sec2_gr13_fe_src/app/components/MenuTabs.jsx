"use client";
import React from "react";

// รับ props 3 ตัว: categories, activeTab, onTabClick
function MenuTabs({ categories = [], activeTab, onTabClick }) {
  return (
    <div className=" bg-white shadow-sm z-30">
      <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
        <div className="flex space-x-8 border-b">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onTabClick(category)}
              className={`py-4 px-1 text-sm font-medium whitespace-nowrap
                ${
                  activeTab === category
                    ? "border-b-2 border-green-500 text-green-600" // สไตล์เมื่อแท็บถูกเลือก
                    : "border-b-2 border-transparent text-gray-500 hover:text-gray-700" // สไตล์ปกติ
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MenuTabs;