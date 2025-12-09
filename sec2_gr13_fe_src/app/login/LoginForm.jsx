"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AuthFormComponent } from '../components/AuthForm';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { useShopAuth } from '../hooks/useShopAuth';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useAuth } from '../context/AuthContext';

const Background = dynamic(() => import('../components/Background'), { ssr: false });

// (SVG Icons - ย้ายมาจากโค้ดเดิม)
const CustomerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 sm:size-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);
const ShopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 sm:size-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);
const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 sm:size-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
);


export default function LoginForm() {
    const [selectedRole, setSelectedRole] = useState(null);
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();

    const customerAuth = useCustomerAuth();
    const shopAuth = useShopAuth();
    const adminAuth = useAdminAuth();

    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        const success = await customerAuth.handleSubmit(e);
        if (success) router.push('/');
    };

    const handleShopSubmit = async (e) => {
        e.preventDefault();
        const success = await shopAuth.handleSubmit(e);
        if (success) router.push('/manage');
    };

    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        const success = await adminAuth.handleSubmit(e);
        if (success) router.push('/admin');
    };
    
    if (loading) {
        return <div className="text-center p-10">Loading...</div>;
    }
      
    return (
        <>
            <Background />

            {!selectedRole ? (
                // ✅ แก้ไข: นำโค้ดจาก Selectlogin.jsx มาใส่ตรงนี้
                <main className="flex justify-center items-center mt-12 mb-12 px-4">
                    <div className="bg-gray-300 p-6 sm:px-10 sm:py-8 rounded-3xl shadow-xl w-[95%] max-w-[500px] flex flex-col gap-5">
                        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900">
                            SELECT FOR LOGIN
                        </h2>

                        {/* Customer Button */}
                        <button onClick={() => setSelectedRole('customer')} className='w-full text-left p-3 bg-green-400 rounded-2xl cursor-pointer transition duration-300 hover:bg-amber-50'>
                            <div className='flex px-4 sm:px-7 flex-row items-center'>
                                <CustomerIcon />
                                <div className="font-bold text-base sm:text-xl px-3">
                                    CUSTOMER
                                    <p className='font-light text-sm sm:text-base'>Customers interested in our services</p>
                                </div>
                            </div>
                        </button>

                        {/* Shop/Restaurant Button */}
                        <button onClick={() => setSelectedRole('shop')} className='w-full text-left p-3 bg-green-400 rounded-2xl cursor-pointer transition duration-300 hover:bg-amber-50'>
                            <div className='flex px-4 sm:px-7 flex-row items-center'>
                                <ShopIcon />
                                <div className="font-bold text-base sm:text-xl px-3">
                                    RESTAURANT
                                    <p className='font-light text-sm sm:text-base'>Restaurants that want to sell</p>
                                </div>
                            </div>
                        </button>

                        {/* Admin Button */}
                        <button onClick={() => setSelectedRole('admin')} className='w-full text-left p-3 bg-green-400 rounded-2xl cursor-pointer transition duration-300 hover:bg-amber-50'>
                            <div className='flex px-4 sm:px-7 flex-row items-center'>
                                <AdminIcon />
                                <div className="font-bold text-base sm:text-xl px-3">
                                    ADMIN
                                    <p className='font-light text-sm sm:text-base'>Administrative manager</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </main>
            ) : (
                <main className="flex justify-center mt-12 mb-12 px-4">
                    {selectedRole === 'customer' && (
                        <AuthFormComponent 
                            title="LOGIN FOR CUSTOMER" 
                            {...customerAuth} 
                            handleSubmit={handleCustomerSubmit}
                        />
                    )}
                    {selectedRole === 'shop' && (
                        <AuthFormComponent 
                            title="LOGIN FOR SHOP" 
                            {...shopAuth}
                            handleSubmit={handleShopSubmit}
                        />
                    )}
                    {selectedRole === 'admin' && (
                        <AuthFormComponent 
                            title="LOGIN FOR ADMIN" 
                            {...adminAuth}
                            handleSubmit={handleAdminSubmit}
                        />
                    )}
                </main>
            )}
        </>
    );
}