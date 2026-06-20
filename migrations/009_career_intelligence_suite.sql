-- RESUMEAI PRO - 009_CAREER_INTELLIGENCE_SUITE.SQL
-- Migration script to add tables, RLS policies, triggers, and indices for the Career Intelligence Suite.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
AS $$
  SELECT null::uuid;
$$ LANGUAGE sql STABLE;

---------------------------------------------------------
-- 1. INTERVIEW SESSIONS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_role text NOT NULL,
  target_company text,
  experience_level text NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
  difficulty text NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
  interview_type text NOT NULL, -- 'behavioral', 'hr', 'technical', 'leadership', 'managerial', 'system_design', 'coding', 'case_study', 'group_discussion'
  interview_mode text NOT NULL, -- 'practice', 'timed', 'rapid_fire', 'role_based', 'company_specific'
  duration integer DEFAULT 30 NOT NULL, -- minutes
  question_count integer NOT NULL,
  preferred_language text DEFAULT 'English' NOT NULL,
  overall_score integer,
  communication_score integer,
  technical_score integer,
  confidence_score integer,
  leadership_score integer,
  problem_solving_score integer,
  culture_fit_score integer,
  role_readiness_score integer,
  general_feedback text,
  strengths text[] DEFAULT '{}'::text[] NOT NULL,
  weaknesses text[] DEFAULT '{}'::text[] NOT NULL,
  suggested_improvements text[] DEFAULT '{}'::text[] NOT NULL,
  status text DEFAULT 'draft' NOT NULL, -- 'draft', 'in_progress', 'completed'
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow interview owners all actions"
  ON public.interview_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 2. INTERVIEW QUESTIONS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  category text NOT NULL, -- 'hr', 'behavioral', 'technical', etc.
  user_answer text,
  overall_score integer,
  clarity_score integer,
  confidence_score integer,
  relevance_score integer,
  technical_score integer,
  star_evaluation jsonb DEFAULT '{}'::jsonb NOT NULL,
  general_feedback text,
  strengths text,
  weaknesses text,
  missed_points text[] DEFAULT '{}'::text[] NOT NULL,
  suggested_improvement text,
  better_answer text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  evaluated_at timestamp with time zone
);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow interview owners access to questions"
  ON public.interview_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s 
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions s 
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

---------------------------------------------------------
-- 3. CAREER GOALS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_date timestamp with time zone,
  status text DEFAULT 'active' NOT NULL, -- 'active', 'completed', 'archived'
  progress integer DEFAULT 0 NOT NULL,
  milestones jsonb DEFAULT '[]'::jsonb NOT NULL, -- [{id, title, completed, completed_at}]
  ai_suggestions text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow goal owners all actions"
  ON public.career_goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 4. CAREER ROADMAPS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_roadmaps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  current_skills text[] DEFAULT '{}'::text[] NOT NULL,
  goal text NOT NULL,
  timeline text,
  budget text,
  roadmap_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.career_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow roadmap owners all actions"
  ON public.career_roadmaps
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 5. SALARY REPORTS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.salary_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  experience text,
  location text,
  industry text,
  range_min numeric,
  range_max numeric,
  range_median numeric,
  trend_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  negotiation_tips text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.salary_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow salary report owners all actions"
  ON public.salary_reports
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 6. LEARNING PLANS (SKILL ANALYSES) TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_role text NOT NULL,
  missing_skills jsonb DEFAULT '[]'::jsonb NOT NULL, -- [{skill, priority, difficulty, hours}]
  learning_resources jsonb DEFAULT '[]'::jsonb NOT NULL, -- [{skill, courses:[], books:[], platforms:[], challenges:[]}]
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow learning plan owners all actions"
  ON public.learning_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 7. CAREER COACH CHATS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_coach_chats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'New Chat' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.career_coach_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow coach chat owners all actions"
  ON public.career_coach_chats
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 8. CAREER COACH MESSAGES TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_coach_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id uuid REFERENCES public.career_coach_chats(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL, -- 'user', 'assistant'
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.career_coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow owners access to coach messages"
  ON public.career_coach_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.career_coach_chats c 
      WHERE c.id = chat_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.career_coach_chats c 
      WHERE c.id = chat_id AND c.user_id = auth.uid()
    )
  );

---------------------------------------------------------
-- 9. INDEX OPTIMIZATIONS
---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_session_id ON public.interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON public.career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_career_roadmaps_user_id ON public.career_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_reports_user_id ON public.salary_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_plans_user_id ON public.learning_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_chats_user_id ON public.career_coach_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_chat_id ON public.career_coach_messages(chat_id);

---------------------------------------------------------
-- 10. TIMESTAMPS TRIGGERS ATTACHMENT
---------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_interview_sessions_updated_at ON public.interview_sessions;
CREATE TRIGGER trigger_update_interview_sessions_updated_at 
  BEFORE UPDATE ON public.interview_sessions 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_career_goals_updated_at ON public.career_goals;
CREATE TRIGGER trigger_update_career_goals_updated_at 
  BEFORE UPDATE ON public.career_goals 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_career_coach_chats_updated_at ON public.career_coach_chats;
CREATE TRIGGER trigger_update_career_coach_chats_updated_at 
  BEFORE UPDATE ON public.career_coach_chats 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
