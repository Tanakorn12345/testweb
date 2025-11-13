import React from 'react'

function Footer() {
  return (
   <>
   <div className='bg-green-600 p-3'>
    <h5 className='flex flex-row justify-center text-center text-white text-sm'> © {new Date().getFullYear()} LINE GIRL. All rights reserved.</h5>
   </div>
   </>
  )
}

export default Footer