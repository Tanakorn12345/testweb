"use client";

// This component receives the 'role' as a prop to customize its title.
const RegisterForm = ({ formData, error, handleChange, handleSubmit, role }) => {
    // This creates a capitalized version of the role for the title, e.g., "customer" -> "Customer".
    const roleTitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

    return (
        <div className="w-[95%] sm:w-full max-w-md bg-white rounded-3xl shadow-xl p-5 sm:p-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-8">
                {/* The title now dynamically includes the user's role. */}
                CREATE {roleTitle.toUpperCase()} ACCOUNT
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                
                {/* The radio buttons for selecting a role have been removed. */}

                {/* --- Username Field --- */}
                <div>
                    <label htmlFor="username" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-2.5 sm:py-3 bg-gray-200 border-none rounded-full focus:ring-2 focus:ring-green-400 focus:outline-none transition"
                    />
                </div>

                {/* --- Email Field --- */}
                <div>
                    <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-2.5 sm:py-3 bg-gray-200 border-none rounded-full focus:ring-2 focus:ring-green-400 focus:outline-none transition"
                    />
                </div>

                {/* --- Phone Number Field --- */}
                 <div>
                    <label htmlFor="phone" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-2.5 sm:py-3 bg-gray-200 border-none rounded-full focus:ring-2 focus:ring-green-400 focus:outline-none transition"
                    />
                </div>

                {/* --- Password Field --- */}
                <div>
                    <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-2.5 sm:py-3 bg-gray-200 border-none rounded-full focus:ring-2 focus:ring-green-400 focus:outline-none transition"
                    />
                </div>
                
                {error && <p className="text-xs sm:text-sm text-center text-red-600 pt-1">{error}</p>}
                
                <div className="pt-2">
                    <button 
                        type="submit"
                        className="w-full bg-[#66BB6A] text-white text-sm sm:text-base font-bold py-2.5 sm:py-3 px-4 rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                    >
                        REGISTER
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm;