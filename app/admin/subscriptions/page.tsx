import React from "react";
import { getAdminPlansAction, getAdminPaymentsAction } from "@/app/actions/adminActions";
import SubscriptionsClient from "./subscriptions-client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const revalidate = 0;

export default async function AdminSubscriptionsPage() {
  const plans = await getAdminPlansAction();
  const payments = await getAdminPaymentsAction();

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            Billing & Subscriptions
          </h2>
          <p className="text-sm text-zinc-400">
            Update pricing tiers, modify service parameters, inspect transactions, and process customer refunds.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/reports/export?type=payments&format=csv" download>
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/40 text-xs hover:bg-zinc-800 hover:text-white">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export CSV
            </Button>
          </a>
          <a href="/api/admin/reports/export?type=payments&format=pdf" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/40 text-xs hover:bg-zinc-800 hover:text-white">
              <Download className="w-3.5 h-3.5 mr-1" />
              Print PDF Report
            </Button>
          </a>
        </div>
      </div>

      <SubscriptionsClient initialPlans={plans} initialPayments={payments} />
    </div>
  );
}
