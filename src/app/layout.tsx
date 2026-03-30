import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarHandler from "@/app/NavbarHandler";
import NavBar from "@/components/NavBar";
import { LoadingProvider } from "@/contexts/LoadingContext";
import PageTransition from "@/components/PageTransition";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EpiLanka",
  description: "Sri Lankan Disease analysis platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <LoadingProvider>
            <NavbarHandler>
              <NavBar/>
            </NavbarHandler>
            <PageTransition>
              {children}
            </PageTransition>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
