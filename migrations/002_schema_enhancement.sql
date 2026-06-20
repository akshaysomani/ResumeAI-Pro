-- RESUMEAI PRO - 002_SCHEMA_ENHANCEMENT.SQL
-- Migration script to add visual editor layout settings and granular section columns.

---------------------------------------------------------
-- 1. EXTEND PROFILES & SETTINGS TABLES
---------------------------------------------------------
alter table public.profiles 
  add column if not exists dob text,
  add column if not exists gender text,
  add column if not exists country text,
  add column if not exists twitter_url text,
  add column if not exists personal_website text,
  add column if not exists preferred_language text,
  add column if not exists timezone text;

---------------------------------------------------------
-- 2. EXTEND RESUMES TABLES WITH LAYOUT & LIFE CYCLE
---------------------------------------------------------
alter table public.resumes
  add column if not exists status text not null default 'draft',
  add column if not exists is_favorite boolean not null default false,
  add column if not exists is_archived boolean not null default false,
  add column if not exists color_theme text not null default 'indigo',
  add column if not exists font_family text not null default 'sans',
  add column if not exists paper_size text not null default 'A4',
  add column if not exists page_margin text not null default 'normal',
  add column if not exists layout_style text not null default 'single-column',
  add column if not exists resume_type text not null default 'custom';

---------------------------------------------------------
-- 3. EXTEND EDUCATION TABLE
---------------------------------------------------------
alter table public.education
  add column if not exists location text,
  add column if not exists start_date text,
  add column if not exists end_date text,
  add column if not exists currently_studying boolean not null default false,
  add column if not exists description text;

---------------------------------------------------------
-- 4. EXTEND EXPERIENCE & INTERNSHIPS TABLES
---------------------------------------------------------
alter table public.experience
  add column if not exists employment_type text,
  add column if not exists location text,
  add column if not exists start_date text,
  add column if not exists end_date text,
  add column if not exists currently_working boolean not null default false,
  add column if not exists achievements text;

alter table public.internships
  add column if not exists employment_type text,
  add column if not exists location text,
  add column if not exists start_date text,
  add column if not exists end_date text,
  add column if not exists currently_working boolean not null default false,
  add column if not exists achievements text;

---------------------------------------------------------
-- 5. EXTEND PROJECTS TABLE
---------------------------------------------------------
alter table public.projects
  add column if not exists technologies text,
  add column if not exists github_url text,
  add column if not exists live_url text,
  add column if not exists start_date text,
  add column if not exists end_date text;

---------------------------------------------------------
-- 6. EXTEND SKILLS TABLE
---------------------------------------------------------
alter table public.skills
  add column if not exists years_of_experience integer,
  add column if not exists is_primary boolean not null default false,
  add column if not exists is_secondary boolean not null default false;

---------------------------------------------------------
-- 7. EXTEND CERTIFICATIONS TABLE
---------------------------------------------------------
alter table public.certifications
  add column if not exists issue_date text,
  add column if not exists expiry_date text,
  add column if not exists credential_id text,
  add column if not exists credential_url text;

---------------------------------------------------------
-- 8. EXTEND LANGUAGES TABLE
---------------------------------------------------------
alter table public.languages
  add column if not exists reading text,
  add column if not exists writing text,
  add column if not exists speaking text;
