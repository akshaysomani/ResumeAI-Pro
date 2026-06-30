"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Mail, Github, Clock, MapPin, Send, CheckCircle } from "lucide-react";
import { createContactTicketAction } from "@/app/actions/supportActions";

export default function ContactClient() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Pre-fill profile info if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        name: user.user_metadata?.full_name || user.user_metadata?.name || ""
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      showErrorToast("Please fill in all the required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createContactTicketAction({
        userId: user?.id || null,
        name: formData.name,
        email: formData.email,
        category: formData.category,
        subject: formData.subject,
        message: formData.message
      });

      if (response.success) {
        showSuccessToast(response.message);
        setIsSubmitted(true);
        setFormData({
          name: user ? (user.user_metadata?.full_name || user.user_metadata?.name || "") : "",
          email: user ? (user.email || "") : "",
          category: "general",
          subject: "",
          message: ""
        });
      } else {
        showErrorToast(response.message);
      }
    } catch (err: any) {
      console.error(err);
      showErrorToast("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
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
      <section className="pt-32 pb-12 px-6 md:px-12 max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-leaf bg-leaf/10 dark:bg-leaf/20 rounded-full px-3.5 py-1.5 mb-4">
          <Mail className="h-3.5 w-3.5" /> Get in Touch
        </div>
        <h1 className="font-serif text-3xl md:text-5xl text-ink dark:text-cream tracking-tight max-w-2xl mx-auto">
          Contact Support & Sales
        </h1>
        <p className="text-sm md:text-base text-ink-light dark:text-ink-faint max-w-lg mx-auto mt-4 font-sans font-light">
          Have questions about Pro quotas, custom templates, or need technical help? Send us a message and we'll reply shortly.
        </p>
      </section>

      {/* SPLIT LAYOUT */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        {/* Info Cards (Left Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/60 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-leaf/10 dark:bg-leaf/20 text-leaf flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink dark:text-cream font-sans">Email Support</h3>
              <p className="text-xs text-ink-light dark:text-ink-faint mt-1 font-light">Direct support inquiries and invoice concerns:</p>
              <a href="mailto:support@resumeaipro.com" className="text-sm text-leaf hover:underline mt-2 inline-block font-medium">
                support@resumeaipro.com
              </a>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-leaf/10 dark:bg-leaf/20 text-leaf flex items-center justify-center shrink-0">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink dark:text-cream font-sans">GitHub Repository</h3>
              <p className="text-xs text-ink-light dark:text-ink-faint mt-1 font-light">Submit technical issues, feedback suggestions, or code contributions:</p>
              <a href="https://github.com/akshaysomani/ResumeAI-Pro" target="_blank" rel="noopener noreferrer" className="text-sm text-leaf hover:underline mt-2 inline-block font-medium">
                github.com/akshaysomani/ResumeAI-Pro
              </a>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-leaf/10 dark:bg-leaf/20 text-leaf flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink dark:text-cream font-sans">Response SLA</h3>
              <p className="text-xs text-ink-light dark:text-ink-faint mt-1 font-light leading-relaxed">
                Our support agents are active 24/7. We promise:
              </p>
              <ul className="list-disc pl-4 mt-2 space-y-1 text-xs text-ink-light dark:text-ink-faint font-light">
                <li>Under <strong>12 hours</strong> average callback wait for Pro subscribers.</li>
                <li>Under <strong>24 hours</strong> average response for free members.</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-leaf/10 dark:bg-leaf/20 text-leaf flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink dark:text-cream font-sans">Headquarters</h3>
              <p className="text-xs text-ink-light dark:text-ink-faint mt-1 leading-relaxed font-light">
                ResumeAI Pro operates globally under distributed nodes:<br />
                San Francisco, CA, USA & Mumbai, India
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form (Right Columns) */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="h-16 w-16 bg-leaf/10 dark:bg-leaf/20 rounded-full flex items-center justify-center mx-auto text-leaf">
                  <CheckCircle className="h-10 w-10 animate-bounce" />
                </div>
                <h2 className="font-serif text-2xl text-ink dark:text-cream">Inquiry Submitted!</h2>
                <p className="text-sm text-ink-light dark:text-ink-faint max-w-sm mx-auto font-light leading-relaxed">
                  Thank you for reaching out. We have logged your request. If you are signed in, you can track it in your Support Tickets portal inside the admin dashboards.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  className="rounded-full bg-ink dark:bg-cream text-white dark:text-ink hover:bg-leaf dark:hover:bg-leaf dark:hover:text-white px-6 font-sans text-xs h-10 transition-colors"
                >
                  Send another inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="font-serif text-xl md:text-2xl text-ink dark:text-cream mb-2">Send a Message</h3>
                <p className="text-xs text-ink-faint dark:text-ink-faint font-light">Fields marked with * are required.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-medium text-ink-light dark:text-ink-faint">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Akshay Somani"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full bg-cream-dark/30 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/50 focus:border-leaf dark:focus:ring-leaf/50 transition-all font-sans font-light"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-medium text-ink-light dark:text-ink-faint">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="you@domain.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full bg-cream-dark/30 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/50 focus:border-leaf dark:focus:ring-leaf/50 transition-all font-sans font-light"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="text-xs font-medium text-ink-light dark:text-ink-faint">
                    Inquiry Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full bg-cream-dark/30 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/50 focus:border-leaf dark:focus:ring-leaf/50 transition-all font-sans font-light text-ink-light dark:text-cream"
                  >
                    <option value="general">General Enquiry</option>
                    <option value="billing">Billing & Upgrade Issues</option>
                    <option value="technical">Technical Support / Bugs</option>
                    <option value="feedback">Feedback & Suggestions</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-xs font-medium text-ink-light dark:text-ink-faint">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    placeholder="Brief summary of your query"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full bg-cream-dark/30 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/50 focus:border-leaf dark:focus:ring-leaf/50 transition-all font-sans font-light"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs font-medium text-ink-light dark:text-ink-faint">
                    Message Description *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Provide details about your inquiry..."
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full bg-cream-dark/30 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/50 focus:border-leaf dark:focus:ring-leaf/50 transition-all font-sans font-light resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink dark:bg-cream text-white dark:text-ink hover:bg-leaf dark:hover:bg-leaf dark:hover:text-white font-sans text-sm font-semibold h-12 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Message
                    </>
                  )}
                </button>
              </form>
            )}
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
