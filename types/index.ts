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

