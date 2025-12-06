'use client';

function HeroSection() {
    return (
        <section className="relative px-6 py-24 text-center min-h-screen flex items-center justify-center">
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-6 px-5 py-3 bg-white/15 backdrop-blur-xl rounded-full border border-white/30 shadow-2xl">
                    <span className="text-2xl">🦠</span>
                    <span className="text-sm font-bold text-white tracking-wide">Disease Surveillance Platform</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight text-white drop-shadow-2xl">
                    EpiWatch Lanka
                </h1>

                {/* Subheading */}
                <p className="text-xl md:text-3xl max-w-4xl mx-auto mb-4 text-white/95 leading-relaxed font-semibold drop-shadow-lg">
                    Sri Lanka&#39;s intelligent infectious disease awareness and prediction platform.
                </p>
                <p className="text-lg md:text-xl text-white/80 mb-12 font-medium drop-shadow-md">
                    Stay informed, stay protected — wherever you travel.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                    <a
                        href="/dashboard"
                        className="group relative inline-flex items-center gap-3 bg-white text-black font-bold px-10 py-5 rounded-xl shadow-[0_20px_60px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_80px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 text-lg overflow-hidden"
                    >
                        {/* Button shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                        <span className="relative z-10">Go to Dashboard</span>
                        <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>

                    <a
                        href="#about"
                        className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xl text-white font-bold px-10 py-5 rounded-xl border-2 border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 text-lg shadow-xl"
                    >
                        <span>Learn More</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </a>
                </div>
            </div>
        </section>
    )
}

export default HeroSection;