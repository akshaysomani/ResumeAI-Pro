export type Theme = "light" | "dark";

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  headline?: string;
  summary?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  phoneNumber?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  dob?: string;
  gender?: string;
  country?: string;
  twitterUrl?: string;
  personalWebsite?: string;
  preferredLanguage?: string;
  timezone?: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  description?: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  sections: ResumeSection[];
  atsScore?: number;
  status: "draft" | "completed" | "archived" | "published";
  isFavorite: boolean;
  isArchived: boolean;
  colorTheme: string;
  fontFamily: string;
  paperSize: string;
  pageMargin: string;
  layoutStyle: string;
  resumeType: string;
  themeConfig?: any;
  workspaceId?: string;
}

export type SectionType =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications"
  | "languages"
  | "achievements"
  | "internships"
  | "interests"
  | "references"
  | "publications"
  | "awards"
  | "volunteer_experience"
  | "custom_sections";

export interface ResumeSection {
  id: string;
  resumeId: string;
  sectionType: SectionType;
  title: string;
  orderIndex: number;
  content: any; // Dynamic JSON structure based on SectionType
}

export interface ResumeVersion {
  id: string;
  resumeId: string;
  versionNumber: number;
  resumeData: any;
  createdAt: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string;
  category: "modern" | "minimal" | "professional" | "executive" | "creative" | "academic";
  config: any;
}

export interface Subscription {
  id: string;
  userId: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
  planType: "free" | "pro";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  providerPaymentId: string;
  createdAt: string;
}

export interface AIUsage {
  id: string;
  userId: string;
  actionType: "resume_generation" | "bullet_point" | "summary" | "keyword" | "ats_check" | "cover_letter";
  creditsUsed: number;
  createdAt: string;
}

export interface ExportedFile {
  id: string;
  resumeId: string;
  fileUrl: string;
  fileType: "pdf" | "docx";
  createdAt: string;
}

export interface JobMatch {
  id: string;
  resumeId: string;
  jobDescription: string;
  matchScore: number;
  missingSkills: string[];
  suggestedImprovements: string[];
  createdAt: string;
}

export interface CoverLetter {
  id: string;
  userId: string;
  resumeId?: string;
  title: string;
  jobTitle: string;
  companyName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  workspaceId?: string;
}

// ==========================================
// NEW NORMALIZED CORE SECTIONS TYPES
// ==========================================

