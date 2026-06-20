"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Eye, HelpCircle, FileJson, Download } from "lucide-react";

interface AuditLogItem {
  id: string;
  actorId?: string | null;
  actorName?: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  ipAddress?: string | null;
  details: any;
  createdAt: string;
}

interface LogsClientProps {
  initialLogs: AuditLogItem[];
}

export default function LogsClient({ initialLogs }: LogsClientProps) {
  const [logs] = useState<AuditLogItem[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (log.actorName || "").toLowerCase().includes(term) ||
      (log.action || "").toLowerCase().includes(term) ||
      (log.targetType || "").toLowerCase().includes(term) ||
      (log.targetId || "").toLowerCase().includes(term) ||
      (log.ipAddress || "").toLowerCase().includes(term);
    return matchesSearch;
  });

  const activeLog = logs.find((l) => l.id === selectedLogId);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter audit logs by action, actor, target or IP address..."
            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 h-10 rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Table list pane */}
        <Card className="bg-zinc-900/30 border-zinc-800 overflow-hidden md:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/20 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target</th>
                  <th className="p-4 pr-6 text-right font-semibold">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-[11px] font-mono text-zinc-300">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-zinc-500 font-sans">
                      No matching audit log records.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isSelected = selectedLogId === log.id;
                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-zinc-900/10 cursor-pointer transition-colors ${
                          isSelected ? "bg-zinc-900/20" : ""
                        }`}
                        onClick={() => setSelectedLogId(log.id)}
                      >
                        <td className="p-4 pl-6 text-zinc-500 whitespace-nowrap font-sans">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-zinc-200 font-sans">
                          {log.actorName || "System Agent"}
                        </td>
                        <td className="p-4 font-bold text-indigo-400">
                          {log.action}
                        </td>
                        <td className="p-4 font-sans text-zinc-400">
                          <span className="font-semibold text-zinc-300">{log.targetType}</span>
                          <span className="block text-[9px] font-mono text-zinc-500">ID: {log.targetId || "N/A"}</span>
                        </td>
                        <td className="p-4 pr-6 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] h-7 px-2 font-bold hover:bg-zinc-800 text-zinc-400 hover:text-white"
                            onClick={() => setSelectedLogId(log.id)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Selected Log Inspector pane */}
        <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md p-5 md:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/80 pb-3">
            <FileJson className="w-4 h-4 text-zinc-500" />
            Audit Parameters Inspector
          </h3>

          {activeLog ? (
            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Event ID</span>
                <span className="text-[10px] text-zinc-300 font-mono block select-all">{activeLog.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Actor ID</span>
                  <span className="text-[10px] text-zinc-300 font-mono block truncate select-all">{activeLog.actorId || "N/A"}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider font-mono">IP Address</span>
                  <span className="text-[10px] text-zinc-300 font-mono block select-all">{activeLog.ipAddress || "Internal"}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-zinc-800/60">
                <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Context Details (JSON)</span>
                <pre className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-[10px] font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap select-all max-h-48 overflow-y-auto">
                  {JSON.stringify(activeLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-zinc-700" />
              <p className="font-mono">Select an audit log row to inspect transaction variables.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
