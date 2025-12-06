import HeroSection from "@/components/homepage-components/HeroSection";
import StatSection from "@/components/homepage-components/StatSection";
import AboutSection from "@/components/homepage-components/AboutSection";
import FeaturesSection from "@/components/homepage-components/FeaturesSection";
import CtaSection from "@/components/homepage-components/CtaSection";

// Legacy copy of the original /Home page (from src/pages/Home.tsx)
// Kept only for reference after migrating to the App Router.

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Fixed background with hero gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-winered via-[#8B0000] to-winered overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10">
        <HeroSection />

        {/* Floating sections container */}
        <div className="relative">
          <StatSection />
          <AboutSection />
          <FeaturesSection />
          <CtaSection />
        </div>
      </div>
    </main>
  );
}

