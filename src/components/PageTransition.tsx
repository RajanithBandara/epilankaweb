"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const pathname = usePathname();
  const safePath = pathname ?? "";

  const isAppRoute = useMemo(() => {
    return safePath.startsWith("/dashboard") || safePath.startsWith("/admindashboard");
  }, [safePath]);

  useEffect(() => {
    const restoreBody = () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
    };

    if (isAppRoute) {
      const timer = window.setTimeout(() => {
        setIsLoading(false);
        setShowContent(true);
        restoreBody();
      }, 0);

      return () => {
        window.clearTimeout(timer);
        restoreBody();
      };
    }

    const kickoffTimer = window.setTimeout(() => {
      setIsLoading(true);
      setShowContent(false);
    }, 0);

    const loadingTimer = window.setTimeout(() => {
      setIsLoading(false);
      const contentTimer = window.setTimeout(() => {
        setShowContent(true);
      }, 240);

      return () => window.clearTimeout(contentTimer);
    }, 620);

    return () => {
      window.clearTimeout(kickoffTimer);
      window.clearTimeout(loadingTimer);
      restoreBody();
    };
  }, [safePath, isAppRoute]);

  return (
    <>
      {!isAppRoute && <LoadingScreen isLoading={isLoading} />}

      <div
        className={`min-h-screen ${
          isAppRoute ? "duration-200" : "duration-500"
        } ease-out transition-all ${
          showContent
            ? "opacity-100 translate-y-0 scale-100"
            : isAppRoute
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-2 scale-[0.99]"
        }`}
      >
        {children}
      </div>
    </>
  );
}
