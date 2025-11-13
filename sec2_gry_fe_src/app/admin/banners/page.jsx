"use client";

import React, { useState, useEffect, useRef } from 'react';
import Navbar from "../../components/Navbar"; //
import { Loader2, UploadCloud, Trash2, X, Image as ImageIcon } from "lucide-react";

export default function AdminBannersPage() {
    const fileInputRef = useRef(null);
    
    // State สำหรับการดึงข้อมูล
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State สำหรับฟอร์มอัปโหลด
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // 1. ดึงข้อมูล Banner ทั้งหมดเมื่อหน้าโหลด
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch('/api/admin/banners');
                if (!res.ok) throw new Error('Failed to fetch banners.');
                const data = await res.json();
                setBanners(data.banners);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    // 2. จัดการเมื่อเลือกไฟล์ (เหมือนหน้า add-menu)
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }
        const url = URL.createObjectURL(file);
        setImageFile(file);
        setImagePreview(url);
        setSubmitError(null);
    };

    // 3. ฟังก์ชันอัปโหลด (handleSubmit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            setSubmitError("Please select an image file to upload.");
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);

        const formData = new FormData();
        formData.append("image", imageFile);

        try {
            const res = await fetch('/api/admin/banners', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to upload banner.');
            }
            
            // เพิ่ม Banner ใหม่เข้าไปใน State ทันที
            setBanners(prevBanners => [data.newBanner, ...prevBanners]);
            
            // รีเซ็ตฟอร์ม
            setImageFile(null);
            setImagePreview(null);
            if(fileInputRef.current) fileInputRef.current.value = "";

        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 4. ฟังก์ชันลบ Banner
    const handleDelete = async (bannerId) => {
        if (!window.confirm("Are you sure you want to delete this banner?")) {
            return;
        }
        
        try {
            const res = await fetch(`/api/admin/banners/${bannerId}`, {
                method: 'DELETE',
            });
            
            if (res.status === 204) {
                // ลบ Banner ออกจาก State
                setBanners(prevBanners => prevBanners.filter(b => b.Banner_Id !== bannerId));
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete banner.');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <ImageIcon className="w-6 h-6 text-black" />
                    <h1 className="text-xl font-bold text-black">Manage Hero Banners</h1>
                </div>

                {/* --- ส่วนอัปโหลด --- */}
                <form onSubmit={handleSubmit} className="bg-gray-100 p-6 rounded-2xl shadow-inner mb-8">
                    <label className="block font-semibold mb-2 text-gray-700">Upload New Banner</label>
                    <input
                        type="file" accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        role="button" tabIndex={0}
                        className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-green-400 transition h-48"
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Banner preview" className="max-h-full max-w-full object-contain rounded" />
                        ) : (
                            <div className="space-y-1 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="text-sm text-gray-600">Click to upload an image</p>
                            </div>
                        )}
                    </div>
                    {submitError && <p className="text-red-500 text-sm mt-2">{submitError}</p>}
                    <button
                        type="submit"
                        className="mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-green-600 flex items-center justify-center disabled:opacity-60"
                        disabled={isSubmitting || !imageFile}
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        {isSubmitting ? "Uploading..." : "Upload Banner"}
                    </button>
                </form>

                {/* --- ส่วนแสดงผล Banner ปัจจุบัน --- */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Current Banners</h2>
                    {loading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                        </div>
                    )}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {banners.length === 0 ? (
                                <p className="text-gray-500 col-span-full">No banners found.</p>
                            ) : (
                                banners.map(banner => (
                                    <div key={banner.banner_id} className="relative border rounded-lg overflow-hidden group">
                                      <img
                                        src={banner.image_url}
                                        alt={`Banner ${banner.banner_id}`}
                                        className="w-full h-32 object-cover"
                                      />
                                      <button
                                        onClick={() => handleDelete(banner.banner_id)}
                                        className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}