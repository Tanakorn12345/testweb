"use client";

import Navbar from "../../../components/Navbar"; // <-- Comment out temporarily 
import Footer from "../../../components/Footer"; // <-- Comment out temporarily
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; // <-- Commented out due to build error
import { Loader2, User, ArrowLeftIcon } from "lucide-react"; 

export default function UpdateUserPage({ params }) { // <-- ใช้ params prop ที่ Page ได้รับ
    const router = useRouter(); // <-- Commented out temporarily
    const { id: userId } = useParams(); 
    
    // --- State สำหรับฟอร์ม ---
    const [form, setForm] = useState({
        username: "",
        email: "",
        phone: "",
        role: "customer", // <-- 🎯 Role ใน DB ของคุณใช้ 'customer' หรือ 'Customer'
        password: "" // สำหรับกรอกรหัสใหม่ (Optional)
    });
    
    // --- State สำหรับ Loading / Submitting / Error ---
    const [loadingData, setLoadingData] = useState(true); // Loading ข้อมูลเริ่มต้น
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ message: "", type: "" });
    const [errorData, setErrorData] = useState(null); // Error ตอนโหลดข้อมูล

    // --- 1. useEffect สำหรับ Fetch ข้อมูล User เดิม ---
    useEffect(() => {
        if (!userId) {
            setErrorData("User ID not found in URL.");
            setLoadingData(false);
            return;
        }

        const fetchUserData = async () => {
            setLoadingData(true);
            setErrorData(null);
            try {
                // --- 🎯 เรียก API GET /api/admin/users/[id] ---
                const res = await fetch(`/api/admin/users/${userId}`, { cache: 'no-store' }); 
                
                if (!res.ok) {
                    let errorMsg = `Failed to fetch user data. Status: ${res.status}`;
                    try { const errorData = await res.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
                    throw new Error(errorMsg);
                }
                const data = await res.json();

                // --- นำข้อมูลที่ได้มาใส่ในฟอร์ม ---
                if (data.user) {
                    setForm({
                        username: data.user.username || "",
                        email: data.user.email || "",
                        phone: data.user.phone || "",
                        role: data.user.role || "customer",
                        password: "" // เริ่มต้นช่อง Password ให้ว่างเสมอ
                    });
                } else {
                    throw new Error("User data not found in API response.");
                }

            } catch (err) {
                console.error("Fetch user error:", err);
                setErrorData(err.message);
            } finally {
                setLoadingData(false); 
            }
        };

        fetchUserData();
    }, [userId]); // ให้ re-run ถ้า userId เปลี่ยน

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setSubmitStatus({ message: "", type: "" }); 
    };

    // --- 2. handleSubmit สำหรับ PUT Request ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            setSubmitStatus({ message: "User ID is missing.", type: "error" });
            return;
        }
        setSubmitting(true);
        setSubmitStatus({ message: "", type: "" });

        // --- Validation ---
        if (!form.username || !form.email || !form.role) {
            setSubmitStatus({ message: "Username, Email, and Role are required.", type: "error" });
            setSubmitting(false);
            return;
        }

        // --- เตรียมข้อมูลที่จะส่ง ---
        const dataToSend = {
            username: form.username,
            email: form.email,
            phone: form.phone,
            role: form.role,
        };

        // --- เพิ่ม Password ถ้ามีการกรอกใหม่เท่านั้น ---
        if (form.password && form.password.length > 0) {
            if (form.password.length < 6) {
                setSubmitStatus({ message: "New password must be at least 6 characters long.", type: "error" });
                setSubmitting(false);
                return;
            }
            dataToSend.password = form.password;
        }

        try {
            console.log(`--- Submitting Update User Form (ID: ${userId}) ---`);
            console.log("Data to send:", JSON.stringify(dataToSend));

            // --- 🎯 เรียก API PUT /api/admin/users/[id] ---
            const res = await fetch(`/api/admin/users/${userId}`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend), // ส่งเป็น JSON
            });

            if (!res.ok) {
                let errorData = { message: "Failed to update user." };
                try { errorData = await res.json(); } catch (e) {}
                throw new Error(errorData.message || `Status: ${res.status}`);
            }
            
            const result = await res.json(); 
            console.log("Update Backend Response:", result);

            setSubmitStatus({ message: "User updated successfully! Redirecting...", type: "success" });
            setTimeout(() => {
                 router.push("/admin"); 
                console.log("Redirecting to /admin...");
                window.location.href = "/admin"; // Temporary redirect
            }, 2000);

        } catch (err) {
            console.error("Update User Error:", err);
            setSubmitStatus({ message: err.message, type: "error" });
            setSubmitting(false); 
        } 
    };

    // --- UI Loading / Error ---
    if (loadingData) {
        return (
          <div className="min-h-screen bg-white flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
              <p className="ml-3 text-gray-600">Loading user details...</p>
          </div>
        );
    }
    
    if (errorData) {
        return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
              <p className="text-xl text-red-600 mb-4 text-center">Error: {errorData}</p>
              <button onClick={() => window.history.back()} className="bg-gray-500 text-white font-semibold px-6 py-2 rounded-full">
                  Go Back
              </button>
          </div>
        );
    }

    // --- UI ฟอร์ม ---
    return (
        <div className="min-h-screen bg-white">
            <Navbar /> 
            <div className="p-8 max-w-4xl mx-auto">
                 <button onClick={() => window.history.back()} className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="w-5 h-5"/> Back to User List
                 </button>

                <div className="flex items-center gap-3 mb-4">
                     <User className="w-6 h-6 text-black" />
                     <h1 className="text-xl font-bold text-black">Update User Account</h1>
                </div>
                <p className="text-gray-600 mb-6">Edit details for user (ID: {userId}).</p>

                <form onSubmit={handleSubmit} className="bg-gray-100 p-8 rounded-2xl flex flex-col gap-6 shadow-inner">
                    
                    <div>
                        <label htmlFor="username" className="block font-semibold mb-1 text-gray-700">Username *</label>
                        <input type="text" id="username" name="username" value={form.username} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400" required />
                    </div>

                    <div>
                        <label htmlFor="email" className="block font-semibold mb-1 text-gray-700">Email *</label>
                        <input type="email" id="email" name="email" value={form.email} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400" required />
                    </div>

                    <div>
                        <label htmlFor="role" className="block font-semibold mb-1 text-gray-700">Role *</label>
                        <select id="role" name="role" value={form.role} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none appearance-none focus:ring-2 focus:ring-green-400"
                        >
                            {/* --- 🎯 ตรวจสอบ Role ให้ตรงกับ DB --- */}
                            <option value="customer">Customer</option>
                            <option value="shop">Shop</option> 
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="password" className="block font-semibold mb-1 text-gray-700">New Password (Optional)</label>
                        <input type="password" id="password" name="password" value={form.password} onChange={handleChange}
                            placeholder="Leave blank to keep current password"
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
                            minLength={6} 
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block font-semibold mb-1 text-gray-700">Phone Number</label>
                        <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange}
                            className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400" />
                    </div>

                    {submitStatus.message && (
                        <div className={`p-3 rounded-lg text-center font-semibold ${
                            submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {submitStatus.message}
                        </div>
                    )}

                    <div className="flex justify-center mt-6">
                        <button type="submit" className="bg-green-500 text-white font-semibold px-12 py-3 rounded-full hover:bg-green-600 flex items-center justify-center disabled:opacity-60 w-full sm:w-auto" disabled={submitting || loadingData}>
                            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {submitting ? "Saving Changes..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
            <Footer /> 
        </div>
    );
}

