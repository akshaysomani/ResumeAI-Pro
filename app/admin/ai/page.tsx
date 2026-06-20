import React from "react";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Brain, Cpu, TrendingUp, AlertTriangle } from "lucide-react";

export const revalidate = 0;

export default async function AdminAIPage() {
  // Query 1: Overall aggregates
  const aggRes = await db.query(`
    SELECT 
      count(*)::integer as "totalRequests",
      coalesce(sum(tokens_used), 0)::integer as "totalTokens",
      coalesce(avg(tokens_used), 0)::integer as "avgTokens"
    FROM public.ai_generations
  `);
  const aggregates = aggRes.rows[0] || { totalRequests: 0, totalTokens: 0, avgTokens: 0 };

  // Query 2: Break down by Model Name
  const modelRes = await db.query(`
    SELECT 
      coalesce(model_name, 'Gemini-1.5-Pro') as model,
      count(*)::integer as count,
      coalesce(sum(tokens_used), 0)::integer as tokens
    FROM public.ai_generations
    GROUP BY model
    ORDER BY count DESC
  `);

  // Query 3: Break down by Action Type
  const typeRes = await db.query(`
    SELECT 
      generation_type as type,
      count(*)::integer as count,
      coalesce(sum(tokens_used), 0)::integer as tokens
    FROM public.ai_generations
    GROUP BY type
    ORDER BY count DESC
  `);

  // Query 4: Detailed logs list
  const logsRes = await db.query(`
    SELECT 
      g.id,
      g.generation_type as type,
      coalesce(g.model_name, 'Gemini-1.5-Pro') as model,
      g.tokens_used as tokens,
      g.prompt,
      g.created_at as "createdAt",
      p.email
    FROM public.ai_generations g
    LEFT JOIN public.profiles p ON g.user_id = p.id
    ORDER BY g.created_at DESC
    LIMIT 20
  `);

  // Estimate costs: assuming $0.0015 per 1k input/output tokens (Gemini 1.5 Pro blended rate)
  const estimatedCost = (aggregates.totalTokens / 1000) * 0.0015;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          AI Provider Analytics
        </h2>
        <p className="text-sm text-zinc-400">
          Monitor LLM token expenditures, model routing shares, cost diagnostics, and request volumes.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Requests</CardTitle>
            <Brain className="w-4.5 h-4.5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-50">{aggregates.totalRequests}</div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">Completed LLM requests</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tokens Spent</CardTitle>
            <Cpu className="w-4.5 h-4.5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-50">
              {aggregates.totalTokens.toLocaleString()}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">Cumulative model tokens</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Tokens / Call</CardTitle>
            <TrendingUp className="w-4.5 h-4.5 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-50">{aggregates.avgTokens}</div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">Average request token length</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Est. Provider Cost</CardTitle>
            <span className="text-emerald-500 text-xs font-bold">$ USD</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-50">
              ${estimatedCost.toFixed(4)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">Blended $0.0015 / 1k rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid splits */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Model Distribution */}
        <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur-md space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Model routing breakdown</h3>
          <div className="divide-y divide-zinc-800/80">
            {modelRes.rows.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 font-mono">No active model usage recorded.</p>
            ) : (
              modelRes.rows.map((row) => (
                <div key={row.model} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-zinc-200">{row.model}</span>
                    <span className="block text-[10px] text-zinc-500">{row.count} prompts handled</span>
                  </div>
                  <span className="font-mono text-zinc-400 font-bold">{row.tokens.toLocaleString()} tokens</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feature Category Distribution */}
        <div className="p-5 border border-zinc-800 rounded-2xl bg-zinc-900/40 backdrop-blur-md space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI prompt action categories</h3>
          <div className="divide-y divide-zinc-800/80">
            {typeRes.rows.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 font-mono">No categories queried yet.</p>
            ) : (
              typeRes.rows.map((row) => (
                <div key={row.type} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-zinc-200 capitalize">{row.type.replace(/_/g, " ")}</span>
                    <span className="block text-[10px] text-zinc-500">{row.count} actions executed</span>
                  </div>
                  <span className="font-mono text-zinc-400 font-bold">{row.tokens.toLocaleString()} tokens</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Logs Console Table */}
      <div className="border border-zinc-800 rounded-2xl bg-zinc-900/20 backdrop-blur-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-100">Live AI Provider Transaction Logs</h3>
          <p className="text-[11px] text-zinc-400">Chronological telemetry of prompts processed by target AI APIs.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/20 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Model</th>
                <th className="p-4 text-right">Tokens</th>
                <th className="p-4 pr-6">Prompt Context Snippet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              {logsRes.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500">No telemetry log entries found.</td>
                </tr>
              ) : (
                logsRes.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="p-4 pl-6 text-zinc-500 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-4 text-zinc-200">
                      {row.email || "system"}
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-800 text-zinc-400 uppercase">
                        {row.type}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 text-[11px]">
                      {row.model}
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-300">
                      {row.tokens || 0}
                    </td>
                    <td className="p-4 pr-6 text-zinc-500 truncate max-w-xs font-sans text-xs">
                      {row.prompt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
