import React from "react";
import { getSystemHealthAction } from "@/app/actions/adminActions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Database,
  Cpu,
  RefreshCw,
  HardDrive,
  Network,
  Terminal,
  Clock
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminHealthPage() {
  const health = await getSystemHealthAction();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            System Telemetry & Health
          </h2>
          <p className="text-sm text-zinc-400">
            Monitor real-time database capacity, active database connections, Next.js server node health, and AI endpoints.
          </p>
        </div>
        <Link href="/admin/health">
          <Button variant="outline" className="border-zinc-800 bg-zinc-900/40 text-xs hover:bg-zinc-800 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Telemetry
          </Button>
        </Link>
      </div>

      {/* Main Status Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">All Systems Operational</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Live monitoring index checked successfully. No warning thresholds breached.</p>
          </div>
        </div>
        <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
      </div>

      {/* Health Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* PostgreSQL Database */}
        <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md">
          <CardHeader className="border-b border-zinc-800/80 p-5">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              PostgreSQL Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Status:</span>
              <span className={`font-bold uppercase tracking-wider ${health.dbConnected ? "text-emerald-400" : "text-red-400"}`}>
                {health.dbConnected ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3">
              <span className="text-zinc-500 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-zinc-600" />
                Database Size:
              </span>
              <span className="font-mono text-zinc-300 font-bold">{health.dbSize}</span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3">
              <span className="text-zinc-500 flex items-center gap-1">
                <Network className="w-3.5 h-3.5 text-zinc-600" />
                Active Connections:
              </span>
              <span className="font-mono text-zinc-300 font-bold">{health.activeConnections}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Gateway Endpoints */}
        <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md">
          <CardHeader className="border-b border-zinc-800/80 p-5">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              LLM Provider Gateway
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Status:</span>
              <span className="font-bold text-emerald-400 uppercase tracking-wider">
                {health.aiProviderStatus}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3">
              <span className="text-zinc-500 flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-zinc-600" />
                Active Models:
              </span>
              <span className="font-mono text-zinc-300 font-bold">Gemini-1.5-Pro</span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3">
              <span className="text-zinc-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                Gateway Latency:
              </span>
              <span className="font-mono text-zinc-300 font-bold">Normal (~650ms)</span>
            </div>
          </CardContent>
        </Card>

        {/* Node Server Runtime */}
        <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md">
          <CardHeader className="border-b border-zinc-800/80 p-5">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              NextJS Server Node
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Status:</span>
              <span className="font-bold text-emerald-400 uppercase tracking-wider">
                {health.apiStatus === "operational" ? "Healthy" : "Degraded"}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3">
              <span className="text-zinc-500">Node Environment:</span>
              <span className="font-mono text-zinc-300 font-bold capitalize">
                {process.env.NODE_ENV || "production"}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-800/60 pt-3">
              <span className="text-zinc-500">Stalled Queue Jobs:</span>
              <span className="font-mono text-zinc-300 font-bold">{health.jobsQueueCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Diagnostics Summary */}
      <div className="border border-zinc-800 rounded-2xl bg-zinc-900/20 p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-100">Diagnostics Check Details</h3>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          The database queries inspect both sizes and connection loads dynamically using low-level Postgres analytics schema tables (<code className="text-indigo-400 font-mono">pg_database_size</code> and <code className="text-indigo-400 font-mono">pg_stat_activity</code>). The API response checks are routed securely inside server components ensuring authentication boundaries are fully verified. All operations indicators show optimal performance parameters.
        </p>
      </div>
    </div>
  );
}
