"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { createInterviewSessionAction, getUserPlan, getInterviewHistoryAction } from "@/app/actions/intelligenceActions";
import { queryResumesAction } from "@/app/actions/resumeActions";
import { 
  Video, 
  Calendar, 
  ChevronRight, 
  Plus, 
  Settings2, 
  Crown, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import type { InterviewSession, Resume } from "@/types";

export default function MockInterviewPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Configuration Form State
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [targetCompany, setTargetCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [interviewType, setInterviewType] = useState("technical");
  const [interviewMode, setInterviewMode] = useState("practice");
  const [duration, setDuration] = useState(30);
  const [questionCount, setQuestionCount] = useState(5);
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check plan
        const userPlan = await getUserPlan(user.id);
        setPlan(userPlan);

        // Load previous sessions via Server Action
        const sessionsData = await getInterviewHistoryAction(user.id);
        if (sessionsData) {
          setSessions(sessionsData);
        }

        // Load resumes for mapping via Server Action
        const resumesData = await queryResumesAction({ userId: user.id });
        if (resumesData && Array.isArray(resumesData)) {
          setResumes(resumesData as any);
          if (resumesData.length > 0) {
            setSelectedResumeId(resumesData[0].id);
          }
        }
      } catch (err: any) {
        console.error("Error loading interview console data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Adjust parameters when switching types / difficulty on Free plan
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (plan === "free" && ["system_design", "coding"].includes(val)) {
      setErrorMsg("Coding and System Design interviews are premium Pro features.");
      return;
    }
    setErrorMsg("");
    setInterviewType(val);
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (plan === "free" && ["timed", "rapid_fire"].includes(val)) {
      setErrorMsg("Timed and Rapid Fire modes are premium Pro features.");
      return;
    }
    setErrorMsg("");
    setInterviewMode(val);
  };

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (plan === "free" && val > 5) {
      setErrorMsg("Free plan is capped at 5 questions per session.");
      setQuestionCount(5);
      return;
    }
    setErrorMsg("");
    setQuestionCount(val || 5);
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg("");
    setSubmitting(true);

    try {
      // Free plan check: max 10 sessions total
      if (plan === "free" && sessions.length >= 10) {
        setErrorMsg("Free plan limit reached (max 10 interview sessions). Upgrade to Pro for unlimited prep.");
        setSubmitting(false);
        return;
      }

      const session = await createInterviewSessionAction({
        userId: user.id,
        resumeId: selectedResumeId || null,
        jobRole,
        targetCompany,
        experienceLevel,
        difficulty,
        interviewType,
        interviewMode,
        duration,
        questionCount,
        preferredLanguage
      });

      // Redirect to the interview workspace
      window.location.href = `/dashboard/interview/${session.id}`;
    } catch (err: any) {
      console.error("Failed to start session:", err);
      setErrorMsg(err.message || "An error occurred starting the interview.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-900/10 via-zinc-950/10 to-transparent border border-emerald-500/10 dark:from-emerald-950/20 dark:via-zinc-950/20 dark:border-emerald-500/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              AI Mock Interview Prep
            </h2>
            {plan === "pro" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                <Crown className="h-3 w-3 fill-amber-500" /> Pro active
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Rehearse interactive HR, Technical, and System Design questions tailored to your resume.
          </p>
        </div>
        <Button onClick={() => setIsConfigOpen(!isConfigOpen)} className="shrink-0 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white">
          <Plus className="mr-1.5 h-4 w-4" /> Start Practice Run
        </Button>
      </div>

      {/* Config Drawer / Modal Form */}
      {isConfigOpen && (
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-md font-bold">
                  <Settings2 className="h-4.5 w-4.5 text-emerald-500" /> Configure Practice Session
                </CardTitle>
                <CardDescription className="text-xs">
                  Provide company and role context to generate personalized questions.
                </CardDescription>
              </div>
              {plan === "free" && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <Crown className="h-3.5 w-3.5 fill-amber-600 dark:fill-amber-400" /> Free Plan limits active
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartSession} className="space-y-6">
              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Target Job Role</label>
                  <Input 
                    value={jobRole} 
                    onChange={(e) => setJobRole(e.target.value)} 
                    placeholder="e.g. Senior Frontend Engineer" 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Target Company (Optional)</label>
                  <Input 
                    value={targetCompany} 
                    onChange={(e) => setTargetCompany(e.target.value)} 
                    placeholder="e.g. Stripe, Google, Acme Inc" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Resume Context</label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full text-sm rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">No Resume (General Questions)</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full text-sm rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="beginner">Entry Level / Junior</option>
                    <option value="intermediate">Mid-Level</option>
                    <option value="advanced">Senior / Lead</option>
                    <option value="expert">Principal / Director</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-sm rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="beginner">Beginner (Basic HR/Conversational)</option>
                    <option value="intermediate">Intermediate (Standard Tech/Role specific)</option>
                    <option value="advanced">Advanced (Deep Architectural & Edge-cases)</option>
                    <option value="expert">Expert (Stress test & Complex systems)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={handleTypeChange}
                    className="w-full text-sm rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="hr">HR & Culture Fit Interview</option>
                    <option value="behavioral">Behavioral (STAR method target)</option>
                    <option value="technical">Technical / Coding Concepts</option>
                    <option value="leadership">Leadership & Stakeholders</option>
                    <option value="managerial">Managerial & Organization</option>
                    <option value="system_design">System Design (Architecture) {plan === "free" ? "👑" : ""}</option>
                    <option value="coding">Coding Sandbox generation {plan === "free" ? "👑" : ""}</option>
                    <option value="case_study">Case Study analysis</option>
                    <option value="group_discussion">Group Discussion prep</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Interview Mode</label>
                  <select
                    value={interviewMode}
                    onChange={handleModeChange}
                    className="w-full text-sm rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="practice">Practice Mode (Self-paced, immediate evaluate)</option>
                    <option value="timed">Timed Interview (Overall clock countdown) {plan === "free" ? "👑" : ""}</option>
                    <option value="rapid_fire">Rapid Fire Round (Short answers, high pressure) {plan === "free" ? "👑" : ""}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Question Count</label>
                  <Input 
                    type="number" 
                    min={3} 
                    max={15} 
                    value={questionCount} 
                    onChange={handleQuestionCountChange} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Preferred Language</label>
                  <Input 
                    value={preferredLanguage} 
                    onChange={(e) => setPreferredLanguage(e.target.value)} 
                    placeholder="e.g. English, Español" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <Button type="button" variant="ghost" onClick={() => setIsConfigOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  {submitting ? "Initializing AI Prompts..." : "Launch Interview Console"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History Grid */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50">
          Previous Interview Runs
        </h3>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No Interviews Logged"
            description="You haven't run any mock sessions yet. Start a run to calibrate your technical skills and STAR response style."
            actionText="Practice Now"
            onAction={() => setIsConfigOpen(true)}
          />
        ) : (
          <div className="grid gap-3">
            {sessions.map((s) => {
              const isCompleted = s.status === "completed";
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-50">
                        {s.jobRole} {s.targetCompany ? `at ${s.targetCompany}` : ""}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {new Date(s.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{s.interviewType}</span>
                        <span>•</span>
                        <span className="capitalize">{s.difficulty} difficulty</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isCompleted ? (
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {s.overallScore !== null ? `${s.overallScore}%` : "N/A"}
                        </div>
                        <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">STAR score</div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
                        In Progress
                      </span>
                    )}
                    <Link href={`/dashboard/interview/${s.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
