"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Loader2, Star } from 'lucide-react';

// --- StarRating Component (เหมือนเดิม) ---
const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex justify-start gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 cursor-pointer ${
            rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
};
// ---

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  // --- ⭐️ 1. State สำหรับดึงข้อมูลเมนู ---
  const [itemsToReview, setItemsToReview] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // --- ⭐️ 2. State สำหรับเก็บรีวิว (เป็น Object) ---
  // ใช้ menuId เป็น key เช่น { 101: { rating: 5, comment: "อร่อย" }, 102: { rating: 3, comment: "" } }
  const [reviews, setReviews] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  // --- ⭐️ 3. useEffect สำหรับดึงรายการเมนูที่ต้องรีวิว ---
  useEffect(() => {
    if (!orderId) {
      setLoadError("Order ID not found in URL.");
      setLoadingItems(false);
      return;
    }

    const fetchItems = async () => {
      setLoadingItems(true);
      setLoadError(null);
      try {
        // เรียก API ใหม่ที่เราสร้างในขั้นตอนที่ 1
        const res = await fetch(`/api/orders/${orderId}/items`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to load order items.");
        }
        const data = await res.json();
        
        if (data.items.length === 0) {
            setLoadError("You have already reviewed all items in this order.");
        } else {
            setItemsToReview(data.items);
            // สร้าง State เริ่มต้นสำหรับเก็บรีวิว
            const initialReviews = {};
            for (const item of data.items) {
              initialReviews[item.Menu_Id] = { rating: 0, comment: "" };
            }
            setReviews(initialReviews);
        }

      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [orderId]);

  // --- ⭐️ 4. ฟังก์ชันสำหรับอัปเดต State รีวิว (แยกตามเมนู) ---
  const handleReviewChange = (menuId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        [field]: value
      }
    }));
    setSubmitError(null); // เคลียร์ error ถ้ามีการแก้ไข
  };

  // --- ⭐️ 5. ฟังก์ชัน Submit (ส่งข้อมูลแบบ Array) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // กรองเอาเฉพาะรีวิวที่ให้คะแนนแล้ว (rating > 0)
    const reviewsToSubmit = Object.entries(reviews)
      .map(([menuId, data]) => ({
        menuId: parseInt(menuId, 10),
        rating: data.rating,
        comment: data.comment
      }))
      .filter(review => review.rating > 0);

    if (reviewsToSubmit.length === 0) {
      setSubmitError("Please provide a rating for at least one item.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCartId: orderId,
          reviews: reviewsToSubmit // 👈 ส่ง Array
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to submit reviews.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err) {
      setSubmitError(err.message);
      setIsSubmitting(false);
    }
  };

  // --- UI (Loading, Success, Error) ---
  if (loadingItems) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          <p className="mt-4 text-gray-600">Loading your order items...</p>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (success) { /* (เหมือนเดิม) */ }
  if (loadError) { /* (แสดง loadError) */ }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-2xl mx-auto p-4 sm:p-8 w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Review Your Order</h1>
        <p className="text-center text-gray-600 mb-4">Order ID: {orderId}</p>

        {/* ⭐️ 6. แสดงฟอร์มเป็นรายการเมนู ⭐️ */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {itemsToReview.map((item) => (
            <div key={item.Menu_Id} className="bg-gray-100 p-4 rounded-lg shadow-sm space-y-3">
              <div className="flex items-center gap-4">
                <img 
                  src={item.menuImage || 'https://placehold.co/100x100/F3EFEF/AAAAAA?text=No+Image'} 
                  alt={item.menuName}
                  className="w-16 h-16 rounded-md object-cover" 
                />
                <h2 className="text-lg font-semibold">{item.menuName}</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <StarRating
                  rating={reviews[item.Menu_Id]?.rating || 0}
                  setRating={(rating) => handleReviewChange(item.Menu_Id, 'rating', rating)}
                />
              </div>

              <div>
                <label htmlFor={`comment-${item.Menu_Id}`} className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
                <textarea
                  id={`comment-${item.Menu_Id}`}
                  rows={3}
                  value={reviews[item.Menu_Id]?.comment || ""}
                  onChange={(e) => handleReviewChange(item.Menu_Id, 'comment', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="How was this item?"
                />
              </div>
            </div>
          ))}

          {submitError && (
            <div className="p-3 rounded-lg text-center font-semibold bg-red-100 text-red-800">
              Error: {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting ? "Submitting Reviews..." : "Submit All Reviews"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}