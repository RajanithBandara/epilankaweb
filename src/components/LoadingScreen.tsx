'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [shouldRender, setShouldRender] = useState(isLoading);

  // Handle progress updates
  useEffect(() => {
    if (isLoading) {
      // Reset progress when loading starts
      const resetProgress = () => setProgress(0);
      resetProgress();

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      // Complete progress when loading stops
      const timer = setTimeout(() => setProgress(100), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Handle rendering state separately
  useEffect(() => {
    if (isLoading) {
      // Show immediately when loading starts (async to prevent cascading)
      const timer = setTimeout(() => setShouldRender(true), 0);
      return () => clearTimeout(timer);
    } else if (progress === 100) {
      // Wait for fade-out animation before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading, progress]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] transition-opacity duration-700 ${
        !isLoading && progress === 100 ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Animated Globe Loader */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="h-32 w-32 rounded-full border-4 border-transparent border-t-white border-r-white opacity-20"></div>
          </div>

          {/* Middle rotating ring (opposite direction) */}
          <div className="absolute inset-2 animate-spin-reverse">
            <div className="h-28 w-28 rounded-full border-4 border-transparent border-b-[#0EA5A4] border-l-[#0EA5A4] opacity-40"></div>
          </div>

          {/* Inner pulsing globe */}
          <div className="relative flex h-32 w-32 items-center justify-center">
            <div className="absolute h-20 w-20 animate-pulse rounded-full bg-white/10 backdrop-blur-sm"></div>

            {/* Globe icon */}
            <svg
              className="h-16 w-16 text-white animate-float"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            {/* Connection dots */}
            <div className="absolute -top-1 -right-1 h-2 w-2 animate-ping rounded-full bg-red-400"></div>
            <div className="absolute -bottom-1 -left-1 h-2 w-2 animate-ping rounded-full bg-cyan-400" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute top-1/2 -right-2 h-2 w-2 animate-ping rounded-full bg-yellow-400" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
            Loading...
          </h2>
          <p className="text-sm text-white/70">
            Connecting the world
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-white to-[#0EA5A4] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress Percentage */}
        <div className="text-white/80 text-sm font-medium">
          {progress}%
        </div>
      </div>
    </div>
  );
}






