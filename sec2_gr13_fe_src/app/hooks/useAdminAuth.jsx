// app/hooks/useAdminAuth.jsx
"use client"
import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // 👈 Import useAuth

export const useAdminAuth = () => {
    const { login } = useAuth(); // 👈 ดึงฟังก์ชัน login มาใช้
    const [formData, setFormData] = useState({
        username: '', // หรือ email ตามที่คุณใช้
        password: '',
    });
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // 👈 เพิ่ม state สำหรับ loading

    const handleChange = (e) => {
        const { name, value } = e.target;
        setError(null);
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true); // 👈 เริ่ม loading

        try {
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            
            if (response.ok) {
                const userResponse = await fetch('/api/auth/me');
                if (userResponse.ok) {
                    const { user } = await userResponse.json();
                    login(user); // อัปเดต State ส่วนกลาง
                }
                return true; // 👈 คืนค่า true บอกว่าสำเร็จ
            } else {
                const data = await response.json();
                setError(data.message || 'An error occurred.');
                return false; // 👈 คืนค่า false บอกว่าล้มเหลว
            }

        } catch (err) {
            console.error('Fetch error:', err);
            setError('Could not connect to the server.');
            return false;
        } finally {
            setIsSubmitting(false); // 👈 หยุด loading
        }
    };

    return {
        formData,
        error,
        isSubmitting, // 👈 ส่ง state loading ออกไป
        handleChange,
        handleSubmit,
    };
};