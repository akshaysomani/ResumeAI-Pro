import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Building,
  FolderOpen,
  Users,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Sliders,
  CreditCard,
  ArrowLeft,
  Lock,
  User as UserIcon,
  LogOut,
  Library
} from "lucide-react";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { id: orgId } = await params;

  // 1. Authenticate user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  // 2. Fetch organization details
  const dbOrg = await db.query("SELECT * FROM public.organizations WHERE id = $1", [orgId]);
  if (dbOrg.rows.length === 0) {
    redirect("/dashboard/organizations");
  }
  const org = dbOrg.rows[0];

  // 3. Fetch user membership details
  const dbMember = await db.query(
    "SELECT role, status FROM public.organization_members WHERE organization_id = $1 AND user_id = $2",
    [orgId, user.id]
  );

  const isOwner = org.owner_id === user.id;
  if (dbMember.rows.length === 0 && !isOwner) {
    redirect("/dashboard/organizations");
  }

  const role = isOwner ? "owner" : dbMember.rows[0]?.role || "viewer";
  const status = isOwner ? "active" : dbMember.rows[0]?.status || "active";

  // 4. Handle suspension screen
  if (status === "suspended") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-16.5 h-16.5 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-50">Membership Suspended</h1>
            <p className="text-sm text-zinc-400">
              Your access to the organization "{org.name}" has been suspended by an administrator. Please contact your organization owner.
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-800">
            <Link href="/dashboard/organizations">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9">
                Back to Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Sidebar Navigation Links filtered by Roles
  const navItems = [
    { href: `/dashboard/organizations/${orgId}/workspaces`, label: "Workspaces", icon: FolderOpen },
    { href: `/dashboard/organizations/${orgId}/team`, label: "Team Members", icon: Users },
    { href: `/dashboard/organizations/${orgId}/assets`, label: "Shared Library", icon: Library },
    {
      href: `/dashboard/organizations/${orgId}/recruiter`,
      label: "Recruiter Portal",
      icon: Briefcase,
      roles: ["owner", "admin", "manager", "recruiter", "hiring_manager"]
    },
    {
      href: `/dashboard/organizations/${orgId}/career-center`,
      label: "Career Center",
      icon: GraduationCap,
      roles: ["owner", "admin", "manager", "career_coach"]
    },
    {
      href: `/dashboard/organizations/${orgId}/analytics`,
      label: "Team Analytics",
      icon: TrendingUp,
      roles: ["owner", "admin", "manager"]
    },
    {
      href: `/dashboard/organizations/${orgId}/branding`,
      label: "Custom Branding",
      icon: Sliders,
      roles: ["owner", "admin"]
    },
    {
      href: `/dashboard/organizations/${orgId}/billing`,
      label: "Seats & Billing",
      icon: CreditCard,
      roles: ["owner", "admin", "manager"]
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-zinc-200 truncate max-w-[140px]" title={org.name}>
              {org.name}
            </h1>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider font-bold">ENTERPRISE HUB</p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Check roles access limits
            if (item.roles && !item.roles.includes(role)) {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-50 hover:bg-zinc-850/50 transition-all duration-200 group"
              >
                <item.icon className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Identity details */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-850 flex items-center justify-center text-zinc-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-zinc-300 truncate">{user.email}</p>
              <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-400 uppercase tracking-widest">
                {role.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/dashboard/organizations" className="w-full">
              <Button
                variant="outline"
                className="w-full h-8 text-[9px] font-bold border-zinc-800 hover:bg-zinc-800 hover:text-white"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Directory
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full">
              <Button
                variant="ghost"
                className="w-full h-8 text-[9px] font-bold text-zinc-400 hover:bg-zinc-800/40"
              >
                App Hub
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main workspace container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
              Organization Admin Console
            </span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 font-bold tracking-wide uppercase">
            Tiers: Premium Team
          </span>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
