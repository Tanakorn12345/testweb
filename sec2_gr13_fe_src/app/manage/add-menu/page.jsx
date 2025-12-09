"use client";

import Navbar from "../../components/Navbar"; // <-- Comment out temporarily
 import Footer from "../../components/Footer"; // <-- Comment out temporarily
import { useState, useRef, useEffect } from "react";
 import { useRouter } from "next/navigation"; // <-- Comment out temporarily
import { Loader2, UploadCloud, Utensils, ArrowLeftIcon } from "lucide-react"; // <-- Icons

export default function AddMenuPage() {
    const router = useRouter(); // <-- Comment out temporarily
    const fileInputRef = useRef(null); 

    // --- State สำหรับฟอร์มเมนู ---
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "", 
        category: "", 
        is_available: true, // ค่าเริ่มต้นคือ พร้อมขาย
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ message: "", type: "" });
    const [imageFile, setImageFile] = useState(null); 
    const [imagePreview, setImagePreview] = useState(null); 

    // --- Cleanup Object URL ---
    useEffect(() => {
        return () => {
          if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
          }
        };
      }, [imagePreview]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ 
            ...prev, 
            // จัดการ Checkbox แยกต่างหาก
            [name]: type === 'checkbox' ? checked : value 
        }));
        setSubmitStatus({ message: "", type: "" }); 
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }
        const url = URL.createObjectURL(file); 
        setImageFile(file); 
        setImagePreview(url); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitStatus({ message: "", type: "" });

        // --- Basic Validation ---
        const priceNum = parseFloat(form.price);
        if (!form.name || !form.price || !form.category) {
            setSubmitStatus({ message: "Please fill in Menu Name, Price, and Category.", type: "error" });
            setSubmitting(false);
            return;
        }
         if (isNaN(priceNum) || priceNum <= 0) {
            setSubmitStatus({ message: "Price must be a positive number.", type: "error" });
            setSubmitting(false);
            return;
        }


        // --- สร้าง FormData ---
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("description", form.description);
        formData.append("price", priceNum.toString()); // ส่งเป็น String
        formData.append("category", form.category);
        formData.append("is_available", form.is_available.toString()); // ส่งเป็น String 'true'/'false'
        if (imageFile) {
            formData.append("image", imageFile); 
        }

        try {
            console.log("--- Submitting Add Menu Form ---");
             for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value instanceof File ? value.name : value}`); 
            }

            // --- 👇 (ขั้นตอนถัดไป) Uncomment และสร้าง API POST /api/manage/menus ---
            const res = await fetch('/api/manage/menus', {
                method: 'POST',
                body: formData,
              });
              

            if (!res.ok) {
                let errorData = { message: "Failed to add menu." };
                try { errorData = await res.json(); } catch (e) {}
                throw new Error(errorData.message || `Status: ${res.status}`);
            }
            

            // --- Mock Success ---
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            setSubmitStatus({ message: "Menu added successfully! Redirecting...", type: "success" });
            setTimeout(() => {
                 router.push("/manage/overview"); // <-- ควรกลับไปหน้า Overview
                console.log("Redirecting to /manage/overview...");
                window.location.href = "/manage/overview"; // Temporary redirect
            }, 2000);

        } catch (err) {
            console.error("Add Menu Error:", err);
            setSubmitStatus({ message: err.message, type: "error" });
            setSubmitting(false); 
        } 
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar /> 
            <div className="p-8 max-w-4xl mx-auto">
                {/* --- ปุ่ม Back --- */}
                 <button 
                   onClick={() => window.history.back()} // Temporary back
                   className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
                 >
                    <ArrowLeftIcon className="w-5 h-5"/> Back to Overview
                 </button>

                <div className="flex items-center gap-3 mb-4">
                     <Utensils className="w-6 h-6 text-black" />
                     <h1 className="text-xl font-bold text-black">Add New Menu Item</h1>
                </div>
                <p className="text-gray-600 mb-6">Fill in the details for your new menu item.</p>

                <form onSubmit={handleSubmit} className="bg-gray-100 p-8 rounded-2xl flex flex-col gap-6 shadow-inner">
                    
                    {/* Menu Name */}
                    <div>
                        <label htmlFor="name" className="block font-semibold mb-1 text-gray-700">Menu Name *</label>
                        <input
                            type="text" id="name" name="name"
                            value={form.name} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            required
                        />
                    </div>

                     {/* Category */}
                    <div>
                        <label htmlFor="category" className="block font-semibold mb-1 text-gray-700">Category *</label>
                        <input
                            type="text" id="category" name="category"
                            placeholder="e.g., Appetizers, Main Course, Drinks"
                            value={form.category} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            required
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label htmlFor="price" className="block font-semibold mb-1 text-gray-700">Price (Baht) *</label>
                        <input
                            type="number" id="price" name="price"
                            value={form.price} onChange={handleChange}
                            min="0" step="0.01" // อนุญาตทศนิยม
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            required
                        />
                    </div>
                   
                    {/* Image Upload */}
                    <div>
                        <label className="block font-semibold mb-1 text-gray-700">Menu Image</label>
                        <input
                            type="file" accept="image/*" 
                            ref={fileInputRef} onChange={handleImageChange}
                            className="hidden" 
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()} 
                            role="button" tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                            className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-green-400 transition h-48"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Menu preview" className="max-h-full max-w-full object-contain rounded" />
                            ) : (
                                <div className="space-y-1 text-center">
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600"><p className="pl-1">Click to upload an image</p></div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block font-semibold mb-1 text-gray-700">Description</label>
                        <textarea
                            id="description" name="description"
                            value={form.description} onChange={handleChange}
                            rows={3}
                            className="w-full bg-orange-50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                     {/* Availability */}
                     <div className="flex items-center gap-3">
                         <input
                            type="checkbox"
                            id="is_available"
                            name="is_available"
                            checked={form.is_available}
                            onChange={handleChange}
                            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                         />
                         <label htmlFor="is_available" className="font-medium text-gray-700">Available for Sale</label>
                     </div>

                    {/* Submit Status */}
                    {submitStatus.message && (
                        <div className={`p-3 rounded-lg text-center font-semibold ${
                            submitStatus.type === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                            {submitStatus.message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-center mt-6">
                        <button
                            type="submit"
                            className="bg-green-500 text-white font-semibold px-12 py-3 rounded-full hover:bg-green-600 flex items-center justify-center disabled:opacity-60 w-full sm:w-auto"
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {submitting ? "Adding Menu..." : "Add Menu Item"}
                        </button>
                    </div>
                </form>
            </div>
            <Footer /> 
        </div>
    );
}
