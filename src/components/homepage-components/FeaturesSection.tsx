'use client';

function FeaturesSection() {
    const features = [
        {
            icon: (
                <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            ),
            title: "Reduce Travel Risk",
            description: "Travelers can quickly see high-risk areas and changing disease patterns, helping them avoid outbreaks and plan safer routes."
        },
        {
            icon: (
                <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            title: "District-Level Insights",
            description: "EpiWatch collects and displays detailed district-level disease reports, giving you accurate and localized health information."
        },
        {
            icon: (
                <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            title: "Awareness for Prevention",
            description: "Learn symptoms, preventive steps, and seasonal disease patterns to protect yourself and your family."
        },
        {
            icon: (
                <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: "Supports Health Preparedness",
            description: "With predictive analytics (coming soon), EpiWatch helps forecast potential outbreaks, enabling early precautions."
        }
    ];

    return(
        <section className="px-6 py-20 mx-4 md:mx-8 my-8 relative z-10">
            <div className="max-w-6xl mx-auto">
                {/* Main card with glassmorphism */}
                <div className="relative bg-black/20 backdrop-blur-xl rounded-3xl shadow-[0_20px_70px_rgba(164,17,17,0.15)] border border-white/10 overflow-hidden p-8 md:p-12">

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-winered/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-winered/10 rounded-full blur-3xl"></div>

                    <div className="relative">
                        <div className="text-center mb-12">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 bg-gradient-to-br from-white via-white/90 to-white/80 rounded-full border border-winered/20 shadow-lg shadow-winered/10">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <span className="text-sm font-semibold text-black">Platform Features</span>
                            </div>

                            {/* Heading */}
                            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-white/80 bg-clip-text text-transparent">
                                Why Choose EpiWatch Lanka?
                            </h2>
                            <p className="text-white/70 text-lg max-w-2xl mx-auto font-medium">
                                Advanced tools and insights to keep you informed and protected
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group relative p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-winered/40 transition-all duration-500 hover:shadow-xl hover:shadow-winered/20 hover:scale-105 cursor-pointer"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animation: 'fadeInUp 0.6s ease-out forwards',
                                        opacity: 0
                                    }}
                                >
                                    {/* Icon badge */}
                                    <div className="relative inline-flex items-center justify-center mb-5">
                                        <div className="relative p-3 bg-gradient-to-br from-white via-white/90 to-white/80 rounded-xl backdrop-blur-sm border border-winered/20 shadow-lg shadow-winered/10 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl group-hover:shadow-winered/30 group-hover:border-winered/40 transition-all duration-500">
                                            <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                                                {feature.icon}
                                            </div>
                                            {/* Inner shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-black mb-3 bg-white/80 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                                        {feature.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-white/70 leading-relaxed font-medium">
                                        {feature.description}
                                    </p>

                                    {/* Bottom indicator */}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-winered to-transparent group-hover:w-3/4 transition-all duration-500 rounded-t-full"></div>
                                </div>
                            ))}
                        </div>

                        {/* Decorative bottom shine */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-winered/30 to-transparent"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </section>

    )
}

export default FeaturesSection;