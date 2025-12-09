"use client";
import Navbar from "../../components/Navbar"; // <-- Comment out temporarily
import Footer from "../../components/Footer"; // <-- Comment out temporarily
import { useState, useRef, useEffect } from "react"; // <-- เพิ่ม useRef, useEffect
import { useRouter } from "next/navigation"; // <-- Comment out temporarily
import { Loader2, Store, UploadCloud } from "lucide-react"; // <-- เพิ่ม UploadCloud

export default function CreateRestaurantPage() {
    const router = useRouter(); // <-- Comment out temporarily
    const fileInputRef = useRef(null); // <-- Ref สำหรับ input file

    // State for the form
    const [form, setForm] = useState({
        name: "",
        description: "",
        opening_hours: "",
        phone: "",
        address: "",
        branch: "", // <-- เพิ่ม
        slug: "",   // <-- เพิ่ม
        type: "",    // <-- เพิ่ม
        latitude: "",  // 👈 เพิ่ม
        longitude: ""  // 👈 เพิ่ม
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ message: "", type: "" });

    // --- 1. เพิ่ม State สำหรับรูปภาพ ---
    const [imageFile, setImageFile] = useState(null); // เก็บ File object
    const [imagePreview, setImagePreview] = useState(null); // เก็บ URL สำหรับ preview

    // --- 4. Cleanup Object URL ---
    useEffect(() => {
        return () => {
          if (imagePreview && imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
          }
        };
    }, [imagePreview]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setSubmitStatus({ message: "", type: "" });
    };

    // --- 3. ฟังก์ชันสำหรับจัดการการเลือกรูปภาพ ---
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

    // --- 5. อัปเดต handleSubmit ให้ใช้ FormData ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitStatus({ message: "", type: "" });

        if (!form.name || !form.address || !form.phone) {
            setSubmitStatus({ message: "Please fill in all required fields.", type: "error" });
            setSubmitting(false);
            return;
        }

        const formData = new FormData();
        for (let key in form) {
            formData.append(key, form[key]);
        }

        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {
            console.log("--- Submitting Create Restaurant Form (with FormData) ---");
            for (let [key, value] of formData.entries()) {
                 console.log(`${key}: ${value instanceof File ? value.name : value}`);
            }

            const res = await fetch('/api/restaurants', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                let errorData = { message: "Failed to create restaurant. Status: " + res.status };
                try { errorData = await res.json(); } catch (jsonError) { errorData.message = await res.text(); }
                throw new Error(errorData.message || "Something went wrong.");
            }

            const result = await res.json();
            console.log("Backend Response:", result);

            setSubmitStatus({ message: "Restaurant created successfully! Redirecting...", type: "success" });
            setTimeout(() => {
                 router.push("/manage"); // Uncomment in real project
                window.location.href = "/manage"; 
            }, 2000);

        } catch (err) {
            console.error("Create Restaurant Error:", err);
            setSubmitStatus({ message: err.message || "Failed to create restaurant.", type: "error" });
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
             <Navbar /> 
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                     <Store className="w-6 h-6 text-green-700" />
                     <h1 className="text-xl font-bold text-green-700">Restaurant Setup</h1>
                </div>
                <p className="text-gray-600 mb-6">Please provide your restaurant details to get started.</p>

                <form onSubmit={handleSubmit} className="bg-gray-100 p-8 rounded-2xl flex flex-col gap-6 shadow-inner">

                    {/* Restaurant Name */}
                    <div>
                        <label htmlFor="name" className="block font-semibold mb-1 text-gray-700">Restaurant Name *</label>
                        <input
                            type="text" id="name" name="name"
                            value={form.name} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            required
                        />
                    </div>

                    {/* Branch */}
                    <div>
                        <label htmlFor="branch" className="block font-semibold mb-1 text-gray-700">Branch</label>
                        <input
                            type="text" id="branch" name="branch"
                            value={form.branch} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label htmlFor="slug" className="block font-semibold mb-1 text-gray-700">Slug</label>
                        <input
                            type="text" id="slug" name="slug"
                            value={form.slug} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label htmlFor="type" className="block font-semibold mb-1 text-gray-700">Type</label>
                        <input
                            type="text" id="type" name="type"
                            value={form.type} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    {/* --- Image Upload --- */}
                    <div>
                        <label className="block font-semibold mb-1 text-gray-700">Restaurant Image</label>
                        <input
                            type="file" accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                            className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-green-400 transition h-48"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Restaurant preview" className="max-h-full max-w-full object-contain rounded" />
                            ) : (
                                <div className="space-y-1 text-center">
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <p className="pl-1">Click to upload an image</p>
                                    </div>
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

                    {/* Opening Hours */}
                    <div>
                        <label htmlFor="opening_hours" className="block font-semibold mb-1 text-gray-700">Opening Hours (e.g., 10:00 - 22:00)</label>
                        <input
                            type="text" id="opening_hours" name="opening_hours"
                            value={form.opening_hours} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block font-semibold mb-1 text-gray-700">Phone Number *</label>
                        <input
                            type="tel" id="phone" name="phone"
                            value={form.phone} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            required
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="address" className="block font-semibold mb-1 text-gray-700">Address *</label>
                        <textarea
                            id="address" name="address"
                            value={form.address} onChange={handleChange}
                            rows={3}
                            className="w-full bg-orange-50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            required
                        />
                    </div>

                    {/* 2. เพิ่มฟอร์มสำหรับ Latitude และ Longitude (อาจจะวางไว้ใกล้ๆ Address) */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="latitude" className="block font-semibold mb-1 text-gray-700">Latitude</label>
                            <input
                                type="number" step="any" id="latitude" name="latitude"
                                value={form.latitude} onChange={handleChange}
                                placeholder="e.g., 13.7563"
                                className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="longitude" className="block font-semibold mb-1 text-gray-700">Longitude</label>
                            <input
                                type="number" step="any" id="longitude" name="longitude"
                                value={form.longitude} onChange={handleChange}
                                placeholder="e.g., 100.5018"
                                className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
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
                            {submitting ? "Creating Restaurant..." : "Create Restaurant"}
                        </button>
                    </div>
                </form>
            </div>
            <Footer /> 
        </div>
    );
}
