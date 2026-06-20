-- RESUMEAI PRO - 001_INIT_SCHEMA.SQL
-- Migration file to structure normalized tables, triggers, indexes, views, and functions.

---------------------------------------------------------
-- 0. INITIAL EXTENSION AND PL/PGSQL BOOTSTRAP
---------------------------------------------------------
create extension if not exists "uuid-ossp";

-- Shared trigger function to update updated_at timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

---------------------------------------------------------
-- 1. CORE TABLES (3NF ARCHITECTURE)
---------------------------------------------------------

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key, -- Binds directly to auth.users id
  email text unique,
  full_name text,
  phone_number text,
  headline text,
  location text,
  bio text,
  avatar_url text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  website text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 2. Resumes Table
create table if not exists public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  template_id text not null default 'modern',
  is_public boolean default false not null,
  ats_score integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 3. Resume Sections Table
create table if not exists public.resume_sections (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  section_type text not null,
  title text not null,
  order_index integer not null,
  visible boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 4. Resume Versions Table
create table if not exists public.resume_versions (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  version_number integer not null,
  resume_data jsonb not null,
  created_at timestamp with time zone default now() not null
);

-- 5. Resume Templates Table
create table if not exists public.resume_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  thumbnail_url text,
  category text not null, -- e.g. modern, executive, academic
  config jsonb not null,
  created_at timestamp with time zone default now() not null
);

-- 6. Personal Information Table
create table if not exists public.personal_information (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null unique,
  full_name text,
  email text,
  phone text,
  location text,
  website text,
  linkedin_url text,
  github_url text,
  portfolio_url text
);

-- 7. Education Table
create table if not exists public.education (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  school text not null,
  degree text,
  major text,
  gpa text,
  duration text, -- e.g. 2018 - 2022
  order_index integer not null
);

-- 8. Experience Table
create table if not exists public.experience (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  company text not null,
  role text not null,
  duration text,
  description text,
  order_index integer not null
);

-- 9. Internships Table
create table if not exists public.internships (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  company text not null,
  role text not null,
  duration text,
  description text,
  order_index integer not null
);

-- 10. Projects Table
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  title text not null,
  role text,
  url text,
  description text,
  order_index integer not null
);

-- 11. Skills Table
create table if not exists public.skills (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  name text not null,
  proficiency text, -- e.g. Beginner, Expert
  category text, -- e.g. Frontend, Languages
  order_index integer not null
);

-- 12. Certifications Table
create table if not exists public.certifications (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  name text not null,
  issuer text,
  date text,
  url text,
  order_index integer not null
);

-- 13. Achievements Table
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  title text not null,
  description text,
  order_index integer not null
);

-- 14. Languages Table
create table if not exists public.languages (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  name text not null,
  proficiency text,
  order_index integer not null
);

-- 15. Interests Table
create table if not exists public.interests (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  name text not null,
  order_index integer not null
);

-- 16. References Table
create table if not exists public.references (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  name text not null,
  title text,
  company text,
  contact text,
  order_index integer not null
);

-- 17. Publications Table
create table if not exists public.publications (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  title text not null,
  publisher text,
  date text,
  url text,
  description text,
  order_index integer not null
);

-- 18. Awards Table
create table if not exists public.awards (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  title text not null,
  issuer text,
  date text,
  description text,
  order_index integer not null
);

-- 19. Volunteer Experience Table
create table if not exists public.volunteer_experience (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  organization text not null,
  role text not null,
  duration text,
  description text,
  order_index integer not null
);

-- 20. Custom Sections Table
create table if not exists public.custom_sections (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  section_title text not null,
  content jsonb not null,
  order_index integer not null
);

---------------------------------------------------------
-- 2. AI & ATS ANALYSIS TABLES
---------------------------------------------------------

-- AI Generations history
create table if not exists public.ai_generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  prompt text not null,
  generated_text text not null,
  generation_type text not null, -- e.g. summary, bullet_point
  tokens_used integer,
  model_name text,
  created_at timestamp with time zone default now() not null
);

-- ATS Analysis reports
create table if not exists public.ats_analysis (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null unique,
  overall_score integer not null,
  format_score integer,
  keyword_score integer,
  grammar_score integer,
  design_score integer,
  missing_keywords jsonb,
  recommendations jsonb,
  analyzed_at timestamp with time zone default now() not null
);

-- Job spec comparisons
create table if not exists public.job_matches (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  job_description text not null,
  match_percentage integer not null,
  missing_skills jsonb,
  recommended_changes jsonb,
  generated_at timestamp with time zone default now() not null
);

-- AI cover letters
create table if not exists public.cover_letters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  resume_id uuid references public.resumes(id) on delete set null,
  company_name text not null,
  job_title text not null,
  generated_content text not null,
  tone text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

---------------------------------------------------------
-- 3. EXPORTS & PUBLIC SHARING TRACKERS
---------------------------------------------------------

-- Export History
create table if not exists public.resume_exports (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null,
  file_url text not null,
  file_type text not null, -- e.g. pdf, docx
  created_at timestamp with time zone default now() not null
);

