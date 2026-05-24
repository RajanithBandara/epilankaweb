"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
    { label: "Update Records", href: "/officerdashboard/update-records" },
    { label: "Diseases", href: "/officerdashboard/diseases" },
    { label: "Analytics", href: "/officerdashboard/analytics" },
    { label: "Map", href: "/officerdashboard/map" },
    { label: "Upload Report", href: "/officerdashboard/uploadreports" },
    { label: "Menus", href: "/officerdashboard/menus" },
] as const;

export default function OfficerHomePage() {
    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
                <CardHeader>
                    <CardTitle className="text-lg">Officer Dashboard</CardTitle>
                    <CardDescription className="text-black/65 dark:text-white/65">
                        Black and white navigation with quick access to your core officer tools.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                    {quickLinks.map((link) => (
                        <Button
                            key={link.href}
                            asChild
                            variant="outline"
                            className="justify-start border-black/20 bg-white text-black hover:bg-black hover:text-white dark:border-white/30 dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
                        >
                            <Link href={link.href}>{link.label}</Link>
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}