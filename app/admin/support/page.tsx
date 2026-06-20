import React from "react";
import { getAdminTicketsAction, getAdminUsersAction } from "@/app/actions/adminActions";
import SupportClient from "./support-client";

export const revalidate = 0;

export default async function AdminSupportPage() {
  const tickets = await getAdminTicketsAction();
  const allUsers = await getAdminUsersAction();
  
  // Extract agents (roles not equal to 'user')
  const agents = allUsers
    .filter((u) => u.role !== "user")
    .map((u) => ({
      id: u.id,
      fullName: u.fullName || "Admin Agent",
      email: u.email,
      role: u.role
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Customer Support Workspace
        </h2>
        <p className="text-sm text-zinc-400">
          Respond to user billing or technical inquiries, log internal manager notes, and delegate support tickets.
        </p>
      </div>
      <SupportClient initialTickets={tickets} agents={agents} />
    </div>
  );
}
