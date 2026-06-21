"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getResumeAction, saveResumeFullAction, queryResumesAction } from "@/app/actions/resumeActions";
import {
  Target,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  TrendingUp,
  History,
  File,
  Download,
  Check,
  Plus,
  ArrowRight,
  Sparkle
} from "lucide-react";
import type { Resume } from "@/types";

interface JobMatchResult {
  id?: string;
  overallMatch: number;
  keywordMatch: number;
  skillsMatch: number;
  experienceMatch: string;
  educationMatch: string;
  missingSkills: string[];
  extraQualifications: string[];
  recommendations: string[];
  jobTitle?: string;
  companyName?: string;
  generatedAt?: string;
}

export default function JobMatcherPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<JobMatchResult | null>(null);
  
  // Free vs Pro status details
  const [dailyUsage, setDailyUsage] = useState({ count: 0, limit: 1, plan: "free" });
  const [pastMatches, setPastMatches] = useState<any[]>([]);
  
  // Skills checking list
  const [checkedSkills, setCheckedSkills] = useState<string[]>([]);
  const [appendingSkills, setAppendingSkills] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/ai/usage");
      if (res.ok) {
        const data = await res.json();
        setDailyUsage({
          count: data.count,
          limit: 9999, // Unused since it's free
          plan: data.plan
        });
      }
    } catch (e) {
      console.error("Failed to load matching credits metrics:", e);
    }
  };

  const fetchPastMatchesList = async (resumeIds: string[]) => {
    if (resumeIds.length === 0) return;
    try {
      const { data, error: dbError } = await supabase
        .from("job_matches")
        .select("*")
        .in("resume_id", resumeIds)
        .order("generated_at", { ascending: false });

      if (!dbError && data) {
        setPastMatches(data);
      }
    } catch (err) {
      console.error("Could not fetch past matches logs:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchResumes = async () => {
      try {
        const data = await queryResumesAction({ userId: user.id });

        if (data) {
          const list: Resume[] = data.map((r: any) => ({
            id: r.id,
            userId: user.id,
            title: r.title,
            templateId: r.templateId || "modern",
            createdAt: r.createdAt || "",
            updatedAt: r.updatedAt || "",
            isPublic: r.isPublic || false,
            sections: [],
            status: r.status || "draft",
            isFavorite: r.isFavorite || false,
            isArchived: r.isArchived || false,
            colorTheme: r.colorTheme || "indigo",
            fontFamily: r.fontFamily || "sans",
            paperSize: r.paperSize || "A4",
            pageMargin: r.pageMargin || "normal",
            layoutStyle: r.layoutStyle || "single-column",
            resumeType: r.resumeType || "custom",
          }));
          setResumes(list);
          if (list.length > 0) {
            setSelectedResumeId(list[0].id);
          }
          // Fetch past matches linked to these resumes
          const resumeIds = list.map((r) => r.id);
          await fetchPastMatchesList(resumeIds);
        }
      } catch (err) {
        console.warn("Bypassed DB resume loading in matcher:", err);
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchResumes();
    fetchUsage();
  }, [user]);

  // Handle uploading of job description files (.txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      error("Unsupported format. Currently, we extract text content from .txt files directly. For Word/PDF, please copy and paste description text.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setJobDescription(text);
        success("Job description text extracted successfully.");
      }
    };
    reader.onerror = () => {
      error("Failed to read the file.");
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!selectedResumeId) {
      error("Please select a resume to compare.");
      return;
    }
    if (!jobDescription.trim()) {
      error("Please enter or paste the job description text.");
      return;
    }

    setAnalyzing(true);
    setResults(null);
    setCheckedSkills([]);

    try {
      const res = await fetch("/api/ai/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobDescription,
          jobTitle: jobTitle.trim() || "Target Position",
          companyName: companyName.trim() || "Target Company",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Scan failed with status ${res.status}`);
      }

      const report: JobMatchResult = await res.json();
      setResults(report);
      success("ATS Job description match analysis completed successfully!");
      
      // Refresh credit usage stats and matches logs
      fetchUsage();
      const resumeIds = resumes.map((r) => r.id);
      fetchPastMatchesList(resumeIds);
    } catch (err: any) {
      console.error("ATS Analyzer error:", err);
      error(err.message || "Failed to compare ATS match scores.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Append checked skills to resume database schema
  const handleAppendSkills = async () => {
    if (checkedSkills.length === 0 || !selectedResumeId) return;

    setAppendingSkills(true);
    try {
      const resume = await getResumeAction(selectedResumeId);
      if (!resume) throw new Error("Could not fetch the active resume schema.");

      // Find the skills section
      let skillsSec = resume.sections.find((s) => s.sectionType === "skills");
      if (!skillsSec) {
        // Add new skills section if missing
        skillsSec = {
          id: `sec-skills-${Date.now()}`,
          resumeId: selectedResumeId,
          sectionType: "skills",
          title: "Skills Competencies",
          orderIndex: resume.sections.length,
          content: [],
        };
        resume.sections.push(skillsSec);
      }

      const currentSkillsList = Array.isArray(skillsSec.content) ? skillsSec.content : [];
      const updatedSkillsList = [...currentSkillsList];

      checkedSkills.forEach((sk) => {
        if (!updatedSkillsList.some((s) => s.name?.toLowerCase() === sk.toLowerCase())) {
          updatedSkillsList.push({
            id: `item-${Date.now()}-${Math.random()}`,
            name: sk,
            category: "Technical",
            proficiency: "Intermediate",
          });
        }
      });

      skillsSec.content = updatedSkillsList;

      await saveResumeFullAction(selectedResumeId, resume);
      success(`Successfully added ${checkedSkills.length} skill(s) directly to your resume!`);
      setCheckedSkills([]);
    } catch (err: any) {
      console.error("Failed to append skills:", err);
      error(err.message || "Failed to add skills to resume.");
    } finally {
      setAppendingSkills(false);
    }
  };

  // Select a past match from logs list
  const handleSelectPastMatch = (match: any) => {
    let breakdown = match.match_breakdown;
    if (typeof breakdown === "string") {
      try {
        breakdown = JSON.parse(breakdown);
      } catch {
        breakdown = {};
      }
    }
    
    let parsedMissing = match.missing_skills;
    if (typeof parsedMissing === "string") {
      try {
        parsedMissing = JSON.parse(parsedMissing);
      } catch {
        parsedMissing = [];
      }
    }

    let parsedRecs = match.recommended_changes;
    if (typeof parsedRecs === "string") {
      try {
        parsedRecs = JSON.parse(parsedRecs);
      } catch {
        parsedRecs = [];
      }
    }

    setResults({
      id: match.id,
      overallMatch: match.match_percentage,
      keywordMatch: breakdown?.keywordMatch || match.match_percentage,
      skillsMatch: breakdown?.skillsMatch || match.match_percentage,
      experienceMatch: breakdown?.experienceMatch || "Alignment evaluated.",
      educationMatch: breakdown?.educationMatch || "Requirements verified.",
      missingSkills: parsedMissing || [],
      extraQualifications: breakdown?.extraQualifications || [],
      recommendations: parsedRecs || [],
      jobTitle: match.job_title,
      companyName: match.company_name,
    });
    setJobDescription(match.job_description);
    setJobTitle(match.job_title || "");
    setCompanyName(match.company_name || "");
    setSelectedResumeId(match.resume_id);
    setCheckedSkills([]);
    success("Historical ATS match report loaded.");
  };

  // Helper to color codes scores
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 50) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-red-500 border-red-500/30 bg-red-500/10";
  };

  return (
    <div className="space-y-6">
      {/* Visual Report header for printing */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">Job Matcher (ATS Analyzer)</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Assess alignment against job specs, detect missing resume keywords, and run scoring diagnostics.
          </p>
        </div>
        {results && (
          <Button
            variant="outline"
            className="text-xs flex items-center gap-1.5 h-9"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4" /> Download Scorecard PDF
          </Button>
        )}
      </div>

      {/* Printable Cover page view (styled for PDF download) */}
      {results && (
        <div className="hidden print:block text-left p-6 space-y-6 text-zinc-900 bg-white">
          <div className="border-b-2 border-indigo-600 pb-4">
            <h1 className="text-2xl font-extrabold tracking-tight">RESUMEAI PRO — ATS VALIDATION REPORT</h1>
            <p className="text-sm mt-1 text-zinc-500">
              Evaluated on {new Date().toLocaleDateString()} for role: <strong>{results.jobTitle}</strong> at <strong>{results.companyName}</strong>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-xl text-center">
              <span className="text-xs font-bold text-zinc-400 uppercase">Overall Match</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{results.overallMatch}%</p>
            </div>
            <div className="p-4 border rounded-xl text-center">
              <span className="text-xs font-bold text-zinc-400 uppercase">Keywords Match</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{results.keywordMatch}%</p>
            </div>
            <div className="p-4 border rounded-xl text-center">
              <span className="text-xs font-bold text-zinc-400 uppercase">Skills Match</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{results.skillsMatch}%</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold border-b pb-1 text-zinc-700 uppercase">Alignment Details</h3>
            <p className="text-xs leading-relaxed"><strong>Experience Quality:</strong> {results.experienceMatch}</p>
            <p className="text-xs leading-relaxed"><strong>Education Completeness:</strong> {results.educationMatch}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold border-b pb-1 text-zinc-700 uppercase">Detected Missing Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {results.missingSkills.map((sk) => (
                <span key={sk} className="border px-2 py-1 rounded text-xs">{sk}</span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold border-b pb-1 text-zinc-700 uppercase">Actionable Recommendations</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              {results.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Workspace grid (hidden on print) */}
      <div className="grid gap-6 lg:grid-cols-3 print:hidden">
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-zinc-950 dark:text-white">
                <FileText className="h-4.5 w-4.5 text-indigo-600" />
                Comparison Params
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Provide resume details and the target job posting spec.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {/* Select Resume */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select CV Resume</label>
                {loadingResumes ? (
                  <Skeleton className="h-9 w-full" />
                ) : resumes.length === 0 ? (
                  <div className="text-xs text-zinc-500 p-3 bg-zinc-50 dark:bg-zinc-900 border rounded-lg border-zinc-200 dark:border-zinc-800">
                    Create a resume first to run comparison matcher.
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target position info */}
              <div className="grid gap-2 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Job Title</label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. React Developer"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Company</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Stripe"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Upload TXT File */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Job Description Spec</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[9px] text-indigo-600 hover:text-indigo-700 hover:underline font-bold flex items-center gap-0.5"
                  >
                    <File className="h-3 w-3" /> Upload .txt
                  </button>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  className="hidden"
                />
                <Textarea
                  rows={9}
                  placeholder="Paste the full job posting requirements spec description text here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Limit notices info */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">ATS Score Scan:</span>
                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">
                    <span className="text-emerald-600 font-bold">Free & Unlimited Scans</span>
                  </p>
                </div>
              </div>

              <Button
                className="w-full h-10 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-1.5"
                onClick={handleAnalyze}
                disabled={analyzing || resumes.length === 0}
              >
                {analyzing ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Analyzing Keywords...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Calculate ATS Score
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Past Matches List */}
          {pastMatches.length > 0 && (
            <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
              <CardHeader className="py-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <History className="h-4 w-4 text-zinc-400" />
                  Past Scans History ({pastMatches.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[300px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 border-t border-zinc-100 dark:border-zinc-900">
                {pastMatches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => handleSelectPastMatch(match)}
                    className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer flex items-center justify-between transition-all"
                  >
                    <div className="min-w-0 pr-4">
                      <h5 className="text-xs font-extrabold truncate text-zinc-900 dark:text-zinc-250">
                        {match.job_title || "Unknown Role"}
                      </h5>
                      <span className="text-[9px] text-zinc-400 font-medium">
                        {match.company_name || "Unknown Company"} • {new Date(match.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${getScoreColor(match.match_percentage)}`}>
                      {match.match_percentage}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Output Analysis Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col h-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 min-h-[450px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-zinc-950 dark:text-white">
                <Target className="h-4.5 w-4.5 text-indigo-600" />
                ATS Readiness Report Card
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Matching breakdowns, missing skills checklists, and improvement advice.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-start p-6">
              {analyzing ? (
                <div className="space-y-4 w-full my-auto text-center py-12">
                  <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">
                    Scanning keywords & evaluating syntax metrics...
                  </p>
                  <div className="max-w-xs mx-auto space-y-2 pt-4">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-4/5 rounded mx-auto" />
                  </div>
                </div>
              ) : results ? (
                <div className="w-full space-y-6 text-left">
                  {/* Circular overall gauge card */}
                  <div className="grid gap-4 sm:grid-cols-3 bg-zinc-50 dark:bg-zinc-900/30 p-4 border dark:border-zinc-850 rounded-xl">
                    <div className="flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-150 dark:border-zinc-800 pb-3 sm:pb-0">
                      <div className="h-20 w-20 rounded-full border-4 border-indigo-600/20 flex flex-col items-center justify-center text-lg font-bold shrink-0 relative bg-white dark:bg-zinc-950">
                        <span className="text-indigo-600 dark:text-indigo-400 text-xl font-extrabold">{results.overallMatch}%</span>
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider leading-none">Match</span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-2.5">Overall ATS Compatibility</span>
                    </div>

                    <div className="sm:col-span-2 flex flex-col justify-center space-y-3.5 pr-2 pt-2 sm:pt-0">
                      {/* Technical skill match */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                          <span className="uppercase tracking-wider">Skills Relevance</span>
                          <span className="font-extrabold text-zinc-700 dark:text-zinc-300">{results.skillsMatch}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${results.skillsMatch}%` }}
                          />
                        </div>
                      </div>

                      {/* Keyword densities match */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                          <span className="uppercase tracking-wider">Keywords Density Match</span>
                          <span className="font-extrabold text-zinc-700 dark:text-zinc-300">{results.keywordMatch}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${results.keywordMatch}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alignment Checks */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-3 border dark:border-zinc-850 bg-zinc-50/30 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">Work Experience Quality</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">{results.experienceMatch}</p>
                    </div>
                    <div className="p-3 border dark:border-zinc-850 bg-zinc-50/30 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">Education Completeness</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">{results.educationMatch}</p>
                    </div>
                  </div>

                  {/* Missing Skills with insertion checkboxes */}
                  {results.missingSkills.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          Missing Critical Skills ({results.missingSkills.length})
                        </h4>
                        {checkedSkills.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAppendSkills}
                            disabled={appendingSkills}
                            className="h-6 text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200"
                          >
                            {appendingSkills ? "Saving..." : `Append Selected (${checkedSkills.length}) to CV`}
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {results.missingSkills.map((skill, i) => {
                          const isChecked = checkedSkills.includes(skill);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setCheckedSkills(
                                  isChecked
                                    ? checkedSkills.filter((s) => s !== skill)
                                    : [...checkedSkills, skill]
                                );
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-red-50/30 dark:bg-red-950/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-950 hover:bg-red-50/50"
                              }`}
                            >
                              {isChecked ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Extra Qualifications */}
                  {results.extraQualifications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                        <Sparkle className="h-3.5 w-3.5 text-indigo-500" />
                        Value-Add Qualifications & Certifications
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {results.extraQualifications.map((qual, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold"
                          >
                            {qual}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Actionable Improvement Checklist
                    </h4>
                    <div className="border border-zinc-100 dark:border-zinc-850 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-850 overflow-hidden">
                      {results.recommendations.map((rec, i) => (
                        <div key={i} className="p-3 bg-zinc-50/30 flex items-start gap-2.5">
                          <span className="h-4.5 w-4.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-[10px] text-indigo-600 font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-zinc-100 dark:border-zinc-900">
                    <Button
                      variant="outline"
                      className="text-xs font-bold border-zinc-300"
                      onClick={() => success("Opening download prompt...")}
                    >
                      Export Report
                    </Button>
                    <a href={`/dashboard/editor?id=${selectedResumeId}`}>
                      <Button className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1">
                        Go Edit & Fix Resume <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-16 my-auto text-center">
                  <div className="h-11 w-11 rounded-xl bg-zinc-50 dark:bg-zinc-900 border dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <Target className="h-5.5 w-5.5 text-zinc-400" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-500">Scans Viewport Empty</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Once you provide target params and paste a description, the circular ATS matcher and suggestions will render right here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
