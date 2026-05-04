'use client';

import MicroorganismBackground from '@/components/safety-components/MicroorganismBackground';
import EpiGuardChat from '@/components/safety-components/EpiGuardChat';
import { useEffect } from 'react';
import Lenis from 'lenis';

export default function SafetyPage() {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.5,
            smoothWheel: true,
            wheelMultiplier: 0.7,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => lenis.destroy();
    }, []);

    return (
        <main className="h-screen overflow-hidden relative text-white flex flex-col">
            <MicroorganismBackground />
            <div className="fixed inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] overflow-hidden -z-20">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>
            </div>

            {/* spacer for fixed navbar */}
            <div className="shrink-0 h-24" />

            <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 pb-6 relative z-10 flex flex-col">
                <div className="relative bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.25)] flex-1 min-h-0 flex flex-col">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#1E3A8A]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#0EA5A4]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden h-full w-full">
                        <EpiGuardChat />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0EA5A4]/40 to-transparent pointer-events-none" />
                </div>
            </div>
        </main>
    );
}

