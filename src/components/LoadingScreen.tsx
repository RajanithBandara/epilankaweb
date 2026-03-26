'use client';

import Lottie from 'lottie-react';
import flyingGlobeAnimation from '@/constants/flyingGlobeLottie.json';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #0c7490 100%)',
        opacity: isLoading ? 1 : 0,
        transform: isLoading ? 'scale(1)' : 'scale(1.03)',
        pointerEvents: isLoading ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
      aria-hidden={!isLoading}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0EA5A4]/15 rounded-full blur-3xl pointer-events-none" />

      <div
        className="relative mb-4 w-48 h-48 sm:w-56 sm:h-56 animate-[float_2.4s_ease-in-out_infinite]"
        style={{ filter: 'drop-shadow(0 0 32px rgba(34,211,238,0.35))' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[112%] h-[112%] rounded-full border border-[#67e8f9]/20 animate-[spin_8s_linear_infinite]" />
        </div>
        <Lottie
          animationData={flyingGlobeAnimation}
          loop
          autoplay
          className="w-full h-full"
          rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        />
      </div>

      <div className="text-center mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">
          EpiWatch{' '}
          <span className="bg-gradient-to-r from-[#7dd3fc] to-[#67e8f9] bg-clip-text text-transparent">
            Lanka
          </span>
        </h1>
        <p className="text-white/50 text-sm tracking-widest uppercase">Disease Surveillance Platform</p>
      </div>

      <div className="flex items-center gap-2 text-white/70 text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
        <span>Syncing outbreak data...</span>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
