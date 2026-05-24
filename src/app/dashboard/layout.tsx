'use client';

import {
  Home,
  Map,
  FileText,
  FilePlus,
  Settings,
  LogOut,
  User,
  CalendarDays,
  ChevronRight,
  Brain,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { LocationProvider } from "@/contexts/LocationContext";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import NotificationBell from "@/components/dashboard-components/NotificationBell";
import NotificationToast from "@/components/dashboard-components/NotificationToast";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Map", href: "/dashboard/map", icon: Map },
  { label: "Submit Report", href: "/dashboard/report", icon: FilePlus },
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "EpiGuard AI", href: "/dashboard/takecare", icon: Brain },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const baseNavItemClass =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const avatarLetter = displayName ? displayName[0].toUpperCase() : null;
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const userPrefs = (user?.prefs ?? {}) as Record<string, unknown>;
  const googleImageCandidates = [
    userPrefs.profile_image,
    userPrefs.avatar,
    userPrefs.picture,
    userPrefs.photoURL,
    userPrefs.photo_url,
    userPrefs.image,
  ];
  const oauthImage = googleImageCandidates.find(
    (value): value is string => typeof value === "string" && /^https?:\/\//.test(value)
  ) ?? null;

  const resolvedAvatarImage = profileImage || oauthImage;

  useEffect(() => {
    let isCancelled = false;

    const loadSidebarProfileImage = async () => {
      if (!user) {
        setProfileImage(null);
        return;
      }

      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const image =
          typeof data?.user?.profile_image === "string" && data.user.profile_image.trim().length > 0
            ? data.user.profile_image
            : null;

        if (!isCancelled) setProfileImage(image);
      } catch {
        if (!isCancelled) setProfileImage(null);
      }
    };

    void loadSidebarProfileImage();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    []
  );

  return (
    <NotificationProvider>
      <NotificationToast />
      <LocationProvider>
        <div
          className="relative h-dvh w-full overflow-hidden"
          style={{ background: "var(--dash-bg)" }}
        >
        <div className="relative z-10 h-full min-h-0 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside
            className="hidden lg:flex flex-col h-dvh border-r"
            style={{
              background: "var(--dash-sidebar-bg)",
              borderColor: "var(--dash-sidebar-border)",
            }}
          >
            <div
              className="px-5 pt-5 pb-4 shrink-0 border-b"
              style={{ borderColor: "var(--dash-sidebar-border)" }}
            >
              <Link href="/" className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: "var(--color-primary)", color: "#fff" }}
                >
                  E
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--dash-text-primary)" }}
                  >
                    EpiLanka
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--dash-text-muted)" }}
                  >
                    Disease Intelligence
                  </p>
                </div>
              </Link>
            </div>

            <div className="px-3 pt-3 pb-2 shrink-0">
              <p
                className="px-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--dash-text-muted)" }}
              >
                Menu List
              </p>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${baseNavItemClass} ${
                      isActive ? "" : "hover:bg-(--dash-nav-hover-bg)"
                    }`}
                    style={
                      isActive
                        ? { background: "var(--color-primary)", color: "#fff" }
                        : { color: "var(--dash-text-secondary)" }
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 opacity-80" />}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 pb-5 space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 rounded-xl border px-3 py-2.5 flex items-center gap-2"
                  style={{
                    background: "var(--dash-card-bg)",
                    borderColor: "var(--dash-card-border)",
                  }}
                >
                  <CalendarDays
                    className="h-4 w-4"
                    style={{ color: "var(--dash-text-muted)" }}
                  />
                  <span
                    className="flex-1 text-xs font-medium"
                    style={{ color: "var(--dash-text-secondary)" }}
                  >
                    {todayLabel}
                  </span>
                </div>
                <NotificationBell />
                <AnimatedThemeToggler
                  className="h-10 w-10 rounded-lg border flex items-center justify-center"
                  style={{
                    borderColor: "var(--dash-card-border)",
                    color: "var(--dash-text-secondary)",
                    background: "var(--dash-card-bg)",
                  }}
                />
              </div>

              {/* User info card */}
              <div
                className="rounded-xl border px-3 py-2.5 flex items-center gap-2.5"
                style={{
                  background: "var(--dash-card-bg)",
                  borderColor: "var(--dash-card-border)",
                }}
              >
                {resolvedAvatarImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolvedAvatarImage}
                    alt="User profile"
                    className="h-8 w-8 rounded-lg object-cover border"
                    style={{ borderColor: "var(--dash-card-border)" }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
                    style={{ background: "var(--color-primary)", color: "#fff" }}
                  >
                    {avatarLetter ?? <User className="h-4 w-4" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--dash-text-primary)" }}
                  >
                    {displayName}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--dash-text-muted)" }}
                  >
                    {user?.email ?? ""}
                  </p>
                </div>
              </div>

              <button
                onClick={() => void logout()}
                className="w-full rounded-xl border px-3 py-2.5 flex items-center gap-2.5 text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                style={{
                  borderColor: "var(--dash-card-border)",
                  color: "#dc2626",
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>

          <main className="min-w-0 min-h-0 h-full flex flex-col px-3 sm:px-4 lg:px-5 pb-28 lg:pb-5 pt-3 lg:pt-5">
            <section
              className="max-w-7xl mx-auto w-full min-h-0 h-full rounded-2xl border overflow-hidden flex flex-col"
              style={{
                background: "var(--dash-panel-bg)",
                borderColor: "var(--dash-panel-border)",
              }}
            >
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 md:px-6 lg:px-7 py-5 sm:py-6">
                {children}
              </div>
            </section>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <nav
            className="rounded-xl border overflow-hidden"
            style={{
              background: "var(--dash-sidebar-bg)",
              borderColor: "var(--dash-sidebar-border)",
            }}
          >
            <div className="h-16 grid grid-cols-7 gap-1 p-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className="min-w-0">
                    <div
                      className="h-full rounded-lg flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium"
                      style={
                        isActive
                          ? { background: "var(--color-primary)", color: "#fff" }
                          : { color: "var(--dash-text-muted)" }
                      }
                    >
                      <Icon className="h-[15px] w-[15px]" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
              <div className="h-full flex items-center justify-center">
                <AnimatedThemeToggler
                  className="h-9 w-9 rounded-lg border flex items-center justify-center"
                  style={{
                    borderColor: "var(--dash-card-border)",
                    color: "var(--dash-text-secondary)",
                    background: "var(--dash-card-bg)",
                  }}
                />
              </div>
            </div>
          </nav>
        </div>
      </div>
      </LocationProvider>
    </NotificationProvider>
  );
}
