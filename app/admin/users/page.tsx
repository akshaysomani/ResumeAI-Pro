import React from "react";
import { getAdminUsersAction } from "@/app/actions/adminActions";
import UsersClient from "./users-client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const users = await getAdminUsersAction();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            User Directory & Roles
          </h2>
          <p className="text-sm text-zinc-400">
            Manage system users, change organizational roles, suspend accounts, and view user metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/reports/export?type=users&format=csv" download>
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/40 text-xs hover:bg-zinc-800 hover:text-white">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          </a>
          <a href="/api/admin/reports/export?type=users&format=pdf" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/40 text-xs hover:bg-zinc-800 hover:text-white">
              <Download className="w-3.5 h-3.5 mr-1" />
              Print PDF Report
            </Button>
          </a>
        </div>
      </div>
      <UsersClient initialUsers={users} />
    </div>
  );
}
