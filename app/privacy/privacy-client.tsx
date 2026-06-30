"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Shield, Lock, Eye, Key, Trash2, HelpCircle } from "lucide-react";

export default function PrivacyClient() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("collect");

  const sections = [
    { id: "collect", title: "1. Data We Collect", icon: Eye },
    { id: "usage", title: "2. How We Use Data", icon: Shield },
    { id: "ai-privacy", title: "3. AI & Privacy", icon: Key },
    { id: "security", title: "4. Security & Retention", icon: Lock },
    { id: "gdpr-ccpa", title: "5. Your Rights (GDPR & CCPA)", icon: Trash2 },
    { id: "cookies", title: "6. Cookie Policy", icon: HelpCircle },
  ];

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Offset for fixed nav
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-zinc-950 text-ink dark:text-cream transition-colors duration-200">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-5 px-6 md:px-12 bg-cream/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <Link href="/" className="nav-logo flex items-center gap-2 font-serif text-lg text-ink dark:text-cream no-underline">
          <span className="nav-logo-dot w-2.5 h-2.5 rounded-full bg-leaf"></span>
          ResumeAI Pro
        </Link>
        <ul className="nav-links hidden md:flex items-center gap-8 list-none">
          <li>
            <Link href="/#features" className="text-sm font-sans font-normal text-ink-light hover:text-ink dark:text-ink-faint dark:hover:text-cream no-underline transition-colors duration-200">
              Features
            </Link>
          </li>
          <li>
            <Link href="/#documents" className="text-sm font-sans font-normal text-ink-light hover:text-ink dark:text-ink-faint dark:hover:text-cream no-underline transition-colors duration-200">
              Documents
            </Link>
          </li>
          <li>
            <Link href="/#pricing" className="text-sm font-sans font-normal text-ink-light hover:text-ink dark:text-ink-faint dark:hover:text-cream no-underline transition-colors duration-200">
              Pricing
            </Link>
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
      <section className="pt-32 pb-16 px-6 md:px-12 max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-leaf bg-leaf/10 dark:bg-leaf/20 rounded-full px-3.5 py-1.5 mb-4">
          <Shield className="h-3.5 w-3.5" /> Trust & Compliance
        </div>
        <h1 className="font-serif text-3xl md:text-5xl text-ink dark:text-cream tracking-tight max-w-2xl mx-auto">
          Privacy Policy
        </h1>
        <p className="text-sm md:text-base text-ink-light dark:text-ink-faint max-w-lg mx-auto mt-4 font-sans font-light">
          Last Updated: June 30, 2026. Learn how we handle your resume, credentials, and generation metadata securely.
        </p>
      </section>

      {/* CONTENT & SIDEBAR */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24 grid grid-cols-1 lg:grid-cols-4 gap-12 relative z-10">
        {/* Table of Contents (Desktop) */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-28 self-start">
          <div className="bg-white/50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="font-serif text-base mb-4 text-ink dark:text-cream">Sections</h3>
            <ul className="space-y-1 list-none p-0 m-0">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => handleScrollTo(section.id)}
                      className={`w-full text-left flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-leaf text-white"
                          : "text-ink-light dark:text-ink-faint hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <IconComponent className="h-4 w-4 shrink-0" />
                      <span>{section.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Content Pane */}
        <div className="col-span-1 lg:col-span-3 space-y-12">
          {/* Section: Collect */}
          <div id="collect" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">1. Data We Collect</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                At ResumeAI Pro, we value your privacy and aim to be transparent about the data we collect.
                We only collect information necessary to provide, support, and enhance our AI document builder:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Account Information:</strong> When you register, we collect your name, email address,
                  and authentication details from services like Supabase Auth.
                </li>
                <li>
                  <strong>User Profile Information:</strong> Any information you supply to build your profile,
                  including education history, job roles, achievements, skills, and social URLs.
                </li>
                <li>
                  <strong>Document Context:</strong> Uploaded resume files, cover letters, and statements of
                  purpose that you draft using our real-time builders.
                </li>
                <li>
                  <strong>Payment Data:</strong> All financial transactions are securely managed via billing portals.
                  We do not directly process or store your credit card credentials.
                </li>
              </ul>
            </div>
          </div>

          {/* Section: Usage */}
          <div id="usage" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">2. How We Use Data</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>We process your information in accordance with applicable legal grounds for the following goals:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>To Power Builders:</strong> Feeding your profile variables into document models to generate
                  custom cover letters, SOPs, and resumes in real time.
                </li>
                <li>
                  <strong>ATS Optimization checks:</strong> Analysing keywords and computing ATS compatibility match scores.
                </li>
                <li>
                  <strong>Analytics & Improvement:</strong> Measuring tool usage frequency and system performance parameters
                  to resolve interface latency issues.
                </li>
                <li>
                  <strong>Communication:</strong> Relaying critical security advisories, billing invoices, or updates on quota credits.
                </li>
              </ul>
            </div>
          </div>

          {/* Section: AI Privacy */}
          <div id="ai-privacy" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <Key className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">3. AI & Privacy</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                ResumeAI Pro leverages secure AI models (such as Gemini API services) to generate structured documents.
                Here are our strict constraints regarding generative AI:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>No Model Training:</strong> We do NOT permit third-party API providers to use your personal
                  resume data, experiences, or generated documents to train their public models.
                </li>
                <li>
                  <strong>Zero Retention:</strong> Any data sent to our AI endpoints is processed in transit and is not
                  stored long-term by our API providers.
                </li>
                <li>
                  <strong>Private Context:</strong> Your private document context remains strictly confined to your individual
                  authenticated session.
                </li>
              </ul>
            </div>
          </div>

          {/* Section: Security */}
          <div id="security" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">4. Security & Retention</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                We employ industry-leading infrastructure security protocols to protect your personal files:
              </p>
              <p>
                <strong>Row-Level Security (RLS):</strong> Our database is governed by strict Supabase RLS.
                This guarantees that only you can read, update, or edit your documents and profile variables.
              </p>
              <p>
                <strong>Encryption:</strong> All payload queries are encrypted in transit via SSL/TLS, and database
                tokens are encrypted at rest using industry-standard AES-256 protocols.
              </p>
              <p>
                <strong>Retention Limits:</strong> We hold documents as long as your account remains active.
                You can change retention duration or purge snapshots directly inside your account's Privacy Center.
              </p>
            </div>
          </div>

          {/* Section: GDPR & CCPA */}
          <div id="gdpr-ccpa" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">5. Your Rights (GDPR & CCPA)</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                Depending on your residency, you possess comprehensive rights over your personal telemetry under the
                GDPR and CCPA regulations:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Right to Access:</strong> You can export and download your complete system records in a structured JSON
                  format at any time from your dashboard.
                </li>
                <li>
                  <strong>Right to Deletion:</strong> You can permanently delete your account profile. This triggers an automated
                  cascade that removes all your resumes, document history, and authentication details from our databases.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> You can edit profile parameters instantly from the Profile Settings tab.
                </li>
              </ul>
            </div>
          </div>

          {/* Section: Cookies */}
          <div id="cookies" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">6. Cookie Policy</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                We use cookies and active local storage tokens to simplify authentication.
                By default:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Essential Cookies:</strong> Set to retain login sessions and CSRF security validation tokens.
                  These cannot be turned off.
                </li>
                <li>
                  <strong>Analytical Cookies:</strong> Used optionally to trace anonymous traffic volumes and interface speeds.
                  You can opt-out of analytical tracking in your dashboard.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer border-t border-black/10 dark:border-white/10 max-w-7xl mx-auto">
        <div className="footer-logo text-ink dark:text-cream">
          <span className="nav-logo-dot w-2.5 h-2.5 rounded-full bg-leaf"></span>
          ResumeAI Pro
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://github.com/akshaysomani/ResumeAI-Pro" target="_blank" rel="noopener noreferrer">GitHub</a>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="footer-copy text-ink-faint">© 2026 Akshay Somani</div>
      </footer>
    </div>
  );
}
