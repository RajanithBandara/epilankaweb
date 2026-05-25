"use client";

import dynamic from "next/dynamic";

const OfficerArticles = dynamic(
    () => import("@/components/officerpanel-components/OfficerArticles"),
    { ssr: false }
);

export default function OfficerArticlesPage() {
    return <OfficerArticles />;
}
