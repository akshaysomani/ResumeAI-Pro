"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Plus, Trash2, Download, Eye, Sparkles } from "lucide-react";
import type { CoverLetter } from "@/types";

export default function CoverLettersPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [viewLetter, setViewLetter] = useState<CoverLetter | null>(null);
  
  // Form states
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [letterTitle, setLetterTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchLetters = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from("cover_letters")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!dbError && data) {
        setLetters(
          data.map((l: any) => ({
            id: l.id,
            userId: l.user_id,
            resumeId: l.resume_id,
            title: l.title,
            jobTitle: l.job_title,
            companyName: l.company_name,
            content: l.content,
            createdAt: l.created_at,
            updatedAt: l.updated_at,
          }))
        );
      }
    } catch (err: any) {
      console.warn("Cover letters database connection skipped:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [user]);

  const handleCreate = async () => {
    if (!jobTitle || !companyName || !letterTitle) {
      error("Please complete all form fields.");
      return;
    }
    setGenerating(true);

    try {
      const simulatedText = `Dear Hiring Team at ${companyName},

I am writing to express my enthusiastic interest in the ${jobTitle} position at your company. With my background in software architecture and full stack systems, I am confident that I can add immediate value to your technical projects.

Throughout my career, I have prioritized building clean, scalable services and delivering high-quality UI interfaces. I look forward to discussing how my experience fits your requirements.

Sincerely,
${user?.email?.split("@")[0] || "Applicant"}`;

      // Insert cover letter into Supabase
      const { data, error: insertError } = await supabase
        .from("cover_letters")
        .insert({
          user_id: user?.id,
          title: letterTitle,
          job_title: jobTitle,
          company_name: companyName,
          content: simulatedText,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        const newLetter: CoverLetter = {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          jobTitle: data.job_title,
          companyName: data.company_name,
          content: data.content,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setLetters((prev) => [newLetter, ...prev]);
      } else {
        // Fallback local append for demo compilation
        const mockLetter: CoverLetter = {
          id: `cl-${Date.now()}`,
          userId: user?.id || "user",
          title: letterTitle,
          jobTitle,
          companyName,
          content: simulatedText,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setLetters((prev) => [mockLetter, ...prev]);
      }

      success("Cover Letter generated successfully.");
      setCreateOpen(false);
      setJobTitle("");
      setCompanyName("");
      setLetterTitle("");
    } catch (err: any) {
      error(err.message || "Failed to create cover letter.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("cover_letters")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setLetters((prev) => prev.filter((l) => l.id !== id));
      success("Cover letter deleted.");
    } catch (err: any) {
      error("Failed to delete record.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Cover Letters</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generate matching professional cover letters tailored for specific company roles.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate New Letter
        </Button>
      </div>

      {/* Letters Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : letters.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No Cover Letters"
          description="Create customized cover letters linked to job openings and targeted resumes."
          actionText="Generate Cover Letter"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map((letter) => (
            <Card key={letter.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                </div>
                <CardTitle className="text-sm font-bold mt-3 leading-tight truncate">
                  {letter.title}
                </CardTitle>
                <CardDescription className="text-xs truncate">
                  {letter.jobTitle} at {letter.companyName}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 pb-2">
                <p className="text-xs text-zinc-400 truncate mt-1">
                  Generated: {new Date(letter.createdAt).toLocaleDateString()}
                </p>
              </CardContent>

              <CardFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="text-xs h-8 text-red-600 hover:text-red-500"
                  size="sm"
                  onClick={() => handleDelete(letter.id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button size="sm" className="h-8 text-xs px-2.5" variant="outline" onClick={() => setViewLetter(letter)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Creation Form Modal */}
      <Dialog isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-indigo-500 animate-spin" />
            Generate Cover Letter
          </DialogTitle>
          <DialogDescription>
            Specify the company details and role profile to draft a personalized cover letter.
          </DialogDescription>
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-500 uppercase">Document Name</label>
            <Input
              placeholder="e.g. Google Frontend Role Letter"
              value={letterTitle}
              onChange={(e) => setLetterTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Target Job Title</label>
              <Input
                placeholder="Senior Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-500 uppercase">Company Name</label>
              <Input
                placeholder="Google Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={generating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={generating}>
            Draft Letter
          </Button>
        </DialogFooter>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog isOpen={viewLetter !== null} onClose={() => setViewLetter(null)}>
        {viewLetter && (
          <>
            <DialogHeader>
              <DialogTitle>{viewLetter.title}</DialogTitle>
              <DialogDescription>
                Tailored for {viewLetter.jobTitle} at {viewLetter.companyName}
              </DialogDescription>
            </DialogHeader>
            <DialogContent>
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-xs leading-relaxed font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {viewLetter.content}
              </div>
            </DialogContent>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewLetter(null)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
