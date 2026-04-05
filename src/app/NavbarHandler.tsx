"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavbarHandlerProps {
  children: ReactNode;
}

export default function NavbarHandler({ children }: NavbarHandlerProps) {
  const pathname = usePathname();

  const hideNavbarRoutes = [
    "/login",
    "/reset-password",
    "/success",
    "/dashboard",
    "/signup",
    "/admindashboard",
    "/officerdashboard",
    "/admin/login",
    "/officer/login",
  ];

  const shouldHideNavbar = hideNavbarRoutes.some((route) =>
    pathname === route || pathname?.startsWith(`${route}/`)
  );

  // Don't render navbar on specified routes
  if (shouldHideNavbar) {
    return null;
  }

  // Render navbar on all other routes
  return <>{children}</>;
}
