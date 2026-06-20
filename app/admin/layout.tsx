import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserRoleAndStatusAction } from "@/app/actions/adminActions";
import { hasPermission, getRolePermissions } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Brain,
  Palette,
  ShieldAlert,
  LifeBuoy,
  Megaphone,
  History,
  Activity,
  ArrowLeft,
  Lock,
  LogOut,
  User as UserIcon
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 1. Fetch user session
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  // 2. Fetch role mapping and check status
  const { role, isSuspended } = await getUserRoleAndStatusAction(user.id, user.email || "");

  // 3. Handle suspended screen
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-50">Account Suspended</h1>
            <p className="text-sm text-zinc-400">
              Your account has been suspended by a system administrator. If you believe this is an error, please contact our support desk.
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-800">
            <form action="/auth/api/signout" method="POST">
              <Button type="submit" variant="danger" className="w-full">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 4. Handle non-admin screen redirection
  if (role === "user") {
    redirect("/dashboard");
  }

  // 5. Navigation Items filtered by permissions
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users, permission: "view_users" },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, permission: "manage_plans" },
    { href: "/admin/ai", label: "AI Analytics", icon: Brain, permission: "view_ai_logs" },
    { href: "/admin/templates", label: "Templates", icon: Palette, permission: "manage_templates" },
    { href: "/admin/moderation", label: "Moderation Queue", icon: ShieldAlert, permission: "manage_templates" },
    { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy, permission: "manage_support" },
    { href: "/admin/notifications", label: "Announcements", icon: Megaphone, permission: "broadcast_notifications" },
    { href: "/admin/logs", label: "Audit Logs", icon: History, permission: "view_audit_logs" },
    { href: "/admin/health", label: "System Health", icon: Activity, permission: "view_system_health" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar Panel */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex flex-col shrink-0">
        {/* Brand Logo header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-md tracking-wider">
            R
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
              ResumeAI Pro
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono font-medium">ADMIN PLATFORM</p>
          </div>
        </div>

        {/* Navigation Sidebar List */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // If the item requires specific permissions, check if the current role satisfies it
            if (item.permission && !hasPermission(role, item.permission as any)) {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 transition-all duration-200 group"
              >
                <item.icon className="w-4.5 h-4.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Identity & Navigation Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-zinc-300 truncate">
                {user.email}
              </p>
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider">
                {role.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/dashboard" className="w-full">
              <Button
                variant="outline"
                className="w-full h-8 text-[10px] font-bold border-zinc-800 hover:bg-zinc-800 hover:text-white"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                App
              </Button>
            </Link>
            <Link href="/auth" className="w-full">
              <Button
                variant="ghost"
                className="w-full h-8 text-[10px] font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="w-3 h-3 mr-1" />
                SignOut
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] font-medium text-zinc-500 tracking-wider uppercase font-mono">
              All backend systems normal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-zinc-500">Session expires soon</span>
          </div>
        </header>

        {/* Children layouts wrapper */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
