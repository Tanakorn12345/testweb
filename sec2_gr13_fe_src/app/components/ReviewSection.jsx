// app/components/ReviewSection.jsx
import React from 'react';
import { Star } from 'lucide-react';

// Component ย่อยสำหรับแสดงดาว
const ReadOnlyStar = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5; // (เผื่อในอนาคตมี 4.5)
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      ))}
      {/* (ส่วนนี้สำหรับดาวครึ่งดวง - ตอนนี้ API เรายังไม่รองรับ แต่ใส่ไว้ได้)
      {halfStar && <StarHalf className="w-5 h-5 text-yellow-400 fill-yellow-400" />} 
      */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
      ))}
    </div>
  );
};

export default function ReviewSection({ title, reviews = [] }) {
  
  // ฟังก์ชันแปลงวันที่
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h3 className="text-2xl font-bold mb-6">{title}</h3>
      
      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews for this restaurant yet.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">{review.username || 'Anonymous'}</span>
                <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
              </div>
              <ReadOnlyStar rating={review.rating} />
              {review.comment && (
                <p className="text-gray-700 mt-3">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}