"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { queryResumesAction } from "@/app/actions/resumeActions";
import {
  getInterviewHistoryAction,
  getGoalsAction,
  getSalaryReportsAction,
} from "@/app/actions/intelligenceActions";
import {
  FileText,
  Sparkles,
  Target,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Video,
  CheckSquare,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import type { Resume } from "@/types";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState({ used: 0, limit: 5 });
  const [avgInterviewScore, setAvgInterviewScore] = useState<number | null>(null);
  const [activeGoalCount, setActiveGoalCount] = useState<number>(0);
  const [avgGoalProgress, setAvgGoalProgress] = useState<number>(0);
  const [latestSalary, setLatestSalary] = useState<{ role: string; median: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch resumes from PostgreSQL
        const data = await queryResumesAction({
          userId: user.id,
          limit: 3,
          sortBy: "updated_at",
          sortOrder: "desc",
          filterStatus: "all"
        });

        if (data) {
          setResumes(
            data.map((r: any) => ({
              id: r.id,
              userId: r.userId,
              title: r.title,
              description: r.description,
              templateId: r.templateId,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              isPublic: r.isPublic,
              atsScore: r.atsScore || 72,
              sections: [],
              status: (r.status as any) || "draft",
              isFavorite: r.isFavorite || false,
              isArchived: r.isArchived || false,
              colorTheme: r.colorTheme || "indigo",
              fontFamily: r.fontFamily || "sans",
              paperSize: r.paperSize || "A4",
              pageMargin: r.pageMargin || "normal",
              layoutStyle: r.layoutStyle || "single-column",
              resumeType: r.resumeType || "custom",
            }))
          );
        }

        // Fetch AI usage details via API
        try {
          const usageRes = await fetch("/api/ai/usage");
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            setCredits({ used: usageData.count, limit: usageData.limit });
          }
        } catch (usageErr) {
          console.warn("Could not fetch AI usage:", usageErr);
        }

        // Fetch Mock Interview statistics from PostgreSQL
        const interviewData = await getInterviewHistoryAction(user.id);
        if (interviewData && interviewData.length > 0) {
          const completed = interviewData.filter((i: any) => i.status === "completed" && i.overallScore !== null);
          if (completed.length > 0) {
            const avg = Math.round(completed.reduce((acc: number, curr: any) => acc + (curr.overallScore || 0), 0) / completed.length);
            setAvgInterviewScore(avg);
          }
        }

        // Fetch Goals details from PostgreSQL
        const goalData = await getGoalsAction(user.id);
        if (goalData) {
          const active = goalData.filter((g: any) => g.status === "active");
          setActiveGoalCount(active.length);
          if (active.length > 0) {
            const avgProg = Math.round(active.reduce((acc: number, curr: any) => acc + (curr.progress || 0), 0) / active.length);
            setAvgGoalProgress(avgProg);
          }
        }

        // Fetch Salary report details from PostgreSQL
        const salaryData = await getSalaryReportsAction(user.id);
        if (salaryData && salaryData.length > 0) {
          setLatestSalary({
            role: salaryData[0].role,
            median: salaryData[0].rangeMedian || 0
          });
        }
      } catch (err) {
        console.warn("Could not retrieve dashboard tables, showing offline layout:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleCreateResume = () => {
    // Redirects to editor to create a new resume
    window.location.href = `/dashboard/editor?new=true`;
  };

  const averageAts = resumes.length
    ? Math.round(resumes.reduce((acc, curr) => acc + (curr.atsScore || 0), 0) / resumes.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-indigo-900/5 to-transparent border border-indigo-500/10 dark:from-indigo-950/20 dark:via-indigo-950/10 dark:border-indigo-500/20">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {profile?.fullName?.split(" ")[0] || "there"} 👋
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Let's build your next ATS-ready resume and land your dream role.
          </p>
        </div>
        <Button onClick={handleCreateResume} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Create New Resume
        </Button>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total Resumes
            </CardTitle>
            <FileText className="h-4.5 w-4.5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{resumes.length}</div>
            )}
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Active documents in workspace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Average ATS Score
            </CardTitle>
            <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {averageAts > 0 ? `${averageAts}%` : "N/A"}
              </div>
            )}
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Target for recruiters: 75%+
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              AI Mock Interview Score
            </CardTitle>
            <Video className="h-4.5 w-4.5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {avgInterviewScore !== null ? `${avgInterviewScore}%` : "N/A"}
              </div>
            )}
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Ready index of active interview preps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Active Career Goals
            </CardTitle>
            <CheckSquare className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {activeGoalCount} ({avgGoalProgress}% avg)
              </div>
            )}
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Tracked milestones completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid split */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Resumes */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50">
              Recent Resumes
            </h3>
            {resumes.length > 0 && (
              <Link
                href="/dashboard/resumes"
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400 font-medium flex items-center"
              >
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : resumes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Resumes Yet"
              description="Start building your resume with our guided forms or AI generator."
              actionText="Create Resume"
              onAction={handleCreateResume}
            />
          ) : (
            <div className="grid gap-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-50">
                        {resume.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Last edited: {new Date(resume.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                        ATS: {resume.atsScore}%
                      </div>
                      <div className="text-[10px] text-zinc-400">Score Rating</div>
                    </div>
                    <Link href={`/dashboard/editor?id=${resume.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Quick Actions Panel */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50">
            Quick Tools
          </h3>
          <div className="space-y-3">
            <Link href="/dashboard/job-matcher" className="block">
              <Card className="hover:border-indigo-500/30 transition-all dark:hover:border-indigo-400/30">
                <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Target className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">ATS Job Matcher</CardTitle>
                    <CardDescription className="text-[11px]">
                      Check how your resume fits a JD
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Paste any job description to parse match score, find missing skills, and generate alignment tips.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/ai-assistant" className="block">
              <Card className="hover:border-amber-500/30 transition-all dark:hover:border-amber-400/30">
                <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">AI Assistant</CardTitle>
                    <CardDescription className="text-[11px]">
                      Optimise your bullet points
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Generate professional summary copy, bullet points, or project descriptions instantly with our editor AI.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/coach" className="block">
              <Card className="hover:border-indigo-500/30 transition-all dark:hover:border-indigo-400/30">
                <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">AI Career Coach</CardTitle>
                    <CardDescription className="text-[11px]">
                      Chat with career mentors
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    {latestSalary ? `Salary Benchmark: $${(latestSalary.median / 1000).toFixed(0)}k median for ${latestSalary.role}. ` : ""}
                    Get promotion playbooks, custom roadmaps, and salary negotiation guides.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/interview" className="block">
              <Card className="hover:border-emerald-500/30 transition-all dark:hover:border-emerald-400/30">
                <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Video className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Mock Interview Console</CardTitle>
                    <CardDescription className="text-[11px]">
                      HR, behavioral & tech prep
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Practice timed questions, outline system design specs, and check your STAR scores.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
