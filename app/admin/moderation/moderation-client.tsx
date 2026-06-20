"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { moderateItemAction } from "@/app/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Trash2, ShieldAlert, FileText, User, MessageSquare } from "lucide-react";

interface ReportedItem {
  id: string;
  itemType: "resume" | "profile";
  itemId: string;
  itemTitle?: string;
  reporterId?: string | null;
  reporterEmail?: string;
  reason: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ModerationClientProps {
  initialReports: ReportedItem[];
}

export default function ModerationClient({ initialReports }: ModerationClientProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [reports, setReports] = useState<ReportedItem[]>(initialReports);

  // Notes state for selected report
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const handleModerate = async (reportId: string, action: "actioned" | "dismissed") => {
    if (!user) return;
    if (!adminNotes.trim()) {
      toastError("Please add admin review notes before actioning.");
      return;
    }

    try {
      await moderateItemAction(user.id, reportId, action, adminNotes);
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: action, adminNotes, updatedAt: new Date().toISOString() }
            : r
        )
      );
      setActiveReportId(null);
      setAdminNotes("");
      toastSuccess(`Report marked as ${action}`);
    } catch (err: any) {
      toastError(err.message || "Failed to moderate report");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {reports.length === 0 ? (
          <div className="border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs bg-zinc-900/10">
            No abuse or content reports in the queue. Everything is clean!
          </div>
        ) : (
          reports.map((report) => {
            const isPending = report.status === "pending";
            const isModerating = activeReportId === report.id;

            return (
              <Card
                key={report.id}
                className={`bg-zinc-900/35 border-zinc-800 overflow-hidden transition-all duration-200 ${
                  isPending ? "border-amber-500/20 hover:border-amber-500/40" : ""
                }`}
              >
                {/* Title and metadata header */}
                <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      report.itemType === "resume" ? "bg-indigo-500/10 text-indigo-400" : "bg-teal-500/10 text-teal-400"
                    }`}>
                      {report.itemType === "resume" ? <FileText className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 capitalize">
                        Reported {report.itemType}: {report.itemTitle || "Untitled Item"}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Item ID: {report.itemId} | Report ID: {report.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge */}
                    {report.status === "pending" ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 uppercase tracking-wider animate-pulse">
                        PENDING REVIEW
                      </span>
                    ) : report.status === "actioned" ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/10 text-red-400 uppercase tracking-wider">
                        ACTIONED / BANNED
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                        DISMISSED
                      </span>
                    )}
                  </div>
                </div>

                {/* Content body */}
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Report Reason */}
                    <div className="space-y-1.5 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/80">
                      <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Report Details</span>
                      <p className="text-zinc-300 font-medium flex items-start gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        {report.reason}
                      </p>
                      <div className="text-[10px] text-zinc-500 mt-2 font-mono">
                        Reporter: {report.reporterEmail || "Anonymous User"}
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono">
                        Logged: {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Admin Actions details */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Review Resolution</span>
                      {isPending ? (
                        isModerating ? (
                          <div className="space-y-3">
                            <Input
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Enter audit remarks or actions justification..."
                              className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold h-8 text-white"
                                onClick={() => handleModerate(report.id, "dismissed")}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Dismiss Report
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                className="bg-red-600 hover:bg-red-500 text-[10px] font-bold h-8 text-white"
                                onClick={() => handleModerate(report.id, "actioned")}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Take Action / Ban
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[10px] h-8 text-zinc-500 hover:text-white"
                                onClick={() => {
                                  setActiveReportId(null);
                                  setAdminNotes("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white h-8"
                            onClick={() => {
                              setActiveReportId(report.id);
                              setAdminNotes(report.adminNotes || "");
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                            Write Audit Notes & Moderate
                          </Button>
                        )
                      ) : (
                        <div className="bg-zinc-950/20 p-4 rounded-xl border border-zinc-800/80 text-zinc-400">
                          <p className="italic">"{report.adminNotes || "No notes logged by administrator."}"</p>
                          <span className="block text-[9px] text-zinc-500 mt-2 font-mono">
                            Reviewed: {new Date(report.updatedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
