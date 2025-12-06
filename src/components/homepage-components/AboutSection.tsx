'use client';

function AboutSection() {
    return (
        <section id="about" className="px-6 py-12 mx-4 md:mx-8 my-8 relative z-10">
            <div className="max-w-4xl mx-auto">
                {/* Main card with glassmorphism */}
                <div className="relative bg-black/20 backdrop-blur-xl rounded-3xl shadow-[0_20px_70px_rgba(164,17,17,0.15)] border border-white/10 overflow-hidden p-8 md:p-12">

                    {/* Decorative elements */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-winered/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-winered/10 rounded-full blur-3xl"></div>

                    <div className="relative text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-gradient-to-br from-white via-white/90 to-white/80 rounded-full border border-winered/20 shadow-lg shadow-winered/10">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-semibold text-black">About the Platform</span>
                        </div>

                        {/* Heading */}
                        <h2 className="text-4xl md:text-5xl font-black mb-6 bg-white/80 bg-clip-text text-transparent">
                            What Is EpiWatch Lanka?
                        </h2>

                        {/* Description */}
                        <p className="text-white/70 text-lg leading-relaxed font-medium">
                            EpiWatch Lanka provides real-time district-level disease information, interactive heatmaps,
                            and analytical insights. The platform transforms weekly epidemiology reports into
                            user-friendly visual data, helping citizens and health authorities understand disease trends.
                        </p>

                        {/* Decorative bottom shine */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-winered/30 to-transparent"></div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AboutSection;