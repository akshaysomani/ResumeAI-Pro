"use client";

import React, { useState, useEffect } from "react";
import type { Resume } from "@/types";
import { ResumePreviewCanvas } from "@/components/resume-preview-canvas";
import { generateDocx } from "@/lib/docx-generator";
import { generatePlainText } from "@/lib/text-generator";
import { logShareAnalyticsAction, logResumeExportAction } from "@/app/actions/shareActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Download,
  Printer,
  Mail,
  Lock,
  Eye,
  FileText,
  FileCode,
  CheckCircle,
  Copy,
  Info,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientShareViewProps {
  slug: string;
  initialResume: Resume | null;
  initialSettings: any;
  isPasswordLocked: boolean;
  ownerPlan: "free" | "pro";
}

export default function ClientShareView({
  slug,
  initialResume,
  initialSettings,
  isPasswordLocked: initialPasswordLocked,
  ownerPlan,
}: ClientShareViewProps) {
  // Page states
  const [resume, setResume] = useState<Resume | null>(initialResume);
  const [settings, setSettings] = useState<any>(initialSettings);
  const [passwordLocked, setPasswordLocked] = useState(initialPasswordLocked);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  // Exporters states
  const [downloading, setDownloading] = useState<string | null>(null);

  // Recruiter contact dialog state
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Track page view event on successful resume load
  useEffect(() => {
    if (resume && !passwordLocked) {
      // client-side agent info
      const ua = navigator.userAgent;
      
      const getDeviceType = () => {
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated/.test(ua)) return "mobile";
        return "desktop";
      };

      const getBrowser = () => {
        if (ua.indexOf("Firefox") > -1) return "Firefox";
        if (ua.indexOf("Edg") > -1) return "Edge";
        if (ua.indexOf("Chrome") > -1) return "Chrome";
        if (ua.indexOf("Safari") > -1) return "Safari";
        return "Browser";
      };

      logShareAnalyticsAction(slug, "view", {
        deviceType: getDeviceType(),
        browser: getBrowser(),
        referrer: document.referrer || "direct",
        country: "US", // Default mock location
      });
    }
  }, [resume, passwordLocked, slug]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setPasswordError("");

    try {
      const res = await fetch("/api/share/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Fetch full resume now that unlocked
        const verifyRes = await fetch(`/api/share/verify-password?slug=${slug}&password=${password}`); // fallback helper
        // Since we have the server actions we can just call it directly!
        const { getPublicResumeBySlugAction } = await import("@/app/actions/shareActions");
        const fetchResult = await getPublicResumeBySlugAction(slug, password);
        
        if (fetchResult.success && fetchResult.resume) {
          setResume(fetchResult.resume);
          setSettings(fetchResult.settings);
          setPasswordLocked(false);
        } else {
          setPasswordError("Failed to fetch resume data after unlocking.");
        }
      } else {
        setPasswordError(data.error || "Incorrect password. Access denied.");
      }
    } catch (err) {
      setPasswordError("Verification failed due to connectivity issues.");
    } finally {
      setLoading(false);
    }
  };

  const trackDownload = (format: string) => {
    logShareAnalyticsAction(slug, "download", { referrer: format });
    if (resume) {
      logResumeExportAction(
        resume.id,
        format,
        resume.templateId,
        15000, // mock file size
        1 // latest version index
      );
    }
  };

  const handlePrint = () => {
    if (settings?.printAllowed === false) return;
    trackDownload("pdf");
    window.print();
  };

  const handleDownloadDocx = async () => {
    if (!resume || settings?.downloadAllowed === false) return;
    setDownloading("docx");
    try {
      trackDownload("docx");
      const blob = await generateDocx(resume);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.title.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Docx generation failed:", err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadText = () => {
    if (!resume || settings?.downloadAllowed === false) return;
    trackDownload("txt");
    try {
      const text = generatePlainText(resume);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.title.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Text download failed:", err);
    }
  };

  const handleDownloadHtml = () => {
    if (!resume || settings?.downloadAllowed === false) return;
    trackDownload("html");
    try {
      // Quick layout compilation wrapper
      const plainText = generatePlainText(resume);
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${resume.title}</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1f2937; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <pre>${plainText}</pre>
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.title.replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("HTML download failed:", err);
    }
  };

  const copyEmail = () => {
    const personal = resume?.sections.find((s) => s.sectionType === "personal")?.content;
    if (personal?.email) {
      navigator.clipboard.writeText(personal.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1. Password Lock Viewport
  if (passwordLocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 select-none">
        <Card className="max-w-md w-full border dark:border-zinc-850 shadow-md">
          <form onSubmit={handleUnlock}>
            <CardHeader className="text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Lock className="h-5 w-5" />
              </div>
              <CardTitle className="text-md font-bold text-zinc-950 dark:text-white">Password Protected</CardTitle>
              <CardDescription className="text-xs">
                This candidate profile is locked. Please enter the password provided to access credentials details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Enter Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>
              {passwordError && (
                <p className="text-[10px] text-red-500 font-semibold text-left">{passwordError}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-10 text-xs font-bold" isLoading={loading}>
                Access Profile
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (!resume) return null;

  const personal = resume.sections.find((s) => s.sectionType === "personal")?.content || {};

  // Build JSON-LD structured schema metadata
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": personal.fullName || "Candidate Profile",
    "jobTitle": personal.headline || "Professional Resume",
    "email": personal.email || undefined,
    "telephone": personal.phone || undefined,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": personal.location || undefined,
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16 relative select-none">
      {/* JSON-LD Script injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      {/* Dynamic media print layout rules */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `,
        }}
      />

      {/* Top sticky floating action header */}
      <header className="no-print h-14 border-b border-zinc-200/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md dark:border-zinc-850 px-6 sticky top-0 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            R
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-950 dark:text-white">
              {personal.fullName || "Candidate Resume"}
            </span>
            <span className="hidden sm:inline-block text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded ml-2 uppercase">
              Shared Link
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print button */}
          {settings?.printAllowed !== false && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-[10px] font-bold px-2.5"
            >
              <Printer className="mr-1 h-3.5 w-3.5" />
              Print
            </Button>
          )}

          {/* Download buttons dropdown */}
          {settings?.downloadAllowed !== false && (
            <div className="relative group/dl">
              <Button size="sm" className="h-8 text-[10px] font-bold px-3">
                <Download className="mr-1 h-3.5 w-3.5" />
                Download
              </Button>
              <div className="absolute right-0 top-full pt-1 hidden group-hover/dl:block w-40 z-30">
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden py-1 flex flex-col text-left">
                  <button
                    onClick={handleDownloadDocx}
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    Word Document (.docx)
                  </button>
                  <button
                    onClick={handleDownloadHtml}
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <FileCode className="h-3.5 w-3.5 text-emerald-500" />
                    Web Webpage (.html)
                  </button>
                  <button
                    onClick={handleDownloadText}
                    className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-zinc-400" />
                    Plain Text (.txt)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contact button */}
          {personal.email && (
            <Button
              onClick={() => setContactOpen(true)}
              className="h-8 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Mail className="mr-1 h-3.5 w-3.5" />
              Contact
            </Button>
          )}
        </div>
      </header>

      {/* Main View Area */}
      <div className="max-w-4xl mx-auto px-4 pt-8 md:px-6">
        {/* Banner notification if private settings overrides apply */}
        {ownerPlan === "free" && (
          <div className="no-print mb-6 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center gap-2 text-left">
            <Info className="h-4 w-4 text-indigo-500 shrink-0" />
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
              You are viewing a shared profile hosted on **ResumeAI Pro**. Generate your own professional resumes instantly.
            </p>
          </div>
        )}

        {/* The visual resume template render container */}
        <div className="print-area bg-white dark:bg-zinc-950 shadow-md border dark:border-zinc-850 rounded-xl overflow-hidden flex justify-center p-6 sm:p-10">
          <div className="w-full max-w-[800px]">
            {/* Inject ownerPlan to canvas for watermarking toggles */}
            <ResumePreviewCanvas resume={resume} zoom={1} />
          </div>
        </div>
      </div>

      {/* Recruiter contact drawer popover */}
      {contactOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-zinc-950 dark:text-white">
                <Mail className="h-4 w-4 text-indigo-500" />
                Contact Candidate
              </CardTitle>
              <CardDescription className="text-xs">
                Direct coordinates for hiring recruiters to contact **{personal.fullName}**.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-left">
              {personal.email && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">Email Address</span>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={personal.email} className="h-9 text-xs" />
                    <Button variant="outline" onClick={copyEmail} size="icon" className="h-9 w-9 shrink-0">
                      {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {personal.phone && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">Phone Coordinate</span>
                  <Input readOnly value={personal.phone} className="h-9 text-xs" />
                </div>
              )}

              <p className="text-[10px] text-zinc-400 text-center bg-zinc-50 dark:bg-zinc-900/30 p-2 rounded">
                Clicking copy will add contact details to clipboard. Send correspondence directly.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" className="h-9 text-xs font-semibold" onClick={() => setContactOpen(false)}>
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
