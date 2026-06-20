-- RESUMEAI PRO - 008_CAREER_DOCUMENTS_SUITE.SQL
-- Migration script to add tables, RLS policies, triggers, and indices for the Career Documents Suite.

-- Bootstrap auth schema and uid() function if they do not exist (useful for standard local PostgreSQL instances)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
AS $$
  SELECT null::uuid;
$$ LANGUAGE sql STABLE;

---------------------------------------------------------
-- 1. DOCUMENT FOLDERS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT 'indigo' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, name)
);

-- Enable RLS for folders
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow folder owners all actions"
  ON public.document_folders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 2. CAREER DOCUMENTS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL,
  document_type text NOT NULL, -- e.g. 'cover_letter', 'networking_email', 'linkedin_about'
  title text NOT NULL,
  content text NOT NULL,
  meta_config jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_favorite boolean DEFAULT false NOT NULL,
  is_pinned boolean DEFAULT false NOT NULL,
  is_archived boolean DEFAULT false NOT NULL,
  is_draft boolean DEFAULT true NOT NULL,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for career documents
ALTER TABLE public.career_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow document owners all actions"
  ON public.career_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---------------------------------------------------------
-- 3. CAREER DOCUMENT VERSIONS TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES public.career_documents(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  content text NOT NULL,
  meta_config jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for document versions
ALTER TABLE public.career_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow document owners access to versions"
  ON public.career_document_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.career_documents d 
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.career_documents d 
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

---------------------------------------------------------
-- 4. CAREER DOCUMENT SHARES TABLE
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.career_document_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES public.career_documents(id) ON DELETE CASCADE NOT NULL UNIQUE,
  unique_slug text UNIQUE NOT NULL,
  visibility text DEFAULT 'public' NOT NULL, -- 'public', 'private', 'password'
  password_hash text,
  download_allowed boolean DEFAULT true NOT NULL,
  print_allowed boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for shares
ALTER TABLE public.career_document_shares ENABLE ROW LEVEL SECURITY;

-- Select is allowed for anyone to support sharing links (passwords checked in application tier)
CREATE POLICY "Allow public read access to shares"
  ON public.career_document_shares
  FOR SELECT
  USING (true);

-- Insert/Update/Delete requires owner permission on document
CREATE POLICY "Allow document owners edit access to shares"
  ON public.career_document_shares
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.career_documents d 
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.career_documents d 
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

---------------------------------------------------------
-- 5. INDEX OPTIMIZATIONS
---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_doc_folders_user_id ON public.document_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_career_docs_user_id ON public.career_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_career_docs_folder_id ON public.career_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc_id ON public.career_document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_shares_slug ON public.career_document_shares(unique_slug);
CREATE INDEX IF NOT EXISTS idx_doc_shares_doc_id ON public.career_document_shares(document_id);

---------------------------------------------------------
-- 6. TIMESTAMPS TRIGGERS ATTACHMENT
---------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_document_folders_updated_at ON public.document_folders;
CREATE TRIGGER trigger_update_document_folders_updated_at 
  BEFORE UPDATE ON public.document_folders 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_career_documents_updated_at ON public.career_documents;
CREATE TRIGGER trigger_update_career_documents_updated_at 
  BEFORE UPDATE ON public.career_documents 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_career_document_shares_updated_at ON public.career_document_shares;
CREATE TRIGGER trigger_update_career_document_shares_updated_at 
  BEFORE UPDATE ON public.career_document_shares 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
