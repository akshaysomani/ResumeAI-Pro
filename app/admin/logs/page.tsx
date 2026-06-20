import React from "react";
import { getAdminLogsAction } from "@/app/actions/adminActions";
import LogsClient from "./logs-client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const revalidate = 0;

export default async function AdminLogsPage() {
  const logs = await getAdminLogsAction(100);

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            System Audit Trail
          </h2>
          <p className="text-sm text-zinc-400">
            Inspect platform modifications, suspension histories, security alerts, and roles transitions.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/reports/export?type=audit_logs&format=csv" download>
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/40 text-xs hover:bg-zinc-800 hover:text-white">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          </a>
          <a href="/api/admin/reports/export?type=audit_logs&format=pdf" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/40 text-xs hover:bg-zinc-800 hover:text-white">
              <Download className="w-3.5 h-3.5 mr-1" />
              Print PDF Report
            </Button>
          </a>
        </div>
      </div>

      <LogsClient initialLogs={logs} />
    </div>
  );
}
