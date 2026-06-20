"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Target,
  FileText,
  MousePointerClick,
  Share2,
  Download,
  Sun,
  Moon,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = [
    {
      q: "What is an ATS-friendly resume?",
      a: "Applicant Tracking Systems (ATS) scan resumes for specific layout structures and keyword densities before recruiters see them. Our templates use standard single-column sections and machine-readable text to ensure 100% compatibility.",
    },
    {
      q: "How does the AI builder write bullet points?",
      a: "Our assistant analyzes your short prompt descriptors and expands them into action-oriented achievements with key performance metrics, aligning them to standard industry guidelines.",
    },
    {
      q: "Can I download my resume as a PDF or DOCX file?",
      a: "Yes! The visual editor supports print layout options, letting you print to PDF directly or export docx configurations.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Navigation bar */}
      <nav className="h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 backdrop-blur-md dark:bg-zinc-950/70 sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">
            R
          </div>
          <span>ResumeAI <span className="text-indigo-600 font-bold text-xs bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded-md">PRO</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          <Link href="/templates" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            Templates
          </Link>
          <Link href="/pricing" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="font-semibold text-xs h-9 px-4">
                Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="sm" className="font-semibold text-xs h-9 px-4">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient py-20 px-6 max-w-7xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4 max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Open AI-GPT Engine
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-100 dark:to-zinc-500 bg-clip-text text-transparent">
            Build ATS-Friendly Resumes in Minutes
          </h1>
          <p className="text-md md:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Generate bullet points, draft cover letters, adjust spacing, and verify match scores against job postings.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center gap-4"
        >
          <Link href={user ? "/dashboard" : "/auth"}>
            <Button size="lg" className="font-bold">
              Build My Resume <ArrowRight className="ml-1.5 h-4.5 w-4.5" />
            </Button>
          </Link>
          <Link href="/templates">
            <Button size="lg" variant="outline" className="font-bold">
              View Templates
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Enterprise Features Built For Success</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Everything you need to compile, verify, and output perfect resumes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold mt-4">AI Writer Bullet Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Translate basic tasks into action verbs and numbers to prove capability.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Target className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold mt-4">ATS Job Spec Matcher</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Check compatibility against target descriptions and identify missing skill tags.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold mt-4">Visual Layout Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Tweak fonts, accent colors, margin spacing, and item layout heights in A4 sheets.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Templates Catalog Preview */}
      <section className="py-20 px-6 max-w-7xl mx-auto bg-zinc-50/50 dark:bg-zinc-950/30 border-y border-zinc-200/80 dark:border-zinc-800/80 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Approved Professional Templates</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Clean single-column layouts engineered to pass parsing checks.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {["Modern Style", "Minimalist Style", "Executive Style"].map((name, i) => (
            <Card key={i} className="group overflow-hidden">
              <div className="h-60 bg-zinc-100 dark:bg-zinc-900 border-b flex items-center justify-center relative">
                <FileText className="h-16 w-16 text-zinc-300 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link href="/templates">
                    <Button size="sm" className="text-xs font-semibold">
                      Use Template
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs font-bold">{name}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Trusted By Candidates</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Read what professionals say about landing job interviews.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <Card className="p-6">
            <div className="flex gap-1 text-amber-500 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
              "The ATS Job Matcher was the differentiator. I added Redis and Kubernetes to my resume where requested, and got a callback from Amazon the following week."
            </p>
            <p className="text-xs font-bold mt-4 text-zinc-900 dark:text-white">Alex Chen, DevOps Engineer</p>
          </Card>
          <Card className="p-6">
            <div className="flex gap-1 text-amber-500 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
              "Generating bullet points was simple. It expanded my brief descriptions into high-quality achievements with numbers."
            </p>
            <p className="text-xs font-bold mt-4 text-zinc-900 dark:text-white">Sarah Jenkins, Product Manager</p>
          </Card>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-6 max-w-3xl mx-auto space-y-12">
        <h2 className="text-2xl font-bold text-center tracking-tight">Frequently Asked Questions</h2>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {faqItems.map((item, i) => (
            <div key={i} className="py-4">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between font-semibold text-left text-sm py-2 hover:opacity-80 transition-opacity"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={cn("h-4 w-4 text-zinc-400 transition-transform", {
                    "rotate-180": openFaq === i,
                  })}
                />
              </button>
              {openFaq === i && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2.5">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">R</div>
            <span>ResumeAI Pro</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            © {new Date().getFullYear()} ResumeAI Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