export interface PersonalInformation {
  id: string;
  resumeId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface Education {
  id: string;
  resumeId: string;
  school: string;
  degree?: string;
  major?: string;
  gpa?: string;
  duration?: string;
  orderIndex: number;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentlyStudying: boolean;
  description?: string;
}

export interface Experience {
  id: string;
  resumeId: string;
  company: string;
  role: string;
  duration?: string;
  description?: string;
  orderIndex: number;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking: boolean;
  achievements?: string;
}

export interface Internship {
  id: string;
  resumeId: string;
  company: string;
  role: string;
  duration?: string;
  description?: string;
  orderIndex: number;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking: boolean;
  achievements?: string;
}

export interface Project {
  id: string;
  resumeId: string;
  title: string;
  role?: string;
  url?: string;
  description?: string;
  orderIndex: number;
  technologies?: string;
  githubUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface Skill {
  id: string;
  resumeId: string;
  name: string;
  proficiency?: string;
  category?: string;
  orderIndex: number;
  yearsOfExperience?: number;
  isPrimary: boolean;
  isSecondary: boolean;
}

export interface Certification {
  id: string;
  resumeId: string;
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
  orderIndex: number;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Achievement {
  id: string;
  resumeId: string;
  title: string;
  description?: string;
  orderIndex: number;
}

export interface Language {
  id: string;
  resumeId: string;
  name: string;
  proficiency?: string;
  orderIndex: number;
  reading?: string;
  writing?: string;
  speaking?: string;
}

export interface Interest {
  id: string;
  resumeId: string;
  name: string;
  orderIndex: number;
}

export interface Reference {
  id: string;
  resumeId: string;
  name: string;
  title?: string;
  company?: string;
  contact?: string;
  orderIndex: number;
}

export interface Publication {
  id: string;
  resumeId: string;
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
  orderIndex: number;
}

export interface Award {
  id: string;
  resumeId: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
  orderIndex: number;
}

export interface VolunteerExperience {
  id: string;
  resumeId: string;
  organization: string;
  role: string;
  duration?: string;
  description?: string;
  orderIndex: number;
}

export interface CustomSection {
  id: string;
  resumeId: string;
  sectionTitle: string;
  content: any;
  orderIndex: number;
}

// ==========================================
// AI, ATS & PUBLIC SHARING TYPES
// ==========================================

export interface AIGeneration {
  id: string;
  userId: string;
  prompt: string;
  generatedText: string;
  generationType: string;
  tokensUsed?: number;
  modelName?: string;
  createdAt: string;
}

export interface AtsAnalysis {
  id: string;
  resumeId: string;
  overallScore: number;
  formatScore?: number;
  keywordScore?: number;
  grammarScore?: number;
  designScore?: number;
  missingKeywords?: string[];
  recommendations?: string[];
  analyzedAt: string;
}

export interface PublicResumeLink {
  id: string;
  resumeId: string;
  uniqueSlug: string;
  visibility: "public" | "private";
  expiration?: string;
  viewCount: number;
  qrCodeReference?: string;
  createdAt: string;
}

// ==========================================
// BILLING, SETTINGS & ANALYTICS TYPES
// ==========================================

export interface Plan {
  id: string;
  name: string;
  price: number;
  billingInterval: "monthly" | "yearly";
  description?: string;
  createdAt: string;
}

export interface PaymentHistory {
  id: string;
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  invoiceUrl?: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface UsageLimit {
  id: string;
  planId: string;
  maxResumes: number;
  maxAiCredits: number;
  maxAtsChecks: number;
}

export interface FeatureAccess {
  id: string;
  planId: string;
  featureName: string;
  enabled: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: "light" | "dark";
  language: string;
  timezone: string;
  notifications?: any;
  privacy?: any;
  emailPreferences?: any;
}

export interface DatabaseAnalytics {
  id: string;
  userId: string;
  actionType: string;
  details?: any;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  readStatus: boolean;
  type?: string;
  timestamp: string;
}

// ==========================================
// ENTERPRISE CAREER DOCUMENT SUITE TYPES
// ==========================================

export interface DocumentFolder {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareerDocument {
  id: string;
  userId: string;
  resumeId?: string;
  folderId?: string;
  documentType: string;
  title: string;
  content: string;
  metaConfig: any;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isDraft: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  workspaceId?: string;
}

export interface CareerDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  metaConfig: any;
  createdAt: string;
}

export interface CareerDocumentShare {
  id: string;
  documentId: string;
  uniqueSlug: string;
  visibility: "public" | "private" | "password";
  passwordHash?: string;
  downloadAllowed: boolean;
  printAllowed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// ENTERPRISE AI CAREER INTELLIGENCE SUITE TYPES
// ==========================================

export interface InterviewSession {
  id: string;
  userId: string;
  resumeId?: string | null;
  jobRole: string;
  targetCompany?: string;
  experienceLevel: string;
  difficulty: string;
  interviewType: string;
  interviewMode: string;
  duration: number;
  questionCount: number;
  preferredLanguage: string;
  overallScore?: number | null;
  communicationScore?: number | null;
  technicalScore?: number | null;
  confidenceScore?: number | null;
  leadershipScore?: number | null;
  problemSolvingScore?: number | null;
  cultureFitScore?: number | null;
  roleReadinessScore?: number | null;
  generalFeedback?: string | null;
  strengths: string[];
  weaknesses: string[];
  suggestedImprovements: string[];
  status: "draft" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  questionText: string;
  category: string;
  userAnswer?: string | null;
  overallScore?: number | null;
  clarityScore?: number | null;
  confidenceScore?: number | null;
  relevanceScore?: number | null;
  technicalScore?: number | null;
  starEvaluation?: {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
  };
  generalFeedback?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  missedPoints: string[];
  suggestedImprovement?: string | null;
  betterAnswer?: string | null;
  createdAt: string;
  evaluatedAt?: string | null;
}

export interface CareerGoal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  status: "active" | "completed" | "archived";
  progress: number;
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string | null;
  }>;
  aiSuggestions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CareerRoadmap {
  id: string;
  userId: string;
  currentSkills: string[];
  goal: string;
  timeline?: string;
  budget?: string;
  roadmapData: {
    milestones: Array<{
      title: string;
      description: string;
      estimatedTime: string;
      resources: string[];
    }>;
    certifications: string[];
    skillsToAcquire: string[];
    books: string[];
    courses: string[];
    projects: string[];
  };
  createdAt: string;
}

export interface SalaryReport {
  id: string;
  userId: string;
  role: string;
  experience?: string;
  location?: string;
  industry?: string;
  rangeMin?: number;
  rangeMax?: number;
  rangeMedian?: number;
  trendData: {
    growthTrend: string;
    marketDemand: "high" | "medium" | "low";
    benefits: string[];
  };
  negotiationTips: string[];
  createdAt: string;
}

export interface LearningPlan {
  id: string;
  userId: string;
  targetRole: string;
  missingSkills: Array<{
    skill: string;
    priority: "high" | "medium" | "low";
    difficulty: "beginner" | "intermediate" | "advanced";
    hours: number;
  }>;
  learningResources: Array<{
    skill: string;
    courses: string[];
    books: string[];
    platforms: string[];
    challenges: string[];
  }>;
  createdAt: string;
}

export interface CoachChat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoachMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// ==========================================
// ENTERPRISE ADMIN PORTAL & OPERATIONS TYPES
// ==========================================

export interface UserRoleMapping {
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  actorId?: string | null;
  actorName?: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  ipAddress?: string | null;
  details: any;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "assigned" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketReply {
  id: string;
  ticketId: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ReportedItem {
  id: string;
  itemType: "resume" | "profile";
  itemId: string;
  itemTitle?: string;
  reporterId?: string | null;
  reporterEmail?: string;
  reason: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBroadcast {
  id: string;
  senderId?: string | null;
  title: string;
  message: string;
  type: "maintenance" | "promotion" | "security";
  channels: string[];
  targetGroup: "all" | "free" | "pro";
  createdAt: string;
}

export interface AnalyticsSnapshot {
  id: string;
  metricName: string;
  metricValue: number;
  snapshotDate: string;
  createdAt: string;
}

// ==========================================
// ENTERPRISE COLLABORATION & BILLING TYPES
// ==========================================

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
    emailTemplate?: string;
  };
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  type: "personal" | "startup" | "agency" | "university" | "corporate" | "career_center";
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "manager" | "recruiter" | "career_coach" | "hr" | "hiring_manager" | "interviewer" | "editor" | "viewer";
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  email?: string;
}

export interface OrgInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  status: "pending" | "accepted" | "revoked";
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface DocumentComment {
  id: string;
  documentType: "resume" | "cover_letter" | "document";
  documentId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  resolved: boolean;
  resolvedBy?: string | null;
  assignedTo?: string | null;
  highlightText?: string | null;
  highlightRange?: any;
  createdAt: string;
  updatedAt: string;
  userName?: string;
}

export interface DocumentLock {
  documentType: string;
  documentId: string;
  userId: string;
  lockedAt: string;
  userName?: string;
}

export interface UserPresence {
  workspaceId: string;
  userId: string;
  lastSeenAt: string;
  userName?: string;
}

export interface RecruiterFeedback {
  id: string;
  organizationId: string;
  recruiterId: string;
  candidateId: string;
  resumeId?: string | null;
  feedback: string;
  candidateStatus: "applied" | "reviewing" | "shortlisted" | "interviewing" | "offered" | "rejected";
  rating?: number;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  candidateName?: string;
  candidateEmail?: string;
}

export interface ResumeReviewRequest {
  id: string;
  workspaceId: string;
  studentId: string;
  resumeId: string;
  counselorId?: string | null;
  status: "pending" | "reviewing" | "approved" | "changes_requested";
  feedback?: string | null;
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  studentEmail?: string;
  resumeTitle?: string;
}

export interface PlacementRecord {
  id: string;
  workspaceId: string;
  studentId: string;
  companyName: string;
  jobRole: string;
  packageLpa?: number;
  status: "applied" | "interviewing" | "offered" | "placed";
  placementDate: string;
  createdAt: string;
  studentName?: string;
  studentEmail?: string;
}

export interface OrgBilling {
  id: string;
  organizationId: string;
  planType: "free" | "team_starter" | "enterprise";
  seats: number;
  additionalAiCredits: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  billingEmail?: string;
  taxId?: string;
  purchaseOrderNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceActivity {
  id: string;
  workspaceId: string;
  userId?: string | null;
  userName?: string;
  actionType: "resume_edited" | "template_changed" | "ai_generation" | "comment_added" | "member_invited" | "export_created";
  details: any;
  createdAt: string;
}

// =============================================
// MODULE 14: API Platform & Integrations
// =============================================

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  requestCount: number;
  isRevoked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthApp {
  id: string;
  userId: string;
  appName: string;
  description?: string | null;
  clientId: string;
  redirectUris: string[];
  scopes: string[];
  homepageUrl?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthToken {
  id: string;
  appId: string;
  userId: string;
  scopes: string[];
  expiresAt: string;
  revoked: boolean;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: string;
  userId: string;
  organizationId?: string | null;
  url: string;
  description?: string | null;
  signingSecret: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  payload: any;
  status: "pending" | "delivered" | "failed";
  responseCode?: number | null;
  responseBody?: string | null;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  userId: string;
  organizationId?: string | null;
  name: string;
  description?: string | null;
  triggerEvent: string;
  triggerConditions: any;
  actionType: string;
  actionConfig: any;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  triggerData: any;
  actionResult: any;
  status: "pending" | "success" | "failed";
  errorMessage?: string | null;
  durationMs?: number | null;
  createdAt: string;
  ruleName?: string;
}

export interface IntegrationConfig {
  id: string;
  userId: string;
  provider: string;
  config: any;
  isConnected: boolean;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportRecord {
  id: string;
  userId: string;
  sourceType: string;
  sourceName?: string | null;
  fileSizeBytes?: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  resumeId?: string | null;
  parsedData?: any;
  errorMessage?: string | null;
  createdAt: string;
}

export interface ApiUsageStats {
  totalRequests: number;
  totalToday: number;
  avgLatencyMs: number;
  errorRate: number;
  topEndpoints: { endpoint: string; count: number }[];
  requestsByDay: { date: string; count: number }[];
}

