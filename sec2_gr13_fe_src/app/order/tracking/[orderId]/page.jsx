"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // รับค่า orderId จาก URL
import Navbar from "../../../components/Navbar"; // ปรับ Path ตามจริง
import { Loader2, CheckCircle, Clock, ChefHat, ShoppingBag, XCircle } from "lucide-react";

export default function OrderTrackingPage() {
  const { orderId } = useParams(); // ดึง orderId จาก URL
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderStatus = async () => {
    try {
      // เรียก API ที่เราเพิ่งสร้าง
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error("Tracking Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();
    // ตั้งเวลาให้เช็คสถานะใหม่ทุกๆ 5 วินาที (Real-time feeling)
    const interval = setInterval(fetchOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  // ตัวช่วยแสดง Step สถานะ
  const steps = [
    { status: 'Pending', label: 'Order Sent', icon: Clock },
    { status: 'Cooking', label: 'Cooking', icon: ChefHat },
    { status: 'Ready', label: 'Ready for Pickup', icon: ShoppingBag },
    { status: 'Completed', label: 'Completed', icon: CheckCircle },
  ];

  // Logic เช็คว่า Step นี้ผ่านไปหรือยัง
  const getCurrentStepIndex = (status) => {
    if (status === 'Cancelled') return -1;
    return steps.findIndex(s => s.status === status);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin"/></div>;
  if (!order) return <div className="min-h-screen flex justify-center items-center text-red-500">Order not found</div>;

  const currentStepIndex = getCurrentStepIndex(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto py-10 px-4">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Order #{order.OrderCart_Id}</h1>
            <p className="text-gray-500 mb-4">Store: {order.restaurant_name}</p>
            
            {isCancelled ? (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center justify-center gap-2">
                    <XCircle /> Order Cancelled
                </div>
            ) : (
                <div className="flex justify-center items-center gap-2 text-green-600 font-semibold text-lg animate-pulse">
                   {order.status === 'Pending' && "Waiting for confirmation..."}
                   {order.status === 'Cooking' && "Kitchen is cooking your food..."}
                   {order.status === 'Ready' && "Your food is ready! Please pick up."}
                   {order.status === 'Completed' && "Enjoy your meal!"}
                </div>
            )}
        </div>

        {/* Timeline Steps */}
        {!isCancelled && (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.status} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Icon Circle */}
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 
                                    ${isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-slate-500'}
                                    ${isCurrent ? 'ring-4 ring-green-200' : ''}
                                `}>
                                    <Icon size={20} />
                                </div>
                                
                                {/* Text */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow bg-white">
                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                        <div className={`font-bold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{step.label}</div>
                                    </div>
                                    <div className="text-slate-500 text-sm">
                                        {isActive ? 'Done' : 'Pending'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Total Price */}
        <div className="bg-white rounded-xl shadow p-4 mt-6 flex justify-between items-center">
            <span className="text-gray-600">Total Amount</span>
            <span className="text-2xl font-bold text-blue-600">฿{Number(order.total_amount).toLocaleString()}</span>
        </div>

      </main>
    </div>
  );
}