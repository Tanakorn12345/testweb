"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link"; // <-- Commented out due to build error
import Navbar from "../../components/Navbar"; // <-- Commented out for Canvas
import { MagnifyingGlassIcon, ArrowLeftIcon } from "@heroicons/react/24/solid"; 
import { Loader2, Edit, Trash2, X } from "lucide-react"; // <-- เพิ่ม X สำหรับ Modal

// --- 1. ย้าย ConfirmationModal มาไว้ที่นี่ ---
function ConfirmationModal({ menu, onConfirm, onCancel, isDeleting }) { // <-- เปลี่ยน prop เป็น menu
  if (!menu) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
         {/* ปุ่มปิด Modal */}
         <button 
           onClick={onCancel} 
           disabled={isDeleting}
           className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
           aria-label="Close modal"
          >
           <X size={20} />
         </button>

        <h3 className="text-lg font-bold text-gray-900 mt-2">Confirm Menu Deletion</h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete the menu item:{" "}
          <strong className="font-semibold">{menu.name}</strong> (ID: {menu.Menu_Id})? This action cannot be undone.
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


// --- หน้า OverviewPage ---
const formatPrice = (p) => `${Number(p)}`;

export default function OverviewPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [menus, setMenus] = useState([]); 
  const [loadingMenus, setLoadingMenus] = useState(true); 
  const [errorMenus, setErrorMenus] = useState(null);

  // --- 2. เพิ่ม State สำหรับ Modal การลบเมนู ---
  const [menuToDelete, setMenuToDelete] = useState(null); // เก็บข้อมูล menu ที่จะลบ
  const [isDeleting, setIsDeleting] = useState(false); // สถานะตอนกำลังลบ
  const [deleteError, setDeleteError] = useState(null); // เก็บ Error ตอนลบ (ถ้ามี)

  // --- useEffect fetchMenus (เหมือนเดิม) ---
  useEffect(() => {
    // ... (โค้ด fetchMenus เหมือนเดิม) ...
    const fetchMenus = async () => { setLoadingMenus(true); setErrorMenus(null); try { const res = await fetch("/api/manage/menus", { cache: 'no-store' }); if (!res.ok) { let e = `Status: ${res.status}`; try { e = (await res.json()).message || e; } catch (_) {} throw new Error(e); } const data = await res.json(); if (Array.isArray(data.menus)) setMenus(data.menus); else setMenus([]); } catch (err) { console.error("Fetch menus error:", err); setErrorMenus(err.message); } finally { setLoadingMenus(false); } }; fetchMenus();
  }, []); 

  // --- filteredMenu (เหมือนเดิม) ---
  const filteredMenu = useMemo(() => {
    // ... (โค้ด filteredMenu เหมือนเดิม) ...
    const term = searchTerm.trim().toLowerCase(); if (!term) return menus; return menus.filter(m => m.name.toLowerCase().includes(term) || (m.Menu_Id && m.Menu_Id.toString().toLowerCase().includes(term)) || m.category.toLowerCase().includes(term));
  }, [menus, searchTerm]);

  // --- handleAddMenu, handleEdit (เหมือนเดิม) ---
  const handleAddMenu = () => { window.location.href = '/manage/add-menu'; };
  const handleEdit = (menuId) => { window.location.href = `/manage/update/${menuId}`; };

  // --- 3. เพิ่ม Handlers สำหรับ Modal การลบเมนู ---
  const handleOpenDeleteModal = (menu) => { // <-- รับ object menu เข้ามา
    setMenuToDelete(menu);
    setDeleteError(null); // เคลียร์ Error เก่า (ถ้ามี)
  };

  const handleCloseDeleteModal = () => {
    setMenuToDelete(null);
  };

  const handleConfirmDeleteMenu = async () => {
    if (!menuToDelete) return;

    setIsDeleting(true);
    setDeleteError(null); 
    try {
      console.log(`Attempting to delete menu ID: ${menuToDelete.Menu_Id}`);
      // --- เรียก API DELETE /api/manage/menus/[menuId] ---
      const res = await fetch(`/api/manage/menus/${menuToDelete.Menu_Id}`, { 
          method: 'DELETE' 
      });

      // Status 204 (No Content) คือสำเร็จสำหรับการ Delete
      if (!res.ok && res.status !== 204) { 
        let errorMsg = `Failed to delete menu. Status: ${res.status}`;
        try { const errorData = await res.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
        throw new Error(errorMsg);
      }
      
      console.log(`Menu ID: ${menuToDelete.Menu_Id} deleted successfully via API.`);
      
      // ถ้าสำเร็จ, อัปเดต State ในหน้าเว็บทันที (ลบ menu ออกจาก list `menus`)
      setMenus(currentMenus => currentMenus.filter(m => m.Menu_Id !== menuToDelete.Menu_Id));
      handleCloseDeleteModal(); // ปิด Modal

    } catch (err) {
      console.error("Delete Menu Error:", err);
      setDeleteError(err.message); // เก็บ Error ไว้แสดง (อาจจะแสดงใน Modal หรือนอก Modal)
      // ไม่ต้องปิด Modal ถ้า Error เพื่อให้ User เห็นปัญหา
    } finally {
      setIsDeleting(false); // หยุดสถานะ Deleting
    }
  };


  return (
    <div className="bg-white min-h-screen">
        <Navbar /> 

       {/* --- 4. เพิ่ม Modal เข้ามาในหน้าเว็บ --- */}
       <ConfirmationModal
         menu={menuToDelete} // <-- ส่ง prop menu
         onConfirm={handleConfirmDeleteMenu}
         onCancel={handleCloseDeleteModal}
         isDeleting={isDeleting}
       />
       {/* (Optional) แสดง Delete Error นอก Modal ถ้าต้องการ */}
       {deleteError && <div className="p-4 bg-red-100 text-red-700 text-center">Delete failed: {deleteError}</div>}


      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ... (Header, Search เหมือนเดิม) ... */}
         <div className="mb-4">
          <h1 className="text-2xl font-semibold decoration-black/80 decoration-2 mb-1">Product Overview</h1>
          <p className="text-gray-700">Manage your menu items here.</p>
          {errorMenus && <p className="mt-2 text-sm text-red-600">Error loading menus: {errorMenus}</p>}
        </div>
        <div className="flex items-center gap-4 mb-6">
           {/* --- ใส่ Style กลับมา --- */}
          <input 
            type="text" 
            placeholder="Search menu by name, ID, or category" 
            value={searchTerm} 
            onChange={(e)=>setSearchTerm(e.target.value)} 
            disabled={loadingMenus} 
            className="flex-1 h-12 rounded-full bg-[#f1eeee] px-6 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button 
            aria-label="Search" 
            disabled={loadingMenus} 
            className="w-auto h-12 rounded-xl bg-[#d67a42] hover:bg-[#c86f36] text-black font-medium flex items-center justify-center gap-2 transition px-5 py-3 disabled:opacity-60"
           >
             <MagnifyingGlassIcon className="w-6 h-6"/>
             <span className="hidden sm:inline">Search</span>
           </button>
        </div>

        {/* Table */}
        <div className="bg-[#f3efef] rounded-xl p-4">
          <div className="overflow-x-auto">
          <table className="w-full table-auto min-w-[720px]">
              <thead>
                <tr>
                   {/* --- ใส่ Style กลับมา --- */}
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">MENU ID</th>
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">MENU NAME</th>
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">CATEGORY</th>
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">PRICE</th>
                  <th className="bg-[#B9E8B8] text-left py-4 px-6">STATUS</th>
                  <th className="bg-[#B9E8B8] text-center py-4 px-6">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {/* ... (Loading, Error, No Data rows เหมือนเดิม) ... */}
                 {loadingMenus ? ( 
                   <tr><td colSpan={6} className="text-center py-8 text-gray-500"><Loader2 className="w-6 h-6 inline mr-2 animate-spin"/> Loading...</td></tr>
                 ) : errorMenus ? ( 
                   <tr><td colSpan={6} className="text-center py-8 text-red-500">Failed to load menus.</td></tr>
                 ): filteredMenu.length === 0 ? ( 
                   <tr><td colSpan={6} className="text-center py-8 text-gray-500">No menus found.</td></tr>
                 ) : (
                  filteredMenu.map((menu) => ( 
                    <tr key={menu.Menu_Id}> 
                      {/* --- ใส่ Style กลับมา --- */}
                       <td className="py-4 px-4"><div className="bg-[#fff9c7] rounded-full px-6 py-3">{menu.Menu_Id}</div></td>
                       <td className="py-4 px-4"><div className="bg-[#fff9c7] rounded-full px-6 py-3">{menu.name}</div></td>
                       <td className="py-4 px-4"><div className="bg-[#fff9c7] rounded-full px-6 py-3">{menu.category}</div></td>
                       <td className="py-4 px-4"><div className="bg-[#fff9c7] rounded-full px-6 py-3">{formatPrice(menu.price)}</div></td>
                       <td className="py-4 px-4"><div className={`rounded-full px-6 py-3 text-center text-xs font-medium ${menu.is_available ? 'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{menu.is_available ? 'Available' : 'Unavailable'}</div></td>

                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-2">
                           {/* --- ปุ่ม Edit (เหมือนเดิม) --- */}
                           <Link href={`/manage/update/${menu.Menu_Id}`}> 
                             <button onClick={() => handleEdit(menu.Menu_Id)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold p-2 rounded-full transition" aria-label={`Edit ${menu.name}`}> <Edit size={16} /> </button>
                           </Link> 
                           {/* --- ปุ่ม Delete (เหมือนเดิม) --- */}
                           <button 
                             onClick={() => handleOpenDeleteModal(menu)} 
                             className="bg-red-500 hover:bg-red-600 text-white font-semibold p-2 rounded-full transition"
                             aria-label={`Delete ${menu.name}`} 
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ... (Action Buttons เหมือนเดิม) ... */}
         <div className="flex justify-between items-center gap-4 mt-8">
            {/* --- ใส่ Style กลับมา --- */}
           <button onClick={() => { window.history.back(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow flex items-center gap-2"><ArrowLeftIcon className="w-5 h-5"/> Back</button>
           <button onClick={handleAddMenu} className="bg-[#5FA373] hover:bg-[#4e8c63] text-white px-8 py-3 rounded-lg shadow">ADD MENU</button>
        </div>
      </main>
    </div>
  );
}

