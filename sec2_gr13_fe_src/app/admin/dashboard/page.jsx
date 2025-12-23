"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Navbar from '../../components/Navbar';
import { MdSpaceDashboard } from "react-icons/md";

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', 
  '#00C49F', '#FFBB28', '#FF8042', '#a05195', '#d45087',
  '#f95d6a', '#ff7c43', '#ffa600', '#488f31', '#de425b'
];

export default function AdminDashboardPage() {
  const [chartData, setChartData] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [shopRanking, setShopRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  //  คำนวณยอดรวมทั้งหมดจาก Shop Ranking (Derived State)
  const totalRevenue = shopRanking.reduce((sum, item) => sum + item.value, 0);

  // เช็ก Port ให้ตรงกับ Backend ของคุณ
  const BACKEND_URL = 'http://localhost:3001'; 

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [salesRes, rankingRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/dashboard/daily-shop-sales`, {
            params: { month: selectedMonth, year: selectedYear }
        }),
        axios.get(`${BACKEND_URL}/api/dashboard/shop-ranking`)
      ]);

      // --- 1. Process Data for Stacked Bar Chart ---
      const rawData = salesRes.data;
      const shops = [...new Set(rawData.map(item => item.shop_name))];
      setAllShops(shops);

      const processedChartData = [];
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStats = { date: d };
        const salesToday = rawData.filter(item => item.day_num === d);
        shops.forEach(shop => {
            const shopSale = salesToday.find(s => s.shop_name === shop);
            dayStats[shop] = shopSale ? Number(shopSale.total) : 0;
        });
        processedChartData.push(dayStats);
      }
      setChartData(processedChartData);

      // --- 2. Process Shop Ranking (All Shops) ---
      setShopRanking(rankingRes.data.map(item => ({
          name: item.shop_name,
          value: Number(item.total_sales)
      })));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  return (
    <>
    <Navbar/>
      
    <div className="min-h-screen bg-gray-50 p-8">
       
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
            <h1 className=" flex gap-2 text-3xl font-bold text-gray-800">
            <MdSpaceDashboard size={30}/>
                 Admin Dashboard
            </h1>
            <p className="text-gray-500">Monthly sales overview</p>
        </div>

        <div className="flex gap-4 mt-4 md:mt-0 bg-white p-3 rounded-lg shadow-sm">
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border rounded px-3 py-1 text-gray-700 focus:outline-blue-500"
            >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
            </select>
            
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border rounded px-3 py-1 text-gray-700 focus:outline-blue-500"
            >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
            </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading please wait...</div>
      ) : (
        <div className="space-y-8">
            
            {/* 1. Stacked Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold mb-4 text-gray-700">
                     Daily Sales by Shop (Month {selectedMonth}/{selectedYear})
                </h2>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date" 
                            label={{ value: 'Date', position: 'insideBottom', offset: -5 }} 
                        />
                        <YAxis />
                        <Tooltip 
                            formatter={(value, name) => [`฿${value.toLocaleString()}`, name]}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        {allShops.map((shopName, index) => (
                            <Bar 
                                key={shopName} 
                                dataKey={shopName} 
                                stackId="a" 
                                fill={COLORS[index % COLORS.length]} 
                                name={shopName}
                            />
                          
                        ))}
                    </BarChart>
                 
                    </ResponsiveContainer>
                </div>
                {allShops.length === 0 && (
                    <p className="text-center text-gray-400 mt-4">There is no sales data available for this month.</p>
                )}
            </div>

            {/* 2. Shop Ranking (All Shops) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">
                        Sales Ranking (All Shops)
                    </h2>
                    
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                            <Pie
                                data={shopRanking}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {shopRanking.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                            <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* List Ranking (Scrollable) */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">Ranking Summary</h2>
                    
                    {/* เพิ่ม overflow-y-auto เพื่อให้ Scroll ได้ถ้าร้านเยอะ */}
                    <div className="flex-1 overflow-y-auto max-h-[300px] pr-2">
                        <ul className="space-y-3">
                            {shopRanking.map((shop, index) => (
                                <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-3 ${index < 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-600'}`}>
                                            {index + 1}
                                        </div>
                                        <span className="text-gray-700 font-medium">{shop.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">฿{shop.value.toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex  justify-between  p-3 pt-6">
                            <p className="text-lg text-black-500 flex font-bold">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">
                                ฿{totalRevenue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      )}
    </div>
    </>
  );
}