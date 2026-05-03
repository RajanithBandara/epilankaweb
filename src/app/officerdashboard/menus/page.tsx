import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MenusPage() {
    return (
        <Card className="border-black/15 bg-white text-black dark:border-white/20 dark:bg-black dark:text-white">
            <CardHeader>
                <CardTitle>Menus</CardTitle>
                <CardDescription className="text-black/65 dark:text-white/65">
                    Access additional officer tools and utility actions.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-black/80 dark:text-white/80">
                Additional menu actions can be placed here.
            </CardContent>
        </Card>
    );
}

