"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Palette,
  Sparkles,
  Mail,
  Target,
  BarChart3,
  CreditCard,
  Settings,
  User,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Video,
  MessageSquare,
  Plug,
  Zap,
  Code2,
  FileUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Resumes", href: "/dashboard/resumes", icon: FileText },
  { name: "Templates", href: "/templates", icon: Palette },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Sparkles },
  { name: "Career Documents", href: "/dashboard/documents", icon: Mail },
  { name: "Job Matcher", href: "/dashboard/job-matcher", icon: Target },
  { name: "Interview Prep", href: "/dashboard/interview", icon: Video },
  { name: "Career Coach", href: "/dashboard/coach", icon: MessageSquare },
  { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { name: "Automations", href: "/dashboard/automations", icon: Zap },
  { name: "Developer Portal", href: "/dashboard/developer", icon: Code2 },
  { name: "Import Resume", href: "/dashboard/import", icon: FileUp },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    const item = sidebarItems.find((i) => i.href === pathname);
    return item ? item.name : "ResumeAI Pro";
  };

  // Auth Loading Screen
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Initializing secure session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200/80 bg-white/70 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/70 shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              R
            </div>
            <span>ResumeAI <span className="text-indigo-600 font-semibold text-xs bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded-md">PRO</span></span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", 
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                )} />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {profile?.fullName || "Guest User"}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {user?.email || "anonymous"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => signOut()}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-red-600 dark:text-red-400 dark:hover:bg-red-950/20 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <div className="relative flex flex-col w-64 bg-white dark:bg-zinc-950 h-full border-r border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setMobileOpen(false)}>
                  <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">R</div>
                  <span>ResumeAI Pro</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                          : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                  variant="ghost"
                  className="w-full justify-start text-red-600 dark:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 backdrop-blur-md dark:bg-zinc-950/70 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <Link href="/dashboard/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-sm">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Children Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
