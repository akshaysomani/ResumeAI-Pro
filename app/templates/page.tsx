"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { templatesRegistry } from "@/lib/templates-registry";
import { FileText, Sun, Moon, ArrowRight, Star, Search, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = ["All", "ATS Friendly", "Modern", "Minimal", "Professional", "Executive", "Creative", "Academic"];

  const filteredTemplates = templatesRegistry.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = t.name.toLowerCase().includes(query) || 
                          t.description.toLowerCase().includes(query) ||
                          t.recommendedFor.some(r => r.toLowerCase().includes(query));
                          
    const matchesCategory = filter === "All" || t.category === filter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      {/* Navigation bar */}
      <nav className="h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 backdrop-blur-md dark:bg-zinc-950/70 sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">R</div>
          <span className="text-zinc-900 dark:text-white">ResumeAI Pro</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-650 dark:text-zinc-400">
          <Link href="/templates" className="text-indigo-600 dark:text-indigo-400">
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

      {/* Templates Header */}
      <section className="py-16 px-6 max-w-7xl mx-auto text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">Approved ATS Resume Layouts</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Select from our curation of 26 professional templates designed to maximize recruiter callbacks and pass parsing filters.
        </p>

        {/* Search Input */}
        <div className="relative max-w-md mx-auto pt-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pt-4 text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <Input
            type="text"
            placeholder="Search templates by role (e.g. tech, manager)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 pt-6">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? "default" : "outline"}
              onClick={() => setFilter(cat)}
              className="h-9 text-xs px-4 font-semibold"
            >
              {cat}
            </Button>
          ))}
        </div>
      </section>

      {/* Grid List */}
      <section className="pb-24 px-6 max-w-6xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((style) => (
            <Card key={style.id} className="overflow-hidden group flex flex-col justify-between border dark:border-zinc-800 text-left">
              <div>
                <div className="h-48 bg-zinc-100 dark:bg-zinc-900/60 border-b dark:border-zinc-800 flex items-center justify-center relative">
                  <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-700 group-hover:scale-105 transition-transform duration-300" />
                  
                  <span className={cn(
                    "absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow flex items-center gap-0.5", 
                    !style.isPremium 
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40" 
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40"
                  )}>
                    {style.isPremium ? <Zap className="h-3 w-3 text-amber-500 fill-amber-500" /> : null}
                    {style.isPremium ? "Pro" : "Free"}
                  </span>

                  <div className="absolute bottom-3 left-3 bg-white/80 dark:bg-zinc-950/80 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-500">
                    ATS Score: {style.atsScore}%
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-bold truncate text-zinc-900 dark:text-white">{style.name}</CardTitle>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span className="text-[10px] font-bold">{style.popularity}</span>
                    </div>
                  </div>
                  <CardDescription className="text-xs truncate">{style.category} layout style</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {style.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {style.recommendedFor.slice(0, 3).map((role) => (
                      <span key={role} className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </div>
              <div className="p-4 border-t dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 shrink-0">
                <Link href={`/dashboard/editor?template=${style.id}`}>
                  <Button className="w-full text-xs font-semibold h-9" variant={style.isPremium ? "outline" : "default"}>
                    Use Template <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">R</div>
            <span className="text-zinc-900 dark:text-white">ResumeAI Pro</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            © {new Date().getFullYear()} ResumeAI Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
