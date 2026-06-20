"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  ClipboardList,
  TrendingUp,
  Search,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  Plus,
  Calendar,
  BookOpen,
  DollarSign,
  Briefcase,
  ChevronRight
} from "lucide-react";
import {
  submitReviewFeedbackAction,
  logPlacementRecordAction
} from "@/app/actions/orgActions";
import type { ResumeReviewRequest, PlacementRecord } from "@/types";

interface Student {
  id: string;
  fullName: string;
  email: string;
}

interface CareerCenterClientProps {
  orgId: string;
  role: string;
  userId: string;
  workspaceId: string;
  initialReviews: ResumeReviewRequest[];
  initialPlacements: PlacementRecord[];
  studentsList: Student[];
}

export default function CareerCenterClient({
  orgId,
  role,
  userId,
  workspaceId,
  initialReviews,
  initialPlacements,
  studentsList
}: CareerCenterClientProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [reviews, setReviews] = useState<ResumeReviewRequest[]>(initialReviews);
  const [placements, setPlacements] = useState<PlacementRecord[]>(initialPlacements);

  // Active Tab state: "reviews" or "placements"
  const [activeTab, setActiveTab] = useState<"reviews" | "placements">("reviews");

  // Selected review for details drawer
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const selectedReview = reviews.find((r) => r.id === selectedReviewId);

  // Review Form state
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string>("reviewing");
  const [savingReview, setSavingReview] = useState(false);

  // Placement Form state
  const [placeStudentId, setPlaceStudentId] = useState("");
  const [placeCompany, setPlaceCompany] = useState("");
  const [placeRole, setPlaceRole] = useState("");
  const [placePackage, setPlacePackage] = useState("");
  const [placeStatus, setPlaceStatus] = useState("placed");
  const [savingPlacement, setSavingPlacement] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectReview = (req: ResumeReviewRequest) => {
    setSelectedReviewId(req.id);
    setReviewComment(req.feedback || "");
    setReviewStatus(req.status || "reviewing");
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewId || !reviewComment.trim()) return;

    setSavingReview(true);
    try {
      await submitReviewFeedbackAction(selectedReviewId, userId, reviewStatus, reviewComment.trim());

      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReviewId
            ? { ...r, status: reviewStatus as any, feedback: reviewComment.trim(), updatedAt: new Date().toISOString() }
            : r
        )
      );

      toastSuccess("Resume review feedback recorded!");
      setSelectedReviewId(null);
    } catch (err: any) {
      toastError(err.message || "Failed to record review feedback");
    } finally {
      setSavingReview(false);
    }
  };

  const handleLogPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeStudentId || !placeCompany.trim() || !placeRole.trim() || !placePackage) return;

    setSavingPlacement(true);
    try {
      const packageLpa = parseFloat(placePackage);
      if (isNaN(packageLpa) || packageLpa <= 0) {
        toastError("Please enter a valid salary package (LPA).");
        setSavingPlacement(false);
        return;
      }

      await logPlacementRecordAction({
        workspaceId,
        studentId: placeStudentId,
        companyName: placeCompany.trim(),
        jobRole: placeRole.trim(),
        packageLpa,
        status: placeStatus
      });

      // Fetch student details for display
      const stud = studentsList.find((s) => s.id === placeStudentId);

      const newRec: PlacementRecord = {
        id: Math.random().toString(),
        workspaceId,
        studentId: placeStudentId,
        companyName: placeCompany.trim(),
        jobRole: placeRole.trim(),
        packageLpa,
        status: placeStatus as PlacementRecord["status"],
        placementDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        studentName: stud?.fullName || "Student",
        studentEmail: stud?.email || ""
      };

      setPlacements((prev) => [newRec, ...prev]);
      setPlaceStudentId("");
      setPlaceCompany("");
      setPlaceRole("");
      setPlacePackage("");
      toastSuccess("Placement record logged successfully!");
    } catch (err: any) {
      toastError(err.message || "Failed to log placement record");
    } finally {
      setSavingPlacement(false);
    }
  };

  // Computations for placements dashboard
  const avgPackage = placements.length > 0 ? (placements.reduce((acc, p) => acc + (p.packageLpa || 0), 0) / placements.length).toFixed(1) : "0";
  const maxPackage = placements.length > 0 ? Math.max(...placements.map((p) => p.packageLpa || 0)).toFixed(1) : "0";
  const totalPlaced = placements.filter((p) => p.status === "placed").length;
  const totalOffered = placements.filter((p) => p.status === "offered").length;

  // Filter reviews or placements
  const filteredReviews = reviews.filter((r) => {
    return (
      (r.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.studentEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.resumeTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredPlacements = placements.filter((p) => {
    return (
      (p.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.jobRole || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">University Career Center Hub</h2>
          <p className="text-xs text-zinc-400">Review student resumes, coordinate counseling queues, and track placements audits.</p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex bg-zinc-900/80 border border-zinc-800 rounded-xl p-0.5 w-fit">
        <button
          onClick={() => {
            setActiveTab("reviews");
            setSearchQuery("");
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
            activeTab === "reviews" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Resume Reviews Queue
        </button>
        <button
          onClick={() => {
            setActiveTab("placements");
            setSearchQuery("");
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
            activeTab === "placements" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Student Placement Registry
        </button>
      </div>

      {activeTab === "reviews" ? (
        // RESUME REVIEWS VIEW
        <div className="grid gap-8 lg:grid-cols-3">
          {/* List queue */}
          <div className={`space-y-4 lg:col-span-2 ${selectedReviewId ? "lg:col-span-1" : "lg:col-span-3"}`}>
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-zinc-400">Reviews Queue ({filteredReviews.length})</h3>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or resume..."
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9 pl-9 pr-4 rounded-xl placeholder-zinc-700 text-xs w-full"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {filteredReviews.length === 0 ? (
                <div className="border border-zinc-800 bg-zinc-900/10 rounded-2xl p-12 text-center text-zinc-500 col-span-full">
                  No review requests in queue.
                </div>
              ) : (
                filteredReviews.map((req) => {
                  const statusColors: Record<string, string> = {
                    pending: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    reviewing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    changes_requested: "bg-red-500/10 text-red-400 border-red-500/20"
                  };

                  return (
                    <Card
                      key={req.id}
                      className={`bg-zinc-900/35 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden ${
                        selectedReviewId === req.id ? "ring-2 ring-indigo-500/50 border-indigo-500/50" : ""
                      }`}
                      onClick={() => handleSelectReview(req)}
                    >
                      <CardContent className="p-5 flex justify-between items-center gap-4">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-zinc-200 truncate">{req.studentName}</h4>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${statusColors[req.status] || "bg-zinc-500/10"}`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-semibold truncate">{req.resumeTitle || "Resume"}</p>
                          <p className="text-[10px] text-zinc-550 font-mono">Date Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-650 shrink-0" />
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Details Drawer */}
          {selectedReview && (
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-zinc-200">{selectedReview.studentName}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{selectedReview.studentEmail}</p>
                </div>
                <Button
                  variant="outline"
                  className="h-7 text-[10px] font-bold border-zinc-800 text-zinc-400 hover:text-white"
                  onClick={() => setSelectedReviewId(null)}
                >
                  Close Details
                </Button>
              </div>

              <Card className="bg-zinc-900/25 border-zinc-800">
                <CardHeader className="p-4 border-b border-zinc-800/80">
                  <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <ClipboardList className="w-4 h-4 text-emerald-400" />
                    Review Evaluation Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-850/50 space-y-2">
                      <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider">Review Request Info</h4>
                      <p className="text-xs text-zinc-350">
                        Document: <span className="font-bold text-zinc-200">{selectedReview.resumeTitle}</span>
                      </p>
                      <p className="text-[10px] text-indigo-400 font-bold">
                        <a href={`/dashboard/editor?id=${selectedReview.resumeId}`} target="_blank" className="hover:underline flex items-center gap-1">
                          Open in Resume Editor
                          <BookOpen className="w-3.5 h-3.5" />
                        </a>
                      </p>
                    </div>

                    <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Review Status</label>
                        <select
                          value={reviewStatus}
                          onChange={(e) => setReviewStatus(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs font-semibold"
                        >
                          <option value="pending">Pending Review</option>
                          <option value="reviewing">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="changes_requested">Changes Requested / Revisions</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Counselor Feedback Comments</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Provide actionable resume tips, spelling corrections, or career center insights..."
                          rows={5}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs placeholder-zinc-700 resize-none"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={savingReview || !reviewComment.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs"
                      >
                        {savingReview ? "Recording..." : "Save Review Decision"}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        // STUDENT PLACEMENT TRACKER VIEW
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Log Placement form */}
          <Card className="bg-zinc-900/25 border-zinc-800 h-fit">
            <CardHeader className="p-5 border-b border-zinc-800/80">
              <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Plus className="w-4 h-4 text-indigo-400" />
                Log Placement
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-550">
                Log a student's placement or internship.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleLogPlacement} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Student</label>
                  <select
                    value={placeStudentId}
                    onChange={(e) => setPlaceStudentId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs font-semibold"
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {studentsList.map((stud) => (
                      <option key={stud.id} value={stud.id}>
                        {stud.fullName} ({stud.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Company Name</label>
                  <Input
                    value={placeCompany}
                    onChange={(e) => setPlaceCompany(e.target.value)}
                    placeholder="e.g. Google India"
                    className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Job Role</label>
                  <Input
                    value={placeRole}
                    onChange={(e) => setPlaceRole(e.target.value)}
                    placeholder="e.g. Associate Software Engineer"
                    className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Package (LPA)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={placePackage}
                    onChange={(e) => setPlacePackage(e.target.value)}
                    placeholder="e.g. 12.5"
                    className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</label>
                  <select
                    value={placeStatus}
                    onChange={(e) => setPlaceStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="placed">Placed (Full-Time)</option>
                    <option value="offered">Offered</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="applied">Applied</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={savingPlacement || !placeStudentId || !placeCompany || !placeRole || !placePackage}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs"
                >
                  {savingPlacement ? "Saving..." : "Log Placement"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Placement Roster & Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Analytics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-zinc-900/25 border-zinc-800 p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Average LPA</span>
                <span className="text-xl font-bold text-zinc-200 mt-2">{avgPackage} LPA</span>
              </Card>
              <Card className="bg-zinc-900/25 border-zinc-800 p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Highest LPA</span>
                <span className="text-xl font-bold text-zinc-200 mt-2 text-indigo-400">{maxPackage} LPA</span>
              </Card>
              <Card className="bg-zinc-900/25 border-zinc-800 p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Placed Students</span>
                <span className="text-xl font-bold text-zinc-200 mt-2 text-emerald-400">{totalPlaced} / {placements.length}</span>
              </Card>
            </div>

            {/* List */}
            <Card className="bg-zinc-900/25 border-zinc-800">
              <CardHeader className="p-5 border-b border-zinc-800/80 flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <ClipboardList className="w-4 h-4 text-indigo-400" />
                  Placement Directory ({filteredPlacements.length})
                </CardTitle>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student, role..."
                    className="bg-zinc-900 border-zinc-800 text-zinc-200 h-9 pl-9 pr-4 rounded-xl placeholder-zinc-700 text-xs w-full"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/20 text-zinc-500 text-[10px] uppercase font-mono font-bold">
                      <th className="px-5 py-3">Student Name</th>
                      <th className="px-5 py-3">Company Details</th>
                      <th className="px-5 py-3">Compensation</th>
                      <th className="px-5 py-3">Date logged</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredPlacements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                          No placement logs cataloged.
                        </td>
                      </tr>
                    ) : (
                      filteredPlacements.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-900/10">
                          <td className="px-5 py-3.5 font-semibold text-zinc-200">{p.studentName}</td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-zinc-350">{p.companyName}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{p.jobRole}</div>
                          </td>
                          <td className="px-5 py-3.5 font-bold font-mono text-zinc-200">{p.packageLpa ?? 0} LPA</td>
                          <td className="px-5 py-3.5 text-zinc-500">{new Date(p.placementDate).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                p.status === "placed"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-blue-500/10 text-blue-400"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
