"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const Articles = dynamic(
    () => import("@/components/dashboard-components/Articles"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--dash-text-muted)" }}>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
        ),
    }
);

export default function ArticlesPage() {
    return <Articles />;
}
