"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Sparkles, Send, Bot, User, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
}

export default function AIAssistantPage() {
  const { success, error } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "bot-1",
      sender: "bot",
      text: "Hello! I am your ResumeAI assistant. Select one of the quick actions below, or describe what resume improvements you would like help with.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setGenerating(true);

    const botMsgId = `bot-${Date.now()}`;
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      sender: "bot",
      text: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, initialBotMsg]);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionType: "generic",
          payload: {
            sectionType: "AI Career Assistant",
            instructions: text,
            tone: "professional",
          },
          resumeId: null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Request failed with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader on response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, text: fullText } : msg
          )
        );
      }
    } catch (err: any) {
      error(err.message || "Failed to generate AI content.");
      setMessages((prev) => prev.filter((msg) => msg.id !== botMsgId));
    } finally {
      setGenerating(false);
    }
  };

  const applyActionPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8.5rem)] flex flex-col min-h-0">
      {/* Header controls */}
      <div className="shrink-0">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
          AI Writing Assistant
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Draft high-impact resume bullets, professional statements, or cover letter drafts.
        </p>
      </div>

      {/* Main Chat split pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Side Quick Presets */}
        <div className="space-y-4 shrink-0 lg:col-span-1">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Zap className="h-4.5 w-4.5 text-amber-500" />
                Quick Prompts
              </CardTitle>
              <CardDescription className="text-xs">
                Select a preset to optimize your document content instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2.5">
              <Button
                variant="outline"
                className="w-full text-left justify-start text-xs font-semibold h-auto py-2.5 px-3 whitespace-normal"
                onClick={() =>
                  applyActionPrompt("Rewrite this bullet point to sound more metric-driven: 'helped build landing pages for clients'")
                }
              >
                📊 Add Metrics to Bullet
              </Button>
              <Button
                variant="outline"
                className="w-full text-left justify-start text-xs font-semibold h-auto py-2.5 px-3 whitespace-normal"
                onClick={() =>
                  applyActionPrompt("Draft a strong professional summary for a junior full stack react developer with 1 year experience")
                }
              >
                ✍️ Write Summary Intro
              </Button>
              <Button
                variant="outline"
                className="w-full text-left justify-start text-xs font-semibold h-auto py-2.5 px-3 whitespace-normal"
                onClick={() =>
                  applyActionPrompt("List top 5 technical skills required for a Cloud DevOps engineer resume")
                }
              >
                🛠️ Suggest DevOps Skills
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Side Chat panel */}
        <div className="flex-1 lg:col-span-2 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-950/40 flex flex-col min-h-0 overflow-hidden">
          {/* Chat Messages scroll viewport */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-3 max-w-[85%] transition-all duration-300", {
                  "ml-auto flex-row-reverse": msg.sender === "user",
                })}
              >
                <div
                  className={cn(
                    "h-8.5 w-8.5 rounded-full flex items-center justify-center shrink-0 border text-xs",
                    msg.sender === "bot"
                      ? "bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-900/50 dark:text-indigo-400"
                      : "bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  )}
                >
                  {msg.sender === "bot" ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                </div>
                <div
                  className={cn(
                    "p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap",
                    msg.sender === "bot"
                      ? "bg-zinc-50 border border-zinc-100 text-zinc-900 dark:bg-zinc-900/50 dark:border-zinc-900 dark:text-zinc-100"
                      : "bg-indigo-600 text-white shadow-sm"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {generating && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="h-8.5 w-8.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-900/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-[11px] font-semibold uppercase">Analyzing resume details...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat input form container */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex gap-2 shrink-0">
            <input
              type="text"
              placeholder="Ask for writing improvements (e.g. rewrite my sales executive bullet)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
              disabled={generating}
            />
            <Button size="icon" onClick={() => handleSend()} disabled={generating || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
