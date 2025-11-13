"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from '../context/CartContext'; // <-- ใช้จริงเลย
import { Loader2 } from "lucide-react";

export default function OrderPage() {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart(); // <-- ใช้ context จริง
  const [payment, setPayment] = useState("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // ถ้าไม่มีสินค้าในตะกร้า
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-2xl font-bold text-gray-700">Your cart is empty.</h1>
          <p className="text-gray-500 mt-2">It looks like you haven't added anything to your cart yet.</p>
          <a href="/" className="mt-6 bg-green-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">
            Start shopping          
          </a>
        </main>
        <Footer /> 
      </div>
    );
  }

  // จัดกลุ่มสินค้าในตะกร้าตามร้าน
  const groupedByRestaurant = cartItems.reduce((acc, item) => {
    const restaurantName = item.restaurant.name;
    if (!acc[restaurantName]) acc[restaurantName] = [];
    acc[restaurantName].push(item);
    return acc;
  }, {});

  // คำนวณราคารวม
  const total = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price.replace('฿', ''));
    return sum + (price * item.quantity);
  }, 0);

  // ส่งคำสั่งซื้อ
  const handleOrder = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          total,
          paymentMethod: payment
        })
      });
      // 1. อ่าน JSON response จาก API ก่อนเสมอ
      const result = await res.json();

      if (!res.ok) {
        // 2. ใช้ message จาก result ที่อ่านมา (ถ้ามี)
        let errorMsg = result.message || `Failed to create order. Status: ${res.status}`;
        throw new Error(errorMsg);
      }

      // 3. ถ้าสำเร็จ, ดึง orderCartId และส่งต่อไปยังหน้า success
      const newOrderCartId = result.orderCartId;

      clearCart();
      // 4. ส่ง newOrderCartId ไปกับ URL
      router.push(`/order/success?orderId=${newOrderCartId}`);

    } catch (err) {
      console.error(err);
      setSubmitError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow px-4 sm:px-6 py-6 max-w-2xl mx-auto flex flex-col gap-6 w-full">
        {Object.entries(groupedByRestaurant).map(([restaurantName, items]) => (
          <div key={restaurantName} className="flex flex-col gap-4">
            <h2 className="text-lg font-bold border-b pb-2">{restaurantName}</h2>
            {items.map(item => (
              <div key={item.id} className="bg-gray-100 rounded-xl p-4 flex justify-between items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-gray-300 rounded">-</button>
                    <div className="w-10 h-10 bg-gray-200 flex items-center justify-center">{item.quantity}</div>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-gray-300 rounded">+</button>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{item.name}</h2>
                    <button onClick={() => removeFromCart(item.id)} className="text-sm text-red-500">Remove</button>
                  </div>
                </div>
                <div className="text-right text-lg font-medium">฿{(parseFloat(item.price.replace('฿', '')) * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
        ))}

        <div className="bg-gray-100 rounded-xl p-4 flex justify-between font-bold">
          <span>Total</span>
          <span>฿{total.toFixed(2)}</span>
        </div>

        {/* Payment */}
        <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-3">
          <p className="font-bold text-lg">Method of Payment</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setPayment("Cash")} className={`flex-1 border rounded-xl p-3 ${payment==="Cash" ? 'bg-green-500 text-white' : 'bg-white text-gray-700'}`}>Cash</button>
            <button onClick={() => setPayment("PromptPay")} className={`flex-1 border rounded-xl p-3 ${payment==="PromptPay" ? 'bg-green-500 text-white' : 'bg-white text-gray-700'}`}>PromptPay</button>
          </div>
        </div>

        {submitError && (
          <div className="p-3 rounded-lg text-center font-semibold bg-red-100 text-red-800">
            Error: {submitError}
          </div>
        )}

        <button onClick={handleOrder} disabled={isSubmitting} className="bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl text-xl font-semibold flex justify-between px-6 transition w-full disabled:opacity-60">
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Ordering...</span>
            </>
          ) : (
            <>
              <span>Confirm Order</span>
              <span>฿{total.toFixed(2)}</span>
            </>
          )}
        </button>
      </main>
      <Footer />
    </div>
  );
}
