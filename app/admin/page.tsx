import React from "react";
import { getAdminDashboardStatsAction, getAdminLogsAction } from "@/app/actions/adminActions";
import { SVGLineChart, SVGBarChart } from "@/components/admin/charts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CreditCard,
  FileText,
  Brain,
  LifeBuoy,
  ShieldAlert,
  TrendingUp,
  Activity,
  History,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Disable caching to fetch live data

export default async function AdminDashboardPage() {
  // Fetch dashboard data
  const stats = await getAdminDashboardStatsAction();
  const logs = await getAdminLogsAction(5);

  // Format currency numbers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Time Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            Operations Telemetry
          </h2>
          <p className="text-sm text-zinc-400">
            Real-time analytics, user subscriptions, support queues, and platform health metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/logs">
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/40 text-xs hover:bg-zinc-800 hover:text-white">
              <History className="w-3.5 h-3.5 mr-1" />
              Audit Logs
            </Button>
          </Link>
          <Link href="/admin/health">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white">
              <Activity className="w-3.5 h-3.5 mr-1" />
              System Status
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Core KPIs */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900/30 border-zinc-800 backdrop-blur-md relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Users</CardTitle>
            <Users className="w-4.5 h-4.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-50">{stats.totalUsers}</div>
            <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
              <span className="text-emerald-400 font-bold font-mono">+{stats.proUsers}</span>
              <span>Pro active subscribers</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800 backdrop-blur-md relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">MRR / ARR</CardTitle>
            <CreditCard className="w-4.5 h-4.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-50">{formatCurrency(stats.mrr)}</div>
            <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
              <span>ARR:</span>
              <span className="font-semibold font-mono text-zinc-300">{formatCurrency(stats.arr)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800 backdrop-blur-md relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Resumes Created</CardTitle>
            <FileText className="w-4.5 h-4.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-50">{stats.totalResumes}</div>
            <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
              <span>AI generations count:</span>
              <span className="font-mono text-zinc-300">{stats.aiGenerationsCount}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/30 border-zinc-800 backdrop-blur-md relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pending Queues</CardTitle>
            <ShieldAlert className="w-4.5 h-4.5 text-zinc-500 group-hover:text-rose-400 transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-50">
              {stats.pendingReports} / {stats.openTickets}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 flex items-center gap-1">
              <span>Abuse reports / Open support tickets</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <SVGLineChart data={stats.registrationsChart} title="Daily Registrations" color="indigo" />
        <SVGBarChart data={stats.resumesChart} title="Resumes Built" color="emerald" />
        <SVGLineChart data={stats.aiTokensChart} title="AI Tokens Spent" color="amber" />
        
        {/* plan distribution stats */}
        <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Subscription Share</h4>
            <p className="text-xs text-zinc-500">Distribution of active tier accounts across the platform.</p>
          </div>
          <div className="my-4 space-y-3.5">
            {stats.planDistribution.length === 0 ? (
              <div className="text-xs text-zinc-500 py-4 text-center">No subscriptions active in DB.</div>
            ) : (
              stats.planDistribution.map((item, index) => {
                const colors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500"];
                const color = colors[index % colors.length];
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300 capitalize">{item.name} Plan</span>
                      <span className="font-mono text-zinc-400">{item.count} users</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`${color} h-full rounded-full`}
                        style={{ width: `${Math.min((item.count / Math.max(stats.proUsers, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>Total active subscribers:</span>
            <span>{stats.proUsers}</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Quick View */}
      <div className="border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Recent Admin Activities</h3>
            <p className="text-[11px] text-zinc-400">Live operational events performed by managers & system administrators.</p>
          </div>
          <Link href="/admin/logs">
            <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800/30">
              View Audit trail
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {logs.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 font-mono">No administrative events recorded yet.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-zinc-900/10 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-300">
                      {log.actorName || "System Agent"}
                    </span>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-800 text-zinc-400 font-mono uppercase">
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Modified <strong className="text-zinc-300">{log.targetType}</strong> id: <span className="font-mono">{log.targetId || "N/A"}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono">
                    IP: {log.ipAddress || "Internal"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
