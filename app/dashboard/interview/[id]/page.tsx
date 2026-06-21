"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  getInterviewSessionAction, 
  completeInterviewSessionAction, 
  getUserPlan 
} from "@/app/actions/intelligenceActions";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Play, 
  Sparkles, 
  Award, 
  HelpCircle, 
  AlertCircle, 
  BookOpen, 
  Crown 
} from "lucide-react";
import type { InterviewSession, InterviewQuestion } from "@/types";

export default function InterviewSessionWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const { user } = useAuth();
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<"free" | "pro">("free");

  // Active answer text and evaluation logs
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [evalStreamText, setEvalStreamText] = useState("");
  const [timer, setTimer] = useState(1800); // 30 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load Session and Questions
  useEffect(() => {
    if (!user) return;

    const loadSession = async () => {
      try {
        setLoading(true);
        const userPlan = await getUserPlan(user.id);
        setPlan(userPlan);

        const data = await getInterviewSessionAction(sessionId, user.id);
        if (data) {
          setSession(data.session);
          setQuestions(data.questions);
          setTimer(data.session.duration * 60);

          // Find first unanswered question or set activeIndex
          const unansweredIdx = data.questions.findIndex((q) => !q.userAnswer);
          if (unansweredIdx !== -1) {
            setActiveIndex(unansweredIdx);
          } else if (data.questions.length > 0) {
            setActiveIndex(data.questions.length - 1);
          }

          // Start timer for timed mode
          if (data.session.interviewMode === "timed" && data.session.status !== "completed") {
            setIsTimerRunning(true);
          }
        }
      } catch (err) {
        console.error("Failed to load interview session:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, user]);

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleFinishInterview(); // Auto finish on timeout
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // Helper to generate a question using streaming
  const handleGenerateNextQuestion = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      const response = await fetch("/api/intelligence/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const questionId = response.headers.get("X-Question-Id") || "temp-id";

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let questionText = "";

      // We append a temporary placeholder question while streaming
      setQuestions((prev) => [
        ...prev,
        {
          id: questionId,
          sessionId,
          questionText: "AI is crafting question...",
          category: session?.interviewType || "general",
          missedPoints: [],
          createdAt: new Date().toISOString()
        }
      ]);
      setActiveIndex(questions.length);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        questionText += chunk;

        setQuestions((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            last.questionText = questionText;
          }
          return updated;
        });
      }

      // Reload fresh data from database to capture persisted question details
      const freshData = await getInterviewSessionAction(sessionId, user!.id);
      if (freshData) {
        setQuestions(freshData.questions);
        const unansweredIdx = freshData.questions.findIndex((q) => !q.userAnswer);
        if (unansweredIdx !== -1) {
          setActiveIndex(unansweredIdx);
        } else {
          setActiveIndex(freshData.questions.length - 1);
        }
      }
    } catch (err) {
      console.error("Failed to generate question:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Helper to evaluate answer using streaming
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || evaluating) return;
    setEvaluating(true);
    setEvalStreamText("");

    const activeQuestion = questions[activeIndex];
    try {
      const response = await fetch("/api/intelligence/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: activeQuestion.id, userAnswer })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setEvalStreamText(accumulatedText);
      }

      // Sync data back to state
      const freshData = await getInterviewSessionAction(sessionId, user!.id);
      if (freshData) {
        setQuestions(freshData.questions);
        setUserAnswer("");
        setEvalStreamText("");
      }
    } catch (err) {
      console.error("Failed to evaluate answer:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!session || !user) return;

    // Calculate averages
    const evaluatedQs = questions.filter((q) => q.overallScore !== undefined && q.overallScore !== null);
    if (evaluatedQs.length === 0) {
      alert("Please submit answers to questions before finishing.");
      return;
    }

    const overall = Math.round(evaluatedQs.reduce((acc, q) => acc + (q.overallScore || 0), 0) / evaluatedQs.length);
    const clarity = Math.round(evaluatedQs.reduce((acc, q) => acc + (q.clarityScore || 0), 0) / evaluatedQs.length);
    const confidence = Math.round(evaluatedQs.reduce((acc, q) => acc + (q.confidenceScore || 0), 0) / evaluatedQs.length);
    const relevance = Math.round(evaluatedQs.reduce((acc, q) => acc + (q.relevanceScore || 0), 0) / evaluatedQs.length);
    const technical = Math.round(evaluatedQs.reduce((acc, q) => acc + (q.technicalScore || 0), 0) / evaluatedQs.length);

    setIsTimerRunning(false);
    setLoading(true);

    try {
      await completeInterviewSessionAction(sessionId, user.id, {
        overallScore: overall,
        communicationScore: clarity,
        technicalScore: technical,
        confidenceScore: confidence,
        leadershipScore: Math.round((relevance + clarity) / 2),
        problemSolvingScore: relevance,
        cultureFitScore: Math.round((confidence + relevance) / 2),
        roleReadinessScore: overall,
        generalFeedback: "Congratulations on completing the interview! Read your scorecard breakdown on the right.",
        strengths: ["Clear communication", "Relevant examples mapping to resume credentials"],
        weaknesses: ["Areas of technical gaps highlighted in individual questions"],
        suggestedImprovements: ["Structure answers using STAR (Situation, Task, Action, Result) methodology"]
      });

      const freshData = await getInterviewSessionAction(sessionId, user.id);
      if (freshData) {
        setSession(freshData.session);
        setQuestions(freshData.questions);
      }
    } catch (err) {
      console.error("Error completing session:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-semibold text-zinc-500">Retrieving interview workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8">
        <EmptyState
          icon={AlertCircle}
          title="Interview Session Not Found"
          description="The requested workspace could not be verified or loaded."
          actionText="Back to console"
          onAction={() => window.location.href = "/dashboard/interview"}
        />
      </div>
    );
  }

  const isCompleted = session.status === "completed";
  const activeQuestion = questions[activeIndex];

  // Try parsing the streaming evaluation text if available
  let parsedStreamingEval: any = null;
  if (evalStreamText) {
    try {
      parsedStreamingEval = JSON.parse(evalStreamText);
    } catch (e) {
      // Partial JSON, show simple text parsing fallback or loader
    }
  }

  const activeEval = activeQuestion?.evaluatedAt ? activeQuestion : parsedStreamingEval;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <Link href="/dashboard/interview" className="flex items-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Console
        </Link>
        
        <div className="flex items-center gap-4">
          {session.interviewMode === "timed" && !isCompleted && (
            <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-1 rounded-lg border border-red-200 dark:border-red-900/50">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timer)}</span>
            </div>
          )}
          
          {!isCompleted && questions.length > 0 && (
            <Button onClick={handleFinishInterview} variant="outline" className="border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20">
              Finish Practice
            </Button>
          )}
        </div>
      </div>

      {/* Main split dashboard panels */}
      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* Left Side: Question Console Workspace */}
        <div className="lg:col-span-3 space-y-6">
          {questions.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] border-zinc-200 dark:border-zinc-800">
              <Sparkles className="h-10 w-10 text-emerald-500 mb-4 animate-pulse" />
              <h4 className="text-md font-bold mb-1">Generate Practice Run</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                Ready to answer questions for the {session.jobRole} role? Click below to generate your first prompt.
              </p>
              <Button onClick={handleGenerateNextQuestion} disabled={generating} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Play className="mr-1.5 h-4 w-4" /> Start Generating Questions
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Question card */}
              <Card className="border-emerald-500/20 bg-emerald-500/[0.02] dark:border-emerald-500/20">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                      Question {activeIndex + 1} of {session.questionCount}
                    </span>
                    <CardTitle className="text-sm font-bold mt-2">
                      {activeQuestion?.questionText}
                    </CardTitle>
                  </div>
                </CardHeader>
              </Card>

              {/* Answer input */}
              {!isCompleted && !activeQuestion?.userAnswer && (
                <div className="space-y-3">
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Structure your answer here. Try using the STAR method: describe the Situation, specify the Task, outline your Actions, and highlight the quantifiable Results."
                    rows={8}
                    className="resize-none"
                    disabled={evaluating}
                  />
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>Format with metrics/outcomes for higher scores.</span>
                    <span>{userAnswer.length} characters</span>
                  </div>
                  <Button 
                    onClick={handleSubmitAnswer} 
                    disabled={!userAnswer.trim() || evaluating}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {evaluating ? "Evaluating Answer..." : "Submit Answer"}
                  </Button>
                </div>
              )}

              {activeQuestion?.userAnswer && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Submitted Answer</h4>
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                    {activeQuestion.userAnswer}
                  </div>
                  
                  {/* Next flow logic */}
                  {!isCompleted && activeIndex === questions.length - 1 && questions.length < session.questionCount && (
                    <Button onClick={handleGenerateNextQuestion} disabled={generating} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                      {generating ? "Loading..." : "Get Next Question"}
                    </Button>
                  )}
                </div>
              )}

              {/* Selector / Index mapping */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                {questions.map((q, idx) => {
                  const hasAnswer = !!q.userAnswer;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`h-9 px-3.5 rounded-lg text-xs font-semibold border transition-all ${
                        isActive
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : hasAnswer
                          ? "bg-emerald-50/40 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                          : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800"
                      }`}
                    >
                      {idx + 1} {hasAnswer && `(${q.overallScore || 0}%)`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Scorecard & Evaluation Feedback Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dashboard Summary (Overlay or top widget if completed) */}
          {isCompleted && (
            <Card className="border border-zinc-200 bg-gradient-to-br from-emerald-500/10 via-zinc-950/[0.02] to-transparent dark:border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-md font-bold flex items-center gap-1.5">
                  <Award className="h-5 w-5 text-emerald-500" /> Final Report Card
                </CardTitle>
                <CardDescription className="text-xs">
                  Overall review for job role: {session.jobRole}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950 flex flex-col items-center justify-center border-2 border-emerald-500">
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{session.overallScore}%</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold">Ready for Market</h5>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Average calibration across {questions.length} questions.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">Technical Skill</p>
                    <p className="text-md font-bold mt-0.5">{session.technicalScore}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">Communication</p>
                    <p className="text-md font-bold mt-0.5">{session.communicationScore}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">Confidence Index</p>
                    <p className="text-md font-bold mt-0.5">{session.confidenceScore}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">Role Readiness</p>
                    <p className="text-md font-bold mt-0.5">{session.roleReadinessScore}%</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">General Review</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {session.generalFeedback}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question specific scorecard evaluation */}
          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <BookOpen className="h-4.5 w-4.5 text-emerald-500" /> Evaluation Report
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!activeEval ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                  <HelpCircle className="h-8 w-8 mb-2" />
                  <p className="text-xs">No evaluation yet. Submit your answer to see AI ratings, strengths, and rewrite suggestions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Score breakdown indicators */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Score Breakdown</h4>
                      <p className="text-[10px] text-zinc-400">Overall score for this prompt</p>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {activeEval.overallScore}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="flex justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-900">
                      <span className="font-semibold text-zinc-500">Clarity:</span>
                      <span className="font-bold">{activeEval.clarityScore}%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-900">
                      <span className="font-semibold text-zinc-500">Confidence:</span>
                      <span className="font-bold">{activeEval.confidenceScore}%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-900">
                      <span className="font-semibold text-zinc-500">Relevance:</span>
                      <span className="font-bold">{activeEval.relevanceScore}%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-900">
                      <span className="font-semibold text-zinc-500">Technical:</span>
                      <span className="font-bold">{activeEval.technicalScore}%</span>
                    </div>
                  </div>

                  {/* Highlights strengths weaknesses */}
                  <div className="space-y-3 pt-2">
                    {activeEval.generalFeedback && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Coach Summary</span>
                        <p className="text-xs leading-relaxed">{activeEval.generalFeedback}</p>
                      </div>
                    )}

                    {activeEval.strengths && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Strengths</span>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">
                          {activeEval.strengths}
                        </p>
                      </div>
                    )}

                    {activeEval.weaknesses && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Gaps / Weaknesses</span>
                        <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                          {activeEval.weaknesses}
                        </p>
                      </div>
                    )}

                    {activeEval.missedPoints && activeEval.missedPoints.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Missed Core Points</span>
                        <ul className="text-xs list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-0.5">
                          {activeEval.missedPoints.map((pt: string, idx: number) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* STAR Evaluation */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">STAR Structure Evaluation</span>
                      {plan === "free" && <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />}
                    </div>
                    
                    <div className="space-y-2 text-[11px] leading-relaxed">
                      {activeEval.starEvaluation && Object.entries(activeEval.starEvaluation).map(([key, val]: any) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase w-4 shrink-0">{key.charAt(0)}</span>
                          <p className="text-zinc-600 dark:text-zinc-400"><span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{key}:</span> {val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rewrite Answer suggestion */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">How to answer better</span>
                      {plan === "free" && <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />}
                    </div>
                    {activeEval.betterAnswer && (
                      <p className="text-xs italic bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        "{activeEval.betterAnswer}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
