import React from 'react'
import Link from 'next/link'


function Selectlogin() {
  
  return (
    <>
      <div className='flex items-center justify-center min-h-screen bg-gray-100 px-4'>
        <div className="
          flex min-h-full flex-col justify-center 
          w-full 
          sm:max-w-md   /* มือถือขึ้นไป กว้าง ~448px */
          md:max-w-lg   /* แท็บเล็ต กว้าง ~512px */
          lg:max-w-xl   /* หน้าจอใหญ่ กว้าง ~576px */
          xl:max-w-2xl  /* Desktop ใหญ่ กว้าง ~672px */
          px-1 sm:px-8 lg:px-12 
          py-12 sm:py-16 
          bg-gray-300 rounded-2xl shadow-lg
        ">
          <div className="mx-auto w-full">
            <h2 className="mt-6 text-center text-xl sm:text-2xl font-bold tracking-tight text-gray-900 py-6">
              SELECT FOR LOGIN
            </h2>

            <Link href="/Login/Logincustomerr" >
            <div  className='p-3'>
              <div className='bg-green-400 p-6 rounded-2xl cursor-pointer transition duration-600  hover:bg-amber-50 '>
                <div className='flex px-7 flex-row'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7  sm:size-8 ">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <div className="font-bold text-base sm:text-xl px-3">CUSTOMER
                  <p className='font-light'>Customers interested in our services</p></div>

                </div>

              </div>

            </div>
            </Link>
            


            <Link href="/Login/Loginrestaurant">
            <div className='p-3'>
              <div className='bg-green-400 p-6 rounded-2xl transition duration-600  hover:bg-amber-50 cursor-pointer'>
                <div className='flex px-7 flex-row'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7  sm:size-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>

                  <div className="font-bold text-base sm:text-xl px-3">RESTSURSNT
                  <p className='font-light'>Restaurants that want to sell</p></div>

                </div>

              </div>

            </div>

            </Link>

            <Link href="/Login/Loginadmin">
            <div className='p-3'>
              <div className='bg-green-400 p-6 rounded-2xl transition duration-600  hover:bg-amber-50  cursor-pointer'>
                <div className='flex px-7 flex-row'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7  sm:size-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>

                  <div className="font-bold text-base sm:text-xl px-3">ADMIN
                  <p className='font-light'>Administrative manager</p>
                  </div>



                </div>

              </div>

            </div>

              </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Selectlogin

