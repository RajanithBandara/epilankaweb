import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import NavbarHandler from "@/app/NavbarHandler";
import NavBar from "@/components/NavBar";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { AuthProvider } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";
import FooterHandler from "./FooterHandler";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EpiLanka",
  description: "Sri Lankan Disease analysis platform",
};

const themeBootstrapScript = `
  (() => {
    try {
      const storedTheme = window.localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const resolvedTheme = storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : (systemPrefersDark ? "dark" : "light");

      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
      document.documentElement.style.colorScheme = resolvedTheme;
    } catch {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-bootstrap"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <LoadingProvider>
            <NavbarHandler>
              <NavBar />
            </NavbarHandler>
            <PageTransition>
              {children}
            </PageTransition>
            <FooterHandler>
              <Footer />
            </FooterHandler>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
