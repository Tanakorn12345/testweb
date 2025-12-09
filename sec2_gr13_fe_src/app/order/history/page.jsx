"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { Loader2, ShoppingBag, ChevronRight, Clock } from "lucide-react";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders/history');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Fetch orders error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cooking': return 'bg-orange-100 text-orange-800';
      case 'Ready': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag /> My Orders
        </h1>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow">
             <p className="text-gray-500 text-lg">You haven't ordered anything yet.</p>
             <Link href="/" className="mt-4 inline-block text-green-600 font-medium hover:underline">Find Food</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.OrderCart_Id} className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                <div className="flex items-center gap-4">
                  {/* รูปภาพร้าน (ถ้ามี) หรือ Icon แทน */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                     {order.restaurant_image ? (
                        <img src={order.restaurant_image} alt={order.restaurant_name} className="w-full h-full object-cover"/>
                     ) : (
                        <ShoppingBag className="text-gray-400"/>
                     )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{order.restaurant_name}</h3>
                    <p className="text-sm text-gray-500">
                      Order #{order.OrderCart_Id} • {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <div className="mt-1">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                         {order.status}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto">
                   <span className="font-bold text-lg">฿{Number(order.total_amount).toLocaleString()}</span>
                   
                   {/* ปุ่ม Track: แสดงเฉพาะถ้ายังไม่ Completed/Cancelled หรือจะแสดงตลอดก็ได้ */}
                   {order.status !== 'Cancelled' && (
                     <Link 
                       href={`/order/tracking/${order.OrderCart_Id}`} 
                       className="flex items-center gap-1 text-sm bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 font-medium transition"
                     >
                        <Clock size={16}/> Track Order
                     </Link>
                   )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}