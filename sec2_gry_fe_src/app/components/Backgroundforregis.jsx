import React from 'react'

function Backgroundforregis() {
  return (
    <div>
        
          <div
              className="w-full min-h-screen flex flex-col justify-center items-center text-center text-black"
              style={{
                  backgroundImage: "url('https://img.thaicdn.net/u/natthida/travel/32196448/32196448-1.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
              }}
          >
              <h1 className="text-xl font-bold sm:text-2xl">WELCOME TO LINEGIRL</h1>
              <p className="mt-4 text-lg m-3 sm:text-xl">
                  Welcome to our website. <br />
                  We are happy to serve you all, but first, let's become a member.
              </p>
          </div>
    </div>
  )
}

export default Backgroundforregis