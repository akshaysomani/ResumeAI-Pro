"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Star,
  Bookmark,
  Search,
  User,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Mail,
  FileText,
  BookmarkCheck,
  ChevronRight,
  TrendingUp,
  MapPin
} from "lucide-react";
import {
  postRecruiterFeedbackAction,
  bookmarkCandidateAction
} from "@/app/actions/orgActions";
import type { RecruiterFeedback } from "@/types";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  resumesCount: number;
}

interface RecruiterClientProps {
  orgId: string;
  role: string;
  userId: string;
  initialCandidates: Candidate[];
  initialFeedbacks: RecruiterFeedback[];
}

const PIPELINE_STATUSES = [
  { value: "applied", label: "Applied", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { value: "reviewing", label: "Reviewing", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { value: "interviewing", label: "Interviewing", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { value: "offered", label: "Offered", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" }
];

export default function RecruiterClient({
  orgId,
  role,
  userId,
  initialCandidates,
  initialFeedbacks
}: RecruiterClientProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [feedbacks, setFeedbacks] = useState<RecruiterFeedback[]>(initialFeedbacks);
  
  // Selected candidate state
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [bookmarkFilter, setBookmarkFilter] = useState<boolean>(false);

  // Form states
  const [feedbackText, setFeedbackText] = useState("");
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [pipelineStatus, setPipelineStatus] = useState<string>("applied");
  const [savingFeedback, setSavingFeedback] = useState(false);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);
  
  // Find current recruiter stats for the selected candidate
  const candidateFeedbacks = feedbacks.filter((f) => f.candidateId === selectedCandidateId);
  const latestFeedback = candidateFeedbacks[0]; // array is ordered DESC by updated_at

  const handleSelectCandidate = (candId: string) => {
    setSelectedCandidateId(candId);
    const candFbs = feedbacks.filter((f) => f.candidateId === candId);
    const latest = candFbs[0];
    setFeedbackText(latest?.feedback || "");
    setRatingVal(latest?.rating || 5);
    setPipelineStatus(latest?.candidateStatus || "applied");
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId || !feedbackText.trim()) return;

    setSavingFeedback(true);
    try {
      await postRecruiterFeedbackAction({
        orgId,
        recruiterId: userId,
        candidateId: selectedCandidateId,
        feedback: feedbackText.trim(),
        rating: ratingVal,
        status: pipelineStatus
      });

      // Update feedback local list
      const updatedFeedbacks = feedbacks.filter(
        (f) => !(f.organizationId === orgId && f.recruiterId === userId && f.candidateId === selectedCandidateId)
      );
      
      const newFb: RecruiterFeedback = {
        id: Math.random().toString(),
        organizationId: orgId,
        recruiterId: userId,
        candidateId: selectedCandidateId,
        feedback: feedbackText.trim(),
        rating: ratingVal,
        candidateStatus: pipelineStatus as RecruiterFeedback["candidateStatus"],
        bookmarked: latestFeedback?.bookmarked || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        candidateName: selectedCandidate?.fullName,
        candidateEmail: selectedCandidate?.email
      };

      setFeedbacks([newFb, ...updatedFeedbacks]);
      toastSuccess("Candidate evaluation recorded successfully!");
    } catch (err: any) {
      toastError(err.message || "Failed to register candidate feedback");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleToggleBookmark = async (candId: string, currentBookmarked: boolean) => {
    try {
      const nextBookmark = !currentBookmarked;
      await bookmarkCandidateAction(orgId, userId, candId, nextBookmark);

      setFeedbacks((prev) => {
        const found = prev.some((f) => f.candidateId === candId && f.recruiterId === userId);
        if (found) {
          return prev.map((f) =>
            f.candidateId === candId && f.recruiterId === userId
              ? { ...f, bookmarked: nextBookmark, updatedAt: new Date().toISOString() }
              : f
          );
        } else {
          // create a dummy feedback row to hold bookmark
          const cand = candidates.find((c) => c.id === candId);
          const newFb: RecruiterFeedback = {
            id: Math.random().toString(),
            organizationId: orgId,
            recruiterId: userId,
            candidateId: candId,
            feedback: "Bookmarked candidate",
            rating: 5,
            candidateStatus: "applied",
            bookmarked: nextBookmark,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            candidateName: cand?.fullName,
            candidateEmail: cand?.email
          };
          return [newFb, ...prev];
        }
      });

      toastSuccess(nextBookmark ? "Candidate bookmarked!" : "Bookmark removed");
    } catch (err: any) {
      toastError(err.message || "Failed to toggle candidate bookmark");
    }
  };

  // Helper to check bookmark status of a candidate
  const getBookmarkStatus = (candId: string) => {
    return feedbacks.some((f) => f.candidateId === candId && f.bookmarked && f.recruiterId === userId);
  };

  // Helper to check status of a candidate
  const getCandidateStatus = (candId: string) => {
    const candFbs = feedbacks.filter((f) => f.candidateId === candId);
    return candFbs[0]?.candidateStatus || "applied";
  };

  // Apply search and status filters
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    const status = getCandidateStatus(c.id);
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    const isBookmarked = getBookmarkStatus(c.id);
    const matchesBookmark = !bookmarkFilter || isBookmarked;

    return matchesSearch && matchesStatus && matchesBookmark;
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">Recruiter Pipeline Portal</h2>
          <p className="text-xs text-zinc-400">Track candidate status, rating scores, recruiter reviews, and bookmark top profiles.</p>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PIPELINE_STATUSES.map((status) => {
          const count = candidates.filter((c) => getCandidateStatus(c.id) === status.value).length;
          return (
            <Card key={status.value} className="bg-zinc-900/25 border-zinc-800 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">{status.label}</span>
              <div className="flex justify-between items-center mt-2">
                <span className="text-2xl font-bold text-zinc-200">{count}</span>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${status.color}`}>
                  pipeline
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name or email..."
              className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9 pl-9 pr-4 rounded-xl placeholder-zinc-700 text-xs w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs font-semibold"
          >
            <option value="all">All Pipeline Stages</option>
            {PIPELINE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => setBookmarkFilter(!bookmarkFilter)}
            className={`h-9 text-xs rounded-xl font-bold border-zinc-850 ${
              bookmarkFilter ? "bg-amber-950/20 border-amber-500/30 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 mr-1" />
            {bookmarkFilter ? "Bookmarked Only" : "Filter Bookmarked"}
          </Button>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Candidates Roster */}
        <div className={`space-y-4 lg:col-span-2 ${selectedCandidateId ? "lg:col-span-1" : "lg:col-span-3"}`}>
          <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-400">Pipeline Candidates ({filteredCandidates.length})</h3>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {filteredCandidates.length === 0 ? (
              <div className="border border-zinc-800 bg-zinc-900/10 rounded-2xl p-12 text-center text-zinc-500 col-span-full">
                No candidates match your active filters.
              </div>
            ) : (
              filteredCandidates.map((cand) => {
                const status = getCandidateStatus(cand.id);
                const bookmarked = getBookmarkStatus(cand.id);
                const statusInfo = PIPELINE_STATUSES.find((s) => s.value === status) || { label: status, color: "bg-zinc-500/10 text-zinc-400" };

                return (
                  <Card
                    key={cand.id}
                    className={`bg-zinc-900/35 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden ${
                      selectedCandidateId === cand.id ? "ring-2 ring-indigo-500/50 border-indigo-500/50" : ""
                    }`}
                    onClick={() => handleSelectCandidate(cand.id)}
                  >
                    <CardContent className="p-5 flex justify-between items-center gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-200 truncate">{cand.fullName}</h4>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">{cand.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(cand.id, bookmarked);
                          }}
                          className="text-zinc-600 hover:text-amber-400 transition-colors"
                        >
                          <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                        <ChevronRight className="w-5 h-5 text-zinc-600" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Evaluation & Feedback Drawer */}
        {selectedCandidate && (
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-200">{selectedCandidate.fullName}</h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{selectedCandidate.email}</p>
              </div>
              <Button
                variant="outline"
                className="h-7 text-[10px] font-bold border-zinc-800 text-zinc-400 hover:text-white"
                onClick={() => setSelectedCandidateId(null)}
              >
                Close Details
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Feedback History Timeline */}
              <Card className="bg-zinc-900/25 border-zinc-800">
                <CardHeader className="p-4 border-b border-zinc-800/80">
                  <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Evaluation History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {candidateFeedbacks.length === 0 ? (
                    <div className="text-center py-12 text-zinc-650 italic text-[11px]">
                      No recruiter evaluations filed for this candidate yet.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {candidateFeedbacks.map((fb) => (
                        <div key={fb.id} className="border-l border-zinc-800 pl-3.5 relative py-1">
                          <div className="absolute -left-1 top-2.5 w-2 h-2 rounded-full bg-indigo-500" />
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < (fb.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-zinc-700"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[8px] font-mono text-zinc-500">
                              {new Date(fb.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 italic mt-2">"{fb.feedback}"</p>
                          <div className="flex justify-between items-center mt-2.5 text-[9px] font-mono">
                            <span className="text-zinc-500">Reviewer: {fb.recruiterId === userId ? "You" : "Recruiter Agent"}</span>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/10 text-indigo-400 uppercase">
                              {fb.candidateStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assessment Form */}
              <Card className="bg-zinc-900/25 border-zinc-800">
                <CardHeader className="p-4 border-b border-zinc-800/80">
                  <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4 text-emerald-400" />
                    Record Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleSaveFeedback} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Candidate Pipeline Stage</label>
                      <select
                        value={pipelineStatus}
                        onChange={(e) => setPipelineStatus(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs font-semibold"
                      >
                        {PIPELINE_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex justify-between">
                        <span>Candidate Rating Score</span>
                        <span className="text-indigo-400 font-bold">{ratingVal} / 5 Stars</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRatingVal(i + 1)}
                            className="text-zinc-650 hover:text-amber-400 transition-colors"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                i < ratingVal ? "fill-amber-400 text-amber-400" : "text-zinc-800"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Evaluation Comments</label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Write recruiter notes, technical feedback, or next-step logs..."
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs placeholder-zinc-700 resize-none"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={savingFeedback || !feedbackText.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs"
                    >
                      {savingFeedback ? "Recording..." : "Save Evaluation"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
