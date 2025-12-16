"use client"
import React, { useState, useEffect, useMemo } from "react";
import { Search, Trash2, Edit, Loader2, X } from "lucide-react"; 
import Navbar from "../components/Navbar"; // <-- Commented out due to build error
import Link from 'next/link';
import { FaAddressBook } from "react-icons/fa";
// --- ConfirmationModal (เหมือนเดิม) ---
function ConfirmationModal({ user, onConfirm, onCancel, isDeleting }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
         <button onClick={onCancel} disabled={isDeleting} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X size={20} /></button>
        <h3 className="text-lg font-bold text-gray-900 mt-2">Confirm Deletion</h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete the user:{" "}
          <strong className="font-semibold">{user.username}</strong> ({user.email})? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}


// --- หน้า Admin Home หลัก ---
function AdminHome() {
  // --- States (users, searchTerm, loadingUsers, errorUsers, modal states) ---
  const [users, setUsers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true); 
  const [errorUsers, setErrorUsers] = useState(null);   
  const [userToDelete, setUserToDelete] = useState(null); 
  const [isDeleting, setIsDeleting] = useState(false); 
  const [deleteError, setDeleteError] = useState(null); // <-- State สำหรับเก็บ Error ตอนลบ

  // --- useEffect fetchUsers (เหมือนเดิม) ---
  useEffect(() => {
    const fetchUsers = async () => { 
       setLoadingUsers(true); setErrorUsers(null); try { const res = await fetch("/api/admin/users", { cache: 'no-store' }); if (!res.ok) { let e = `Status: ${res.status}`; try { e = (await res.json()).message || e; } catch (_) {} throw new Error(e); } const data = await res.json(); if (Array.isArray(data.users)) setUsers(data.users); else setUsers([]); } catch (err) { console.error("Fetch users error:", err); setErrorUsers(err.message); } finally { setLoadingUsers(false); } 
    };
    fetchUsers();
  }, []); 

  // --- filteredUserData (เหมือนเดิม) ---
  const filteredUserData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users; 
    return users.filter( 
      (user) => 
        (user.username && user.username.toLowerCase().includes(term)) || 
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.role && user.role.toLowerCase().includes(term))
    );
  }, [users, searchTerm]); 

  // --- Handlers (Modal Open/Close, Edit, Add - เหมือนเดิม) ---
  const handleOpenDeleteModal = (user) => { setUserToDelete(user); setDeleteError(null); }; // <-- เคลียร์ Error เก่า
  const handleCloseDeleteModal = () => { setUserToDelete(null); };
  const handleEdit = (userId) => { window.location.href = `/admin/update/${userId}`; };
  const handleAddUser = () => { window.location.href = '/admin/add'; };

  // --- **** แก้ไข handleConfirmDelete **** ---
  const handleConfirmDelete = async () => {
     if (!userToDelete) return; 
     setIsDeleting(true); 
     setDeleteError(null); // <-- เคลียร์ Error
     try { 
        console.log(`Sending DELETE request for user ID: ${userToDelete.id}`);
        
        // --- 1. Uncomment และเรียก API จริง ---
        const res = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' }); 

        // Status 204 (No Content) คือสำเร็จสำหรับการ Delete
        if (!res.ok && res.status !== 204) { 
           let errorMsg = `Failed to delete user. Status: ${res.status}`;
           try { 
              // พยายามอ่าน Error message จาก Backend (เช่น "Cannot delete user: ...")
              const errorData = await res.json(); 
              errorMsg = errorData.message || errorMsg; 
           } catch (e) {
              try { errorMsg = await res.text() || errorMsg; } catch (textErr) {}
           }
           throw new Error(errorMsg); // <-- โยน Error ที่ได้จาก Backend
        } 
        
        console.log(`User ID: ${userToDelete.id} deleted successfully.`);
        
        // --- 2. อัปเดต State ทันที (ถ้าสำเร็จ) ---
        setUsers(currentUsers => currentUsers.filter(u => u.id !== userToDelete.id)); 
        handleCloseDeleteModal(); // ปิด Modal

     } catch (err) { 
        console.error("Delete User Error:", err); 
        setDeleteError(err.message); // <-- แสดง Error ใน UI
        // ไม่ต้องปิด Modal ถ้า Error
     } finally { 
        setIsDeleting(false); // หยุด Loading เสมอ
     }
   };


  return (
    <div className="bg-white min-h-screen">
       <Navbar /> 

      {/* --- Modal ยืนยันการลบ User --- */}
      <ConfirmationModal
        user={userToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteModal}
        isDeleting={isDeleting}
      />
      
      {/* --- 3. เพิ่มแถบแสดง Error (สำหรับ Foreign Key) --- */}
      {deleteError && (
         <div 
           className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50 shadow-md flex items-center gap-4" 
           role="alert"
         >
            <div>
                <strong className="font-bold">Delete Failed! </strong>
                <span className="block sm:inline">{deleteError}</span>
            </div>
            <button onClick={() => setDeleteError(null)} className="p-1 text-red-700 hover:bg-red-200 rounded-full">
               <X size={20} />
            </button>
         </div>
      )}


      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="gap-2.5 flex text-2xl font-semibold decoration-black/80 decoration-2 mb-1">
        <FaAddressBook  className="w-6 h-6"/>ADMIN</h1>
        <p className="text-gray-700 mb-6">ADMIN USER MANAGEMENT</p> 

        {/* --- Search bar --- */}
         <div className="flex items-center gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Search user by username, email, or role" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            disabled={loadingUsers} 
            className="flex-1 h-12 rounded-full bg-[#f1eeee] px-6 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
           />
          <button 
             aria-label="Search" 
             disabled={loadingUsers} 
             className="w-auto h-12 rounded-xl bg-[#d67a42] hover:bg-[#c86f36] text-black font-medium flex items-center justify-center gap-2 transition px-5 py-3 disabled:opacity-60"
           >
             <Search size={18} />
             <span className="hidden sm:inline">Search</span>
           </button>
        </div>

        {/* --- Error Message (Loading) --- */}
        {errorUsers && ( <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{errorUsers}</span></div> )}

        {/* ตาราง Users */}
        <div className="bg-[#f3efef] rounded-xl p-4">
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[720px]">
              <thead>
                <tr>
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">USER ID</th>
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">USERNAME</th>
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">EMAIL</th>
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">ROLE</th>
                  <th className="bg-[#B9E8B8] text-center py-4 px-6">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {/* --- Loading/Error/No Data rows --- */}
                {loadingUsers ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500"><Loader2 className="w-6 h-6 inline mr-2 animate-spin"/> Loading users...</td></tr> 
                ) : errorUsers ? ( 
                  <tr><td colSpan={5} className="text-center py-8 text-red-500">Failed to load users.</td></tr> 
                ): filteredUserData.length === 0 ? ( 
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users found.</td></tr> 
                ) : (
                  // --- แสดงข้อมูล User ---
                  filteredUserData.map((user) => ( 
                    <tr key={user.id}> 
                      <td className="py-4 px-4"><div className="bg-[#fff9c7] rounded-full px-6 py-3">{user.id}</div></td>
                      <td className="py-4 px-4"><div className="bg-[#fff9c7] rounded-full px-6 py-3">{user.username}</div></td>
                      <td className="py-4 px-4"><div className="bg-[#fff9c7] rounded-full px-6 py-3 underline text-blue-700 cursor-pointer">{user.email}</div></td>
                      <td className="py-4 px-4"><div className="bg-[#fff9c7] rounded-full px-6 py-3">{user.role}</div></td>
                      {/* --- Actions (ปุ่ม Delete จะเรียก handleOpenDeleteModal) --- */}
                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-2"> 
                           <button onClick={() => handleEdit(user.id)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold p-2 rounded-full transition" aria-label={`Edit ${user.username}`}> <Edit size={16} /> </button>
                           <button onClick={() => handleOpenDeleteModal(user)} className="bg-red-500 hover:bg-red-600 text-white font-semibold p-2 rounded-full transition" aria-label={`Delete ${user.username}`}> <Trash2 size={16} /> </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ปุ่ม Add User (เหมือนเดิม) */}
        <div className="flex justify-center items-center gap-4 mt-8">
        <Link href="/admin/banners">
                <button 
                  className="bg-[#5FA373] hover:bg-[#4e8c63] text-white px-8 py-3 rounded-lg shadow"
                >
                  MANAGE BANNERS
                </button>
            </Link>
            <button 
              onClick={handleAddUser} 
              className="bg-[#5FA373] hover:bg-[#4e8c63] text-white px-8 py-3 rounded-lg shadow"
            >
              ADD USER
            </button>
        </div>
      </main>
    </div>
  );
}

export default AdminHome;

