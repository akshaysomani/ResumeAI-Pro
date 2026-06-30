"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, FileText, UserCheck, Zap, DollarSign, Award, AlertTriangle, PowerOff } from "lucide-react";

export default function TermsClient() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("acceptance");

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms", icon: UserCheck },
    { id: "accounts", title: "2. Account Registry", icon: FileText },
    { id: "credits", title: "3. AI Credit Usage", icon: Zap },
    { id: "billing", title: "4. Billing & Refunds", icon: DollarSign },
    { id: "ownership", title: "5. Content Ownership", icon: Award },
    { id: "termination", title: "6. Termination", icon: PowerOff },
    { id: "liability", title: "7. Liability & Warranties", icon: AlertTriangle },
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
          <FileText className="h-3.5 w-3.5" /> Terms & Agreements
        </div>
        <h1 className="font-serif text-3xl md:text-5xl text-ink dark:text-cream tracking-tight max-w-2xl mx-auto">
          Terms of Service
        </h1>
        <p className="text-sm md:text-base text-ink-light dark:text-ink-faint max-w-lg mx-auto mt-4 font-sans font-light">
          Last Updated: June 30, 2026. Please read these terms carefully before utilizing our generative resume tools.
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
          {/* Section: Acceptance */}
          <div id="acceptance" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">1. Acceptance of Terms</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                By registering an account or accessing the services provided by ResumeAI Pro ("Platform", "we", "us"),
                you explicitly agree to comply with and be bound by these Terms of Service.
              </p>
              <p>
                If you do not agree to these terms, you must immediately terminate your utilization of our service utilities.
                We reserve the right to revise these terms from time to time.
              </p>
            </div>
          </div>

          {/* Section: Accounts */}
          <div id="accounts" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">2. Account Registry</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>To use most features of the Platform, you must register for an account:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Information Accuracy:</strong> You agree to provide current, accurate, and complete information
                  during the signup process and update it in the Profile Settings panel.
                </li>
                <li>
                  <strong>Session Security:</strong> You are responsible for preserving credentials and restricting access
                  to your device. You are responsible for all actions taken under your credentials.
                </li>
                <li>
                  <strong>Age Restriction:</strong> You must be at least 18 years old (or the legal age of majority in your
                  region) to register.
                </li>
              </ul>
            </div>
          </div>

          {/* Section: Credits */}
          <div id="credits" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">3. AI Credit Usage</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                The Platform provides AI capabilities that consume generation credits. Depending on your active tier:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Free Quotas:</strong> Free tier users receive daily limits on AI assistant chatbot exchanges (e.g., 35 credits)
                  and document generations. Unused daily free credits do not roll over to subsequent days.
                </li>
                <li>
                  <strong>Fair Use Policy:</strong> We restrict botting, mass script automation, or scraping behavior that
                  attempts to bypass rate limits or consume system resources excessively.
                </li>
                <li>
                  <strong>Quota Modification:</strong> We reserve the right to audit, revise, or restructure daily credit volumes
                  to prevent server load crashes.
                </li>
              </ul>
            </div>
          </div>

          {/* Section: Billing */}
          <div id="billing" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">4. Billing & Refunds</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                Subscribing to our Pro tier involves structured subscription billing cycles:
              </p>
              <p>
                <strong>Recurring Billing:</strong> By upgrading, you authorize us to charge your transaction card
                automatically on a recurring monthly or yearly cycle.
                You can terminate renewals at any point from the Billing tab.
              </p>
              <p>
                <strong>Refund Policy:</strong> Pro subscriptions are generally non-refundable unless specified otherwise
                by local consumer protection laws. If you encounter charge failures or double transactions, contact
                our support portal immediately.
              </p>
            </div>
          </div>

          {/* Section: Ownership */}
          <div id="ownership" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">5. Content Ownership</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                Ownership parameters of drafts and assets are defined as follows:
              </p>
              <p>
                <strong>User Content:</strong> You retain complete ownership rights of the text inputs, educational lists,
                and generated documents compiled on our platform. We make no ownership claims over your resumes or cover letters.
              </p>
              <p>
                <strong>Platform Assets:</strong> All proprietary builder code, graphics, layout templates, styling sheets,
                logos, and trademarks belong to ResumeAI Pro and are protected by international copyright laws.
              </p>
            </div>
          </div>

          {/* Section: Termination */}
          <div id="termination" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <PowerOff className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">6. Account Termination</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                We reserve the right to suspend or close your account registry at our discretion if we detect:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Material violation of these Terms of Service.</li>
                <li>Attempts to execute malicious code, prompt injections, or DDoS vectors against our servers.</li>
                <li>Fraudulent chargebacks or payment fraud.</li>
              </ul>
              <p>
                You can close your account permanently at any time from your dashboard Privacy settings.
                This will trigger an automatic cascade deleting your records.
              </p>
            </div>
          </div>

          {/* Section: Liability */}
          <div id="liability" className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-black/5 dark:border-white/5 pb-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-leaf/10 text-leaf flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-ink dark:text-cream">7. Liability & Warranties</h2>
            </div>
            <div className="font-sans text-sm text-ink-light dark:text-ink-faint leading-relaxed space-y-4 font-light">
              <p>
                RESUMEAI PRO IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE MAKE NO EXPRESS OR IMPLIED WARRANTIES
                THAT:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The platform will remain uninterrupted, error-free, or 100% online at all times.</li>
                <li>The generated AI documents will guarantee career placement, employment callbacks, or corporate interviews.</li>
                <li>The ATS matching scores represent absolute evaluation criteria of external recruiting filters.</li>
              </ul>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL RESUMEAI PRO BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OF OUR SYSTEM SERVICES.
              </p>
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
