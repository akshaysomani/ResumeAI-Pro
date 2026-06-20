"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sliders, Paintbrush, Globe, Eye, Save } from "lucide-react";
import { updateBrandingAction } from "@/app/actions/orgActions";

interface Branding {
  primaryColor?: string;
  secondaryColor?: string;
  customDomain?: string;
  emailTemplate?: string;
}

interface BrandingClientProps {
  orgId: string;
  userId: string;
  initialBranding: Branding;
}

export default function BrandingClient({
  orgId,
  userId,
  initialBranding
}: BrandingClientProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [primaryColor, setPrimaryColor] = useState(initialBranding?.primaryColor || "#4f46e5");
  const [secondaryColor, setSecondaryColor] = useState(initialBranding?.secondaryColor || "#10b981");
  const [customDomain, setCustomDomain] = useState(initialBranding?.customDomain || "");
  const [emailTemplate, setEmailTemplate] = useState(initialBranding?.emailTemplate || "");
  const [saving, setSaving] = useState(false);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const nextBranding = {
        primaryColor,
        secondaryColor,
        customDomain: customDomain.trim() || undefined,
        emailTemplate: emailTemplate.trim() || undefined
      };

      await updateBrandingAction(userId, orgId, nextBranding);
      toastSuccess("Branding configuration stored successfully!");
    } catch (err: any) {
      toastError(err.message || "Failed to update custom branding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">Custom Branding & Whitelabel</h2>
          <p className="text-xs text-zinc-400">Personalize corporate themes, custom domains, and styling profiles.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Settings Form */}
        <Card className="bg-zinc-900/25 border-zinc-800">
          <CardHeader className="p-5 border-b border-zinc-800/80">
            <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Paintbrush className="w-4 h-4 text-indigo-400" />
              Corporate Identity Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSaveBranding} className="space-y-6 text-xs">
              {/* Colors Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Primary Theme Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 p-0 bg-transparent border-zinc-800 rounded-lg cursor-pointer shrink-0"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#4f46e5"
                      className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Secondary Accent Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-9 p-0 bg-transparent border-zinc-800 rounded-lg cursor-pointer shrink-0"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#10b981"
                      className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Domain */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Custom Subdomain or Domain
                </label>
                <Input
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. resumes.mycompany.com"
                  className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                />
                <span className="text-[9px] text-zinc-550 block font-mono">
                  Map a CNAME record pointing to our gateway at <code className="text-zinc-400">cname.resumeai.pro</code>.
                </span>
              </div>

              {/* Email Templates branding */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custom Invitation Email Body</label>
                <textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Join our resume center workspaces review database..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs placeholder-zinc-700 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs"
              >
                {saving ? "Saving Branding..." : "Save Branding Configuration"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview drawer */}
        <Card className="bg-zinc-900/25 border-zinc-800 flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-zinc-800/80">
            <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-emerald-400" />
              Live Theme Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex items-center justify-center">
            {/* Fake Resume Box */}
            <div className="max-w-xs w-full bg-white text-zinc-900 rounded-xl p-5 shadow-2xl border border-zinc-200 space-y-4">
              <div className="text-center space-y-1 border-b pb-3" style={{ borderBottomColor: primaryColor }}>
                <h4 className="text-sm font-black tracking-tight" style={{ color: primaryColor }}>
                  AKSHAY SOMANI
                </h4>
                <p className="text-[8px] font-bold tracking-wide" style={{ color: secondaryColor }}>
                  SENIOR SOFTWARE ENGINEER • DELHI, IN
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="text-[8px] font-bold tracking-widest uppercase" style={{ color: primaryColor }}>
                  Experience
                </h5>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[7px] font-bold">
                    <span>Staff AI Architect</span>
                    <span style={{ color: secondaryColor }}>2024 - Present</span>
                  </div>
                  <p className="text-[6px] text-zinc-500 font-semibold leading-relaxed">
                    Pioneered LLM multi-agent orchestration backends reducing response times.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-[8px] font-bold tracking-widest uppercase" style={{ color: primaryColor }}>
                  Skills
                </h5>
                <div className="flex flex-wrap gap-1">
                  {["Next.js", "PostgreSQL", "Supabase", "Gemini API"].map((s) => (
                    <span
                      key={s}
                      className="text-[6px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
