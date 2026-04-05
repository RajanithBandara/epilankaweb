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
    return (
      safePath.startsWith("/dashboard") ||
      safePath.startsWith("/admindashboard") ||
      safePath.startsWith("/officerdashboard")
    );
  }, [safePath]);

  useEffect(() => {
    let loadingTimer: number | undefined;
    let contentTimer: number | undefined;

    const restoreBody = () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
    };

    if (isAppRoute) {
      loadingTimer = window.setTimeout(() => {
        setIsLoading(false);
        setShowContent(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        restoreBody();
      }, 0);

      return () => {
        if (loadingTimer) window.clearTimeout(loadingTimer);
        restoreBody();
      };
    }

    const kickoffTimer = window.setTimeout(() => {
      setIsLoading(true);
      setShowContent(false);
    }, 50);

    loadingTimer = window.setTimeout(() => {
      setIsLoading(false);
      contentTimer = window.setTimeout(() => {
        setShowContent(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 220);
    }, 620);

    return () => {
      if (kickoffTimer) window.clearTimeout(kickoffTimer);
      if (loadingTimer) window.clearTimeout(loadingTimer);
      if (contentTimer) window.clearTimeout(contentTimer);
      restoreBody();
    };
  }, [safePath, isAppRoute]);

  return (
    <>
      {!isAppRoute && <LoadingScreen isLoading={isLoading} />}

      <div
        className={`min-h-screen ${
          isAppRoute ? "duration-400" : "duration-900"
        } ease-[cubic-bezier(0.22,1,0.36,1)] transition-[opacity,transform] will-change-[opacity,transform] ${
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
