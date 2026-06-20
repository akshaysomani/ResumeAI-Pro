"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, Sun, Moon, ArrowRight, Zap, Sparkles } from "lucide-react";

export default function PricingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    setLoading(true);
    setTimeout(() => {
      success("Redirecting to checkout billing portal...");
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Navigation bar */}
      <nav className="h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 backdrop-blur-md dark:bg-zinc-950/70 sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">R</div>
          <span>ResumeAI Pro</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          <Link href="/templates" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            Templates
          </Link>
          <Link href="/pricing" className="text-indigo-600 dark:text-indigo-400">
            Pricing
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg text-zinc-500 dark:text-zinc-400"
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

      {/* Pricing Header Banner */}
      <section className="py-16 px-6 max-w-7xl mx-auto text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">Flexible Plans Built For Your Career</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Upgrade to Pro to export unlimited documents, unlock template styles, and check ATS scores.
        </p>
      </section>

      {/* Plans comparison cards */}
      <section className="pb-24 px-6 max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Free Plan</CardTitle>
            <div className="mt-2 flex items-baseline text-zinc-900 dark:text-zinc-50">
              <span className="text-3xl font-extrabold tracking-tight">$0</span>
              <span className="ml-1 text-xs font-semibold text-zinc-500">/ forever</span>
            </div>
            <CardDescription className="text-xs mt-2">
              For individuals seeking quick resume updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 pb-6 border-t pt-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Build up to 2 resumes</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Access standard templates</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>5 AI helper content generations per day</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <Link href="/auth" className="w-full">
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="flex flex-col relative border-indigo-500 dark:border-indigo-600 shadow-lg bg-indigo-50/10 dark:bg-indigo-950/10">
          <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Zap className="h-3 w-3 fill-current" /> Premium Option
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Pro Plan</CardTitle>
            <div className="mt-2 flex items-baseline text-zinc-900 dark:text-zinc-50">
              <span className="text-3xl font-extrabold tracking-tight">$9</span>
              <span className="ml-1 text-xs font-semibold text-zinc-500">/ month</span>
            </div>
            <CardDescription className="text-xs mt-2">
              Accelerate your hiring callbacks by listing targeted keywords.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 pb-6 border-t pt-4">
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Create unlimited resumes</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Access all templates (Modern, Executive, etc.)</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Unlimited AI helper generations</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Full ATS Job Match Checker</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Tailored cover letters & LinkedIn generators</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4 border-t bg-indigo-500/5 dark:bg-indigo-950/20">
            <Button className="w-full" onClick={handleCheckout} isLoading={loading}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Upgrade to Pro
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center">
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">R</div>
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
