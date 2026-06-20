-- RESUMEAI PRO - 010_ADMIN_AND_OPERATIONS.SQL
-- Migration script to add tables, triggers, indices, and RLS for the Admin Portal & Operations.

---------------------------------------------------------
-- 1. USER ROLES MAPPING TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL DEFAULT 'user', -- 'super_admin', 'platform_admin', 'support_manager', 'support_agent', 'finance_manager', 'content_manager', 'analytics_manager', 'developer', 'qa_engineer', 'auditor', 'user'
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to roles"
  ON public.user_roles FOR SELECT USING (true);

CREATE POLICY "Allow super_admins to manage roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

---------------------------------------------------------
-- 2. ADMIN AUDIT LOGS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL, -- e.g. 'suspend_user', 'refund_invoice', 'manage_template'
  target_type text NOT NULL, -- e.g. 'user', 'invoice', 'template'
  target_id text,
  ip_address text,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin role to view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role <> 'user'
    )
  );

---------------------------------------------------------
-- 3. SUPPORT TICKETS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL, -- 'billing', 'technical', 'feedback', 'other'
  priority text DEFAULT 'medium' NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  status text DEFAULT 'open' NOT NULL, -- 'open', 'assigned', 'resolved', 'closed'
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow owners to view and create tickets"
  ON public.support_tickets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to manage all support tickets"
  ON public.support_tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role <> 'user'
    )
  );

---------------------------------------------------------
-- 4. SUPPORT TICKET REPLIES TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_ticket_replies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_internal boolean DEFAULT false NOT NULL, -- true if only admins can view
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow ticket owners access to public replies"
  ON public.support_ticket_replies FOR SELECT
  USING (
    NOT is_internal AND EXISTS (
      SELECT 1 FROM public.support_tickets t 
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow ticket owners to post replies"
  ON public.support_ticket_replies FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND NOT is_internal AND EXISTS (
      SELECT 1 FROM public.support_tickets t 
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to access all replies"
  ON public.support_ticket_replies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role <> 'user'
    )
  );

---------------------------------------------------------
-- 5. REPORTED ITEMS TABLE (CONTENT MODERATION)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reported_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type text NOT NULL, -- 'resume', 'profile'
  item_id uuid NOT NULL,
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' NOT NULL, -- 'pending', 'reviewed', 'actioned', 'dismissed'
  admin_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.reported_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow auth users to report items"
  ON public.reported_items FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Allow admins to access reported items"
  ON public.reported_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role <> 'user'
    )
  );

---------------------------------------------------------
-- 6. ADMIN BROADCASTS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'maintenance', 'promotion', 'security'
  channels text[] NOT NULL, -- 'in_app', 'email'
  target_group text NOT NULL, -- 'all', 'free', 'pro'
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read to broadcasts"
  ON public.admin_broadcasts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admins to manage broadcasts"
  ON public.admin_broadcasts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role <> 'user'
    )
  );

---------------------------------------------------------
-- 7. ANALYTICS SNAPSHOTS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name text NOT NULL, -- 'dau', 'mrr', 'arr', 'resumes_created', 'ai_tokens'
  metric_value numeric NOT NULL,
  snapshot_date date DEFAULT current_date NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(metric_name, snapshot_date)
);

ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to access snapshots"
  ON public.analytics_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role <> 'user'
    )
  );

---------------------------------------------------------
-- 8. INDEX OPTIMIZATIONS
---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON public.support_ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_reported_items_item ON public.reported_items(item_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_name_date ON public.analytics_snapshots(metric_name, snapshot_date);

---------------------------------------------------------
-- 9. TIMESTAMPS TRIGGERS ATTACHMENT
---------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_update_user_roles_updated_at 
  BEFORE UPDATE ON public.user_roles 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trigger_update_support_tickets_updated_at 
  BEFORE UPDATE ON public.support_tickets 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_reported_items_updated_at ON public.reported_items;
CREATE TRIGGER trigger_update_reported_items_updated_at 
  BEFORE UPDATE ON public.reported_items 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