-- Public Share Links
create table if not exists public.public_resume_links (
  id uuid primary key default uuid_generate_v4(),
  resume_id uuid references public.resumes(id) on delete cascade not null unique,
  unique_slug text unique not null,
  visibility text default 'public' not null,
  expiration timestamp with time zone,
  view_count integer default 0 not null,
  qr_code_reference text,
  created_at timestamp with time zone default now() not null
);

---------------------------------------------------------
-- 4. BILLING & SUBSCRIPTIONS TABLES
---------------------------------------------------------

-- Subscription Plans
create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric(10,2) not null,
  billing_interval text not null, -- monthly, yearly
  description text,
  created_at timestamp with time zone default now() not null
);

-- Subscriptions Table
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_id uuid references public.plans(id) not null,
  status text not null, -- active, past_due, canceled
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  status text not null,
  provider_payment_id text unique,
  created_at timestamp with time zone default now() not null
);

-- Payment History (Invoicing details)
create table if not exists public.payment_history (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid references public.payments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  currency text default 'USD' not null,
  status text not null,
  created_at timestamp with time zone default now() not null
);

-- Invoices Table
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid references public.subscriptions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  invoice_url text,
  amount numeric(10,2) not null,
  status text not null,
  created_at timestamp with time zone default now() not null
);

-- Usage Limits metrics
create table if not exists public.usage_limits (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references public.plans(id) on delete cascade not null unique,
  max_resumes integer default 2 not null,
  max_ai_credits integer default 5 not null,
  max_ats_checks integer default 5 not null
);

-- Feature Access definitions
create table if not exists public.feature_access (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references public.plans(id) on delete cascade not null,
  feature_name text not null,
  enabled boolean default false not null
);

---------------------------------------------------------
-- 5. SETTINGS, ANALYTICS, & NOTIFICATIONS
---------------------------------------------------------

-- User Preferences
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  theme text default 'dark' not null,
  language text default 'en' not null,
  timezone text default 'UTC' not null,
  notifications jsonb default '{}'::jsonb,
  privacy jsonb default '{}'::jsonb,
  email_preferences jsonb default '{}'::jsonb
);

-- User Activity Logging (Analytics)
create table if not exists public.analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  action_type text not null, -- view, download, ai_generation, ats_check
  details jsonb,
  created_at timestamp with time zone default now() not null
);

-- In-app Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  read_status boolean default false not null,
  type text, -- info, alert
  timestamp timestamp with time zone default now() not null
);

---------------------------------------------------------
-- 6. INDEX OPTIMIZATIONS
---------------------------------------------------------
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_resume_sections_resume_id on public.resume_sections(resume_id);
create index if not exists idx_education_resume_id on public.education(resume_id);
create index if not exists idx_experience_resume_id on public.experience(resume_id);
create index if not exists idx_projects_resume_id on public.projects(resume_id);
create index if not exists idx_skills_resume_id on public.skills(resume_id);
create index if not exists idx_versions_resume_id on public.resume_versions(resume_id);
create index if not exists idx_ai_generations_user_id on public.ai_generations(user_id);
create index if not exists idx_ats_analysis_resume_id on public.ats_analysis(resume_id);
create index if not exists idx_job_matches_resume_id on public.job_matches(resume_id);
create index if not exists idx_exports_resume_id on public.resume_exports(resume_id);
create index if not exists idx_public_links_slug on public.public_resume_links(unique_slug);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_analytics_user_id on public.analytics(user_id);

---------------------------------------------------------
-- 7. TIMESTAMPS TRIGGERS ATTACHMENT
---------------------------------------------------------
drop trigger if exists trigger_update_profiles_updated_at on public.profiles;
create trigger trigger_update_profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at_column();

drop trigger if exists trigger_update_resumes_updated_at on public.resumes;
create trigger trigger_update_resumes_updated_at before update on public.resumes for each row execute procedure public.update_updated_at_column();

drop trigger if exists trigger_update_resume_sections_updated_at on public.resume_sections;
create trigger trigger_update_resume_sections_updated_at before update on public.resume_sections for each row execute procedure public.update_updated_at_column();

drop trigger if exists trigger_update_cover_letters_updated_at on public.cover_letters;
create trigger trigger_update_cover_letters_updated_at before update on public.cover_letters for each row execute procedure public.update_updated_at_column();

drop trigger if exists trigger_update_subscriptions_updated_at on public.subscriptions;
create trigger trigger_update_subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.update_updated_at_column();


---------------------------------------------------------
-- 8. BUSINESS FUNCTIONS & STORED PROCEDURES
---------------------------------------------------------

-- Function: Duplicate a Resume (Cloning resume row and all associated sub-tables)
create or replace function public.duplicate_resume(target_resume_id uuid)
returns uuid as $$
declare
  new_resume_id uuid;
