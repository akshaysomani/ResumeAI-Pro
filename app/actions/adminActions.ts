"use server";

import { db } from "@/lib/db";
import type { 
  AdminAuditLog, 
  SupportTicket, 
  SupportTicketReply, 
  ReportedItem, 
  AdminBroadcast,
  UserRoleMapping
} from "@/types";
import { UserRole } from "@/lib/rbac";

// ---------------------------------------------------------
// Helper: Log Administrative Actions
// ---------------------------------------------------------
export async function createAuditLog(data: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  ipAddress?: string | null;
  details?: any;
}): Promise<void> {
  try {
    const query = `
      INSERT INTO public.admin_audit_logs (actor_id, action, target_type, target_id, ip_address, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    await db.query(query, [
      data.actorId,
      data.action,
      data.targetType,
      data.targetId || null,
      data.ipAddress || null,
      JSON.stringify(data.details || {})
    ]);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

// ---------------------------------------------------------
// 1. USER MANAGEMENT ACTIONS
// ---------------------------------------------------------

export async function getAdminUsersAction(): Promise<any[]> {
  const query = `
    SELECT 
      p.id, 
      p.email, 
      p.full_name as "fullName", 
      p.created_at as "createdAt",
      COALESCE(ur.role, 'user') as role,
      COALESCE(ur.is_suspended, false) as "isSuspended",
      (SELECT COUNT(*) FROM public.resumes r WHERE r.user_id = p.id) as "resumeCount",
      (SELECT COALESCE(SUM(amount), 0) FROM public.payments pay WHERE pay.user_id = p.id) as "totalPaid"
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    ORDER BY p.created_at DESC
  `;
  const { rows } = await db.query(query);
  return rows;
}

export async function updateUserRoleAction(
  actorId: string, 
  targetUserId: string, 
  newRole: string
): Promise<void> {
  const query = `
    INSERT INTO public.user_roles (user_id, role, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
  `;
  await db.query(query, [targetUserId, newRole]);

  await createAuditLog({
    actorId,
    action: "update_user_role",
    targetType: "user",
    targetId: targetUserId,
    details: { newRole }
  });
}

export async function toggleUserSuspensionAction(
  actorId: string,
  targetUserId: string,
  suspend: boolean
): Promise<void> {
  const query = `
    INSERT INTO public.user_roles (user_id, is_suspended, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) DO UPDATE SET is_suspended = EXCLUDED.is_suspended, updated_at = NOW()
  `;
  await db.query(query, [targetUserId, suspend]);

  await createAuditLog({
    actorId,
    action: suspend ? "suspend_user" : "unsuspend_user",
    targetType: "user",
    targetId: targetUserId,
    details: { suspend }
  });
}

export async function deleteUserRecordAction(actorId: string, targetUserId: string): Promise<void> {
  // Cascades to resumes, user_roles, support tickets, documents etc.
  const query = `DELETE FROM public.profiles WHERE id = $1`;
  await db.query(query, [targetUserId]);

  await createAuditLog({
    actorId,
    action: "delete_user",
    targetType: "user",
    targetId: targetUserId
  });
}

// ---------------------------------------------------------
// 2. SUBSCRIPTION & PAYMENT ACTIONS
// ---------------------------------------------------------

export async function getAdminPaymentsAction(): Promise<any[]> {
  const query = `
    SELECT 
      pay.*, 
      p.email, 
      p.full_name as "fullName" 
    FROM public.payments pay
    JOIN public.profiles p ON pay.user_id = p.id
    ORDER BY pay.created_at DESC
  `;
  const { rows } = await db.query(query);
  return rows;
}

export async function refundInvoiceAction(
  actorId: string,
  paymentId: string
): Promise<void> {
  const query = `UPDATE public.payments SET status = 'refunded' WHERE id = $1`;
  await db.query(query, [paymentId]);

  await createAuditLog({
    actorId,
    action: "refund_payment",
    targetType: "payment",
    targetId: paymentId
  });
}

// ---------------------------------------------------------
// 3. SUPPORT TICKETS ACTIONS
// ---------------------------------------------------------

export async function getAdminTicketsAction(): Promise<SupportTicket[]> {
  const query = `
    SELECT 
      t.id, t.user_id as "userId", t.assigned_to as "assignedTo",
      t.title, t.description, t.category, t.priority, t.status,
      t.created_at as "createdAt", t.updated_at as "updatedAt",
      p.email as "userEmail", p.full_name as "userName",
      pa.full_name as "assignedToName"
    FROM public.support_tickets t
    JOIN public.profiles p ON t.user_id = p.id
    LEFT JOIN public.profiles pa ON t.assigned_to = pa.id
    ORDER BY t.updated_at DESC
  `;
  const { rows } = await db.query(query);
  return rows;
}

export async function assignTicketAction(
  actorId: string,
  ticketId: string,
  agentId: string | null
): Promise<void> {
  const query = `UPDATE public.support_tickets SET assigned_to = $1, status = 'assigned', updated_at = NOW() WHERE id = $2`;
  await db.query(query, [agentId, ticketId]);

  await createAuditLog({
    actorId,
    action: "assign_ticket",
    targetType: "ticket",
    targetId: ticketId,
    details: { assignedTo: agentId }
  });
}

export async function getTicketRepliesAction(ticketId: string): Promise<SupportTicketReply[]> {
  const query = `
    SELECT 
      r.id, r.ticket_id as "ticketId", r.sender_id as "senderId",
      r.content, r.is_internal as "isInternal", r.created_at as "createdAt",
      p.full_name as "senderName", ur.role as "senderRole"
    FROM public.support_ticket_replies r
    JOIN public.profiles p ON r.sender_id = p.id
    LEFT JOIN public.user_roles ur ON r.sender_id = ur.user_id
    WHERE r.ticket_id = $1
    ORDER BY r.created_at ASC
  `;
  const { rows } = await db.query(query, [ticketId]);
  return rows;
}

export async function postTicketReplyAction(data: {
  actorId: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
}): Promise<SupportTicketReply> {
  const query = `
    INSERT INTO public.support_ticket_replies (ticket_id, sender_id, content, is_internal, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `;
  const { rows } = await db.query(query, [data.ticketId, data.actorId, data.content, data.isInternal]);
  const r = rows[0];

  // Touch ticket update time
  await db.query(
    "UPDATE public.support_tickets SET updated_at = NOW() WHERE id = $1",
    [data.ticketId]
  );

  return {
    id: r.id,
    ticketId: r.ticket_id,
    senderId: r.sender_id,
    content: r.content,
    isInternal: r.is_internal,
    createdAt: r.created_at
  };
}

export async function updateTicketStatusAction(
  actorId: string,
  ticketId: string,
  status: "open" | "assigned" | "resolved" | "closed"
): Promise<void> {
  const query = `UPDATE public.support_tickets SET status = $1, updated_at = NOW() WHERE id = $2`;
  await db.query(query, [status, ticketId]);

  await createAuditLog({
    actorId,
    action: `update_ticket_status_${status}`,
    targetType: "ticket",
    targetId: ticketId
  });
}

// ---------------------------------------------------------
// 4. TEMPLATE & RESUME MANAGEMENT ACTIONS
// ---------------------------------------------------------

export async function getAdminTemplatesAction(): Promise<any[]> {
  const query = `
    SELECT 
      t.id, t.name, t.slug, t.thumbnail_url as "thumbnailUrl", 
      t.category, t.is_premium as "isPremium", t.popularity, t.downloads 
    FROM public.templates t
    ORDER BY t.popularity DESC
  `;
  const { rows } = await db.query(query);
  return rows;
}

export async function updateTemplatePremiumStatusAction(
  actorId: string,
  templateId: string,
  isPremium: boolean
): Promise<void> {
  const query = `UPDATE public.templates SET is_premium = $1 WHERE id = $2`;
  await db.query(query, [isPremium, templateId]);

  await createAuditLog({
    actorId,
    action: isPremium ? "set_template_premium" : "set_template_free",
    targetType: "template",
    targetId: templateId
  });
}

export async function getReportedItemsAction(): Promise<ReportedItem[]> {
  const query = `
    SELECT 
      ri.id, ri.item_type as "itemType", ri.item_id as "itemId",
      ri.reporter_id as "reporterId", ri.reason, ri.status,
      ri.admin_notes as "adminNotes", ri.created_at as "createdAt",
      ri.updated_at as "updatedAt", p.email as "reporterEmail",
      r.title as "itemTitle"
    FROM public.reported_items ri
    LEFT JOIN public.profiles p ON ri.reporter_id = p.id
    LEFT JOIN public.resumes r ON ri.item_id = r.id AND ri.item_type = 'resume'
    ORDER BY ri.created_at DESC
  `;
  const { rows } = await db.query(query);
  return rows;
}

export async function moderateItemAction(
  actorId: string,
  reportId: string,
  action: "actioned" | "dismissed",
  notes: string
): Promise<void> {
  const query = `
    UPDATE public.reported_items 
    SET status = $1, admin_notes = $2, updated_at = NOW() 
    WHERE id = $3
  `;
  await db.query(query, [action, notes, reportId]);

  await createAuditLog({
    actorId,
    action: `moderate_item_${action}`,
    targetType: "moderation",
    targetId: reportId,
    details: { notes }
  });
}

// ---------------------------------------------------------
// 5. NOTIFICATION CENTER ACTIONS
// ---------------------------------------------------------

export async function sendBroadcastAction(
  actorId: string,
  data: {
    title: string;
    message: string;
    type: "maintenance" | "promotion" | "security";
    channels: string[];
    targetGroup: "all" | "free" | "pro";
  }
): Promise<AdminBroadcast> {
  const query = `
    INSERT INTO public.admin_broadcasts (sender_id, title, message, type, channels, target_group, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING *
  `;
  const values = [
    actorId,
    data.title,
    data.message,
    data.type,
    data.channels,
    data.targetGroup
  ];
  const { rows } = await db.query(query, values);
  const b = rows[0];

  await createAuditLog({
    actorId,
    action: "create_broadcast",
    targetType: "broadcast",
    targetId: b.id,
    details: { type: data.type, targetGroup: data.targetGroup }
  });

  return {
    id: b.id,
    senderId: b.sender_id,
    title: b.title,
    message: b.message,
    type: b.type as "maintenance" | "promotion" | "security",
    channels: b.channels,
    targetGroup: b.target_group as "all" | "free" | "pro",
    createdAt: b.created_at
  };
}

// ---------------------------------------------------------
// 6. HEALTH & AUDIT LOGS ACTIONS
// ---------------------------------------------------------

export async function getSystemHealthAction(): Promise<{
  dbConnected: boolean;
  dbSize: string;
  activeConnections: number;
  apiStatus: "operational" | "degraded";
  jobsQueueCount: number;
  aiProviderStatus: string;
}> {
  try {
    const sizeRes = await db.query("SELECT pg_size_pretty(pg_database_size(current_database())) as size");
    const connRes = await db.query("SELECT count(*) as count FROM pg_stat_activity");
    return {
      dbConnected: true,
      dbSize: sizeRes.rows[0]?.size || "unknown",
      activeConnections: parseInt(connRes.rows[0]?.count || "0", 10),
      apiStatus: "operational",
      jobsQueueCount: 0,
      aiProviderStatus: "Operational"
    };
  } catch (err) {
    console.error(err);
    return {
      dbConnected: false,
      dbSize: "N/A",
      activeConnections: 0,
      apiStatus: "degraded",
      jobsQueueCount: 0,
      aiProviderStatus: "Offline"
    };
  }
}

export async function getAdminLogsAction(limit = 50): Promise<AdminAuditLog[]> {
  const query = `
    SELECT 
      l.id, l.actor_id as "actorId", l.action, l.target_type as "targetType",
      l.target_id as "targetId", l.ip_address as "ipAddress", l.details,
      l.created_at as "createdAt", p.full_name as "actorName"
    FROM public.admin_audit_logs l
    LEFT JOIN public.profiles p ON l.actor_id = p.id
    ORDER BY l.created_at DESC
    LIMIT $1
  `;
  const { rows } = await db.query(query, [limit]);
  return rows;
}

// ---------------------------------------------------------
// 7. ROLE BOOTSTRAPPING & STATUS CHECKS
// ---------------------------------------------------------
export async function getUserRoleAndStatusAction(
  userId: string,
  email: string
): Promise<{ role: UserRole; isSuspended: boolean }> {
  // Check if roles table is completely empty
  const countQuery = `SELECT COUNT(*) as count FROM public.user_roles`;
  const { rows: countRows } = await db.query(countQuery);
  const count = parseInt(countRows[0]?.count || "0", 10);

  if (count === 0) {
    // Bootstrap: make this user the super_admin
    const insertQuery = `
      INSERT INTO public.user_roles (user_id, role, is_suspended, updated_at)
      VALUES ($1, 'super_admin', false, NOW())
      ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', updated_at = NOW()
    `;
    await db.query(insertQuery, [userId]);
    
    // Log the bootstrap event
    await createAuditLog({
      actorId: userId,
      action: "bootstrap_super_admin",
      targetType: "user",
      targetId: userId,
      details: { email }
    });
    
    return { role: "super_admin", isSuspended: false };
  }

  // Otherwise, fetch user's role
  const query = `
    SELECT role, is_suspended as "isSuspended" 
    FROM public.user_roles 
    WHERE user_id = $1
  `;
  const { rows } = await db.query(query, [userId]);
  if (rows.length === 0) {
    return { role: "user", isSuspended: false };
  }

  return {
    role: (rows[0].role as UserRole) || "user",
    isSuspended: !!rows[0].isSuspended,
  };
}

// ---------------------------------------------------------
// 8. DASHBOARD TELEMETRY STATS ACTION
// ---------------------------------------------------------
export async function getAdminDashboardStatsAction(): Promise<{
  totalUsers: number;
  proUsers: number;
  totalResumes: number;
  aiGenerationsCount: number;
  mrr: number;
  arr: number;
  openTickets: number;
  pendingReports: number;
  registrationsChart: { date: string; count: number }[];
  resumesChart: { date: string; count: number }[];
  aiTokensChart: { date: string; count: number }[];
  planDistribution: { name: string; count: number }[];
}> {
  // 1. Core high level counts
  const totalUsersRes = await db.query("SELECT count(*) as count FROM public.profiles");
  const proUsersRes = await db.query("SELECT count(distinct user_id) as count FROM public.subscriptions WHERE status = 'active'");
  const totalResumesRes = await db.query("SELECT count(*) as count FROM public.resumes");
  const aiGenerationsRes = await db.query("SELECT count(*) as count FROM public.ai_generations");
  const openTicketsRes = await db.query("SELECT count(*) as count FROM public.support_tickets WHERE status NOT IN ('resolved', 'closed')");
  const pendingReportsRes = await db.query("SELECT count(*) as count FROM public.reported_items WHERE status = 'pending'");

  // 2. MRR / ARR
  const mrrRes = await db.query(`
    SELECT COALESCE(SUM(
      CASE 
        WHEN p.billing_interval = 'monthly' THEN p.price 
        WHEN p.billing_interval = 'yearly' THEN p.price / 12 
        ELSE 0 
      END
    ), 0) as mrr
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
  `);
  const mrr = parseFloat(mrrRes.rows[0]?.mrr || "0");
  const arr = mrr * 12;

  // 3. Last 7 Days charts
  const registrationsRes = await db.query(`
    SELECT to_char(created_at, 'YYYY-MM-DD') as date, count(*) as count 
    FROM public.profiles 
    WHERE created_at >= NOW() - INTERVAL '7 days' 
    GROUP BY date
    ORDER BY date ASC
  `);

  const resumesRes = await db.query(`
    SELECT to_char(created_at, 'YYYY-MM-DD') as date, count(*) as count 
    FROM public.resumes 
    WHERE created_at >= NOW() - INTERVAL '7 days' 
    GROUP BY date
    ORDER BY date ASC
  `);

  const aiTokensRes = await db.query(`
    SELECT to_char(created_at, 'YYYY-MM-DD') as date, SUM(COALESCE(tokens_used, 0))::integer as count 
    FROM public.ai_generations 
    WHERE created_at >= NOW() - INTERVAL '7 days' 
    GROUP BY date
    ORDER BY date ASC
  `);

  // 4. Plan distribution
  const planDistRes = await db.query(`
    SELECT p.name, count(*)::integer as count 
    FROM public.subscriptions s 
    JOIN public.plans p ON s.plan_id = p.id 
    WHERE s.status = 'active'
    GROUP BY p.name
  `);

  return {
    totalUsers: parseInt(totalUsersRes.rows[0]?.count || "0", 10),
    proUsers: parseInt(proUsersRes.rows[0]?.count || "0", 10),
    totalResumes: parseInt(totalResumesRes.rows[0]?.count || "0", 10),
    aiGenerationsCount: parseInt(aiGenerationsRes.rows[0]?.count || "0", 10),
    mrr,
    arr,
    openTickets: parseInt(openTicketsRes.rows[0]?.count || "0", 10),
    pendingReports: parseInt(pendingReportsRes.rows[0]?.count || "0", 10),
    registrationsChart: registrationsRes.rows.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
    resumesChart: resumesRes.rows.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
    aiTokensChart: aiTokensRes.rows.map(r => ({ date: r.date, count: parseInt(r.count || "0", 10) })),
    planDistribution: planDistRes.rows.map(r => ({ name: r.name, count: parseInt(r.count, 10) }))
  };
}

// ---------------------------------------------------------
// 9. PLAN MANAGEMENT ACTIONS
// ---------------------------------------------------------
export async function getAdminPlansAction(): Promise<any[]> {
  const query = `
    SELECT p.*, ul.max_resumes as "maxResumes", ul.max_ai_credits as "maxAiCredits", ul.max_ats_checks as "maxAtsChecks"
    FROM public.plans p
    LEFT JOIN public.usage_limits ul ON p.id = ul.plan_id
    ORDER BY p.price ASC
  `;
  const { rows } = await db.query(query);
  return rows;
}

export async function updatePlanPriceAction(
  actorId: string,
  planId: string,
  newPrice: number
): Promise<void> {
  const query = `UPDATE public.plans SET price = $1 WHERE id = $2`;
  await db.query(query, [newPrice, planId]);

  await createAuditLog({
    actorId,
    action: "update_plan_price",
    targetType: "plan",
    targetId: planId,
    details: { newPrice }
  });
}

