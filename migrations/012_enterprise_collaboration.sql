-- RESUMEAI PRO - 012_ENTERPRISE_COLLABORATION.SQL

-- 1. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text,
  description text,
  branding jsonb DEFAULT '{}'::jsonb NOT NULL, -- { primaryColor: string, secondaryColor: string, customDomain: string, emailTemplate: string }
  owner_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'personal', -- 'personal', 'startup', 'agency', 'university', 'corporate', 'career_center'
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'viewer', -- 'owner', 'admin', 'manager', 'recruiter', 'career_coach', 'hr', 'hiring_manager', 'interviewer', 'editor', 'viewer'
  status text NOT NULL DEFAULT 'active', -- 'active', 'suspended'
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (organization_id, user_id)
);

-- 4. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'revoked'
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.document_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type text NOT NULL, -- 'resume', 'cover_letter', 'document'
  document_id uuid NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES public.document_comments(id) ON DELETE CASCADE,
  resolved boolean DEFAULT false NOT NULL,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  highlight_text text,
  highlight_range jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. RECRUITER FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.recruiter_feedbacks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  recruiter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  feedback text NOT NULL,
  candidate_status text DEFAULT 'reviewing' NOT NULL, -- 'reviewing', 'shortlisted', 'interviewing', 'offered', 'rejected'
  rating integer,
  bookmarked boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 7. RESUME REVIEW REQUESTS (UNIVERSITY DASHBOARD)
CREATE TABLE IF NOT EXISTS public.resume_review_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  counselor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' NOT NULL, -- 'pending', 'reviewing', 'approved', 'changes_requested'
  feedback text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 8. PLACEMENT RECORDS (UNIVERSITY DASHBOARD)
CREATE TABLE IF NOT EXISTS public.placement_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  job_role text NOT NULL,
  package_lpa numeric(10,2),
  status text DEFAULT 'placed' NOT NULL, -- 'applied', 'interviewing', 'offered', 'placed'
  placement_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 9. BILLING & SEAT COUNTERS TABLE
CREATE TABLE IF NOT EXISTS public.organization_billing (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type text NOT NULL DEFAULT 'free', -- 'free', 'team_starter', 'enterprise'
  seats integer DEFAULT 5 NOT NULL,
  additional_ai_credits integer DEFAULT 0 NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  billing_email text,
  tax_id text,
  purchase_order_number text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 10. DOCUMENT LOCKS TABLE (CONCURRENCY)
CREATE TABLE IF NOT EXISTS public.document_locks (
  document_type text NOT NULL,
  document_id uuid NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  locked_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (document_type, document_id)
);

-- 11. USER PRESENCE HEARTBEATS TABLE
CREATE TABLE IF NOT EXISTS public.user_presence (
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

-- 12. WORKSPACE ACTIVITY LOG FEED
CREATE TABLE IF NOT EXISTS public.workspace_activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type text NOT NULL, -- 'resume_edited', 'template_changed', 'ai_generation', 'comment_added', 'member_invited', 'export_created'
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 13. ALTER EXISTING TABLES TO ATTACH TO WORKSPACES
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.cover_letters ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.career_documents ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.career_roadmaps ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- 14. ROW LEVEL SECURITY (RLS) FOR ORGANIZATION TABLES
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_activity_logs ENABLE ROW LEVEL SECURITY;

-- 15. BASE POLICIES FOR SECURITY ISOLATION
CREATE POLICY "Allow members to view organization"
  ON public.organizations FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = id AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY "Allow owners to manage organization"
  ON public.organizations FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Allow org members to view workspaces"
  ON public.workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      LEFT JOIN public.organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id AND (o.owner_id = auth.uid() OR (om.user_id = auth.uid() AND om.status = 'active'))
    )
  );

CREATE POLICY "Allow org admins to manage workspaces"
  ON public.workspaces FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      LEFT JOIN public.organization_members om ON o.id = om.organization_id
      WHERE o.id = organization_id AND (o.id = organization_id AND (o.owner_id = auth.uid() OR (om.user_id = auth.uid() AND om.role IN ('admin', 'owner') AND om.status = 'active')))
    )
  );

-- Triggers for timestamps
DROP TRIGGER IF EXISTS trigger_update_organizations_updated_at ON public.organizations;
CREATE TRIGGER trigger_update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trigger_update_workspaces_updated_at 
  BEFORE UPDATE ON public.workspaces 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_document_comments_updated_at ON public.document_comments;
CREATE TRIGGER trigger_update_document_comments_updated_at 
  BEFORE UPDATE ON public.document_comments 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
