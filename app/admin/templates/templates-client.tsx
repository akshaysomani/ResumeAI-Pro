"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { updateTemplatePremiumStatusAction } from "@/app/actions/adminActions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ToggleLeft, ToggleRight, Download, Award } from "lucide-react";

interface TemplateItem {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  category: string;
  isPremium: boolean;
  popularity: number;
  downloads: number;
}

interface TemplatesClientProps {
  initialTemplates: TemplateItem[];
}

export default function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);

  const handleTogglePremium = async (templateId: string, currentStatus: boolean) => {
    if (!user) return;
    const nextStatus = !currentStatus;

    try {
      await updateTemplatePremiumStatusAction(user.id, templateId, nextStatus);
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, isPremium: nextStatus } : t))
      );
      toastSuccess(
        nextStatus
          ? "Template set to Premium access"
          : "Template set to Free access"
      );
    } catch (err: any) {
      toastError(err.message || "Failed to update template status");
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {templates.length === 0 ? (
        <div className="col-span-full border border-zinc-800 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
          No templates registered in the system database.
        </div>
      ) : (
        templates.map((template) => (
          <Card
            key={template.id}
            className="bg-zinc-900/35 border-zinc-800 flex flex-col justify-between overflow-hidden relative group hover:border-zinc-700 transition-all duration-200"
          >
            {/* Thumbnail Placeholder/Image */}
            <div className="h-44 bg-zinc-950 flex items-center justify-center border-b border-zinc-800 relative overflow-hidden">
              {template.thumbnailUrl ? (
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-[10px] text-zinc-600 font-mono flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-zinc-700" />
                  <span>No preview thumbnail</span>
                </div>
              )}
              {template.isPremium && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[8px] font-black bg-indigo-500 text-white uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  PRO
                </span>
              )}
            </div>

            {/* Template details */}
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xs font-bold text-zinc-100">{template.name}</CardTitle>
                  <CardDescription className="text-[10px] text-zinc-500 font-mono mt-0.5">slug: {template.slug}</CardDescription>
                </div>
                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 capitalize">
                  {template.category}
                </span>
              </div>
            </CardHeader>

            {/* Template stats & toggle action */}
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 border-b border-zinc-800/50 pb-3">
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  Downloads: <strong className="text-zinc-300">{template.downloads || 0}</strong>
                </span>
                <span>Popularity: <strong className="text-zinc-300">{template.popularity || 0}</strong></span>
              </div>

              {/* Toggling controller */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-400">Access Tier</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-bold hover:bg-zinc-800 hover:text-white"
                  onClick={() => handleTogglePremium(template.id, template.isPremium)}
                >
                  {template.isPremium ? (
                    <span className="text-indigo-400 flex items-center gap-1.5">
                      <ToggleRight className="w-5.5 h-5.5" />
                      Premium
                    </span>
                  ) : (
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <ToggleLeft className="w-5.5 h-5.5" />
                      Free Tier
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
