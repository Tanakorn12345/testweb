"use client";
import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useSearchParams } from 'next/navigation';
import { Clock } from 'lucide-react'; // เพิ่ม icon นาฬิกา

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div>
      <Navbar />
      <div className="text-center py-20 min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-sm">
            <svg className="mx-auto h-24 w-24 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="mt-4 text-3xl font-bold text-gray-800">The order was successful!</h1>
            <p className="mt-2 text-gray-600">Thank you for your order. We have received your request.</p>
            
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            
            {/* 🟢 1. ปุ่มติดตามสถานะ (Highlight ให้เด่นสุด) */}
            {orderId && (
                <Link 
                href={`/order/tracking/${orderId}`} 
                className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 transform hover:-translate-y-1"
                >
                <Clock size={20} />
                Track Order Status
                </Link>
            )}

            {/* 2. ปุ่มกลับหน้าหลัก */}
            <Link href="/" className="inline-block bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition-colors">
                Return to Home
            </Link>

            {/* 3. ปุ่ม Review (เก็บไว้เหมือนเดิม) */}
            {orderId && (
                <Link 
                href={`/review/new?orderId=${orderId}`} 
                className="hidden sm:inline-block text-blue-500 font-medium px-4 py-3 hover:underline"
                >
                Write a Review
                </Link>
            )}
            
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}