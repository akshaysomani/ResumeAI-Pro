import React from "react";
import { db } from "@/lib/db";
import BroadcastClient from "./broadcast-client";

export const revalidate = 0;

export default async function AdminNotificationsPage() {
  const query = `
    SELECT 
      b.id,
      b.sender_id as "senderId",
      b.title,
      b.message,
      b.type,
      b.channels,
      b.target_group as "targetGroup",
      b.created_at as "createdAt",
      p.full_name as "senderName"
    FROM public.admin_broadcasts b
    LEFT JOIN public.profiles p ON b.sender_id = p.id
    ORDER BY b.created_at DESC
  `;
  const { rows } = await db.query(query);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Announcement Broadcasts
        </h2>
        <p className="text-sm text-zinc-400">
          Create platform announcements, send notifications to specific user tiers, and review previous broadcasts history.
        </p>
      </div>
      <BroadcastClient initialBroadcasts={rows} />
    </div>
  );
}
