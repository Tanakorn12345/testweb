"use client"
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { Loader2, RefreshCw, Phone, User } from "lucide-react"; // เพิ่ม Icon

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/manage/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/manage/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cooking': return 'bg-orange-100 text-orange-800';
      case 'Ready': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Kitchen Monitor (Today)</h1>
          <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {loading && orders.length === 0 ? (
          <div className="text-center py-10"><Loader2 className="animate-spin inline"/> Loading orders...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.length === 0 ? <p className="text-gray-500 col-span-3 text-center">No orders for today.</p> : 
             orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow p-4 border border-gray-100 flex flex-col">
                {/* Header Card */}
                <div className="flex justify-between items-start mb-3 border-b pb-2">
                  <div>
                    <span className="font-bold text-lg">Order #{order.id}</span>
                    <p className="text-xs text-gray-500">Time: {new Date(order.time).toLocaleTimeString('th-TH')}</p>
                    
                    {/* 🟢 ส่วนแสดงข้อมูลลูกค้าที่เพิ่มเข้ามา */}
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400"/> 
                            <span className="font-semibold">{order.customer}</span>
                        </div>
                        {order.phone && (
                            <div className="flex items-center gap-2 mt-1">
                                <Phone size={14} className="text-gray-400"/> 
                                <span>{order.phone}</span>
                            </div>
                        )}
                    </div>

                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items List */}
                <div className="flex-grow space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <div>
                        <span className="font-semibold">{item.quantity}x</span> {item.name}
                        {item.note && <p className="text-xs text-red-500 pl-4">Note: {item.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer / Actions */}
                <div className="mt-auto pt-3 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600 text-sm">Total:</span>
                    <span className="font-bold text-lg">฿{Number(order.total).toLocaleString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'Pending' && (
                       <button onClick={() => updateStatus(order.id, 'Cooking')} className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">Accept / Cook</button>
                    )}
                    {order.status === 'Cooking' && (
                       <button onClick={() => updateStatus(order.id, 'Ready')} className="col-span-2 bg-orange-500 text-white py-2 rounded hover:bg-orange-600 font-medium">Mark as Ready</button>
                    )}
                    {order.status === 'Ready' && (
                       <button onClick={() => updateStatus(order.id, 'Completed')} className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium">Complete Order</button>
                    )}
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                       <button onClick={() => updateStatus(order.id, 'Cancelled')} className="col-span-2 text-red-500 text-sm py-1 hover:underline mt-1">Cancel Order</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}