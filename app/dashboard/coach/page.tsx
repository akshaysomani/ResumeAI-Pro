"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCoachChatsAction,
  createCoachChatAction,
  deleteCoachChatAction,
  getCoachMessagesAction,
  saveCoachMessageAction,
  getUserPlan,
  getGoalsAction,
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
  getRoadmapsAction,
  getLearningPlansAction,
  getSalaryReportsAction
} from "@/app/actions/intelligenceActions";
import {
  MessageSquare,
  Compass,
  TrendingUp,
  Target,
  Send,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Crown,
  BookOpen,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
  Award,
  Sparkles
} from "lucide-react";
import type { CoachChat, CoachMessage, CareerGoal, CareerRoadmap, SalaryReport, LearningPlan } from "@/types";

export default function CareerCoachPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"coach" | "roadmaps" | "gap" | "salary" | "goals">("coach");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);

  // ==========================================
  // STATE DEFINITIONS
  // ==========================================
  // Chat
  const [chats, setChats] = useState<CoachChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStreamingText, setChatStreamingText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Roadmaps
  const [roadmaps, setRoadmaps] = useState<CareerRoadmap[]>([]);
  const [targetGoal, setTargetGoal] = useState("Staff AI Architect");
  const [roadmapTimeline, setRoadmapTimeline] = useState("12 months");
  const [roadmapBudget, setRoadmapBudget] = useState("Flexible");
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [roadmapStreamText, setRoadmapStreamText] = useState("");

  // Skill Gap & Learning Plans
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  // Salary
  const [salaryReports, setSalaryReports] = useState<SalaryReport[]>([]);
  const [salaryRole, setSalaryRole] = useState("AI Architect");
  const [salaryLocation, setSalaryLocation] = useState("Remote");
  const [salaryExperience, setSalaryExperience] = useState("Senior (5-8 yrs)");
  const [estimatingSalary, setEstimatingSalary] = useState(false);
  const [salaryStreamText, setSalaryStreamText] = useState("");

  // Goals
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [goalMilestoneInputs, setGoalMilestoneInputs] = useState<Record<string, string>>({});
  const [suggestingMilestonesForGoal, setSuggestingMilestonesForGoal] = useState<string>("");

  // ==========================================
  // INITIALIZATION DATA LOAD
  // ==========================================
  useEffect(() => {
    if (!user) return;

    const loadAllIntelligence = async () => {
      try {
        setLoading(true);
        const userPlan = await getUserPlan(user.id);
        setPlan(userPlan);

        // Load coach threads
        const cData = await getCoachChatsAction(user.id);
        setChats(cData);
        if (cData.length > 0) {
          setActiveChatId(cData[0].id);
        }

        // Load Roadmaps
        const rData = await getRoadmapsAction(user.id);
        setRoadmaps(rData);

        // Load Learning Plans
        const lpData = await getLearningPlansAction(user.id);
        setLearningPlans(lpData);

        // Load Goals
        const gData = await getGoalsAction(user.id);
        setGoals(gData);

        // Load Salaries
        const sData = await getSalaryReportsAction(user.id);
        if (sData) {
          setSalaryReports(sData);
        }
      } catch (err) {
        console.error("Error loading intelligence dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllIntelligence();
  }, [user]);

  // Load chat messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId || !user) return;
    const loadMessages = async () => {
      try {
        setChatLoading(true);
        const msgs = await getCoachMessagesAction(activeChatId, user.id);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to load chat messages:", err);
      } finally {
        setChatLoading(false);
      }
    };
    loadMessages();
  }, [activeChatId, user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatStreamingText]);

  // ==========================================
  // COACH CHAT METRICS & HANDLERS
  // ==========================================
  const handleCreateChat = async () => {
    if (!user) return;
    const title = `Chat about ${targetGoal || "Career path"}`;
    try {
      const newChat = await createCoachChatAction(user.id, title);
      setChats([newChat, ...chats]);
      setActiveChatId(newChat.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!confirm("Are you sure you want to delete this conversation thread?")) return;

    try {
      await deleteCoachChatAction(id, user.id);
      const filtered = chats.filter((c) => c.id !== id);
      setChats(filtered);
      if (activeChatId === id) {
        if (filtered.length > 0) {
          setActiveChatId(filtered[0].id);
        } else {
          setActiveChatId("");
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !user || chatStreamingText) return;

    const userText = newMessage;
    setNewMessage("");
    setChatStreamingText("Coach is thinking...");

    // Optimistically update list
    setMessages((prev) => [
      ...prev,
      { id: "temp-user", chatId: activeChatId, role: "user", content: userText, createdAt: new Date().toISOString() }
    ]);

    try {
      const response = await fetch("/api/intelligence/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeChatId, userMessage: userText })
      });

      if (!response.ok) {
        const text = await response.text();
        // Check for Free limit block
        if (response.status === 403) {
          alert("Free plan is limited to 3 messages. Upgrade to Pro for unlimited mentoring chat!");
        } else {
          alert(`Error from Coach API: ${text}`);
        }
        // Remove optimistic user msg
        const fresh = await getCoachMessagesAction(activeChatId, user.id);
        setMessages(fresh);
        setChatStreamingText("");
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setChatStreamingText(assistantText);
      }

      // Sync fresh data from DB on completion
      const fresh = await getCoachMessagesAction(activeChatId, user.id);
      setMessages(fresh);
    } catch (err) {
      console.error("Coach messaging failed:", err);
    } finally {
      setChatStreamingText("");
    }
  };

  // ==========================================
  // ROADMAPS GENERATOR HANDLERS
  // ==========================================
  const handleGenerateRoadmap = async () => {
    if (!user || generatingRoadmap) return;
    setGeneratingRoadmap(true);
    setRoadmapStreamText("");

    // Gather user's current skills to pre-populate
    const currentSkills = goals.length > 0 ? goals.map((g) => g.title).slice(0, 5) : ["React", "SQL"];

    try {
      const response = await fetch("/api/intelligence/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSkills,
          goal: targetGoal,
          timeline: roadmapTimeline,
          budget: roadmapBudget
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        setRoadmapStreamText(text);
      }

      // Reload roadmaps and learning plans
      const rData = await getRoadmapsAction(user.id);
      setRoadmaps(rData);

      const lpData = await getLearningPlansAction(user.id);
      setLearningPlans(lpData);
      setActivePlanIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRoadmap(false);
      setRoadmapStreamText("");
    }
  };

  // ==========================================
  // SALARY EXPLORER HANDLERS
  // ==========================================
  const handleEstimateSalary = async () => {
    if (!user || estimatingSalary) return;
    setEstimatingSalary(true);
    setSalaryStreamText("");

    try {
      const response = await fetch("/api/intelligence/salary/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: salaryRole,
          location: salaryLocation,
          experience: salaryExperience
        })
      });

      if (!response.ok) throw new Error(await response.text());

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        setSalaryStreamText(text);
      }

      // Reload salary logs
      const sData = await getSalaryReportsAction(user.id);
      if (sData) {
        setSalaryReports(sData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEstimatingSalary(false);
      setSalaryStreamText("");
    }
  };

  // ==========================================
  // GOALS & MILESTONES CHECKS HANDLERS
  // ==========================================
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGoalTitle.trim()) return;

    try {
      const goal = await createGoalAction(user.id, {
        title: newGoalTitle,
        description: newGoalDesc,
        targetDate: newGoalDeadline || undefined
      });
      setGoals([goal, ...goals]);
      setNewGoalTitle("");
      setNewGoalDesc("");
      setNewGoalDeadline("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMilestone = async (goal: CareerGoal, milestoneId: string) => {
    if (!user) return;
    const updatedMilestones = goal.milestones.map((m) => {
      if (m.id === milestoneId) {
        return { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null };
      }
      return m;
    });

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : 0;
    const status = progress === 100 ? "completed" as const : "active" as const;

    try {
      await updateGoalAction(goal.id, user.id, {
        milestones: updatedMilestones,
        progress,
        status
      });

      // Update local state
      setGoals(goals.map((g) => {
        if (g.id === goal.id) {
          return { ...g, milestones: updatedMilestones, progress, status };
        }
        return g;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMilestone = async (goal: CareerGoal) => {
    if (!user) return;
    const title = goalMilestoneInputs[goal.id];
    if (!title?.trim()) return;

    const newMilestone = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      completed: false
    };

    const updatedMilestones = [...goal.milestones, newMilestone];
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    try {
      await updateGoalAction(goal.id, user.id, {
        milestones: updatedMilestones,
        progress
      });

      setGoals(goals.map((g) => {
        if (g.id === goal.id) {
          return { ...g, milestones: updatedMilestones, progress };
        }
        return g;
      }));

      setGoalMilestoneInputs({ ...goalMilestoneInputs, [goal.id]: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuggestMilestones = async (goal: CareerGoal) => {
    if (!user) return;
    setSuggestingMilestonesForGoal(goal.id);

    try {
      // Build LLM suggestion via helper API
      const payload = {
        title: goal.title,
        targetDate: goal.targetDate,
        currentSkills: ["React", "PostgreSQL"],
      };

      const response = await fetch("/api/intelligence/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: `Learn ${goal.title}`, timeline: "3 months" })
      });

      if (!response.ok) throw new Error("Suggestion failed");
      const roadmap = await response.json();

      const suggestedMilestones = roadmap.milestones?.map((m: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: `${m.title} (${m.estimatedTime})`,
        completed: false
      })) || [];

      await updateGoalAction(goal.id, user.id, {
        milestones: suggestedMilestones,
        aiSuggestions: roadmap.certifications || []
      });

      setGoals(goals.map((g) => {
        if (g.id === goal.id) {
          return { ...g, milestones: suggestedMilestones, aiSuggestions: roadmap.certifications || [] };
        }
        return g;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestingMilestonesForGoal("");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      await deleteGoalAction(id, user.id);
      setGoals(goals.filter((g) => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // PARSING LOADERS
  // ==========================================
  let parsedStreamingRoadmap: any = null;
  if (roadmapStreamText) {
    try {
      parsedStreamingRoadmap = JSON.parse(roadmapStreamText);
    } catch (e) {}
  }
  const activeRoadmap = roadmaps[0] || parsedStreamingRoadmap;

  let parsedStreamingSalary: any = null;
  if (salaryStreamText) {
    try {
      parsedStreamingSalary = JSON.parse(salaryStreamText);
    } catch (e) {}
  }
  const activeSalary = salaryReports[0] || parsedStreamingSalary;

  return (
    <div className="space-y-6">
      {/* Tabs list navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("coach")}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "coach"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5" /> Career Coach
        </button>

        <button
          onClick={() => setActiveTab("roadmaps")}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "roadmaps"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          }`}
        >
          <Compass className="h-4.5 w-4.5" /> Career Roadmaps
        </button>

        <button
          onClick={() => setActiveTab("gap")}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "gap"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          }`}
        >
          <BookOpen className="h-4.5 w-4.5" /> Skill Gap Analysis
        </button>

        <button
          onClick={() => setActiveTab("salary")}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "salary"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          }`}
        >
          <TrendingUp className="h-4.5 w-4.5" /> Salary Explorer
        </button>

        <button
          onClick={() => setActiveTab("goals")}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "goals"
              ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          }`}
        >
          <Target className="h-4.5 w-4.5" /> Goals Checklist
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: COACH CHAT CONSOLE */}
          {activeTab === "coach" && (
            <div className="grid gap-6 md:grid-cols-4 min-h-[500px]">
              {/* Sidebar chat threads */}
              <div className="md:col-span-1 border-r border-zinc-200/80 dark:border-zinc-800/80 pr-4 space-y-4">
                <Button onClick={handleCreateChat} className="w-full text-xs">
                  <Plus className="mr-1 h-3.5 w-3.5" /> New Mentor Session
                </Button>
                <div className="space-y-1 overflow-y-auto max-h-[400px]">
                  {chats.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setActiveChatId(c.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        activeChatId === c.id
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <span className="truncate pr-2">{c.title}</span>
                      <button onClick={(e) => handleDeleteChat(c.id, e)} className="text-zinc-400 hover:text-red-500 shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat View Panel */}
              <div className="md:col-span-3 flex flex-col h-[500px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden">
                {!activeChatId ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center p-8 text-zinc-400">
                    <MessageSquare className="h-10 w-10 mb-2" />
                    <p className="text-xs">No active conversation. Start a session to request review or tips.</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                      <h4 className="text-xs font-bold truncate">Career Coach Messenger</h4>
                      {plan === "free" && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200">
                          <Crown className="h-3 w-3 fill-amber-600" /> Free limit (3 msgs max)
                        </span>
                      )}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                      {chatLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-10 w-48 rounded-lg" />
                          <Skeleton className="h-16 w-64 rounded-lg ml-auto" />
                        </div>
                      ) : (
                        messages.map((m, idx) => {
                          const isUser = m.role === "user";
                          return (
                            <div key={m.id || idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[75%] p-3.5 rounded-xl text-xs leading-relaxed ${
                                  isUser
                                    ? "bg-indigo-600 text-white rounded-br-none"
                                    : "bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 rounded-bl-none"
                                }`}
                              >
                                {m.content}
                              </div>
                            </div>
                          );
                        })
                      )}
                      
                      {chatStreamingText && (
                        <div className="flex justify-start">
                          <div className="max-w-[75%] p-3.5 rounded-xl text-xs leading-relaxed bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 rounded-bl-none">
                            {chatStreamingText}
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Inputs panel */}
                    <form onSubmit={handleSendChatMsg} className="p-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="e.g. How can I transition from React into ML engineer roles?"
                        disabled={chatStreamingText !== ""}
                        className="text-xs"
                      />
                      <Button type="submit" size="icon" disabled={!newMessage.trim() || chatStreamingText !== ""} className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PERSONALIZED ROADMAPS */}
          {activeTab === "roadmaps" && (
            <div className="space-y-6">
              {/* Creator setup banner */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-500" /> Career Path Roadmap Planner
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Input your target dream job to map out milestones and acquisition guidelines.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Target Role Target</label>
                      <Input value={targetGoal} onChange={(e) => setTargetGoal(e.target.value)} placeholder="e.g. Principal AI Lead" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Desired Timeline</label>
                      <Input value={roadmapTimeline} onChange={(e) => setRoadmapTimeline(e.target.value)} placeholder="e.g. 6 months, 2 years" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Educational Budget</label>
                      <Input value={roadmapBudget} onChange={(e) => setRoadmapBudget(e.target.value)} placeholder="e.g. Low cost, $500" className="text-xs" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleGenerateRoadmap} disabled={generatingRoadmap} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9">
                        {generatingRoadmap ? "Drafting Roadmap..." : "Generate AI Roadmap"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Roadmap timeline display */}
              {!activeRoadmap ? (
                <EmptyState
                  icon={Compass}
                  title="No Roadmap Formulated"
                  description="Generate a roadmap above to render an interactive career path timeline."
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Timeline listing */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                      Transition Steps to {activeRoadmap.goal}
                    </h4>

                    <div className="relative border-l border-indigo-200 dark:border-indigo-900 ml-3 pl-6 space-y-6 py-2">
                      {activeRoadmap.roadmapData?.milestones?.map((milestone: any, idx: number) => (
                        <div key={idx} className="relative">
                          {/* Dot indicator */}
                          <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-2 border-indigo-600 bg-white dark:bg-zinc-950 flex items-center justify-center text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                            {idx + 1}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{milestone.title}</h5>
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                {milestone.estimatedTime}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications & Resource highlights */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
                        <CardTitle className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Acquisition Assets</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4 text-xs">
                        <div className="space-y-1.5">
                          <span className="font-semibold text-zinc-500">Skills to Bridge:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeRoadmap.roadmapData?.skillsToAcquire?.map((s: string, idx: number) => (
                              <span key={idx} className="text-[10px] bg-zinc-100 border text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                          <span className="font-semibold text-zinc-500">Suggested Certifications:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
                            {activeRoadmap.roadmapData?.certifications?.map((c: string, idx: number) => (
                              <li key={idx}>{c}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                          <span className="font-semibold text-zinc-500">Curated Reading list:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
                            {activeRoadmap.roadmapData?.books?.map((b: string, idx: number) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                          <span className="font-semibold text-zinc-500">Suggested Projects:</span>
                          <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
                            {activeRoadmap.roadmapData?.projects?.map((p: string, idx: number) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SKILL GAP ANALYSIS */}
          {activeTab === "gap" && (
            <div className="space-y-6">
              {learningPlans.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No Skill Gap Analysis Yet"
                  description="Generate a Career Roadmap first to automatically parse missing skills, learning hours, and recommendation resources."
                />
              ) : (
                <div className="space-y-6">
                  {/* Selector for multiple plans */}
                  <div className="flex gap-2">
                    {learningPlans.map((lp, idx) => (
                      <button
                        key={lp.id}
                        onClick={() => setActivePlanIndex(idx)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                          idx === activePlanIndex
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {lp.targetRole}
                      </button>
                    ))}
                  </div>

                  {/* Details mapping */}
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Missing skills list */}
                    <div className="md:col-span-2 space-y-4">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Core Skills Gap scoreboard</h4>
                      
                      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                            <tr>
                              <th className="p-3 font-semibold text-zinc-500">Skill</th>
                              <th className="p-3 font-semibold text-zinc-500">Acquisition Priority</th>
                              <th className="p-3 font-semibold text-zinc-500">Difficulty</th>
                              <th className="p-3 font-semibold text-zinc-500">Est. learning time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                            {learningPlans[activePlanIndex]?.missingSkills?.map((ms: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-3 font-bold">{ms.skill}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    ms.priority === "high"
                                      ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                                      : ms.priority === "medium"
                                      ? "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                                      : "bg-zinc-50 text-zinc-600"
                                  }`}>
                                    {ms.priority}
                                  </span>
                                </td>
                                <td className="p-3 capitalize">{ms.difficulty}</td>
                                <td className="p-3">{ms.hours} hours</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Learning resources */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Acquisition recommendations</h4>
                      {learningPlans[activePlanIndex]?.learningResources?.map((res: any, idx: number) => (
                        <Card key={idx}>
                          <CardHeader className="p-4 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                            <CardTitle className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{res.skill}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-2 text-xs">
                            {res.courses?.length > 0 && (
                              <div>
                                <span className="font-semibold text-zinc-400">Courses:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400 mt-1">
                                  {res.courses.map((c: string, cidx: number) => <li key={cidx}>{c}</li>)}
                                </ul>
                              </div>
                            )}

                            {res.challenges?.length > 0 && (
                              <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-900 mt-1.5">
                                <span className="font-semibold text-zinc-400">Practice challenge:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400 mt-1">
                                  {res.challenges.map((ch: string, chidx: number) => <li key={chidx}>{ch}</li>)}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SALARY EXPLORER */}
          {activeTab === "salary" && (
            <div className="space-y-6">
              {/* Creator setup banner */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <TrendingUp className="h-4.5 w-4.5 text-indigo-500" /> Salary Intelligence Calculator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Calibrate compensation range medians, perk indices, and negotiation playbooks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Target Role Title</label>
                      <Input value={salaryRole} onChange={(e) => setSalaryRole(e.target.value)} placeholder="e.g. Tech Lead" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Location Target</label>
                      <Input value={salaryLocation} onChange={(e) => setSalaryLocation(e.target.value)} placeholder="e.g. San Francisco, Remote" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Experience bounds</label>
                      <Input value={salaryExperience} onChange={(e) => setSalaryExperience(e.target.value)} placeholder="e.g. Junior (1-2 yrs)" className="text-xs" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleEstimateSalary} disabled={estimatingSalary} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9">
                        {estimatingSalary ? "Calculating metrics..." : "Calculate Market Value"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benchmark scorecard layout */}
              {!activeSalary ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No Salary Estimates Logged"
                  description="Use the calculator above to fetch up-to-date market compensation details and negotiation tips."
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Gauge card */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-zinc-400">Compensation benchmarks</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center py-4 border-b border-zinc-100 dark:border-zinc-900">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Median Base Salary</span>
                          <h3 className="text-3xl font-black mt-1 text-indigo-600 dark:text-indigo-400">
                            ${activeSalary.rangeMedian ? (activeSalary.rangeMedian / 1000).toFixed(0) : "N/A"}k
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-center">
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <span className="text-[9px] text-zinc-500 uppercase font-semibold">Low limit</span>
                            <p className="font-bold mt-0.5">${activeSalary.rangeMin ? (activeSalary.rangeMin / 1000).toFixed(0) : "N/A"}k</p>
                          </div>
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <span className="text-[9px] text-zinc-500 uppercase font-semibold">High limit</span>
                            <p className="font-bold mt-0.5">${activeSalary.rangeMax ? (activeSalary.rangeMax / 1000).toFixed(0) : "N/A"}k</p>
                          </div>
                        </div>

                        <div className="pt-2 text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="font-semibold text-zinc-500">Growth Trend:</span>
                            <span className="font-bold">{activeSalary.trendData?.growthTrend || "Positive upward"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-zinc-500">Market Demand:</span>
                            <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">{activeSalary.trendData?.marketDemand || "High"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Negotiation playbook and perks */}
                  <div className="md:col-span-2 space-y-4">
                    <Card>
                      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
                        <CardTitle className="text-sm font-bold flex items-center gap-1">
                          <Award className="h-4.5 w-4.5 text-indigo-500" /> Negotiation Playbook Guides
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4 text-xs">
                        <div className="space-y-2">
                          {activeSalary.negotiationTips?.map((tip: string, idx: number) => (
                            <div key={idx} className="flex gap-2.5 items-start">
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{tip}</p>
                            </div>
                          ))}
                        </div>

                        {activeSalary.trendData?.benefits?.length > 0 && (
                          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-1.5">
                            <span className="font-bold text-zinc-500 uppercase text-[10px]">Standard Industry Perks for this role:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {activeSalary.trendData.benefits.map((b: string, idx: number) => (
                                <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/50 px-2 py-0.5 rounded">
                                  {b}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GOAL TRACKER */}
          {activeTab === "goals" && (
            <div className="space-y-6">
              {/* Goal creation Form */}
              <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Target className="h-4.5 w-4.5 text-indigo-500" /> Define Career Goal Target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGoal} className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Goal Title</label>
                      <Input value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} placeholder="e.g. Master AWS Architect" required className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Description (Optional)</label>
                      <Input value={newGoalDesc} onChange={(e) => setNewGoalDesc(e.target.value)} placeholder="e.g. Pass exam and deploy 3 projects" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">Target date (Optional)</label>
                      <Input type="date" value={newGoalDeadline} onChange={(e) => setNewGoalDeadline(e.target.value)} className="text-xs" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9">
                        <Plus className="mr-1 h-4 w-4" /> Create Goal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Goals checklist mapping */}
              {goals.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No Goals Defined"
                  description="Define a target goal above to track your professional achievements."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {goals.map((g) => (
                    <Card key={g.id} className="border border-zinc-200 dark:border-zinc-800">
                      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-sm font-bold">{g.title}</CardTitle>
                            {g.description && <p className="text-[11px] text-zinc-500 mt-0.5">{g.description}</p>}
                          </div>
                          <button onClick={() => handleDeleteGoal(g.id)} className="text-zinc-400 hover:text-red-500 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="pt-3 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase">
                            <span>Goal progress</span>
                            <span>{g.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${g.progress}%` }} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4 text-xs">
                        
                        {/* Milestones list */}
                        <div className="space-y-2">
                          <span className="font-bold text-[10px] text-zinc-400 uppercase">Milestones checklist</span>
                          {g.milestones.length === 0 ? (
                            <div className="text-zinc-400 text-center py-2 italic text-[11px]">No milestones. Add one below or click Suggest.</div>
                          ) : (
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                              {g.milestones.map((m) => (
                                <div key={m.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={m.completed}
                                    onChange={() => handleToggleMilestone(g, m.id)}
                                    className="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className={`text-[11px] font-medium ${m.completed ? "line-through text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                                    {m.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add milestone actions */}
                        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                          <Input
                            placeholder="Add custom milestone..."
                            value={goalMilestoneInputs[g.id] || ""}
                            onChange={(e) => setGoalMilestoneInputs({ ...goalMilestoneInputs, [g.id]: e.target.value })}
                            className="text-xs h-8"
                          />
                          <Button size="sm" onClick={() => handleAddMilestone(g)} className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs h-8">
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuggestMilestones(g)}
                            disabled={suggestingMilestonesForGoal === g.id}
                            className="text-xs h-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 dark:border-indigo-900 dark:text-indigo-400"
                          >
                            {suggestingMilestonesForGoal === g.id ? "Drafting..." : "Suggest"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
