"use client";

import Navbar from "../../../components/Navbar"; // <-- Comment out temporarily
import Footer from "../../../components/Footer"; // <-- Comment out temporarily
import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation"; // <-- Commented out due to build error
import { useRouter } from "next/navigation"; // <-- Comment out temporarily
import { Loader2, UploadCloud, Utensils, ArrowLeftIcon } from "lucide-react"; 

export default function UpdateMenuPage({ params }) { // <-- Keep params prop for structure
    const router = useRouter(); // <-- Commented out temporarily
    const { menuId } = useParams()
    
    // --- *** ใช้ menuId จำลองชั่วคราว *** ---
    // <-- ใช้ params prop หรือ fallback เป็น mock ID
    // --- *** (อย่าลืมเอากลับมาใช้ useParams ในโปรเจกต์จริง) *** ---

    const fileInputRef = useRef(null); 

    // --- State (เหมือนเดิม) ---
    const [form, setForm] = useState({ name: "", description: "", price: "", category: "", is_available: true });
    const [loadingData, setLoadingData] = useState(true); 
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ message: "", type: "" });
    const [errorData, setErrorData] = useState(null); 
    const [imageFile, setImageFile] = useState(null); 
    const [imagePreview, setImagePreview] = useState(null); 
    const [originalImageUrl, setOriginalImageUrl] = useState(null); 

    // --- useEffect Cleanup (เหมือนเดิม) ---
    useEffect(() => {
        return () => { if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview); };
    }, [imagePreview]);

    // --- useEffect Fetch Data (ใช้ menuId จำลอง) ---
    useEffect(() => {
        // --- ใช้ menuId ที่ได้จากข้างบน (อาจจะเป็น mock ID) ---
        if (!menuId || menuId === "mock-menu-123") { 
            // ถ้าเป็น mock ID หรือไม่มี ID, แสดง Error หรือฟอร์มเปล่าๆ (ในที่นี้แสดง Error)
            setErrorData("Menu ID not available for fetching."); 
            setLoadingData(false);
            return;
        }

        const fetchMenuData = async () => {
            setLoadingData(true); setErrorData(null);
            try {
                const res = await fetch(`/api/manage/menus/${menuId}`, { cache: 'no-store' }); 
                if (!res.ok) { throw new Error(`Failed to fetch menu data. Status: ${res.status}`); }
                const data = await res.json();
                if (data.menu) {
                    setForm({ 
                        name: data.menu.name || "", description: data.menu.description || "",
                        price: data.menu.price?.toString() || "", category: data.menu.category || "",
                        is_available: data.menu.is_available ?? true,
                    });
                    setImagePreview(data.menu.image_url || null); 
                    setOriginalImageUrl(data.menu.image_url || null); 
                } else { throw new Error("Menu data not found in API response."); }
            } catch (err) { console.error("Fetch menu error:", err); setErrorData(err.message);
            } finally { setLoadingData(false); }
        };

        fetchMenuData();
    }, [menuId]); 

    // --- Handlers (handleChange, handleImageChange - เหมือนเดิม) ---
     const handleChange = (e) => { 
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setSubmitStatus({ message: "", type: "" }); 
     };
     const handleImageChange = (e) => { 
        const file = e.target.files?.[0];
        if (!file) return;
        if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
        const url = URL.createObjectURL(file); 
        setImageFile(file); setImagePreview(url); 
     };

    // --- handleSubmit (ใช้ menuId จำลอง) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        // --- ใช้ menuId ที่ได้จากข้างบน ---
        if (!menuId || menuId === "mock-menu-123") { 
             setSubmitStatus({ message: "Cannot update without a valid Menu ID.", type: "error" }); return; 
        }
        setSubmitting(true); setSubmitStatus({ message: "", type: "" });
        const priceNum = parseFloat(form.price);
        if (!form.name || !form.price || !form.category || isNaN(priceNum) || priceNum <= 0) { /* ... validation ... */ setSubmitting(false); return; }

        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("description", form.description);
        formData.append("price", priceNum.toString()); 
        formData.append("category", form.category);
        formData.append("is_available", form.is_available.toString()); 
        if (imageFile) formData.append("image", imageFile); 

        try {
            console.log(`--- Submitting Update Menu Form (ID: ${menuId}) ---`);
             for (let [key, value] of formData.entries()) console.log(`${key}: ${value instanceof File ? value.name : value}`); 

            const res = await fetch(`/api/manage/menus/${menuId}`, { 
                method: 'PUT', 
                body: formData, 
            });

            if (!res.ok) { /* ... Error handling ... */ 
                 let errorData = { message: "Failed to update menu." };
                 try { errorData = await res.json(); } catch (e) {}
                 throw new Error(errorData.message || `Status: ${res.status}`);
            }
            
            const result = await res.json(); 
            console.log("Update Backend Response:", result);

            setSubmitStatus({ message: "Menu updated successfully! Redirecting...", type: "success" });
            setTimeout(() => { window.location.href = "/manage/overview"; }, 2000);

        } catch (err) { /* ... Error handling ... */ 
            console.error("Update Menu Error:", err);
            setSubmitStatus({ message: err.message, type: "error" });
            setSubmitting(false); 
        } 
    };

    // --- UI (เหมือนเดิม) ---
    // ... Loading / Error states ...
    if (loadingData && menuId !== "mock-menu-123") { // <-- เพิ่มเช็ค mock ID
        return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-10 h-10 text-green-600 animate-spin" /><p className="ml-3 text-gray-600">Loading menu details...</p></div>;
    }
    // --- แสดง Error ถ้าโหลดข้อมูลไม่ได้ (รวมถึงกรณี mock ID) ---
    if (errorData || menuId === "mock-menu-123") { 
        return <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4"><p className="text-xl text-red-600 mb-4 text-center">Error: {errorData || "Menu ID not available in preview."}</p><button onClick={() => window.history.back()} className="bg-gray-500 text-white font-semibold px-6 py-2 rounded-full">Go Back</button></div>;
    }

    // --- ถ้าโหลดข้อมูลสำเร็จ (ไม่ใช่ mock ID) ---
    return (
        <div className="min-h-screen bg-white">
            <Navbar /> 
            <div className="p-8 max-w-4xl mx-auto">
                 {/* ... Back button, Header ... */}
                  <button onClick={() => window.history.back()} className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeftIcon className="w-5 h-5"/> Back to Overview</button>
                  <div className="flex items-center gap-3 mb-4"><Utensils className="w-6 h-6 text-black" /><h1 className="text-xl font-bold text-black">Update Menu Item</h1></div>
                  <p className="text-gray-600 mb-6">Edit the details for this menu item (ID: {menuId}).</p>

                {/* --- Form (เหมือนเดิม) --- */}
                <form onSubmit={handleSubmit} className="bg-gray-100 p-8 rounded-2xl flex flex-col gap-6 shadow-inner">
                    {/* ... Form fields (Name, Category, Price, Image, Desc, Available) ... */}
                     <div><label className="block font-semibold mb-1 text-gray-700">Name *</label><input type="text" name="name" value={form.name} onChange={handleChange} className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400" required /></div>
                     <div><label className="block font-semibold mb-1 text-gray-700">Category *</label><input type="text" name="category" value={form.category} onChange={handleChange} className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400" required /></div>
                     <div><label className="block font-semibold mb-1 text-gray-700">Price *</label><input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400" required /></div>
                     <div><label className="block font-semibold mb-1 text-gray-700">Image</label><input type="file" ref={fileInputRef} onChange={handleImageChange} hidden /><div onClick={()=>fileInputRef.current?.click()} className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-green-400 transition h-48 bg-gray-50">{imagePreview?<img src={imagePreview} alt="Menu preview" className="max-h-full max-w-full object-contain rounded"/>:<div className="space-y-1 text-center text-gray-500"><UploadCloud className="mx-auto h-12 w-12 text-gray-400" /><p className="text-sm">Click to upload</p></div>}</div></div>
                     <div><label className="block font-semibold mb-1 text-gray-700">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full bg-orange-50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"/></div>
                     <div className="flex items-center gap-3"><input type="checkbox" id="is_available" name="is_available" checked={form.is_available} onChange={handleChange} className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"/><label htmlFor="is_available" className="font-medium text-gray-700">Available</label></div>
                    {/* ... Submit Status ... */}
                    {submitStatus.message && ( <div className={`p-3 rounded-lg text-center font-semibold ${submitStatus.type === 'success'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{submitStatus.message}</div> )}
                    {/* ... Submit Button ... */}
                    <div className="flex justify-center mt-6"><button type="submit" className="bg-green-500 text-white font-semibold px-12 py-3 rounded-full hover:bg-green-600 flex items-center justify-center disabled:opacity-60 w-full sm:w-auto" disabled={submitting}>{submitting?<Loader2 className="mr-2 h-5 w-5 animate-spin"/>:null}{submitting?"Saving...":"Save Changes"}</button></div>
                </form>
            </div>
             <Footer /> 
        </div>
    );
}

