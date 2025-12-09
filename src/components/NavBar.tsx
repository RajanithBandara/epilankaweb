'use client';

function NavBar() {
    return (
        <nav className="sticky top-0 bg-black text-white py-4 px-6 z-50 shadow-lg">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="text-2xl font-bold cursor-pointer hover:text-gray-300 transition">
                    EPI Lanka
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-all duration-200 font-semibold"
                    onClick={()=> window.location.href = "/login"}
                    >
                        Sign In
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 font-semibold"
                    onClick={() => window.location.href = "/signup"}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default NavBar;
