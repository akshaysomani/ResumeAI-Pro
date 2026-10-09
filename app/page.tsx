"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  FileText,
  Mail,
  GraduationCap,
  Briefcase,
  FileCheck2,
  ShieldCheck,
  FolderTree,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Lock,
  Check,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // Animate profile completeness progress bar on load
    const timer = setTimeout(() => {
      setProgressWidth(98);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const docContents = [
    {
      id: "outreach",
      title: "Outreach & Networking Emails",
      icon: Mail,
      hint: "Concise, personalized, action-oriented",
      previewLines: [
        { width: "70%", text: "Subject: Request for Career Chat / Senior Full-Stack Role", isTitle: true },
        { width: "100%", text: "Dear Engineering Hiring Team," },
        { width: "95%", text: "I recently reviewed your team's open postings and was fascinated by your real-time cloud data pipeline scaling initiatives." },
        { width: "90%", text: "With 4 years of React/Next.js and Supabase experience, I would love to connect for a brief 10-minute introductory chat." },
        { width: "50%", text: "Best regards, Alex Rivera" }
      ]
    },
    {
      id: "cover-letter",
      title: "Tailored Cover Letters",
      icon: Briefcase,
      hint: "Role-specific matching job description",
      previewLines: [
        { width: "75%", text: "Re: Application for Senior Full-Stack Engineer", isTitle: true },
        { width: "100%", text: "Dear Hiring Manager," },
        { width: "95%", text: "I am writing to express my enthusiastic interest in the Senior Full-Stack Engineer opening. My background in building responsive Next.js applications directly matches your core tech stack." },
        { width: "90%", text: "At my previous company, I spearheaded the frontend architecture redesign that slashed initial render latency by 35%." },
        { width: "45%", text: "Sincerely, Alex Rivera" }
      ]
    },
    {
      id: "sop",
      title: "Statement of Purpose",
      icon: GraduationCap,
      hint: "Academic highlights & institutional fit",
      previewLines: [
        { width: "85%", text: "Statement of Purpose — Graduate Computer Science", isTitle: true },
        { width: "100%", text: "My research interests center on developing highly scalable, offline-first applications and client-side storage protocols." },
        { width: "95%", text: "At my previous laboratory, I optimized schema configurations which successfully reduced server synchronization traffic by 40%." },
        { width: "90%", text: "The dedicated distributed systems labs at your institution align directly with my long-term career goals." },
        { width: "40%", text: "Submitted by Alex Rivera" }
      ]
    },
    {
      id: "proposal",
      title: "Project Proposals & Intro Notes",
      icon: FileText,
      hint: "Scope, deliverables, timeline-aware",
      previewLines: [
        { width: "65%", text: "Project Proposal: Web Application Modernization", isTitle: true },
        { width: "100%", text: "Scope: Port customer-facing views to responsive Next.js App Router architecture with automated ATS parsing." },
        { width: "85%", text: "Deliverables: Production-ready CSS layout system, accessible UI components, and WCAG AA verification." },
        { width: "95%", text: "Timeline: 5 Sprints | Milestone Review: Weekly checkpoints" },
        { width: "50%", text: "Prepared for ResumeAI Pro Team" }
      ]
    }
  ];

  const handleTabChange = (index: number) => {
    setIsTyping(true);
    setActiveTab(index);
    setTimeout(() => {
      setIsTyping(false);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextTab = (index + 1) % docContents.length;
      handleTabChange(nextTab);
      tabRefs.current[nextTab]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevTab = (index - 1 + docContents.length) % docContents.length;
      handleTabChange(prevTab);
      tabRefs.current[prevTab]?.focus();
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-200">
      {/* NAVIGATION */}
      <nav 
        aria-label="Main Navigation"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-4 px-6 md:px-12 bg-cream/90 dark:bg-background/90 backdrop-blur-md border-b border-border"
      >
        <Link 
          href="/" 
          className="nav-logo flex items-center gap-2 font-serif text-lg text-foreground no-underline focus-visible:outline-2 focus-visible:outline-leaf rounded-sm"
        >
          <span className="nav-logo-dot w-2.5 h-2.5 rounded-full bg-leaf"></span>
          ResumeAI Pro
        </Link>
        
        <ul className="nav-links hidden md:flex items-center gap-8 list-none">
          <li>
            <a 
              href="#features" 
              className="text-sm font-sans font-normal text-muted-foreground hover:text-foreground no-underline transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-leaf rounded-sm"
            >
              Features
            </a>
          </li>
          <li>
            <a 
              href="#documents" 
              className="text-sm font-sans font-normal text-muted-foreground hover:text-foreground no-underline transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-leaf rounded-sm"
            >
              Documents
            </a>
          </li>
          <li>
            <Link 
              href="/templates" 
              className="text-sm font-sans font-normal text-muted-foreground hover:text-foreground no-underline transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-leaf rounded-sm"
            >
              Templates
            </Link>
          </li>
          <li>
            <a 
              href="#pricing" 
              className="text-sm font-sans font-normal text-muted-foreground hover:text-foreground no-underline transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-leaf rounded-sm"
            >
              Pricing
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-muted focus-visible:outline-2 focus-visible:outline-leaf"
          >
            {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </Button>

          {user ? (
            <Link 
              href="/dashboard" 
              className="nav-cta focus-visible:outline-2 focus-visible:outline-leaf"
            >
              Dashboard →
            </Link>
          ) : (
            <Link 
              href="/auth" 
              className="nav-cta focus-visible:outline-2 focus-visible:outline-leaf"
            >
              Get Started →
            </Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-bg" aria-hidden="true"></div>
        <div className="hero-inner">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="hero-text"
          >
            <div className="hero-label">
              <span className="hero-label-dot"></span>
              ATS Resume & Career Suite
            </div>
            
            <h1 id="hero-heading" className="landing-h1">
              Your resume & career,<br /><em>engineered</em><br />to win the role.
            </h1>
            
            <p className="hero-sub">
              Build ATS-optimized resumes that pass automated screenings, paired with AI-tailored cover letters, SOPs, and outreach emails grounded in your experience.
            </p>
            
            <div className="hero-actions">
              <Link 
                href={user ? "/dashboard" : "/auth"} 
                className="btn-primary focus-visible:outline-2 focus-visible:outline-leaf"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a 
                href="#features" 
                className="btn-secondary focus-visible:outline-2 focus-visible:outline-leaf"
              >
                Explore Features ↓
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="hero-visual"
            aria-label="Interactive ATS Resume and Career Suite preview"
          >
            <div className="hero-card">
              {/* Card Header: Candidate info & ATS score */}
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <div className="card-avatar" aria-hidden="true">AR</div>
                  <div>
                    <div className="text-sm font-semibold text-foreground leading-tight">Alex Rivera</div>
                    <div className="text-xs text-muted-foreground">Senior Full-Stack Engineer</div>
                  </div>
                </div>
                <span className="card-badge flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-leaf" />
                  ATS Score: 98%
                </span>
              </div>

              {/* Resume summary snippet */}
              <div className="rounded-lg bg-cream/70 dark:bg-muted/60 p-3 mb-4 border border-border">
                <div className="text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
                  <span>Professional Summary</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-leaf font-semibold">ATS Compliant</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Full-stack engineer with 4+ years designing high-throughput React/Next.js systems and distributed architectures with Supabase. Slashed sync latency by 40% via optimistic client caching.
                </p>
              </div>

              {/* Metric metrics */}
              <div className="card-metric">
                <div className="metric-item">
                  <span className="metric-num">98%</span>
                  <span className="metric-lbl">Keyword Match</span>
                </div>
                <div className="metric-item">
                  <span className="metric-num">8</span>
                  <span className="metric-lbl">ATS Templates</span>
                </div>
                <div className="metric-item">
                  <span className="metric-num">35/d</span>
                  <span className="metric-lbl">Free AI Quota</span>
                </div>
              </div>

              {/* Progress */}
              <div className="card-progress-label">
                <span>ATS Parsing Readiness</span>
                <span className="font-semibold text-leaf">98%</span>
              </div>
              <div className="card-progress" role="progressbar" aria-valuenow={progressWidth} aria-valuemin={0} aria-valuemax={100}>
                <div 
                  className="card-progress-fill" 
                  style={{ width: `${progressWidth}%`, transition: "width 1.2s cubic-bezier(0.23, 1, 0.32, 1)" }}
                ></div>
              </div>

              {/* Tags */}
              <div className="card-tags" aria-label="Parsed technical skills">
                <span className="tag">TypeScript</span>
                <span className="tag">Next.js 16</span>
                <span className="tag">React 19</span>
                <span className="tag">PostgreSQL</span>
                <span className="tag">Supabase</span>
              </div>
            </div>

            <div className="hero-pill">
              <Sparkles className="h-3.5 w-3.5 text-leaf animate-pulse" />
              <span>AI Active · Tailoring resume bullets to target role</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features" aria-labelledby="features-heading">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">Core Capabilities</div>
          <h2 id="features-heading" className="section-title">
            Engineered to pass screenings<br /><em>and land interviews</em>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="features-grid"
        >
          {/* Feature 1 */}
          <div className="feat-card">
            <div className="feat-icon text-leaf">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="feat-title">ATS-Compliant Resume Engine</div>
            <p className="feat-desc">
              Choose from 8 single and multi-column templates structured specifically for applicant tracking systems, avoiding unreadable formatting traps.
            </p>
          </div>

          {/* Feature 2 (Accent) */}
          <div className="feat-card accent">
            <div className="feat-icon">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="feat-title">Tailored Career Documents</div>
            <p className="feat-desc">
              Stream role-targeted cover letters, statements of purpose, and outreach emails grounded directly in your resume context and job requirements.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feat-card">
            <div className="feat-icon text-leaf">
              <Clock className="h-5 w-5" />
            </div>
            <div className="feat-title">Version Snapshot History</div>
            <p className="feat-desc">
              Every major update creates a historical checkpoint. Compare draft iterations and roll back content with one-click snapshot restoration.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="feat-card">
            <div className="feat-icon text-leaf">
              <Lock className="h-5 w-5" />
            </div>
            <div className="feat-title">Password-Protected Sharing</div>
            <p className="feat-desc">
              Share resumes and proposals via custom URLs with optional SHA-256 password protection and configurable print/download permissions.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="feat-card">
            <div className="feat-icon text-leaf">
              <FolderTree className="h-5 w-5" />
            </div>
            <div className="feat-title">Organized Workspaces</div>
            <p className="feat-desc">
              Keep your job hunt tidy with color-coded folders, tag filters, and fast full-text search across all your resumes and supporting documents.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="feat-card">
            <div className="feat-icon text-leaf">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="feat-title">Private by Design</div>
            <p className="feat-desc">
              Your career data belongs to you. Guarded by PostgreSQL Row-Level Security (RLS) ensuring strict isolation across all user profiles.
            </p>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how" aria-labelledby="how-heading">
        <div className="how-inner">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-label">Workflow</div>
            <h2 id="how-heading" className="section-title">
              From profile<br /><em>to interview-ready</em>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="steps"
          >
            <div className="step">
              <div className="step-num font-serif">1</div>
              <div className="step-title font-serif">Enter your career profile</div>
              <p className="step-desc">
                Add your work experience, education, projects, and skills once to establish your master career context.
              </p>
              <div className="step-line" aria-hidden="true"></div>
            </div>

            <div className="step">
              <div className="step-num font-serif">2</div>
              <div className="step-title font-serif">Choose layout or document</div>
              <p className="step-desc">
                Select from 8 ATS resume layouts or pick a targeted career document template with guided input fields.
              </p>
              <div className="step-line" aria-hidden="true"></div>
            </div>

            <div className="step">
              <div className="step-num font-serif">3</div>
              <div className="step-title font-serif">Stream AI enhancements</div>
              <p className="step-desc">
                Watch AI stream tailored bullet points, cover letters, or SOPs in real time with adjustable tone and length.
              </p>
              <div className="step-line" aria-hidden="true"></div>
            </div>

            <div className="step">
              <div className="step-num font-serif">4</div>
              <div className="step-title font-serif">Export & share securely</div>
              <p className="step-desc">
                Download ATS-compliant PDFs or generate password-protected shareable links ready for recruiter review.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DOCUMENTS SHOWCASE */}
      <section className="documents" id="documents" aria-labelledby="documents-heading">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">Document Suite</div>
          <h2 id="documents-heading" className="section-title">
            Every application asset,<br /><em>perfectly tailored</em>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="docs-layout"
        >
          {/* Accessible Tab List */}
          <div 
            className="doc-list" 
            role="tablist" 
            aria-label="Career Document Categories"
          >
            {docContents.map((doc, idx) => {
              const IconComponent = doc.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={doc.id}
                  id={`doc-tab-${idx}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`doc-panel-${idx}`}
                  tabIndex={isActive ? 0 : -1}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  onClick={() => handleTabChange(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={cn(
                    "doc-item w-full text-left font-sans transition-all duration-200 focus-visible:outline-2 focus-visible:outline-leaf focus-visible:ring-2 focus-visible:ring-leaf/20",
                    isActive && "active"
                  )}
                >
                  <div className={cn("doc-icon text-lg", isActive && "active")}>
                    <IconComponent className="h-4.5 w-4.5 text-current" />
                  </div>
                  <div className="flex-1">
                    <div className="doc-name font-medium">{doc.title}</div>
                    <div className="doc-hint text-xs">{doc.hint}</div>
                  </div>
                  <ChevronRight className={cn("doc-arrow h-4 w-4 text-muted-foreground transition-transform duration-200", isActive && "rotate-90 text-leaf")} />
                </button>
              );
            })}
          </div>

          {/* Accessible Tab Panel */}
          <div 
            id={`doc-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`doc-tab-${activeTab}`}
            className="doc-preview min-h-[360px] flex flex-col justify-between"
          >
            <div>
              <div className="doc-preview-header" aria-hidden="true">
                <div className="dot dot-r"></div>
                <div className="dot dot-y"></div>
                <div className="dot dot-g"></div>
                <span className="ml-2 text-[11px] font-mono text-muted-foreground">{docContents[activeTab].title} Preview</span>
              </div>
              
              <div className="doc-preview-lines min-h-[220px] pt-1">
                {isTyping ? (
                  <div className="space-y-4 animate-pulse pt-2" aria-live="polite">
                    <div className="h-4 bg-cream-dark dark:bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-cream-dark dark:bg-muted rounded w-full"></div>
                    <div className="h-3 bg-cream-dark dark:bg-muted rounded w-5/6"></div>
                    <div className="h-3 bg-cream-dark dark:bg-muted rounded w-2/3"></div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <div className="space-y-3">
                      {docContents[activeTab].previewLines.map((line, i) => (
                        <motion.div
                          key={`${activeTab}-${i}`}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.2 }}
                          className={cn(
                            line.isTitle 
                              ? "text-sm font-semibold text-foreground border-b border-border pb-2 mb-3 font-serif" 
                              : "text-xs text-muted-foreground leading-relaxed font-sans"
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
            
            <div className="ai-badge mt-4">
              <span className="ai-dot animate-pulse"></span>
              {isTyping ? "AI streaming preview…" : "AI Generation Complete"}
            </div>
          </div>
        </motion.div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing" aria-labelledby="pricing-heading">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label">Transparent Plans</div>
          <h2 id="pricing-heading" className="section-title">
            Start free,<br /><em>upgrade for unlimited</em>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="plans"
        >
          {/* Free Tier */}
          <div className="plan text-left">
            <div className="plan-name">Free Tier</div>
            <div className="plan-price">$0</div>
            <div className="plan-period">forever</div>
            
            <ul className="plan-feats">
              <li>
                <Check className="h-4 w-4 text-leaf shrink-0" />
                <span><strong>35 AI generations</strong> per day</span>
              </li>
              <li>
                <Check className="h-4 w-4 text-leaf shrink-0" />
                <span>Standard ATS resume templates</span>
              </li>
              <li>
                <Check className="h-4 w-4 text-leaf shrink-0" />
                <span>Version history snapshots</span>
              </li>
              <li>
                <Check className="h-4 w-4 text-leaf shrink-0" />
                <span>Public share links & PDF export</span>
              </li>
            </ul>
            
            <Link 
              href={user ? "/dashboard" : "/auth"} 
              className="plan-btn focus-visible:outline-2 focus-visible:outline-leaf"
            >
              Get started free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="plan highlight text-left">
            <div className="plan-name">Pro Tier</div>
            <div className="plan-price">$9</div>
            <div className="plan-period">per month</div>
            
            <ul className="plan-feats">
              <li>
                <Check className="h-4 w-4 text-leaf-pale dark:text-leaf shrink-0" />
                <span><strong>Unlimited</strong> AI generations</span>
              </li>
              <li>
                <Check className="h-4 w-4 text-leaf-pale dark:text-leaf shrink-0" />
                <span>All 8 ATS & executive templates</span>
              </li>
              <li>
                <Check className="h-4 w-4 text-leaf-pale dark:text-leaf shrink-0" />
                <span>Unlimited version snapshots</span>
              </li>
              <li>
                <Check className="h-4 w-4 text-leaf-pale dark:text-leaf shrink-0" />
                <span>Password-protected share links</span>
              </li>
              <li>
                <Check className="h-4 w-4 text-leaf-pale dark:text-leaf shrink-0" />
                <span>Priority AI streaming & coach access</span>
              </li>
            </ul>
            
            <Link 
              href={user ? "/dashboard" : "/auth"} 
              className="plan-btn focus-visible:outline-2 focus-visible:outline-leaf"
            >
              Upgrade to Pro
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer max-w-7xl mx-auto" aria-label="Footer">
        <div className="footer-logo">
          <span className="nav-logo-dot w-2.5 h-2.5 rounded-full bg-leaf" aria-hidden="true"></span>
          ResumeAI Pro
        </div>
        
        <div className="footer-links">
          <Link href="/templates" className="hover:text-foreground transition-colors">
            Templates
          </Link>
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
          <a 
            href="https://github.com/akshaysomani/ResumeAI-Pro" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        <div className="footer-copy">
          © {new Date().getFullYear()} ResumeAI Pro · All rights reserved.
        </div>
      </footer>
    </div>
  );
}


