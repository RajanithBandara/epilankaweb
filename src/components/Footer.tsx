'use client';

function Footer(){
    return(
        <footer className="py-8 px-6 border-t border-gray-800">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <div className="text-xl font-bold text-winered mb-1">EpiWatch Lanka</div>
                        <p className="text-gray-500 text-sm">Infectious Disease Awareness Platform</p>
                    </div>

                    <div className="text-gray-500 text-sm">
                        © 2025 EpiWatch Lanka. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;