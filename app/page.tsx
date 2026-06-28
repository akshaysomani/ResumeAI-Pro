"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    // Animate profile completeness progress bar on load
    const timer = setTimeout(() => {
      setProgressWidth(87);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const docContents = [
    {
      title: "Outreach & Networking Emails",
      icon: "✉️",
      hint: "High-impact, concise, action-oriented",
      previewLines: [
        { width: "70%", text: "Subject: Request for Career Chat / Akshay Somani", isTitle: true },
        { width: "100%", text: "Dear Technical Recruiter," },
        { width: "95%", text: "I recently reviewed your engineering team's open postings and was fascinated by your real-time cloud data pipeline scaling initiatives." },
        { width: "90%", text: "With 3 years of React/Next.js experience and a deep focus on Supabase data modeling, I would love to connect for a quick 10-minute chat." },
        { width: "50%", text: "Best regards, Candidate" }
      ]
    },
    {
      title: "Statement of Purpose",
      icon: "📝",
      hint: "Academic highlights & institutional fit",
      previewLines: [
        { width: "85%", text: "Statement of Purpose - Graduate Computer Science", isTitle: true },
        { width: "100%", text: "My research interests center on developing highly scalable, offline-first applications and client-side storage protocols." },
        { width: "95%", text: "At my previous firm, I optimized schema configurations which successfully slashed server synchronization traffic by 40%." },
        { width: "90%", text: "The dedicated research laboratories at your university align perfectly with my long-term career goals of building agentic systems." },
        { width: "40%", text: "Submitted by the candidate." }
      ]
    },
    {
      title: "Cover Letters",
      icon: "💼",
      hint: "Tailored to role & job description",
      previewLines: [
        { width: "75%", text: "Dear Lead Engineer at Google,", isTitle: true },
        { width: "100%", text: "I am writing to express my enthusiastic interest in the Senior Full-Stack Engineer opening." },
        { width: "95%", text: "My background building secure cloud architectures matches your core requirements. I have led teams in designing responsive frontends." },
        { width: "90%", text: "I would be honored to bring my experience in real-time platforms to Google's engineering team." },
        { width: "45%", text: "Sincerely, Akshay Somani" }
      ]
    },
    {
      title: "Proposals & Introductions",
      icon: "📊",
      hint: "Budget, scope, timeline-aware",
      previewLines: [
        { width: "65%", text: "Project Proposal: Web Application Redesign", isTitle: true },
        { width: "100%", text: "Scope: Port all customer-facing views to premium responsive designs and implement global themes." },
        { width: "85%", text: "Budget: Standard Retained Rate | Timeline: 5 Working Days" },
        { width: "95%", text: "Deliverables: Production-ready CSS-first layouts, integrated UI components, and visual validation reports." },
        { width: "50%", text: "Prepared for ResumeAI Pro Team" }
      ]
    }
  ];

  const handleTabChange = (index: number) => {
    setIsTyping(true);
    setActiveTab(index);
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="min-h-screen transition-colors duration-200">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-100 flex items-center justify-between py-5 px-6 md:px-12 bg-cream/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <Link href="/" className="nav-logo flex items-center gap-2 font-serif text-lg text-ink dark:text-cream no-underline">
          <span className="nav-logo-dot w-2.5 h-2.5 rounded-full bg-leaf"></span>
          ResumeAI Pro
        </Link>
        <ul className="nav-links hidden md:flex items-center gap-8 list-none">
          <li>
            <a href="#features" className="text-sm font-sans font-normal text-ink-light hover:text-ink dark:text-ink-faint dark:hover:text-cream no-underline transition-colors duration-200">
              Features
            </a>
          </li>
          <li>
            <a href="#documents" className="text-sm font-sans font-normal text-ink-light hover:text-ink dark:text-ink-faint dark:hover:text-cream no-underline transition-colors duration-200">
              Documents
            </a>
          </li>
          <li>
            <a href="#pricing" className="text-sm font-sans font-normal text-ink-light hover:text-ink dark:text-ink-faint dark:hover:text-cream no-underline transition-colors duration-200">
              Pricing
            </a>
          </li>
          <li>
            <Link href="/templates" className="text-sm font-sans font-normal text-ink-light hover:text-ink dark:text-ink-faint dark:hover:text-cream no-underline transition-colors duration-200">
              Templates
            </Link>
          </li>
        </ul>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg text-ink-light dark:text-ink-faint hover:text-ink dark:hover:text-cream hover:bg-black/5 dark:hover:bg-white/5"
          >
            {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </Button>

          {user ? (
            <Link href="/dashboard" className="nav-cta text-white font-sans text-xs py-2 px-5 rounded-full bg-ink hover:bg-leaf hover:text-white transition-all duration-200">
              Dashboard →
            </Link>
          ) : (
            <Link href="/auth" className="nav-cta text-white font-sans text-xs py-2 px-5 rounded-full bg-ink hover:bg-leaf hover:text-white transition-all duration-200">
              Get Started →
            </Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-inner">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="hero-text"
          >
            <div className="hero-label">
              <span className="hero-label-dot"></span>
              AI-Powered Career Suite
            </div>
            <h1 className="landing-h1">
              Your career,<br /><em>articulated</em><br />beautifully.
            </h1>
            <p className="hero-sub">
              ResumeAI Pro helps you craft cover letters, SOPs, outreach emails, and proposals — powered by AI, refined by intent.
            </p>
            <div className="hero-actions">
              <Link href={user ? "/dashboard" : "/auth"} className="btn-primary">
                Start Free
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#features" className="btn-secondary">See how it works ↓</a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-visual"
          >
            <div className="hero-card border border-black/5 dark:border-white/5 dark:bg-zinc-900">
              <div className="card-header">
                <div className="card-avatar">A</div>
                <span className="card-badge">✦ AI Active</span>
              </div>
              <div className="card-title text-ink dark:text-cream">Cover Letter Draft</div>
              <div className="card-sub">Software Engineer · Google · Generated just now</div>
              <div className="card-metric">
                <div className="metric-item dark:bg-zinc-800">
                  <span className="metric-num text-ink dark:text-cream">94</span>
                  <span className="metric-lbl">Match %</span>
                </div>
                <div className="metric-item dark:bg-zinc-800">
                  <span className="metric-num text-ink dark:text-cream">3</span>
                  <span className="metric-lbl">Versions</span>
                </div>
                <div className="metric-item dark:bg-zinc-800">
                  <span className="metric-num text-ink dark:text-cream">Pro</span>
                  <span className="metric-lbl">Tone</span>
                </div>
              </div>
              <div className="card-progress-label">
                <span>Profile completeness</span>
                <span>87%</span>
              </div>
              <div className="card-progress">
                <div className="card-progress-fill" style={{ width: `${progressWidth}%`, transition: "width 1.5s cubic-bezier(0.23, 1, 0.32, 1)" }}></div>
              </div>
              <div className="card-tags">
                <span className="tag dark:border-zinc-800">TypeScript</span>
                <span className="tag dark:border-zinc-800">Next.js</span>
                <span className="tag dark:border-zinc-800">Supabase</span>
                <span className="tag dark:border-zinc-800">ML Engineer</span>
              </div>
            </div>
            <div className="hero-pill border border-black/5 dark:border-white/5 dark:bg-zinc-900 dark:text-cream">
              <span className="pill-dot animate-ping"></span>
              AI is generating your cover letter…
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="section-label">What's inside</div>
          <h2 className="section-title text-ink dark:text-cream">Everything you need<br /><em>to get hired</em></h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="features-grid"
        >
          <div className="feat-card border border-black/5 dark:border-white/5 dark:bg-zinc-900">
            <div className="feat-icon dark:bg-zinc-800 text-leaf">✦</div>
            <div className="feat-title text-ink dark:text-cream">AI Document Generation</div>
            <p className="feat-desc dark:text-ink-faint">Stream-generated career documents tailored to your resume context and job description — in real time.</p>
            <Link href={user ? "/dashboard" : "/auth"} className="feat-link">Learn more →</Link>
          </div>
          <div className="feat-card accent">
            <div className="feat-icon dark:bg-zinc-800 text-gold">⏱</div>
            <div className="feat-title">Version History</div>
            <p className="feat-desc text-white/70">Every draft is snapshotted. Restore any version from a clean side-panel with a single click.</p>
            <Link href={user ? "/dashboard" : "/auth"} className="feat-link">Learn more →</Link>
          </div>
          <div className="feat-card border border-black/5 dark:border-white/5 dark:bg-zinc-900">
            <div className="feat-icon dark:bg-zinc-800 text-leaf">🔗</div>
            <div className="feat-title text-ink dark:text-cream">Secure Sharing Links</div>
            <p className="feat-desc dark:text-ink-faint">Share documents via password-protected links with configurable print and download permissions.</p>
            <Link href={user ? "/dashboard" : "/auth"} className="feat-link">Learn more →</Link>
          </div>
          <div className="feat-card border border-black/5 dark:border-white/5 dark:bg-zinc-900">
            <div className="feat-icon dark:bg-zinc-800 text-leaf">📁</div>
            <div className="feat-title text-ink dark:text-cream">Folder Organization</div>
            <p className="feat-desc dark:text-ink-faint">Color-coded folders, tag filters, and full-text search keep your document workspace tidy.</p>
            <Link href={user ? "/dashboard" : "/auth"} className="feat-link">Learn more →</Link>
          </div>
          <div className="feat-card border border-black/5 dark:border-white/5 dark:bg-zinc-900">
            <div className="feat-icon dark:bg-zinc-800 text-leaf">🛡</div>
            <div className="feat-title text-ink dark:text-cream">Row-Level Security</div>
            <p className="feat-desc dark:text-ink-faint">Your data is private by design — Supabase RLS ensures only you can access your documents.</p>
            <Link href={user ? "/dashboard" : "/auth"} className="feat-link">Learn more →</Link>
          </div>
          <div className="feat-card border border-black/5 dark:border-white/5 dark:bg-zinc-900">
            <div className="feat-icon dark:bg-zinc-800 text-leaf">📊</div>
            <div className="feat-title text-ink dark:text-cream">Usage Insights</div>
            <p className="feat-desc dark:text-ink-faint">Track your daily generation quota and upgrade seamlessly when you need unlimited access.</p>
            <Link href={user ? "/dashboard" : "/auth"} className="feat-link">Learn more →</Link>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-inner">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="section-label">The process</div>
            <h2 className="section-title">From intent<br /><em>to document</em></h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="steps"
          >
            <div className="step">
              <div className="step-num">01</div>
              <div className="step-title">Build your profile</div>
              <p className="step-desc">Add your experience, education, projects, and skills once. AI reads it automatically.</p>
              <div className="step-line"></div>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <div className="step-title">Choose a document</div>
              <p className="step-desc">Pick from cover letters, SOPs, outreach emails, or proposals — with guided fields.</p>
              <div className="step-line"></div>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <div className="step-title">Generate & refine</div>
              <p className="step-desc">Watch AI stream the draft in real time. Adjust tone, length, and focus as needed.</p>
              <div className="step-line"></div>
            </div>
            <div className="step">
              <div className="step-num">04</div>
              <div className="step-title">Share or export</div>
              <p className="step-desc">Send a secure link, copy text, or download — ready for any application platform.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DOCUMENTS */}
      <section className="documents" id="documents">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="section-label">Document types</div>
          <h2 className="section-title text-ink dark:text-cream">Every word,<br /><em>perfectly placed</em></h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="docs-layout"
        >
          <div className="doc-list">
            {docContents.map((doc, idx) => (
              <div
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={cn(
                  "doc-item border dark:bg-zinc-900/50",
                  activeTab === idx 
                    ? "active dark:bg-zinc-900 border-black/5 dark:border-white/5" 
                    : "border-transparent"
                )}
              >
                <div className="doc-icon text-lg dark:bg-zinc-800">{doc.icon}</div>
                <div>
                  <div className="doc-name text-ink dark:text-cream">{doc.title}</div>
                  <div className="doc-hint dark:text-ink-faint">{doc.hint}</div>
                </div>
                <div className="doc-arrow">→</div>
              </div>
            ))}
          </div>

          <div className="doc-preview border border-black/5 dark:border-white/5 dark:bg-zinc-900 min-h-[340px] flex flex-col justify-between">
            <div>
              <div className="doc-preview-header">
                <div className="dot dot-r"></div>
                <div className="dot dot-y"></div>
                <div className="dot dot-g"></div>
              </div>
              <div className="doc-preview-lines min-h-[220px]">
                {isTyping ? (
                  <div className="space-y-4 animate-pulse pt-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <div className="space-y-3">
                      {docContents[activeTab].previewLines.map((line, i) => (
                        <motion.div
                          key={`${activeTab}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.25 }}
                          className={cn(
                            line.isTitle 
                              ? "text-sm font-semibold text-ink dark:text-cream border-b border-black/5 dark:border-white/5 pb-2 mb-3 font-serif" 
                              : "text-xs text-ink-light dark:text-ink-faint leading-relaxed font-sans"
                          )}
                          style={{ width: line.width }}
                        >
                          {line.text}
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            </div>
            <div className="ai-badge border border-black/5 dark:border-white/5 dark:bg-zinc-800 text-white mt-4">
              <span className="ai-dot animate-ping"></span>
              {isTyping ? "AI writing…" : "AI Complete"}
            </div>
          </div>
        </motion.div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="section-label">Simple pricing</div>
          <h2 className="section-title text-ink dark:text-cream">Start free,<br /><em>scale when ready</em></h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="plans"
        >
          <div className="plan border border-black/5 dark:border-white/5 dark:bg-zinc-900 text-left">
            <div className="plan-name text-leaf">Free</div>
            <div className="plan-price text-ink dark:text-cream">$0</div>
            <div className="plan-period">forever</div>
            <ul className="plan-feats">
              <li className="text-ink-light dark:text-ink-faint"><span className="check">✓</span> 3 documents per day</li>
              <li className="text-ink-light dark:text-ink-faint"><span className="check">✓</span> All document types</li>
              <li className="text-ink-light dark:text-ink-faint"><span className="check">✓</span> Version history (5 snapshots)</li>
              <li className="text-ink-light dark:text-ink-faint"><span className="check">✓</span> Secure share links</li>
            </ul>
            <Link href={user ? "/dashboard" : "/auth"} className="plan-btn text-ink dark:text-cream border-cream-dark dark:border-zinc-800 hover:border-ink dark:hover:border-cream">
              Get started free
            </Link>
          </div>
          <div className="plan highlight text-left dark:bg-zinc-900 border border-black/5 dark:border-white/5">
            <div className="plan-name">Pro</div>
            <div className="plan-price">$9</div>
            <div className="plan-period">per month</div>
            <ul className="plan-feats">
              <li><span className="check">✓</span> Unlimited documents</li>
              <li><span className="check">✓</span> All document types</li>
              <li><span className="check">✓</span> Unlimited version history</li>
              <li><span className="check">✓</span> Password-protected links</li>
              <li><span className="check">✓</span> Priority AI generation</li>
            </ul>
            <Link href={user ? "/dashboard" : "/auth"} className="plan-btn">
              Upgrade to Pro
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer border-t border-black/10 dark:border-white/10 max-w-7xl mx-auto">
        <div className="footer-logo text-ink dark:text-cream">
          <span className="nav-logo-dot w-2.5 h-2.5 rounded-full bg-leaf"></span>
          ResumeAI Pro
        </div>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="https://github.com/akshaysomani/ResumeAI-Pro" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="#">Contact</a>
        </div>
        <div className="footer-copy text-ink-faint">© 2026 Akshay Somani</div>
      </footer>
    </div>
  );
}