begin
  -- 1. Clone primary resume row
  insert into public.resumes (user_id, title, description, template_id, is_public, ats_score)
  select user_id, title || ' (Copy)', description, template_id, false, ats_score
  from public.resumes
  where id = target_resume_id
  returning id into new_resume_id;

  -- 2. Clone personal information
  insert into public.personal_information (resume_id, full_name, email, phone, location, website, linkedin_url, github_url, portfolio_url)
  select new_resume_id, full_name, email, phone, location, website, linkedin_url, github_url, portfolio_url
  from public.personal_information
  where resume_id = target_resume_id;

  -- 3. Clone education history
  insert into public.education (resume_id, school, degree, major, gpa, duration, order_index)
  select new_resume_id, school, degree, major, gpa, duration, order_index
  from public.education
  where resume_id = target_resume_id;

  -- 4. Clone experience records
  insert into public.experience (resume_id, company, role, duration, description, order_index)
  select new_resume_id, company, role, duration, description, order_index
  from public.experience
  where resume_id = target_resume_id;

  -- 5. Clone skills competency tags
  insert into public.skills (resume_id, name, proficiency, category, order_index)
  select new_resume_id, name, proficiency, category, order_index
  from public.skills
  where resume_id = target_resume_id;

  -- 6. Clone projects
  insert into public.projects (resume_id, title, role, url, description, order_index)
  select new_resume_id, title, role, url, description, order_index
  from public.projects
  where resume_id = target_resume_id;

  -- 7. Clone certifications
  insert into public.certifications (resume_id, name, issuer, date, url, order_index)
  select new_resume_id, name, issuer, date, url, order_index
  from public.certifications
  where resume_id = target_resume_id;

  -- 8. Clone achievements
  insert into public.achievements (resume_id, title, description, order_index)
  select new_resume_id, title, description, order_index
  from public.achievements
  where resume_id = target_resume_id;

  -- 9. Clone languages
  insert into public.languages (resume_id, name, proficiency, order_index)
  select new_resume_id, name, proficiency, order_index
  from public.languages
  where resume_id = target_resume_id;

  -- 10. Clone custom sections
  insert into public.custom_sections (resume_id, section_title, content, order_index)
  select new_resume_id, section_title, content, order_index
  from public.custom_sections
  where resume_id = target_resume_id;

  return new_resume_id;
end;
$$ language plpgsql;

-- Function: Create snapshot version
create or replace function public.create_resume_version_snapshot(target_resume_id uuid)
returns uuid as $$
declare
  new_version_id uuid;
  next_version integer;
  compiled_data jsonb;
begin
  -- Retrieve next version number
  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.resume_versions
  where resume_id = target_resume_id;

  -- Compile sub-tables into a JSON object structure
  select jsonb_build_object(
    'resume', (select row_to_json(r) from public.resumes r where id = target_resume_id),
    'personal', (select row_to_json(p) from public.personal_information p where resume_id = target_resume_id),
    'education', (select json_agg(e) from public.education e where resume_id = target_resume_id),
    'experience', (select json_agg(x) from public.experience x where resume_id = target_resume_id),
    'skills', (select json_agg(s) from public.skills s where resume_id = target_resume_id),
    'projects', (select json_agg(pr) from public.projects pr where resume_id = target_resume_id)
  ) into compiled_data;

  insert into public.resume_versions (resume_id, version_number, resume_data)
  values (target_resume_id, next_version, compiled_data)
  returning id into new_version_id;

  return new_version_id;
end;
$$ language plpgsql;

-- Trigger Function: Auto Snapshot when resume is updated
create or replace function public.trigger_snapshot_on_update()
returns trigger as $$
begin
  perform public.create_resume_version_snapshot(new.id);
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_auto_resume_snapshot on public.resumes;
create trigger trigger_auto_resume_snapshot
  after update on public.resumes
  for each row
  when (old.title is distinct from new.title or old.template_id is distinct from new.template_id)
  execute procedure public.trigger_snapshot_on_update();

---------------------------------------------------------
-- 9. OPTIMIZED VIEWS DEFINITIONS
---------------------------------------------------------

-- View: Dashboard Summary
create or replace view public.view_dashboard_summary as
  select 
    p.id as user_id,
    count(distinct r.id) as total_resumes,
    coalesce(round(avg(r.ats_score)), 0) as average_ats_score,
    (select count(*) from public.ai_generations where user_id = p.id) as total_ai_generations,
    (select count(*) from public.resume_exports e join public.resumes res on e.resume_id = res.id where res.user_id = p.id) as total_downloads
  from public.profiles p
  left join public.resumes r on p.id = r.user_id
  group by p.id;

-- View: Resume Statistics
create or replace view public.view_resume_statistics as
  select
    r.id as resume_id,
    r.title,
    r.ats_score,
    r.is_public,
    coalesce(l.view_count, 0) as view_count,
    count(distinct e.id) as download_count
  from public.resumes r
  left join public.public_resume_links l on r.id = l.resume_id
  left join public.resume_exports e on r.id = e.resume_id
  group by r.id, r.title, r.ats_score, r.is_public, l.view_count;

-- View: Export History logs
create or replace view public.view_export_history as
  select
    e.id as export_id,
    e.resume_id,
    r.title as resume_title,
    r.user_id,
    e.file_url,
    e.file_type,
    e.created_at as exported_at
  from public.resume_exports e
  join public.resumes r on e.resume_id = r.id;
