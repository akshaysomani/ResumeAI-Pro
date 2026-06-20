"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Lock,
  Download,
  Printer,
  Globe,
  ArrowLeft,
  Mail,
  Calendar,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { getPublicDocumentBySlugAction } from "@/app/actions/documentActions";
import type { CareerDocument } from "@/types";

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicDocumentSharePage({ params }: SharePageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const [doc, setDoc] = useState<CareerDocument | null>(null);
  const [settings, setSettings] = useState<{ downloadAllowed: boolean; printAllowed: boolean; uniqueSlug: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Password Gate States
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // General Error State
  const [errorType, setErrorType] = useState<"not_found" | "private" | "server_error" | "">("");

  // Load shared document
  const loadSharedDocument = async (password?: string) => {
    setLoading(true);
    setPasswordError("");
    try {
      const result = await getPublicDocumentBySlugAction(slug, password);

      if (result.success && result.document) {
        setDoc(result.document);
        setSettings(result.settings || null);
        setPasswordRequired(false);
      } else {
        if (result.error === "password_required" || result.error === "password_invalid") {
          setPasswordRequired(true);
          if (result.error === "password_invalid") {
            setPasswordError("Incorrect password. Please try again.");
          }
        } else if (result.error === "private") {
          setErrorType("private");
        } else {
          setErrorType("not_found");
        }
      }
    } catch (err) {
      setErrorType("server_error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedDocument();
  }, [slug]);

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;
    setVerifyingPassword(true);

    try {
      const res = await fetch("/api/documents/share/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password: passwordInput })
      });

      if (res.ok) {
        await loadSharedDocument(passwordInput);
      } else {
        setPasswordError("Invalid passcode key.");
      }
    } catch (err) {
      setPasswordError("Password check error.");
    } finally {
      setVerifyingPassword(false);
    }
  };

  // Plaintext & HTML Download Helpers
  const triggerPlaintextDownload = () => {
    if (!doc) return;
    const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    link.click();
  };

  const triggerHtmlDownload = () => {
    if (!doc) return;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #1f2937; }
    h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 24px; color: #111827; }
    p { white-space: pre-wrap; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  <p>${doc.content}</p>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    link.click();
  };

  // Word doc export client integration
  const triggerDocxDownload = async () => {
    if (!doc) return;
    try {
      const response = await fetch("/api/documents/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: doc.title, content: doc.content })
      });
      if (!response.ok) throw new Error("Word export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.docx`;
      link.click();
    } catch (err) {
      alert("Failed to download Word document.");
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-zinc-500">Decrypting document context...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (errorType) {
    let errorTitle = "Document Unavailable";
    let errorMessage = "This document is private, deleted, or does not exist.";
    if (errorType === "private") {
      errorTitle = "Private Document";
      errorMessage = "The owner has disabled public access to this document.";
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-zinc-900 p-8 rounded-2xl border dark:border-zinc-800 shadow-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{errorTitle}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{errorMessage}</p>
          <a href="/" className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2">
            Go back to Home
          </a>
        </div>
      </div>
    );
  }

  // Password Gate UI
  if (passwordRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl border dark:border-zinc-800 shadow-md space-y-5">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Password Protected</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This career document requires a passcode to view.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Enter Passcode</label>
              <Input
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                required
              />
              {passwordError && (
                <p className="text-[10px] text-red-600 font-medium pt-1">{passwordError}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-indigo-600 text-white text-xs py-2 font-medium" isLoading={verifyingPassword}>
              Unlock Document
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Document Content View
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-10 px-4 md:px-6 print:bg-white print:py-0">
      {/* 1. Header controls (hidden on Print) */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            R
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">ResumeAI Pro</h1>
            <p className="text-[10px] text-zinc-500">Candidate Career Documents Portal</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {settings?.printAllowed && (
            <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 text-xs">
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print Copy
            </Button>
          )}

          {settings?.downloadAllowed && (
            <>
              {/* Word (DOCX) */}
              <Button variant="outline" size="sm" onClick={triggerDocxDownload} className="h-8 text-xs border-blue-200 text-blue-600 hover:bg-blue-50/20">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Word (.docx)
              </Button>

              {/* Plaintext */}
              <Button variant="outline" size="sm" onClick={triggerPlaintextDownload} className="h-8 text-xs text-zinc-600">
                Text (.txt)
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2. Paper Sheet View */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm p-8 md:p-12 min-h-[500px] flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:text-black">
        {/* Document content */}
        <div>
          {/* Header Metadata */}
          <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4 mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 print:text-black">
              {doc?.title}
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Published {doc ? new Date(doc.updatedAt).toLocaleDateString() : ""}</span>
              </div>
              <span>•</span>
              <span className="uppercase font-bold tracking-wider text-indigo-500">
                {doc?.documentType.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Text block */}
          <p className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 font-serif whitespace-pre-wrap print:text-black">
            {doc?.content}
          </p>
        </div>

        {/* Footer branding */}
        <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-6 mt-12 flex items-center justify-between text-[10px] text-zinc-400 print:text-zinc-500">
          <span>Verified Document Copy</span>
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <a href="/" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline print:text-zinc-500 flex items-center gap-0.5">
              ResumeAI Pro <ExternalLink className="h-2 w-2" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
