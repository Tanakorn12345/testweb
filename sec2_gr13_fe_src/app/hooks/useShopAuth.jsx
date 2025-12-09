// app/hooks/useShopAuth.jsx
"use client"
import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useRouter } from 'next/navigation'; // <-- Import useRouter

export const useShopAuth = () => {
    const { login } = useAuth(); 
    const router = useRouter(); // <-- เรียกใช้ useRouter
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setError(null);
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true); 

        try {
            // --- 1. ยิง API Login ก่อน ---
            const loginResponse = await fetch('/api/auth/shop-login', { // <-- 🎯 ตรวจสอบ Path
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            
            if (!loginResponse.ok) {
                // ถ้า Login ไม่สำเร็จ
                const data = await loginResponse.json();
                setError(data.message || 'Login failed.');
                setIsSubmitting(false); // หยุด loading
                return false; 
            }
                
            // --- 2. ถ้า Login สำเร็จ, ไปเรียก /api/auth/me เพื่อเอาข้อมูล User ล่าสุด (รวม hasRestaurant) ---
            const userResponse = await fetch('/api/auth/me'); // GET request โดยอัตโนมัติ
            if (!userResponse.ok) {
                 // ถ้าเรียก /me ไม่สำเร็จ (ไม่ควรเกิด แตด่ักไว้)
                 throw new Error("Failed to fetch user data after login.");
            }
            
            const { user } = await userResponse.json();
            
            if (!user) {
                // ถ้า /me ตอบกลับมาว่าไม่มี user (Token อาจจะมีปัญหา?)
                 throw new Error("User data not found after login.");
            }

            // --- 3. อัปเดต AuthContext ---
            login(user); // อัปเดต State ส่วนกลาง

            // --- 4. ตรวจสอบ Role และ hasRestaurant เพื่อ Redirect ---
            if (user.role === 'shop') { // <-- 🎯 แก้ 'shop' ให้ตรงกับ Role ร้านค้า
                if (user.hasRestaurant) {
                    router.push('/manage'); // มีร้านแล้ว ไปหน้า Manage หลัก
                } else {
                    router.push('/manage/create'); // ยังไม่มีร้าน ไปหน้าสร้างร้าน
                }
            } else {
                 // กรณี Role ไม่ใช่ shop (ไม่ควรเกิดถ้า API login ถูกต้อง)
                 console.warn("Logged in user is not a shop owner, redirecting to home.");
                 router.push('/'); 
            }

            return true; // คืนค่า true บอกว่าสำเร็จทั้งหมด

        } catch (err) {
            console.error('Shop Auth Hook - Submit error:', err);
            setError(err.message || 'Could not connect to the server.');
            setIsSubmitting(false); // หยุด loading ถ้า Error
            return false;
        } 
        // ไม่ต้องมี finally setIsSubmitting(false) เพราะเรา Redirect ไปแล้ว
    };

    return { formData, error, isSubmitting, handleChange, handleSubmit };
};
