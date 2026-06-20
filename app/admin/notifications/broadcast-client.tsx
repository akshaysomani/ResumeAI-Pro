"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { sendBroadcastAction } from "@/app/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Send, ShieldAlert, Mail, Bell, Users, History } from "lucide-react";

interface BroadcastItem {
  id: string;
  senderId?: string | null;
  senderName?: string;
  title: string;
  message: string;
  type: "maintenance" | "promotion" | "security";
  channels: string[];
  targetGroup: "all" | "free" | "pro";
  createdAt: string;
}

interface BroadcastClientProps {
  initialBroadcasts: BroadcastItem[];
}

export default function BroadcastClient({ initialBroadcasts }: BroadcastClientProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>(initialBroadcasts);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"maintenance" | "promotion" | "security">("maintenance");
  const [targetGroup, setTargetGroup] = useState<"all" | "free" | "pro">("all");
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !message.trim()) {
      toastError("Please provide both a title and message.");
      return;
    }

    const channels: string[] = [];
    if (channelInApp) channels.push("in_app");
    if (channelEmail) channels.push("email");

    if (channels.length === 0) {
      toastError("Please select at least one delivery channel.");
      return;
    }

    setSending(true);
    try {
      const data = await sendBroadcastAction(user.id, {
        title,
        message,
        type,
        channels,
        targetGroup
      });

      const newBroadcast: BroadcastItem = {
        ...data,
        senderName: user.email?.split("@")[0] || "Administrator"
      };

      setBroadcasts((prev) => [newBroadcast, ...prev]);
      setTitle("");
      setMessage("");
      setType("maintenance");
      setTargetGroup("all");
      setChannelInApp(true);
      setChannelEmail(false);
      toastSuccess("System announcement broadcasted successfully");
    } catch (err: any) {
      toastError(err.message || "Failed to send system announcement");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 items-start">
      {/* Broadcast Form Panel */}
      <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md md:col-span-1">
        <CardHeader className="border-b border-zinc-800 p-5">
          <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-indigo-400" />
            Dispatch Announcement
          </CardTitle>
          <CardDescription className="text-[10px] text-zinc-500">
            Publish notifications or marketing broadcasts directly to client consoles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Input: Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Announcement Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled System Upgrade"
                className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl text-xs placeholder-zinc-600"
              />
            </div>

            {/* Input: Message */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Message Content</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type notice message here..."
                className="bg-zinc-950 border-zinc-800 text-zinc-200 text-xs rounded-xl h-24 placeholder-zinc-600"
              />
            </div>

            {/* Grid options */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Select: Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl px-2 h-9 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="security">Security Alert</option>
                  <option value="promotion">Marketing</option>
                </select>
              </div>

              {/* Select: Target */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Target Aud.</label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl px-2 h-9 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Tiers</option>
                  <option value="free">Free Tiers Only</option>
                  <option value="pro">Pro Tiers Only</option>
                </select>
              </div>
            </div>

            {/* Channels checkboxes */}
            <div className="pt-2 border-t border-zinc-800/60 space-y-2.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Delivery Channels</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelInApp}
                    onChange={(e) => setChannelInApp(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300">
                    <Bell className="w-3.5 h-3.5 text-zinc-500" />
                    In-App Console
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    Email Dispatch
                  </span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white h-9 mt-4"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {sending ? "Broadcasting..." : "Dispatch Announcement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Historical Dispatches Panel */}
      <Card className="bg-zinc-900/35 border-zinc-800 backdrop-blur-md md:col-span-2">
        <CardHeader className="border-b border-zinc-800 p-5">
          <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-4 h-4 text-zinc-500" />
            Announcement History
          </CardTitle>
          <CardDescription className="text-[10px] text-zinc-500">
            Log of previously dispatched broadcast notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {broadcasts.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 font-mono">No broadcasts dispatched yet.</div>
            ) : (
              broadcasts.map((b) => {
                const badgeColor = {
                  maintenance: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
                  security: "bg-red-500/10 text-red-400 border border-red-500/20",
                  promotion: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }[b.type];

                return (
                  <div key={b.id} className="p-5 space-y-2.5 hover:bg-zinc-900/10 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">{b.title}</h4>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          ID: {b.id} | Sent by: {b.senderName || "System Agent"}
                        </span>
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${badgeColor}`}>
                        {b.type}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 font-sans">{b.message}</p>

                    <div className="flex items-center gap-4 text-[9px] text-zinc-500 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-zinc-600" />
                        Target: <strong className="text-zinc-400 uppercase">{b.targetGroup}</strong>
                      </span>
                      <span>
                        Channels: <strong className="text-zinc-400">{b.channels.join(", ")}</strong>
                      </span>
                      <span className="ml-auto">
                        {new Date(b.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
