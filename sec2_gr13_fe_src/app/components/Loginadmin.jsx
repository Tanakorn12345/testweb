import React from 'react'

import Link from "next/link";

function Loginadmin() {
    return (
        <div>

            <div className='flex items-center justify-center min-h-screen bg-gray-100 px-4'>
                <div className="
          flex min-h-full flex-col justify-center 
          w-full 
          sm:max-w-md   /* มือถือขึ้นไป กว้าง ~448px */
          md:max-w-lg   /* แท็บเล็ต กว้าง ~512px */
          lg:max-w-xl   /* หน้าจอใหญ่ กว้าง ~576px */
          xl:max-w-2xl  /* Desktop ใหญ่ กว้าง ~672px */
          px-6 sm:px-8 lg:px-12 
          py-12 sm:py-16 
          bg-gray-300 rounded-2xl shadow-lg
        ">
                    <div className="mx-auto w-full">


                        <div className="flex min-h-full flex-col justify-center px-6  lg:px-8">
                            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                                <h1 className='font-bold text-xl  sm:text-2xl justify-center flex'>LINE GIRL</h1>
                                <h2 className="mt-10 text-center  text-xl sm:text-2xl/9 font-bold tracking-tight text-black">Sign in to your account</h2>
                            </div>

                            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                                <form action="#" method="POST" className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm/6 font-medium text-black">
                                            Email address
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                autoComplete="email"
                                                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-back outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-green-500 sm:text-sm/6"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="password" className="block text-sm/6 font-medium text-black-100">
                                                Password
                                            </label>
                                            <div className="text-sm">
                                                <a href="#" className="font-semibold text-black hover:text-green-400">
                                                    Forgot password?
                                                </a>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                required
                                                autoComplete="current-password"
                                                className="block w-full rounded-md bg-white px-3 py-1.5 text-black placeholder:text-black focus:outline-2 focus:outline-green-500 sm:text-sm"
                                                
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            className="flex w-full justify-center rounded-md bg-green-400 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-white  hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                        >
                                            Sign in
                                        </button>
                                    </div>
                                </form>

                                <p className="mt-10 text-center text-sm/6 text-black">
                                    Not a member?{' '}
                                    <Link href="/register/registorforadmin" className="font-semibold text-black hover:text-green-400">
                                        Create Account
                                    </Link>
                                </p>
                            </div>
                        </div>






                    </div>
                </div>
            </div>
        </div>
    )
}

export default Loginadmin