"use client";

 import Navbar from "../../components/Navbar"; // <-- Commented out for Canvas
import Footer from "../../components/Footer"; // <-- Commented out for Canvas
import { useState } from "react";
import { useRouter } from "next/navigation"; // <-- Commented out for Canvas
import { Loader2, UserPlus } from "lucide-react"; 

export default function AddUserPage() {
  const router = useRouter(); // <-- Commented out for Canvas

  // 1. State สำหรับฟอร์ม (เพิ่ม password และ role)
  const [form, setForm] = useState({
    username: "",
  
    email: "",
    phone: "",
    password: "", // <-- สำคัญมาก
    role: "Customer", // <-- สำคัญมาก (ตั้งค่าเริ่มต้นเป็น 'Staff')
  });

  // State สำหรับจัดการการ Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: "", type: "" });

  // 2. ฟังก์ชันสำหรับ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus({ message: "", type: "" });

    try {
      console.log("--- Mock Add User ---");
      console.log("Form Data:", JSON.stringify(form));

     
      const res = await fetch(`/api/admin/users`, { // <-- ยิงไปที่ /api/users
          method: "POST", // <-- ใช้ Method POST
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
      });

      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to create user.");
      }
      

      // --- จำลองว่าสำเร็จ ---
      await new Promise(resolve => setTimeout(resolve, 1000)); // หน่วงเวลา 1 วิ

      setSubmitStatus({ message: "User created successfully!", type: "success" });
      setTimeout(() => {
          // router.push("/admin") // <-- Commented out
          console.log("Redirecting to /admin...");
          window.location.href = "/admin"; // กลับไปหน้า Admin Home (ชั่วคราว)
      }, 2000); 

    } catch (err) {
      setSubmitStatus({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar /> 
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold decoration-black/80 decoration-2 mb-1">ADMIN</h1>
        <p className="text-gray-700 mb-6">ADD NEW USER ACCOUNT</p>

        <form onSubmit={handleSubmit} className="bg-gray-100 p-8 rounded-2xl flex flex-col gap-6 shadow-inner relative">
          
         

          <div>
            <label className="block font-semibold mb-1">USERNAME</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none"
              required
            />
          </div>

          
          {/* 3. เพิ่มฟิลด์ Password */}
          <div>
            <label className="block font-semibold mb-1">PASSWORD</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none"
              required
              minLength={6} // ควรกำหนดความยาวขั้นต่ำ
            />
          </div>

          {/* 4. เพิ่มฟิลด์ Role */}
          <div>
              <label className="block font-semibold mb-1">ROLE</label>
              <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none appearance-none"
              >
                  <option value="Customer">Customer</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Admin">Admin</option>
                 
              </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">PHONE NUMBER</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">EMAIL</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-orange-50 rounded-full px-4 py-2 outline-none"
              required
            />
          </div>
          
          {/* 5. แสดงข้อความแจ้งเตือน (แทน Alert) */}
          {submitStatus.message && (
            <div className={`p-3 rounded-lg text-center font-semibold ${
                submitStatus.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
                {submitStatus.message}
            </div>
          )}

          <div className="flex justify-center gap-6 mt-6">
            <button
              type="button"
              onClick={() => window.history.back()} // ใช้ window.history.back() ชั่วคราว
              className="bg-gray-400 text-white font-semibold px-10 py-2 rounded-full hover:bg-gray-500"
              disabled={submitting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white font-semibold px-10 py-2 rounded-full hover:bg-green-600 flex items-center justify-center disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {submitting ? "ADDING..." : "ADD USER"}
            </button>
          </div>
        </form>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
