-- RESUMEAI PRO - DATABASE SCHEMA & AUTOMATED TRIGGER SETUP
-- Run this script in your Supabase SQL Editor to configure User Profiles & Storage.

---------------------------------------------------------
-- 1. PROFILES TABLE CREATION
---------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

---------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
---------------------------------------------------------

-- Policy: Profiles are readable by anyone (required for shared public resume links)
create policy "Allow public read access to profiles" 
  on public.profiles 
  for select 
  using (true);

-- Policy: Users can only update their own profile record
create policy "Allow owners to update their profile" 
  on public.profiles 
  for update 
  using (auth.uid() = id);

-- Policy: Users can insert their own profile record
create policy "Allow owners to insert their profile" 
  on public.profiles 
  for insert 
  with check (auth.uid() = id);

---------------------------------------------------------
-- 3. AUTOMATIC PROFILE CREATION TRIGGER
---------------------------------------------------------
-- This PL/pgSQL function runs automatically when a new record is added to auth.users.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User Account'),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Bind trigger to auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

---------------------------------------------------------
-- 4. STORAGE BUCKET CONFIGURATION FOR AVATARS
---------------------------------------------------------
-- Create the public bucket called "avatars" if it does not exist.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Below are the RLS Policies for the storage.objects table to secure files.

-- Policy: Anyone can select/read profile photos from avatars bucket
create policy "Give public read access to avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Policy: Authenticated users can upload photos to a folder named after their UID
create policy "Allow owner uploads to avatars bucket"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Authenticated users can modify photos in their own UID folder
create policy "Allow owner updates to avatars bucket"
  on storage.objects for update
  with check (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Authenticated users can delete photos in their own UID folder
create policy "Allow owner deletes in avatars bucket"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );
