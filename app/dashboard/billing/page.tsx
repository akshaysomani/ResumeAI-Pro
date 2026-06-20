"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, ShieldCheck, Zap, Sparkles, CreditCard } from "lucide-react";

export default function BillingPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Simulate redirection to Stripe/Razorpay payment session
      setTimeout(() => {
        success("Redirecting to secure checkout portal...");
        setLoading(false);
      }, 1500);
    } catch (err) {
      error("Failed to load checkout portal.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Billing & Subscriptions</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your subscription plans, credits usage, payment preferences, and invoices.
        </p>
      </div>

      {/* Plans Card split */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        {/* Free Plan */}
        <Card className="flex flex-col relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Free Plan</CardTitle>
            <div className="mt-2 flex items-baseline text-zinc-900 dark:text-zinc-50">
              <span className="text-3xl font-extrabold tracking-tight">$0</span>
              <span className="ml-1 text-xs font-semibold text-zinc-500">/ forever</span>
            </div>
            <CardDescription className="text-xs mt-2">
              Core basics for single applications or quick CV formats.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 pb-6">
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Build up to 2 resumes</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Basic layout designer templates</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>5 AI helper content generations per day</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4 border-t bg-zinc-50/30 dark:bg-zinc-900/10">
            <Button className="w-full" variant="outline" disabled>
              Current Active Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className="flex flex-col relative border-indigo-500 dark:border-indigo-600 shadow-lg bg-indigo-50/10 dark:bg-indigo-950/10">
          <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Zap className="h-3 w-3 fill-current" /> Recommended
          </div>

          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Pro Plan</CardTitle>
            <div className="mt-2 flex items-baseline text-zinc-900 dark:text-zinc-50">
              <span className="text-3xl font-extrabold tracking-tight">$9</span>
              <span className="ml-1 text-xs font-semibold text-zinc-500">/ month</span>
            </div>
            <CardDescription className="text-xs mt-2">
              Full access for serious job seekers ready to land interviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 pb-6">
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Create unlimited resumes</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Access all premium A4 style templates</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Unlimited AI assistant generations</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Full ATS Job Match Checker & Keyword Parser</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Tailored cover letters & LinkedIn generators</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4 border-t bg-indigo-500/5 dark:bg-indigo-950/20">
            <Button className="w-full" onClick={handleUpgrade} isLoading={loading}>
              <Sparkles className="mr-1.5 h-4 w-4" /> Upgrade to Pro
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
