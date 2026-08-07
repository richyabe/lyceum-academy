# Portfolio CMS + Bookings + Careers — Supabase Edition

A production-ready, fully dynamic portfolio website with a complete
Admin Panel, **appointment booking**, and a **Careers system** where
visitors can apply to become teachers or apply for general roles.

Built with HTML5, CSS3, vanilla JavaScript, and **Supabase**
(Postgres Database, Authentication, Storage). Deploys free on Vercel.

Every piece of content — profile, services, publications, teachers,
job openings, appointment availability, etc. — is editable through
the Admin Panel. Nothing is hardcoded except structure and design.

---

## 📁 Project Structure

```
cms/
├── public/                    ← Public-facing website
│   ├── index.html
│   ├── css/public.css
│   └── js/public.js
│
├── admin/                     ← Admin dashboard (password protected)
│   ├── login.html
│   ├── index.html
│   ├── css/admin.css
│   └── js/admin-controller.js
│
├── shared/
│   ├── css/base.css
│   └── js/
│       ├── supabase-config.js ← ⚠️ YOU MUST EDIT THIS
│       └── utils.js
│
├── supabase-schema.sql        ← Run this in Supabase SQL Editor
├── vercel.json
└── README.md
```

---

## 🧩 What's New in This Version

| Feature | Description |
|---|---|
| **Supabase backend** | Postgres database, Auth, and Storage — replaces Firebase entirely |
| **Appointment Booking** | Visitors submit a request form (name, email, preferred teacher, date/time, message). Admin sees all requests in a dedicated Appointments manager and marks them pending/confirmed/completed/cancelled |
| **Teachers Directory** | Public page listing approved, bookable teachers with photo, bio, subjects. Each has a "Book with [Name]" button that pre-fills the appointment form |
| **Careers / Job Openings** | Admin posts open roles (teaching or general). Public Careers section lists them with an "Apply Now" button |
| **Job Applications** | Visitors apply with name, email, cover letter, and resume/CV upload (stored in Supabase Storage). Admin reviews all applications in a Kanban board (New → Reviewed → Shortlisted → Hired/Rejected) |
| **Teacher Pipeline** | When a teaching applicant is marked "Hired", a Teacher profile is automatically created (hidden by default) — admin just flips "Bookable" on when ready |

---

## 🚀 Setup Instructions

### 1. Create a Supabase Project
Go to [supabase.com](https://supabase.com) → **New Project**. Choose a
name, database password, and region.

### 2. Run the Database Schema
- Open **SQL Editor** in your Supabase dashboard
- Paste the entire contents of `supabase-schema.sql`
- Click **Run**

This creates every table, enables Row Level Security, sets up all
policies (public read / admin write), seeds the single-row settings
tables, and creates a public `media` Storage bucket with the right
access policies.

### 3. Create Your Admin Login
- Go to **Authentication → Users → Add User**
- Enter an email + password — this is what you'll use to log into `/admin`

> Supabase RLS policies check `auth.role() = 'authenticated'`, so
> **any** user you create here has full admin access. Only create
> accounts for people you trust.

### 4. Get Your API Credentials
- Go to **Project Settings → API**
- Copy the **Project URL** and the **anon/public key**

### 5. Paste Your Config
Open `shared/js/supabase-config.js`:
```js
const SUPABASE_URL      = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...your-anon-key';
```

### 6. Test Locally
```bash
python3 -m http.server 8000
# or: npx serve .
```
- Public site: `http://localhost:8000/public/index.html`
- Admin login: `http://localhost:8000/admin/login.html`

Sign in with the account you created in step 3, then start filling
in your content — Profile, About, Services, Publications, and
critically the new **Teachers**, **Job Openings**, and **Appointment
settings** pages.

---

## ☁️ Deploy to Vercel (Free)

```bash
npm install -g vercel
cd cms
vercel
```
Or connect your GitHub repo at [vercel.com/new](https://vercel.com/new)
— Framework Preset: **Other** (static site). `vercel.json` handles
routing so `/` serves the public site and `/admin` serves the dashboard.

---

## 🔐 How the New Features Work

### Appointment Booking
- Visitors click **"Book Appointment"** (navbar, hero, teacher cards,
  or the floating button) → a modal opens
- They fill in name, email, optional teacher preference, subject,
  preferred date/time, and a message
- This inserts a row into the `appointments` table with `status='pending'`
- **Admin → Appointments** shows every request; click one to view
  details and change its status (Pending / Confirmed / Completed / Cancelled)
- The sidebar shows a live badge with the count of pending requests

### Careers & Job Applications
- **Admin → Job Openings**: post a role — title, department, type
  (teaching/admin/other), employment type, description, requirements
- The role appears in the public **Careers** section automatically
  (only while `status = 'open'`)
- Visitors click **Apply Now** → modal collects name, email, cover
  letter, and an optional resume/CV PDF (uploaded to Supabase Storage)
- If the role type is "teaching", a Subjects field also appears
- **Admin → Applications** is a Kanban board: New → Reviewed →
  Shortlisted → Hired/Rejected. Click any card to see the full
  cover letter, resume link, and internal notes field
- Clicking **Hire** on a teacher-type application automatically
  creates a row in the `teachers` table (status=`approved`,
  `bookable=false`) — go to **Admin → Teachers** and toggle
  "Bookable" once you're ready to publish their profile

### Teachers Directory
- **Admin → Teachers** lists everyone — pending applicants, manually
  added teachers, and approved ones
- Only teachers with `status='approved'` AND `bookable=true` show up
  on the public site (enforced by Postgres RLS, not just UI logic)
- Each public teacher card has a "Book with [Name]" button that opens
  the appointment modal with that teacher pre-selected

---

## 🔐 Security Notes

- **Row Level Security (RLS)** is enabled on every table. Public
  (anonymous) users can only `SELECT` from content tables, and can
  only `INSERT` into `contact_submissions`, `job_applications`, and
  `appointments` — they can never read other people's applications
  or appointment requests.
- Only authenticated users (i.e., accounts you create in Supabase
  Auth) can write to content tables or read/manage submissions.
- Storage bucket `media` is public-read, authenticated-write.
- Add more admin users anytime via **Authentication → Users → Add User**.

---

## 🧩 Full Data Model

**Settings (single-row, id=1):** `profile`, `about`, `metrics`,
`appointment_settings`, `contact`, `navigation`, `footer`, `seo`,
`appearance`, `home_sections`

**Content (multi-row):** `qualifications`, `experience`, `services`,
`publications`, `gallery`, `media`, `testimonials`, `files`

**Bookings & Careers (multi-row, NEW):**
- `teachers` — name, title, bio, subjects[], photo, status, bookable
- `job_openings` — title, department, job_type, employment_type, description, requirements, status
- `job_applications` — applicant info, cover letter, resume_url, applicant_type, status, notes
- `appointments` — name, email, teacher_id (nullable), subject, preferred_date/time, message, status

**System:** `activity_log` (admin-only), `contact_submissions` (public insert, admin read)
supabase password @lyceumacademy1
admin gmail lyceumacademy@adminpanel.com

---

## 🛠 Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript — no build step
- **Supabase** — Postgres (with RLS), Authentication, Storage
- SortableJS — drag-and-drop reordering
- Font Awesome 6, Google Fonts (Playfair Display + Inter)

---

## 📄 License
Yours to customize freely for your own site.
