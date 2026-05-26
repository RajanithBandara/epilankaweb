"use client";

import { useEffect, useRef } from "react";
import HeroSection from "@/components/homepage-components/HeroSection";
import StatSection from "@/components/homepage-components/StatSection";
import AboutSection from "@/components/homepage-components/AboutSection";
import FeaturesSection from "@/components/homepage-components/FeaturesSection";
import CtaSection from "@/components/homepage-components/CtaSection";
import UploadedReportsSection from "@/components/homepage-components/UploadedReportsSection";
import EpiGuardAssistantPopup from "@/components/homepage-components/EpiGuardAssistantPopup";
import dynamic from "next/dynamic";
import { getGsap } from "@/lib/gsap";
import Lenis from "lenis";

// Dynamically import Three.js component with no SSR
const ThreeBackground = dynamic(
  () => import("@/components/homepage-components/ThreeBackground"),
  { ssr: false }
);


export default function HomePage() {
  const pageRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const { gsap, ScrollTrigger } = getGsap();
    const root = pageRef.current;

    if (!root) {
      return;
    }

    // Initialize Lenis for snappier smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("[data-home-scroll-section]");

      sections.forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 56, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              end: "top 40%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      gsap.to("[data-home-glow='left']", {
        y: 48,
        x: 18,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      gsap.to("[data-home-glow='right']", {
        y: -36,
        x: -16,
        scale: 1.06,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    }, root);

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <main ref={pageRef} className="home-cursor-scope">
      <EpiGuardAssistantPopup />

      {/* Fixed background with hero gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0EA5A4] overflow-hidden">
        {/* Three.js animated background */}
        <ThreeBackground />

        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div data-home-glow="left" className="absolute top-10 left-10 w-72 h-72 rounded-full will-change-transform" style={{ background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)" }}></div>
          <div data-home-glow="right" className="absolute bottom-10 right-10 w-96 h-96 rounded-full will-change-transform" style={{ background: "radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)" }}></div>
        </div>
      </div>

       {/* Scrollable content */}
       <div className="relative z-10">
         <HeroSection />
         {/* Floating sections container */}
         <div className="relative pb-32 space-y-24 pt-12">
           <div data-home-scroll-section className="will-change-transform">
             <StatSection />
           </div>
           <div data-home-scroll-section className="will-change-transform">
             <AboutSection />
           </div>
           <div data-home-scroll-section className="will-change-transform">
             <FeaturesSection />
           </div>
           <div data-home-scroll-section className="will-change-transform">
             <CtaSection />
           </div>
         </div>
       </div>
    </main>
  );
}
