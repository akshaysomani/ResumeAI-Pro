"use server";

import { db } from "@/lib/db";
import type {
  Organization,
  Workspace,
  OrgMember,
  OrgInvitation,
  DocumentComment,
  DocumentLock,
  UserPresence,
  RecruiterFeedback,
  ResumeReviewRequest,
  PlacementRecord,
  OrgBilling,
  WorkspaceActivity
} from "@/types";

// ---------------------------------------------------------
// Helper: Log Workspace Concurrency Activities
// ---------------------------------------------------------
export async function logWorkspaceActivityAction(
  workspaceId: string,
  userId: string | null,
  actionType: string,
  details: any
): Promise<void> {
  try {
    const query = `
      INSERT INTO public.workspace_activity_logs (workspace_id, user_id, action_type, details, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;
    await db.query(query, [workspaceId, userId, actionType, JSON.stringify(details || {})]);
  } catch (err) {
    console.error("Failed to write workspace activity log:", err);
  }
}

// ---------------------------------------------------------
// 1. ORGANIZATIONS MANAGEMENT ACTIONS
// ---------------------------------------------------------
export async function createOrganizationAction(
  ownerId: string,
  name: string,
  description?: string
): Promise<Organization> {
  const branding = { primaryColor: "#4f46e5", secondaryColor: "#10b981" };
  
  // 1. Insert organization
  const orgQuery = `
    INSERT INTO public.organizations (name, description, branding, owner_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `;
  const { rows: orgRows } = await db.query(orgQuery, [name, description || null, JSON.stringify(branding), ownerId]);
  const org = orgRows[0];

  // 2. Add owner to membership list
  const memberQuery = `
    INSERT INTO public.organization_members (organization_id, user_id, role, status, created_at, updated_at)
    VALUES ($1, $2, 'owner', 'active', NOW(), NOW())
  `;
  await db.query(memberQuery, [org.id, ownerId]);

  // 3. Create default workspaces
  const workspaceQuery = `
    INSERT INTO public.workspaces (organization_id, name, type, created_at, updated_at)
    VALUES ($1, 'Main Workspace', 'corporate', NOW(), NOW())
    RETURNING id
  `;
  const { rows: wsRows } = await db.query(workspaceQuery, [org.id]);
  const wsId = wsRows[0].id;

  // 4. Create default billing row
  const billingQuery = `
    INSERT INTO public.organization_billing (organization_id, plan_type, seats, additional_ai_credits, created_at, updated_at)
    VALUES ($1, 'free', 5, 0, NOW(), NOW())
  `;
  await db.query(billingQuery, [org.id]);

  // Log activity
  await logWorkspaceActivityAction(wsId, ownerId, "member_invited", { email: "owner_joined", role: "owner" });

  return {
    id: org.id,
    name: org.name,
    logoUrl: org.logo_url,
    description: org.description,
    branding: org.branding,
    ownerId: org.owner_id,
    createdAt: org.created_at,
    updatedAt: org.updated_at
  };
}

export async function renameOrganizationAction(
  actorId: string,
  orgId: string,
  name: string,
  description?: string
): Promise<void> {
  const query = `
    UPDATE public.organizations 
    SET name = $1, description = $2, updated_at = NOW() 
    WHERE id = $3 AND owner_id = $4
  `;
  await db.query(query, [name, description || null, orgId, actorId]);
}

export async function updateBrandingAction(
  actorId: string,
  orgId: string,
  branding: any
): Promise<void> {
  const query = `
    UPDATE public.organizations 
    SET branding = $1, updated_at = NOW() 
    WHERE id = $2 AND owner_id = $3
  `;
  await db.query(query, [JSON.stringify(branding), orgId, actorId]);
}

export async function deleteOrganizationAction(actorId: string, orgId: string): Promise<void> {
  const query = `DELETE FROM public.organizations WHERE id = $1 AND owner_id = $2`;
  await db.query(query, [orgId, actorId]);
}

export async function transferOrgOwnershipAction(
  actorId: string,
  orgId: string,
  newOwnerId: string
): Promise<void> {
  // Update organization owner
  const orgQuery = `UPDATE public.organizations SET owner_id = $1 WHERE id = $2 AND owner_id = $3`;
  await db.query(orgQuery, [newOwnerId, orgId, actorId]);

  // Update memberships
  const memberQuery1 = `UPDATE public.organization_members SET role = 'owner' WHERE organization_id = $1 AND user_id = $2`;
  await db.query(memberQuery1, [orgId, newOwnerId]);

  const memberQuery2 = `UPDATE public.organization_members SET role = 'admin' WHERE organization_id = $1 AND user_id = $2`;
  await db.query(memberQuery2, [orgId, actorId]);
}

export async function getOrganizationsAction(userId: string): Promise<Organization[]> {
  const query = `
    SELECT o.* 
    FROM public.organizations o
    LEFT JOIN public.organization_members om ON o.id = om.organization_id
    WHERE o.owner_id = $1 OR (om.user_id = $1 AND om.status = 'active')
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  const { rows } = await db.query(query, [userId]);
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    logoUrl: r.logo_url,
    description: r.description,
    branding: r.branding,
    ownerId: r.owner_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

// ---------------------------------------------------------
// 2. TEAM & MEMBERSHIP MANAGEMENT ACTIONS
// ---------------------------------------------------------
export async function inviteMemberAction(
  actorId: string,
  orgId: string,
  email: string,
  role: string
): Promise<OrgInvitation> {
  // Generate random token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // expires in 7 days

  const query = `
    INSERT INTO public.organization_invitations (organization_id, email, role, invited_by, status, token, expires_at, created_at)
    VALUES ($1, $2, $3, $4, 'pending', $5, $6, NOW())
    RETURNING *
  `;
  const { rows } = await db.query(query, [orgId, email, role, actorId, token, expiresAt]);
  const inv = rows[0];

  return {
    id: inv.id,
    organizationId: inv.organization_id,
    email: inv.email,
    role: inv.role,
    invitedBy: inv.invited_by,
    status: inv.status,
    token: inv.token,
    expiresAt: inv.expires_at,
    createdAt: inv.created_at
  };
}

export async function bulkInviteMembersAction(
  actorId: string,
  orgId: string,
  emails: string[],
  role: string
): Promise<OrgInvitation[]> {
  const invitations: OrgInvitation[] = [];
  for (const email of emails) {
    if (email.trim()) {
      const inv = await inviteMemberAction(actorId, orgId, email.trim(), role);
      invitations.push(inv);
    }
  }
  return invitations;
}

export async function resendInvitationAction(actorId: string, invitationId: string): Promise<void> {
  const query = `
    UPDATE public.organization_invitations 
    SET created_at = NOW(), expires_at = NOW() + INTERVAL '7 days' 
    WHERE id = $1 AND invited_by = $2
  `;
  await db.query(query, [invitationId, actorId]);
}

export async function acceptInvitationAction(userId: string, token: string): Promise<void> {
  // Find invitation
  const findQuery = `SELECT * FROM public.organization_invitations WHERE token = $1 AND status = 'pending'`;
  const { rows } = await db.query(findQuery, [token]);
  if (rows.length === 0) {
    throw new Error("Invitation token is invalid or expired.");
  }
  const inv = rows[0];

  if (new Date(inv.expires_at) < new Date()) {
    throw new Error("Invitation link has expired.");
  }

  // Update invitation status
  await db.query(`UPDATE public.organization_invitations SET status = 'accepted' WHERE id = $1`, [inv.id]);

  // Insert membership
  const insertQuery = `
    INSERT INTO public.organization_members (organization_id, user_id, role, status, created_at, updated_at)
    VALUES ($1, $2, $3, 'active', NOW(), NOW())
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = NOW()
  `;
  await db.query(insertQuery, [inv.organization_id, userId, inv.role]);
}

export async function removeMemberAction(actorId: string, orgId: string, userId: string): Promise<void> {
  const query = `DELETE FROM public.organization_members WHERE organization_id = $1 AND user_id = $2`;
  await db.query(query, [orgId, userId]);
}

export async function toggleMemberSuspensionAction(
  actorId: string,
  orgId: string,
  userId: string,
  suspend: boolean
): Promise<void> {
  const status = suspend ? "suspended" : "active";
  const query = `
    UPDATE public.organization_members 
    SET status = $1, updated_at = NOW() 
    WHERE organization_id = $2 AND user_id = $3
  `;
  await db.query(query, [status, orgId, userId]);
}

export async function changeMemberRoleAction(
  actorId: string,
  orgId: string,
  userId: string,
  role: string
): Promise<void> {
  const query = `
    UPDATE public.organization_members 
    SET role = $1, updated_at = NOW() 
    WHERE organization_id = $2 AND user_id = $3
  `;
  await db.query(query, [role, orgId, userId]);
}

export async function getOrgMembersAction(orgId: string): Promise<OrgMember[]> {
  const query = `
    SELECT om.*, p.full_name as "fullName", p.email
    FROM public.organization_members om
    JOIN public.profiles p ON om.user_id = p.id
    WHERE om.organization_id = $1
    ORDER BY om.created_at ASC
  `;
  const { rows } = await db.query(query, [orgId]);
  return rows;
}

export async function getOrgInvitationsAction(orgId: string): Promise<OrgInvitation[]> {
  const query = `SELECT * FROM public.organization_invitations WHERE organization_id = $1 AND status = 'pending' ORDER BY created_at DESC`;
  const { rows } = await db.query(query, [orgId]);
  return rows.map((r: any) => ({
    id: r.id,
    organizationId: r.organization_id,
    email: r.email,
    role: r.role,
    invitedBy: r.invited_by,
    status: r.status,
    token: r.token,
    expiresAt: r.expires_at,
    createdAt: r.created_at
  }));
}

// ---------------------------------------------------------
// 3. WORKSPACE MANAGEMENT ACTIONS
// ---------------------------------------------------------
export async function getOrgWorkspacesAction(orgId: string): Promise<Workspace[]> {
  const query = `SELECT * FROM public.workspaces WHERE organization_id = $1 ORDER BY created_at ASC`;
  const { rows } = await db.query(query, [orgId]);
  return rows.map((r: any) => ({
    id: r.id,
    organizationId: r.organization_id,
    name: r.name,
    type: r.type as any,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export async function createWorkspaceAction(orgId: string, name: string, type: string): Promise<Workspace> {
  const query = `
    INSERT INTO public.workspaces (organization_id, name, type, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING *
  `;
  const { rows } = await db.query(query, [orgId, name, type]);
  const r = rows[0];

  return {
    id: r.id,
    organizationId: r.organization_id,
    name: r.name,
    type: r.type,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function getWorkspaceAssetsAction(
  workspaceId: string
): Promise<{
  resumes: any[];
  coverLetters: any[];
  documents: any[];
}> {
  const resumes = await db.query(`SELECT r.*, p.full_name as "userName" FROM public.resumes r JOIN public.profiles p ON r.user_id = p.id WHERE r.workspace_id = $1`, [workspaceId]);
  const coverLetters = await db.query(`SELECT c.*, p.full_name as "userName" FROM public.cover_letters c JOIN public.profiles p ON c.user_id = p.id WHERE c.workspace_id = $1`, [workspaceId]);
  const documents = await db.query(`SELECT d.*, p.full_name as "userName" FROM public.career_documents d JOIN public.profiles p ON d.user_id = p.id WHERE d.workspace_id = $1`, [workspaceId]);

  return {
    resumes: resumes.rows,
    coverLetters: coverLetters.rows,
    documents: documents.rows
  };
}

export async function getWorkspaceActivityLogsAction(workspaceId: string): Promise<WorkspaceActivity[]> {
  const query = `
    SELECT wal.*, p.full_name as "userName"
    FROM public.workspace_activity_logs wal
    LEFT JOIN public.profiles p ON wal.user_id = p.id
    WHERE wal.workspace_id = $1
    ORDER BY wal.created_at DESC
    LIMIT 30
  `;
  const { rows } = await db.query(query, [workspaceId]);
  return rows.map((r: any) => ({
    id: r.id,
    workspaceId: r.workspace_id,
    userId: r.user_id,
    userName: r.userName || "System Agent",
    actionType: r.action_type as any,
    details: r.details,
    createdAt: r.created_at
  }));
}

// ---------------------------------------------------------
// 4. COMMENTS & REVIEWS ACTIONS
// ---------------------------------------------------------
export async function getDocumentCommentsAction(documentType: string, documentId: string): Promise<DocumentComment[]> {
  const query = `
    SELECT dc.*, p.full_name as "userName"
    FROM public.document_comments dc
    JOIN public.profiles p ON dc.user_id = p.id
    WHERE dc.document_type = $1 AND dc.document_id = $2
    ORDER BY dc.created_at ASC
  `;
  const { rows } = await db.query(query, [documentType, documentId]);
  return rows.map((r: any) => ({
    id: r.id,
    documentType: r.document_type as any,
    documentId: r.document_id,
    userId: r.user_id,
    content: r.content,
    parentId: r.parent_id,
    resolved: r.resolved,
    resolvedBy: r.resolved_by,
    assignedTo: r.assigned_to,
    highlightText: r.highlight_text,
    highlightRange: r.highlight_range,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    userName: r.userName
  }));
}

export async function createCommentAction(data: {
  documentType: string;
  documentId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  highlightText?: string | null;
  highlightRange?: any;
  assignedTo?: string | null;
}): Promise<DocumentComment> {
  const query = `
    INSERT INTO public.document_comments (
      document_type, document_id, user_id, content, parent_id,
      highlight_text, highlight_range, assigned_to, resolved, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW())
    RETURNING *
  `;
  const values = [
    data.documentType,
    data.documentId,
    data.userId,
    data.content,
    data.parentId || null,
    data.highlightText || null,
    data.highlightRange ? JSON.stringify(data.highlightRange) : null,
    data.assignedTo || null
  ];
  const { rows } = await db.query(query, values);
  const r = rows[0];

  const profileRes = await db.query("SELECT full_name FROM public.profiles WHERE id = $1", [data.userId]);
  
  return {
    id: r.id,
    documentType: r.document_type,
    documentId: r.document_id,
    userId: r.user_id,
    content: r.content,
    parentId: r.parent_id,
    resolved: r.resolved,
    resolvedBy: r.resolved_by,
    assignedTo: r.assigned_to,
    highlightText: r.highlight_text,
    highlightRange: r.highlight_range,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    userName: profileRes.rows[0]?.full_name || "Member"
  };
}

export async function resolveCommentAction(commentId: string, userId: string): Promise<void> {
  const query = `UPDATE public.document_comments SET resolved = true, resolved_by = $1, updated_at = NOW() WHERE id = $2`;
  await db.query(query, [userId, commentId]);
}

// ---------------------------------------------------------
// 5. CONCURRENCY & HEARTBEATS PRESENCE
// ---------------------------------------------------------
export async function acquireDocumentLockAction(
  documentType: string,
  documentId: string,
  userId: string
): Promise<boolean> {
  // Cleanup old locks (> 30s)
  await db.query(`DELETE FROM public.document_locks WHERE locked_at < NOW() - INTERVAL '30 seconds'`);

  try {
    const query = `
      INSERT INTO public.document_locks (document_type, document_id, user_id, locked_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (document_type, document_id) DO UPDATE 
        SET locked_at = NOW() 
        WHERE document_locks.user_id = EXCLUDED.user_id
      RETURNING *
    `;
    const { rows } = await db.query(query, [documentType, documentId, userId]);
    return rows.length > 0;
  } catch (err) {
    return false;
  }
}

export async function releaseDocumentLockAction(
  documentType: string,
  documentId: string,
  userId: string
): Promise<void> {
  const query = `DELETE FROM public.document_locks WHERE document_type = $1 AND document_id = $2 AND user_id = $3`;
  await db.query(query, [documentType, documentId, userId]);
}

export async function getDocumentLockAction(documentType: string, documentId: string): Promise<DocumentLock | null> {
  // Cleanup old locks first
  await db.query(`DELETE FROM public.document_locks WHERE locked_at < NOW() - INTERVAL '30 seconds'`);

  const query = `
    SELECT dl.*, p.full_name as "userName"
    FROM public.document_locks dl
    JOIN public.profiles p ON dl.user_id = p.id
    WHERE dl.document_type = $1 AND dl.document_id = $2
  `;
  const { rows } = await db.query(query, [documentType, documentId]);
  if (rows.length === 0) return null;
  return {
    documentType: rows[0].document_type,
    documentId: rows[0].document_id,
    userId: rows[0].user_id,
    lockedAt: rows[0].locked_at,
    userName: rows[0].userName
  };
}

export async function heartbeatPresenceAction(workspaceId: string, userId: string): Promise<void> {
  const query = `
    INSERT INTO public.user_presence (workspace_id, user_id, last_seen_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET last_seen_at = NOW()
  `;
  await db.query(query, [workspaceId, userId]);
}

export async function getWorkspacePresenceAction(workspaceId: string): Promise<UserPresence[]> {
  const query = `
    SELECT up.*, p.full_name as "userName"
    FROM public.user_presence up
    JOIN public.profiles p ON up.user_id = p.id
    WHERE up.workspace_id = $1 AND up.last_seen_at >= NOW() - INTERVAL '30 seconds'
  `;
  const { rows } = await db.query(query, [workspaceId]);
  return rows.map((r: any) => ({
    workspaceId: r.workspace_id,
    userId: r.user_id,
    lastSeenAt: r.last_seen_at,
    userName: r.userName
  }));
}

// ---------------------------------------------------------
// 6. RECRUITER PORTAL ACTIONS
// ---------------------------------------------------------
export async function getRecruiterCandidatesAction(orgId: string): Promise<any[]> {
  // In a real application, recruiters evaluate candidate submissions or organization students list.
  // We list all profiles that are not administrators in this workspace.
  const query = `
    SELECT p.id, p.full_name as "fullName", p.email, p.created_at as "createdAt",
      (SELECT count(*) FROM public.resumes r WHERE r.user_id = p.id) as "resumesCount"
    FROM public.profiles p
    ORDER BY p.created_at DESC
    LIMIT 30;
  `;
  const { rows } = await db.query(query);
  return rows;
}

export async function getRecruiterFeedbackAction(orgId: string): Promise<RecruiterFeedback[]> {
  const query = `
    SELECT rf.*, p.full_name as "candidateName", p.email as "candidateEmail"
    FROM public.recruiter_feedbacks rf
    JOIN public.profiles p ON rf.candidate_id = p.id
    WHERE rf.organization_id = $1
    ORDER BY rf.updated_at DESC
  `;
  const { rows } = await db.query(query, [orgId]);
  return rows;
}

export async function postRecruiterFeedbackAction(data: {
  orgId: string;
  recruiterId: string;
  candidateId: string;
  resumeId?: string;
  feedback: string;
  rating?: number;
  status: string;
}): Promise<void> {
  const query = `
    INSERT INTO public.recruiter_feedbacks (
      organization_id, recruiter_id, candidate_id, resume_id, feedback, rating, candidate_status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (organization_id, recruiter_id, candidate_id) 
    DO UPDATE SET 
      feedback = EXCLUDED.feedback,
      rating = EXCLUDED.rating,
      candidate_status = EXCLUDED.candidate_status,
      updated_at = NOW()
  `;
  await db.query(query, [
    data.orgId,
    data.recruiterId,
    data.candidateId,
    data.resumeId || null,
    data.feedback,
    data.rating || 5,
    data.status
  ]);
}

export async function bookmarkCandidateAction(
  orgId: string,
  recruiterId: string,
  candidateId: string,
  bookmark: boolean
): Promise<void> {
  const query = `
    INSERT INTO public.recruiter_feedbacks (organization_id, recruiter_id, candidate_id, feedback, bookmarked, created_at, updated_at)
    VALUES ($1, $2, $3, 'Bookmarked candidate', $4, NOW(), NOW())
    ON CONFLICT (organization_id, recruiter_id, candidate_id) DO UPDATE SET bookmarked = EXCLUDED.bookmarked, updated_at = NOW()
  `;
  await db.query(query, [orgId, recruiterId, candidateId, bookmark]);
}

// ---------------------------------------------------------
// 7. UNIVERSITY / CAREER CENTER ACTIONS
// ---------------------------------------------------------
export async function getResumeReviewRequestsAction(workspaceId: string): Promise<ResumeReviewRequest[]> {
  const query = `
    SELECT rrr.*, ps.full_name as "studentName", ps.email as "studentEmail", r.title as "resumeTitle"
    FROM public.resume_review_requests rrr
    JOIN public.profiles ps ON rrr.student_id = ps.id
    JOIN public.resumes r ON rrr.resume_id = r.id
    WHERE rrr.workspace_id = $1
    ORDER BY rrr.created_at DESC
  `;
  const { rows } = await db.query(query, [workspaceId]);
  return rows;
}

export async function requestResumeReviewAction(
  workspaceId: string,
  studentId: string,
  resumeId: string
): Promise<void> {
  const query = `
    INSERT INTO public.resume_review_requests (workspace_id, student_id, resume_id, status, created_at, updated_at)
    VALUES ($1, $2, $3, 'pending', NOW(), NOW())
  `;
  await db.query(query, [workspaceId, studentId, resumeId]);
}

export async function submitReviewFeedbackAction(
  requestId: string,
  counselorId: string,
  status: string,
  feedback: string
): Promise<void> {
  const query = `
    UPDATE public.resume_review_requests
    SET status = $1, feedback = $2, counselor_id = $3, updated_at = NOW()
    WHERE id = $4
  `;
  await db.query(query, [status, feedback, counselorId, requestId]);
}

export async function getPlacementRecordsAction(workspaceId: string): Promise<PlacementRecord[]> {
  const query = `
    SELECT pr.*, p.full_name as "studentName", p.email as "studentEmail"
    FROM public.placement_records pr
    JOIN public.profiles p ON pr.student_id = p.id
    WHERE pr.workspace_id = $1
    ORDER BY pr.placement_date DESC
  `;
  const { rows } = await db.query(query, [workspaceId]);
  return rows;
}

export async function logPlacementRecordAction(data: {
  workspaceId: string;
  studentId: string;
  companyName: string;
  jobRole: string;
  packageLpa: number;
  status: string;
}): Promise<void> {
  const query = `
    INSERT INTO public.placement_records (workspace_id, student_id, company_name, job_role, package_lpa, status, placement_date, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, NOW())
  `;
  await db.query(query, [
    data.workspaceId,
    data.studentId,
    data.companyName,
    data.jobRole,
    data.packageLpa,
    data.status
  ]);
}

// ---------------------------------------------------------
// 8. BILLING & SEAT ACTIONS
// ---------------------------------------------------------
export async function getOrgBillingAction(orgId: string): Promise<OrgBilling | null> {
  const query = `SELECT * FROM public.organization_billing WHERE organization_id = $1`;
  const { rows } = await db.query(query, [orgId]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    organizationId: r.organization_id,
    planType: r.plan_type,
    seats: r.seats,
    additionalAiCredits: r.additional_ai_credits,
    stripeCustomerId: r.stripe_customer_id,
    stripeSubscriptionId: r.stripe_subscription_id,
    billingEmail: r.billing_email,
    taxId: r.tax_id,
    purchaseOrderNumber: r.purchase_order_number,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function updateBillingDetailsAction(
  actorId: string,
  orgId: string,
  data: { billingEmail?: string; taxId?: string; poNumber?: string }
): Promise<void> {
  const query = `
    UPDATE public.organization_billing
    SET 
      billing_email = COALESCE($1, billing_email),
      tax_id = COALESCE($2, tax_id),
      purchase_order_number = COALESCE($3, purchase_order_number),
      updated_at = NOW()
    WHERE organization_id = $4
  `;
  await db.query(query, [data.billingEmail || null, data.taxId || null, data.poNumber || null, orgId]);
}

export async function adjustSeatsAction(actorId: string, orgId: string, count: number): Promise<void> {
  const query = `UPDATE public.organization_billing SET seats = seats + $1, updated_at = NOW() WHERE organization_id = $2`;
  await db.query(query, [count, orgId]);
}

export async function addAiCreditsAction(actorId: string, orgId: string, credits: number): Promise<void> {
  const query = `UPDATE public.organization_billing SET additional_ai_credits = additional_ai_credits + $1, updated_at = NOW() WHERE organization_id = $2`;
  await db.query(query, [credits, orgId]);
}
