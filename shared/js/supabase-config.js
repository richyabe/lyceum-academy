/**
 * supabase-config.js
 * Central Supabase configuration and client initialization.
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your own project values.
 * Get them from: Supabase Dashboard → Project Settings → API
 */

// ─── YOUR SUPABASE CREDENTIALS (replace these) ────────────────────────────────
const SUPABASE_URL      = 'https://odzsxvqnyirxgggdxwow.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_egsar6Y0yhti00vH8LOzOw_BQbHcWQN';
// ──────────────────────────────────────────────────────────────────────────────

// Initialize Supabase client (loaded via CDN script in each HTML page)
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Table name constants ──────────────────────────────────────────────────────
const TABLES = {
  PROFILE:            'profile',
  ABOUT:               'about',
  QUALIFICATIONS:      'qualifications',
  EXPERIENCE:           'experience',
  SERVICES:             'services',
  PUBLICATIONS:        'publications',
  METRICS:              'metrics',
  GALLERY:              'gallery',
  MEDIA:                'media',
  TESTIMONIALS:        'testimonials',
  APPOINTMENT_SETTINGS:'appointment_settings',
  CONTACT:              'contact',
  NAVIGATION:           'navigation',
  FOOTER:               'footer',
  SEO:                  'seo',
  APPEARANCE:           'appearance',
  HOME_SECTIONS:       'home_sections',
  FILES:                'files',
  CONTACT_SUBMISSIONS:'contact_submissions',
  ACTIVITY_LOG:        'activity_log',
  // New: bookings / careers / teachers
  TEACHERS:             'teachers',
  JOB_OPENINGS:        'job_openings',
  JOB_APPLICATIONS:    'job_applications',
  APPOINTMENTS:         'appointments',
};

// ─── Storage bucket name ───────────────────────────────────────────────────────
// Create one public bucket in Supabase Storage called "media" and this
// code will organize files into folders within it (profile/, gallery/, etc.)
const STORAGE_BUCKET = 'media';
