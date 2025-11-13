"use client";

import RegisterForm from './RegisterForm'; // Import ฟอร์ม
import { useRegister } from '../hooks/useRegister'; // Import Logic ที่เราจะสร้างต่อไป
import Navbar from '../components/Navbar'; // สมมติว่า Navbar อยู่ที่นี่
import Background from '../components/Background';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const RegisterPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams(); // 👈 เรียกใช้ hook
    const role = searchParams.get('role'); // 👈 ดึงค่า 'role' ออกมาจาก URL

    // ป้องกันกรณีที่ผู้ใช้เข้ามาที่ /register ตรงๆ โดยไม่มี role
    useEffect(() => {
        if (!role) {
            router.replace('/login'); // ถ้าไม่มี role ให้ส่งกลับไปหน้า login
        }
    }, [role, router]);

    // ส่ง role ที่ได้มาไปให้ Hook ใช้งาน
    const registerLogic = useRegister({ role });

    // ถ้ายังไม่มี role ให้แสดงหน้าว่างๆ ไปก่อน (กันหน้ากระพริบ)
    if (!role) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Navbar />
            <Background/>
            <main className="flex justify-center mt-12 mb-12 px-4">
                <RegisterForm {...registerLogic} />
            </main>
        </div>
    );
};

export default RegisterPage;