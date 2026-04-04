'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface FooterHandlerProps {
    children: ReactNode;
}

export default function FooterHandler({ children }: FooterHandlerProps) {
    const pathname = usePathname();

    const hideFooterRoutes = ['/login','/reset-password','/success', '/dashboard', '/signup', '/admindashboard', '/admin/login'];

    const shouldHideFooter = hideFooterRoutes.some(route =>
        pathname === route || pathname?.startsWith(`${route}/`)
    );

    // Don't render navbar on specified routes
    if (shouldHideFooter) {
        return null;
    }

    // Render navbar on all other routes
    return <>{children}</>;
}
