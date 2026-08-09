/**
 * utils.js — Shared utility functions (Supabase edition)
 * Used by both public website and admin panel.
 */

// ─── Toast Notifications ─────────────────────────────────────────────────────
let toastQueue = [];
let toastActive = false;

function showToast(message, type = 'info', duration = 3500) {
  toastQueue.push({ message, type, duration });
  if (!toastActive) processToastQueue();
}

function processToastQueue() {
  if (!toastQueue.length) { toastActive = false; return; }
  toastActive = true;
  const { message, type, duration } = toastQueue.shift();

  const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span>
                     <span class="toast-msg">${escHtml(message)}</span>
                     <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;

  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => { toast.remove(); processToastQueue(); }, 400);
  }, duration);
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────
function showConfirm(title, message, confirmText = 'Delete', cancelText = 'Cancel') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h3 id="confirm-title">${escHtml(title)}</h3>
        <p>${escHtml(message)}</p>
        <div class="confirm-actions">
          <button class="btn btn-ghost" id="confirm-cancel">${escHtml(cancelText)}</button>
          <button class="btn btn-danger" id="confirm-ok">${escHtml(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const cleanup = (result) => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
      resolve(result);
    };
    overlay.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
    overlay.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
    overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(false); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { cleanup(false); document.removeEventListener('keydown', esc); }
    }, { once: true });
  });
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function showLoading(message = 'Loading…') {
  let el = document.getElementById('global-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-loading';
    el.innerHTML = `<div class="loading-spinner"></div><p class="loading-msg"></p>`;
    document.body.appendChild(el);
  }
  el.querySelector('.loading-msg').textContent = message;
  el.classList.add('active');
}
function hideLoading() {
  const el = document.getElementById('global-loading');
  if (el) el.classList.remove('active');
}

// ─── HTML Escape ──────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function slugify(str) { return String(str).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function nl2br(str) { return String(str ?? '').replace(/\n/g,'<br>'); }
function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
function formatDateTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) + ' · ' +
         d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

/* ============================================================
   SUPABASE DATA HELPERS
   Thin wrappers around the Supabase JS client so the rest of
   the app can read/write data with simple, consistent calls.
============================================================ */

/** Get a single row by id (for "single row" settings tables use id=1) */
async function sbGet(table, id = 1) {
  const { data, error } = await sb.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Upsert a single settings-style row (id defaults to 1) */
async function sbUpsert(table, values, id = 1) {
  const payload = { id, ...values, updated_at: new Date().toISOString() };
  const { data, error } = await sb.from(table).upsert(payload).select().maybeSingle();
  if (error) throw error;
  return data;
}

/** Insert a new row into a multi-row table, returns the created row */
async function sbInsert(table, values) {
  const payload = { ...values, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { data, error } = await sb.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

/** Update an existing row by id */
async function sbUpdate(table, id, values) {
  const payload = { ...values, updated_at: new Date().toISOString() };
  const { data, error } = await sb.from(table).update(payload).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data;
}

/** Delete a row by id */
async function sbDelete(table, id) {
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

/** List rows with optional ordering / filters
 *  opts: { orderBy: 'col', ascending: true, eq: {col:val}, limit: n }
 */
async function sbList(table, opts = {}) {
  let q = sb.from(table).select('*');
  if (opts.eq) Object.entries(opts.eq).forEach(([k,v]) => { q = q.eq(k, v); });
  if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending !== false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/** Reorder helper: bulk-update `order_index` for a list of {id, order_index} */
async function sbReorder(table, rows) {
  const updates = rows.map(r => sb.from(table).update({ order_index: r.order_index }).eq('id', r.id));
  await Promise.all(updates);
}

/* ============================================================
   SUPABASE STORAGE HELPERS
============================================================ */

/** Upload a file to Supabase Storage, returns the public URL */
async function uploadFile(file, path, onProgress) {
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  if (onProgress) onProgress(100); // Supabase JS v2 doesn't expose progress; report done
  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Delete a file from Supabase Storage given its full public URL */
async function deleteFile(url) {
  if (!url) return;
  try {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length));
    await sb.storage.from(STORAGE_BUCKET).remove([path]);
  } catch (e) { /* already deleted or invalid URL — ignore */ }
}

// ─── Animate On Scroll (lightweight AOS) ─────────────────────────────────────
function initAOSGlobal() {
  const els = document.querySelectorAll('[data-aos]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('aos-in'); obs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}
