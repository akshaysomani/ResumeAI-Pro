"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  FolderOpen,
  Users,
  Brain,
  FileText,
  DollarSign,
  Award
} from "lucide-react";

interface WorkspaceData {
  id: string;
  name: string;
  type: string;
  count: number;
}

interface AIUsageData {
  type: string;
  total: number;
}

interface PlacementData {
  companyName: string;
  jobRole: string;
  packageLpa: number;
  studentName: string;
}

interface AnalyticsClientProps {
  orgId: string;
  role: string;
  totalResumes: number;
  totalMembers: number;
  workspacesData: WorkspaceData[];
  aiUsageData: AIUsageData[];
  placementsData: PlacementData[];
}

export default function AnalyticsClient({
  orgId,
  role,
  totalResumes,
  totalMembers,
  workspacesData,
  aiUsageData,
  placementsData
}: AnalyticsClientProps) {
  
  // Calculate total AI calls
  const totalAICalls = aiUsageData.reduce((acc, u) => acc + u.total, 0);

  // SVG dimensions & calculations for Workspace Bar Chart
  const barChartWidth = 500;
  const barChartHeight = 220;
  const maxResumeCount = Math.max(...workspacesData.map((w) => w.count), 5);

  // Donut chart calculations
  const donutColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"];
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">Team & Workspace Analytics</h2>
          <p className="text-xs text-zinc-400">Monitor document volumes, student placement compensation, and AI credit expenditures.</p>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900/35 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Workspaces</span>
              <p className="text-2xl font-bold text-zinc-200">{workspacesData.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/35 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Active Resumes</span>
              <p className="text-2xl font-bold text-zinc-200">{totalResumes}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/35 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Team Seats Used</span>
              <p className="text-2xl font-bold text-zinc-200">{totalMembers}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/35 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">AI Requests</span>
              <p className="text-2xl font-bold text-zinc-200">{totalAICalls}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Brain className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Split */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Workspace Resumes Count (Bar Chart) */}
        <Card className="bg-zinc-900/25 border-zinc-800">
          <CardHeader className="p-5 border-b border-zinc-800/80">
            <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              Resumes per Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex justify-center">
            {workspacesData.length === 0 ? (
              <div className="py-12 text-xs text-zinc-600 italic">No workspace data</div>
            ) : (
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} className="w-full h-auto">
                  {/* Grid Lines */}
                  {Array.from({ length: 5 }).map((_, i) => {
                    const y = 30 + (i * 130) / 4;
                    const val = Math.round(maxResumeCount - (i * maxResumeCount) / 4);
                    return (
                      <g key={i}>
                        <line x1="40" y1={y} x2="480" y2={y} stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="30" y={y + 4} fill="#52525b" fontSize="10" textAnchor="end" fontFamily="monospace">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars */}
                  {workspacesData.map((ws, i) => {
                    const barWidth = 35;
                    const spacing = (440 - workspacesData.length * barWidth) / (workspacesData.length + 1);
                    const x = 50 + spacing + i * (barWidth + spacing);
                    const height = (ws.count / maxResumeCount) * 130;
                    const y = 160 - height;

                    return (
                      <g key={ws.id} className="group">
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          fill="url(#indigoGrad)"
                          rx="4"
                          className="transition-all duration-300 hover:opacity-80"
                        />
                        {/* Tooltip */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          fill="#a5b4fc"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {ws.count}
                        </text>
                        {/* Label */}
                        <text
                          x={x + barWidth / 2}
                          y="180"
                          fill="#a1a1aa"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          transform={`rotate(-15, ${x + barWidth / 2}, 180)`}
                        >
                          {ws.name.length > 8 ? `${ws.name.substring(0, 8)}...` : ws.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Usage Breakdown (Donut Chart) */}
        <Card className="bg-zinc-900/25 border-zinc-800">
          <CardHeader className="p-5 border-b border-zinc-800/80">
            <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-emerald-400" />
              AI Credits Expenditure Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col md:flex-row items-center gap-6 justify-center">
            {aiUsageData.length === 0 ? (
              <div className="py-12 text-xs text-zinc-650 italic">No AI credits log cataloged.</div>
            ) : (
              <>
                {/* SVG Donut */}
                <div className="w-40 h-40 shrink-0">
                  <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full rotate-90">
                    {aiUsageData.map((usage, index) => {
                      const percent = usage.total / totalAICalls;
                      const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                      cumulativePercent += percent;
                      const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                      const largeArcFlag = percent > 0.5 ? 1 : 0;
                      const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L 0 0`
                      ].join(" ");

                      return (
                        <path
                          key={usage.type}
                          d={pathData}
                          fill={donutColors[index % donutColors.length]}
                          className="transition-all hover:scale-105 origin-center duration-300"
                        />
                      );
                    })}
                    {/* Inner hole */}
                    <circle cx="0" cy="0" r="0.6" fill="#09090b" />
                  </svg>
                </div>

                {/* Donut Legend */}
                <div className="space-y-2 flex-1">
                  {aiUsageData.map((usage, index) => (
                    <div key={usage.type} className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: donutColors[index % donutColors.length] }}
                        />
                        <span className="font-semibold text-zinc-300 truncate max-w-[140px] uppercase text-[10px] font-mono">
                          {usage.type.replace("_", " ")}
                        </span>
                      </div>
                      <span className="font-bold text-zinc-100 font-mono">
                        {usage.total} ({((usage.total / totalAICalls) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Salary compensation leaderboard */}
      <Card className="bg-zinc-900/25 border-zinc-800">
        <CardHeader className="p-5 border-b border-zinc-800/80">
          <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            Top Placed Packages LPA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {placementsData.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-650 italic">
              No placement records logged to build salary rankings.
            </div>
          ) : (
            <div className="space-y-4">
              {placementsData.map((placement, i) => {
                const maxLpa = Math.max(...placementsData.map((p) => p.packageLpa), 20);
                const pct = (placement.packageLpa / maxLpa) * 100;
                
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-zinc-200">{placement.studentName}</span>
                        <span className="text-zinc-550 ml-1.5 font-mono">({placement.jobRole} at {placement.companyName})</span>
                      </div>
                      <span className="font-bold text-indigo-400 font-mono">{placement.packageLpa} LPA</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
