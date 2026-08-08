-- ============================================================
-- SUPABASE SCHEMA — Portfolio CMS + Bookings + Careers
-- ============================================================
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- It creates every table, enables Row Level Security (RLS), and
-- sets up policies so:
--   • Anyone (public/anon) can READ content tables
--   • Only authenticated users (admin) can WRITE to content tables
--   • Anyone can INSERT into contact_submissions, job_applications,
--     and appointments (so visitors can submit forms)
--   • Only admin can READ/UPDATE/DELETE submissions/applications/appointments
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- SECTION 1 — SINGLE-ROW SETTINGS TABLES
-- (each has exactly one row, id = 1, updated via upsert)
-- ============================================================

create table if not exists profile (
  id int primary key default 1,
  name text, display_name text, titles jsonb default '[]',
  email text, phone text, institution text, location text,
  intro text, bio text, mission text, quote text,
  specializations jsonb default '[]',
  hero_headline text, hero_sub text,
  cta1_text text, cta1_link text, cta2_text text, cta2_link text,
  trust_badges jsonb default '[]',
  cv_btn_text text, photo_url text, hero_bg_url text, cv_url text, resume_url text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists about (
  id int primary key default 1,
  heading text, eyebrow text, text text, image_url text, cards jsonb default '[]',
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists metrics (
  id int primary key default 1,
  pubs text, citations text, hindex text, i10 text, students text, years text,
  conferences text, grants text, awards text, countries text, suffix text default '+',
  custom jsonb default '[]',
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists appointment_settings (
  id int primary key default 1,
  whatsapp text, booking_link text, details text, duration text,
  fees text, notes text, availability jsonb default '[]',
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists contact (
  id int primary key default 1,
  email text, email2 text, phone1 text, phone2 text,
  office text, academic text, maps text,
  linkedin text, twitter text, researchgate text, scholar text,
  youtube text, instagram text, facebook text, orcid text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists navigation (
  id int primary key default 1,
  items jsonb default '[]',
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists footer (
  id int primary key default 1,
  tagline text, description text, copyright text, logo text,
  socials boolean default true,
  col2_title text, col3_title text, col4_title text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists seo (
  id int primary key default 1,
  title text, description text, keywords text, favicon text,
  og_title text, og_desc text, og_image text,
  robots text default 'index,follow', twitter_card text default 'summary_large_image',
  canonical text, ga text, json_ld text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists appearance (
  id int primary key default 1,
  color_navy text default '#1F2A44', color_gold text default '#C8A24A',
  color_cream text default '#F5F1E6', color_gold_light text default '#DDB96A',
  font_display text default '''Playfair Display'', serif',
  font_body text default '''Inter'', sans-serif',
  logo_url text, logo_text text, logo_accent text,
  dark_mode_default boolean default false,
  animations boolean default true, float_card boolean default true,
  shimmer boolean default true, counters boolean default true,
  section_visibility jsonb default '{}',
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists home_sections (
  id int primary key default 1,
  sections jsonb default '[]',
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- ============================================================
-- SECTION 2 — MULTI-ROW CONTENT TABLES
-- ============================================================

create table if not exists qualifications (
  id uuid primary key default uuid_generate_v4(),
  year text, name text not null, institution text, type text default 'degree',
  description text, order_index int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists experience (
  id uuid primary key default uuid_generate_v4(),
  period text, role text not null, org text, description text,
  category text default 'teaching', current boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  name text not null, icon text default 'fas fa-star', description text, tag text,
  order_index int default 0, visible boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists publications (
  id uuid primary key default uuid_generate_v4(),
  year int, title text not null, authors text, journal text, volume text,
  doi text, impact text, abstract text, pdf_url text, type text default 'journal',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists gallery (
  id uuid primary key default uuid_generate_v4(),
  url text not null, caption text, category text default 'professional',
  order_index int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists media (
  id uuid primary key default uuid_generate_v4(),
  title text not null, url text, type text default 'youtube',
  platform text, duration text, description text, visible boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists testimonials (
  id uuid primary key default uuid_generate_v4(),
  name text not null, role text, country text, body text not null,
  rating int default 5, photo_url text, visible boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists files (
  id uuid primary key default uuid_generate_v4(),
  name text, url text, type text, size int,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  message text, user_email text,
  created_at timestamptz default now()
);

-- Public form submissions (contact page)
create table if not exists contact_submissions (
  id uuid primary key default uuid_generate_v4(),
  name text, email text, phone text, subject text, message text,
  status text default 'new',
  created_at timestamptz default now()
);

-- ============================================================
-- SECTION 3 — TEACHERS / CAREERS / APPOINTMENTS (NEW)
-- ============================================================

-- Teachers directory. A person becomes a row here once their
-- job_application (type='teaching') is approved by admin, OR
-- admin can add a teacher directly.
create table if not exists teachers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  title text,                      -- e.g. "Chemistry & Biology Tutor"
  bio text,
  photo_url text,
  subjects jsonb default '[]',     -- ["Chemistry","Biology"]
  email text, phone text, whatsapp text,
  cv_url text,
  status text default 'pending',   -- pending | approved | rejected
  bookable boolean default false,  -- shown publicly & bookable once true
  order_index int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Job / role openings posted by admin (teaching or general roles)
create table if not exists job_openings (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  department text,                 -- e.g. "Academics", "Administration"
  job_type text default 'teaching',-- teaching | admin | other
  location text default 'Remote',
  employment_type text default 'part-time', -- full-time | part-time | contract
  description text,
  requirements text,
  status text default 'open',      -- open | closed
  order_index int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Applications submitted by the public against a job_opening
-- (covers both teaching applicants and general applicants)
create table if not exists job_applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references job_openings(id) on delete set null,
  applicant_name text not null,
  email text not null,
  phone text,
  applicant_type text default 'general', -- teacher | general
  subjects jsonb default '[]',           -- filled if applicant_type = teacher
  cover_letter text,
  resume_url text,
  status text default 'new',   -- new | reviewed | shortlisted | rejected | hired
  notes text,                  -- internal admin notes
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Appointment / consultation booking requests submitted by the public
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  teacher_id uuid references teachers(id) on delete set null,  -- null = general/admin
  subject text,
  preferred_date date,
  preferred_time text,
  message text,
  status text default 'pending', -- pending | confirmed | cancelled | completed
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- ============================================================
-- SECTION 4 — ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on every table
alter table profile enable row level security;
alter table about enable row level security;
alter table metrics enable row level security;
alter table appointment_settings enable row level security;
alter table contact enable row level security;
alter table navigation enable row level security;
alter table footer enable row level security;
alter table seo enable row level security;
alter table appearance enable row level security;
alter table home_sections enable row level security;
alter table qualifications enable row level security;
alter table experience enable row level security;
alter table services enable row level security;
alter table publications enable row level security;
alter table gallery enable row level security;
alter table media enable row level security;
alter table testimonials enable row level security;
alter table files enable row level security;
alter table activity_log enable row level security;
alter table contact_submissions enable row level security;
alter table teachers enable row level security;
alter table job_openings enable row level security;
alter table job_applications enable row level security;
alter table appointments enable row level security;

-- ─── Policy helper pattern ───────────────────────────────────
-- Public content tables: SELECT open to everyone, ALL other
-- operations restricted to authenticated users (the admin).

-- Generic macro-like block repeated per table (Postgres has no
-- real macros, so each policy is spelled out explicitly below).

-- profile
create policy "profile_select_public" on profile for select using (true);
create policy "profile_write_admin" on profile for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- about
create policy "about_select_public" on about for select using (true);
create policy "about_write_admin" on about for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- metrics
create policy "metrics_select_public" on metrics for select using (true);
create policy "metrics_write_admin" on metrics for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- appointment_settings
create policy "apptsettings_select_public" on appointment_settings for select using (true);
create policy "apptsettings_write_admin" on appointment_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- contact
create policy "contact_select_public" on contact for select using (true);
create policy "contact_write_admin" on contact for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- navigation
create policy "navigation_select_public" on navigation for select using (true);
create policy "navigation_write_admin" on navigation for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- footer
create policy "footer_select_public" on footer for select using (true);
create policy "footer_write_admin" on footer for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- seo
create policy "seo_select_public" on seo for select using (true);
create policy "seo_write_admin" on seo for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- appearance
create policy "appearance_select_public" on appearance for select using (true);
create policy "appearance_write_admin" on appearance for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- home_sections
create policy "homesections_select_public" on home_sections for select using (true);
create policy "homesections_write_admin" on home_sections for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- qualifications
create policy "qualifications_select_public" on qualifications for select using (true);
create policy "qualifications_write_admin" on qualifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- experience
create policy "experience_select_public" on experience for select using (true);
create policy "experience_write_admin" on experience for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- services
create policy "services_select_public" on services for select using (true);
create policy "services_write_admin" on services for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- publications
create policy "publications_select_public" on publications for select using (true);
create policy "publications_write_admin" on publications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- gallery
create policy "gallery_select_public" on gallery for select using (true);
create policy "gallery_write_admin" on gallery for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- media
create policy "media_select_public" on media for select using (true);
create policy "media_write_admin" on media for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- testimonials
create policy "testimonials_select_public" on testimonials for select using (true);
create policy "testimonials_write_admin" on testimonials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- files
create policy "files_select_public" on files for select using (true);
create policy "files_write_admin" on files for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- activity_log — admin only, no public access at all
create policy "activitylog_admin_only" on activity_log for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- contact_submissions — public can INSERT only; admin can do everything
create policy "contactsub_public_insert" on contact_submissions for insert with check (true);
create policy "contactsub_admin_manage" on contact_submissions for select using (auth.role() = 'authenticated');
create policy "contactsub_admin_update" on contact_submissions for update using (auth.role() = 'authenticated');
create policy "contactsub_admin_delete" on contact_submissions for delete using (auth.role() = 'authenticated');

-- ─── Teachers ───────────────────────────────────────────────
-- Public can view only approved+bookable teachers. Admin sees/edits all.
create policy "teachers_select_public_approved" on teachers for select
  using (status = 'approved' and bookable = true);
create policy "teachers_admin_all" on teachers for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ─── Job openings ───────────────────────────────────────────
-- Public can view only open roles. Admin manages everything.
create policy "jobopenings_select_public_open" on job_openings for select
  using (status = 'open');
create policy "jobopenings_admin_all" on job_openings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ─── Job applications ───────────────────────────────────────
-- Public can INSERT (apply) only. Only admin can read/update/delete.
create policy "jobapps_public_insert" on job_applications for insert with check (true);
create policy "jobapps_admin_select" on job_applications for select using (auth.role() = 'authenticated');
create policy "jobapps_admin_update" on job_applications for update using (auth.role() = 'authenticated');
create policy "jobapps_admin_delete" on job_applications for delete using (auth.role() = 'authenticated');

-- ─── Appointments ───────────────────────────────────────────
-- Public can INSERT (book) only. Only admin can read/update/delete.
create policy "appointments_public_insert" on appointments for insert with check (true);
create policy "appointments_admin_select" on appointments for select using (auth.role() = 'authenticated');
create policy "appointments_admin_update" on appointments for update using (auth.role() = 'authenticated');
create policy "appointments_admin_delete" on appointments for delete using (auth.role() = 'authenticated');

-- ============================================================
-- SECTION 5 — SEED SINGLE-ROW TABLES WITH id=1
-- (so upsert works immediately from the admin panel)
-- ============================================================
insert into profile (id) values (1) on conflict (id) do nothing;
insert into about (id) values (1) on conflict (id) do nothing;
insert into metrics (id) values (1) on conflict (id) do nothing;
insert into appointment_settings (id) values (1) on conflict (id) do nothing;
insert into contact (id) values (1) on conflict (id) do nothing;
insert into navigation (id) values (1) on conflict (id) do nothing;
insert into footer (id) values (1) on conflict (id) do nothing;
insert into seo (id) values (1) on conflict (id) do nothing;
insert into appearance (id) values (1) on conflict (id) do nothing;
insert into home_sections (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- SECTION 6 — STORAGE BUCKET
-- ============================================================
-- Run this too (or create manually in Dashboard → Storage):
--   Name: media | Public bucket: YES
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Storage policies: public read, authenticated write/delete
create policy "media_public_read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media_admin_insert" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "media_admin_update" on storage.objects for update
  using (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "media_admin_delete" on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');

-- ============================================================
-- DONE. Next steps:
--  1. Go to Authentication → Users → Add User to create your
--     admin login (email + password).
--  2. Copy your Project URL + anon key into
--     shared/js/supabase-config.js
--  3. Open admin/login.html and sign in.
-- ============================================================
