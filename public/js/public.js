/**
 * public.js — Public Website Data Loader (Supabase edition)
 * Reads all content from Supabase and renders it dynamically.
 * Also handles appointment booking and job application submissions.
 */
'use strict';

let siteAppearance = {};
let teachersData = [];
let jobsData = [];
let testiPerView = window.innerWidth < 768 ? 1 : 3;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadAppearance();
    await Promise.all([ loadProfile(), loadContact(), loadNavigation() ]);
    await applySeo();

    await Promise.all([
      loadAboutSection(), loadQualificationsSection(), loadExperienceSection(),
      loadServicesSection(), loadPublicationsSection(), loadMetricsSection(),
      loadGallerySection(), loadMediaSection(), loadTestimonialsSection(),
      loadTeachersSection(), loadJobsSection(), loadAppointmentSection(),
    ]);

    applySectionVisibility();
    initNavbar(); initThemeToggle(); initHamburger(); initAOSGlobal();
    initContactForm(); initLightbox(); initApptModal(); initApplyModal();

    setTimeout(() => {
      const loader = document.getElementById('page-loader');
      if (loader) loader.classList.add('hide');
      setTimeout(() => loader?.remove(), 600);
    }, 400);
  } catch (err) {
    console.error('Public site load error:', err);
    document.getElementById('page-loader')?.classList.add('hide');
  }
});

// ─── Appearance ────────────────────────────────────────────
async function loadAppearance() {
  try {
    const d = await sbGet(TABLES.APPEARANCE);
    if (!d) return;
    siteAppearance = d;
    const root = document.documentElement;
    if (d.color_navy) root.style.setProperty('--navy', d.color_navy);
    if (d.color_gold) root.style.setProperty('--gold', d.color_gold);
    if (d.color_cream) root.style.setProperty('--cream', d.color_cream);
    if (d.color_gold_light) root.style.setProperty('--gold-light', d.color_gold_light);
    if (d.font_display) root.style.setProperty('--font-display', d.font_display);
    if (d.font_body) root.style.setProperty('--font-body', d.font_body);
    const saved = localStorage.getItem('pub-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    else if (d.dark_mode_default) document.documentElement.setAttribute('data-theme', 'dark');
    if (d.animations === false) document.documentElement.style.setProperty('--tr', '0s');
  } catch (e) { console.warn('Appearance load failed:', e); }
}

function applySectionVisibility() {
  const vis = siteAppearance.section_visibility || {};
  Object.entries(vis).forEach(([key, visible]) => {
    const el = document.getElementById(`section-${key}`);
    if (el) el.style.display = visible ? '' : 'none';
  });
}

// ─── SEO ───────────────────────────────────────────────────
async function applySeo() {
  try {
    const d = await sbGet(TABLES.SEO);
    if (!d) return;
    if (d.title) document.title = d.title;
    setMeta('description', d.description); setMeta('keywords', d.keywords); setMeta('robots', d.robots || 'index,follow');
    setOg('title', d.og_title || d.title); setOg('description', d.og_desc || d.description); setOg('image', d.og_image); setOg('type', 'website');
    if (d.canonical) setLink('canonical', d.canonical);
    if (d.favicon) setLink('icon', d.favicon);
    if (d.ga) {
      const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${d.ga}`; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', d.ga);
    }
    if (d.json_ld) { const el = document.createElement('script'); el.type = 'application/ld+json'; el.textContent = d.json_ld; document.head.appendChild(el); }
  } catch (e) { console.warn('SEO load failed:', e); }
}
function setMeta(name, content) { if (!content) return; let el = document.querySelector(`meta[name="${name}"]`); if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); } el.content = content; }
function setOg(prop, content) { if (!content) return; let el = document.querySelector(`meta[property="og:${prop}"]`); if (!el) { el = document.createElement('meta'); el.setAttribute('property', `og:${prop}`); document.head.appendChild(el); } el.content = content; }
function setLink(rel, href) { if (!href) return; let el = document.querySelector(`link[rel="${rel}"]`); if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el); } el.href = href; }

// ─── Navigation ─────────────────────────────────────────────
async function loadNavigation() {
  try {
    const d = await sbGet(TABLES.NAVIGATION);
    const items = d?.items || [];
    renderNavLinks(items); renderMobileNavLinks(items);
  } catch (e) { console.warn('Navigation load failed:', e); }
}
function renderNavLinks(items) {
  const ul = document.getElementById('navLinks'); if (!ul) return;
  const visible = items.filter(i => i.visible !== false).sort((a,b) => a.order - b.order);
  ul.innerHTML = visible.map(item => `<li><a href="#${item.key}" onclick="smoothScrollTo('${item.key}');return false">${escHtml(item.label)}</a></li>`).join('');
}
function renderMobileNavLinks(items) {
  const nav = document.getElementById('mobileNavLinks'); if (!nav) return;
  const visible = items.filter(i => i.visible !== false).sort((a,b) => a.order - b.order);
  nav.innerHTML = visible.map(item => `<a href="#${item.key}" onclick="smoothScrollTo('${item.key}');closeMobileNav();return false">${escHtml(item.label)}</a>`).join('');
}
function smoothScrollTo(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }

// ─── Profile / Hero ─────────────────────────────────────────
async function loadProfile() {
  try {
    const p = await sbGet(TABLES.PROFILE); if (!p) return;
    renderHero(p); renderFooterBrand(p); renderNavBrand(p);
  } catch (e) { console.warn('Profile load failed:', e); }
}
function renderNavBrand(p) {
  const logoImg = document.getElementById('navLogoImg'), logoName = document.getElementById('navLogoName'), logoTag = document.getElementById('navLogoTag');
  if (siteAppearance.logo_url && logoImg) { logoImg.src = siteAppearance.logo_url; logoImg.style.display = 'block'; document.getElementById('navLogoIcon').style.display = 'none'; }
  if (logoName && siteAppearance.logo_text) logoName.textContent = siteAppearance.logo_text;
  if (logoTag && p.institution) logoTag.textContent = p.institution;
}
function renderHero(p) {
  setText('heroHeadline', p.hero_headline || 'Healing Minds. Shaping Futures.');
  setText('heroSub', p.intro || '');
  const titlesEl = document.getElementById('heroTitles');
  if (titlesEl && p.titles?.length) titlesEl.innerHTML = p.titles.map(t => `<span class="title-pill">${escHtml(t)}</span>`).join('');
  const trustEl = document.getElementById('heroTrust');
  if (trustEl && p.trust_badges?.length) trustEl.innerHTML = p.trust_badges.map(b => `<div class="trust-item"><i class="fas fa-check-circle"></i>${escHtml(b)}</div>`).join('');
  const cta2 = document.getElementById('heroCta2');
  if (cta2 && p.cta2_text) { cta2.textContent = p.cta2_text; if (p.cta2_link) cta2.href = p.cta2_link; }
  setText('cardTutorName', p.name || p.display_name || 'Your Consultant');
  setText('cardTutorCred', p.institution || '');
  const cardAv = document.getElementById('cardAvatar');
  if (cardAv && p.photo_url) cardAv.innerHTML = `<img src="${escHtml(p.photo_url)}" alt="${escHtml(p.name||'')}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  else if (cardAv && p.name) cardAv.textContent = (p.name||'T').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  if (p.hero_bg_url) { const el = document.getElementById('heroBgImg'); if (el) { el.src = p.hero_bg_url; el.style.display = 'block'; } }
}

// ─── About ──────────────────────────────────────────────────
async function loadAboutSection() {
  try {
    const [a, p] = await Promise.all([ sbGet(TABLES.ABOUT), sbGet(TABLES.PROFILE) ]);
    const about = a || {}, profile = p || {};
    setText('aboutEyebrow', about.eyebrow || 'Who I Am');
    setText('aboutHeading', about.heading || 'About');
    const bioEl = document.getElementById('aboutBio');
    if (bioEl) { const text = about.text || profile.bio || ''; bioEl.innerHTML = text.split('\n\n').filter(Boolean).map(p => `<p>${nl2br(escHtml(p))}</p>`).join(''); }
    const specEl = document.getElementById('aboutSpecs');
    if (specEl && profile.specializations?.length) specEl.innerHTML = profile.specializations.map(s => `<div class="spec-item"><i class="fas fa-check-circle"></i>${escHtml(s)}</div>`).join('');
    const imgEl = document.getElementById('aboutImage');
    if (imgEl && (about.image_url || profile.photo_url)) imgEl.innerHTML = `<img src="${escHtml(about.image_url || profile.photo_url)}" alt="${escHtml(profile.name||'')}" style="width:100%;height:100%;object-fit:cover;object-position:top"/>`;
    const cardsEl = document.getElementById('aboutCards');
    if (cardsEl && about.cards?.length) cardsEl.innerHTML = about.cards.map(c => `<div class="about-card" data-aos><div class="about-card-icon"><i class="${escHtml(c.icon||'fas fa-star')}"></i></div><h4>${escHtml(c.title||'')}</h4><p>${escHtml(c.desc||'')}</p></div>`).join('');
  } catch (e) { console.warn('About load failed:', e); }
}

// ─── Qualifications ─────────────────────────────────────────
async function loadQualificationsSection() {
  try {
    const items = await sbList(TABLES.QUALIFICATIONS, { orderBy:'order_index', ascending:true });
    const degrees = items.filter(i => ['degree','license'].includes(i.type));
    const certs = items.filter(i => ['certification','membership','award'].includes(i.type));
    const col1 = document.getElementById('qualCol1'), col2 = document.getElementById('qualCol2');
    if (col1) col1.innerHTML = degrees.length ? degrees.map(qualCard).join('') : '<p style="color:var(--text-muted);font-size:.88rem">No degrees listed yet.</p>';
    if (col2) col2.innerHTML = certs.length ? certs.map(qualCard).join('') : '<p style="color:var(--text-muted);font-size:.88rem">No certifications listed yet.</p>';
  } catch (e) { console.warn('Qualifications load failed:', e); }
}
function qualCard(q) { return `<div class="qual-item" data-aos><span class="qual-yr">${escHtml(q.year||'')}</span><div class="qual-info"><h4>${escHtml(q.name||'')}</h4><p>${escHtml(q.institution||'')}${q.description?'<br><em>'+escHtml(q.description)+'</em>':''}</p></div></div>`; }

// ─── Experience ─────────────────────────────────────────────
async function loadExperienceSection() {
  try {
    const items = await sbList(TABLES.EXPERIENCE, { orderBy:'created_at', ascending:false });
    const cats = ['teaching','clinical','research','international'];
    const tabsEl = document.getElementById('expTabs'), panelsEl = document.getElementById('expPanels');
    if (!tabsEl || !panelsEl) return;
    tabsEl.innerHTML = cats.map((cat,i) => `<button class="exp-tab ${i===0?'active':''}" onclick="switchExpTab(this,'exp-${cat}')">${cat.charAt(0).toUpperCase()+cat.slice(1)}</button>`).join('');
    panelsEl.innerHTML = cats.map((cat,i) => { const catItems = items.filter(x => x.category === cat); return `<div class="exp-panel ${i===0?'active':''}" id="exp-${cat}">${catItems.length ? catItems.map(expCard).join('') : `<div style="color:var(--text-muted);font-size:.88rem;padding:1rem 0">No ${cat} experience listed yet.</div>`}</div>`; }).join('');
  } catch (e) { console.warn('Experience load failed:', e); }
}
function expCard(e) { return `<div class="exp-entry" data-aos><span class="exp-period">${escHtml(e.period||'')}</span><div class="exp-body"><h4>${escHtml(e.role||'')}</h4><p class="org">${escHtml(e.org||'')}</p><p>${escHtml(e.description||'')}</p></div></div>`; }
function switchExpTab(btn, panelId) { document.querySelectorAll('.exp-tab').forEach(t=>t.classList.remove('active')); document.querySelectorAll('.exp-panel').forEach(p=>p.classList.remove('active')); btn.classList.add('active'); document.getElementById(panelId)?.classList.add('active'); }

// ─── Services ───────────────────────────────────────────────
async function loadServicesSection() {
  try {
    const items = (await sbList(TABLES.SERVICES, { orderBy:'order_index', ascending:true })).filter(s => s.visible !== false);
    const grid = document.getElementById('servicesGrid'); if (!grid) return;
    grid.innerHTML = items.length ? items.map(s => `<div class="srv-card" data-aos><div class="srv-icon"><i class="${escHtml(s.icon||'fas fa-star')}"></i></div><h3>${escHtml(s.name||'')}</h3><p>${escHtml(s.description||'')}</p>${s.tag?`<span class="srv-tag">${escHtml(s.tag)}</span>`:''}</div>`).join('') : '<p style="color:var(--text-muted)">Services coming soon.</p>';
  } catch (e) { console.warn('Services load failed:', e); }
}

// ─── Publications ───────────────────────────────────────────
async function loadPublicationsSection() {
  try {
    const items = await sbList(TABLES.PUBLICATIONS, { orderBy:'year', ascending:false });
    renderPublications(items, 'all');
    document.querySelectorAll('.pub-filter').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.pub-filter').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderPublications(items, btn.dataset.type||'all'); }));
  } catch (e) { console.warn('Publications load failed:', e); }
}
function renderPublications(items, type) {
  const list = document.getElementById('pubList'); if (!list) return;
  const filtered = type === 'all' ? items : items.filter(p => p.type === type);
  list.innerHTML = filtered.length ? filtered.map(p => `<div class="pub-item" data-aos><span class="pub-badge">${escHtml((p.type||'').toUpperCase())}</span><div class="pub-content"><h4>${escHtml(p.title||'')}</h4><p class="pub-meta">${escHtml(p.authors||'')}${p.year?' ('+p.year+')':''}</p>${p.journal?`<p class="pub-journal">${escHtml(p.journal)}${p.volume?', '+escHtml(p.volume):''}</p>`:''}${p.doi?`<a href="${escHtml(p.doi)}" target="_blank" rel="noopener" style="font-size:.78rem;color:var(--gold);text-decoration:underline">DOI Link ↗</a>`:''}</div>${p.pdf_url?`<a href="${escHtml(p.pdf_url)}" target="_blank" rel="noopener" class="pub-dl" title="Download PDF"><i class="fas fa-download"></i></a>`:''}</div>`).join('') : '<div style="color:var(--text-muted);padding:2rem 0;text-align:center">No publications in this category yet.</div>';
}

// ─── Metrics ─────────────────────────────────────────────────
async function loadMetricsSection() {
  try {
    const d = await sbGet(TABLES.METRICS); if (!d) return;
    const sfx = d.suffix || '+';
    const statsData = [ {label:'Years Experience', value:d.years}, {label:'Publications', value:d.pubs}, {label:'Students & Mentees', value:d.students}, {label:'Conferences', value:d.conferences} ];
    const custom = Array.isArray(d.custom) ? d.custom : [];
    const allStats = [...statsData, ...custom.map(c => ({ label:c.label, value:c.value, custom:true }))];
    const row = document.getElementById('statsRow'); if (!row) return;
    row.innerHTML = allStats.filter(s => s.value).map(s => `<div class="stat-it" data-aos><div class="stat-n"><span class="counter" data-target="${parseInt(s.value)||0}">${s.custom?escHtml(String(s.value)):'0'}</span>${!s.custom?`<em>${sfx}</em>`:''}</div><div class="stat-l">${escHtml(s.label||'')}</div></div>`).join('');
    initCounters();
  } catch (e) { console.warn('Metrics load failed:', e); }
}
function initCounters() {
  if (siteAppearance.counters === false) { document.querySelectorAll('.counter').forEach(el => el.textContent = el.dataset.target); return; }
  const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (!e.isIntersecting) return; const el = e.target, target = parseInt(el.dataset.target)||0; let cur = 0; const step = target/(1800/16); const t = setInterval(() => { cur = Math.min(cur+step,target); el.textContent = Math.floor(cur).toLocaleString(); if (cur>=target) clearInterval(t); },16); obs.unobserve(el); }); }, { threshold:0.5 });
  document.querySelectorAll('.counter[data-target]').forEach(el => obs.observe(el));
}

// ─── Gallery ────────────────────────────────────────────────
async function loadGallerySection() {
  try {
    const items = await sbList(TABLES.GALLERY, { orderBy:'order_index', ascending:true });
    const grid = document.getElementById('galleryGrid'); if (!grid || !items.length) return;
    grid.innerHTML = items.slice(0,8).map(g => `<div class="gal-item" onclick="openLightbox('${escHtml(g.url||'')}','${escHtml(g.caption||'')}')">${g.url?`<img class="gal-img" src="${escHtml(g.url)}" alt="${escHtml(g.caption||'')}" loading="lazy"/>`:`<div class="gal-placeholder"><i class="fas fa-image"></i></div>`}<div class="gal-overlay"><span class="gal-cap">${escHtml(g.caption||'')}</span></div></div>`).join('');
    const its = grid.querySelectorAll('.gal-item');
    if (its[0]) { its[0].style.gridColumn='span 2'; its[0].style.gridRow='span 2'; }
    if (its[3]) its[3].style.gridColumn='span 2';
  } catch (e) { console.warn('Gallery load failed:', e); }
}

// ─── Media ───────────────────────────────────────────────────
async function loadMediaSection() {
  try {
    const items = (await sbList(TABLES.MEDIA, { orderBy:'created_at', ascending:false })).filter(m => m.visible !== false);
    const grid = document.getElementById('vidGrid'); if (!grid || !items.length) return;
    grid.innerHTML = items.slice(0,6).map(m => { const ytId = getYouTubeId(m.url||''); const embedUrl = ytId?`https://www.youtube.com/embed/${ytId}`:''; return `<div class="vid-card" data-aos><div class="vid-thumb">${embedUrl?`<iframe src="${escHtml(embedUrl)}" title="${escHtml(m.title||'')}" allowfullscreen loading="lazy"></iframe>`:`<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gold);font-size:3rem"><i class="fab fa-youtube"></i></div>`}</div><div class="vid-info"><div class="vid-tag">${escHtml(m.type||'Video')}</div><div class="vid-title">${escHtml(m.title||'')}</div><div class="vid-meta">${escHtml(m.platform||'')}${m.duration?' · '+escHtml(m.duration):''}</div></div></div>`; }).join('');
  } catch (e) { console.warn('Media load failed:', e); }
}
function getYouTubeId(url) { const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m?m[1]:null; }

// ─── Testimonials ───────────────────────────────────────────
async function loadTestimonialsSection() {
  try {
    const items = (await sbList(TABLES.TESTIMONIALS, { orderBy:'created_at', ascending:false })).filter(t => t.visible !== false);
    const track = document.getElementById('testiTrack'), dots = document.getElementById('testiDots');
    if (!track || !items.length) return;
    track.innerHTML = items.map(t => `<div class="t-card"><div class="t-stars">${'★'.repeat(parseInt(t.rating)||5)}</div><p class="t-body">"${escHtml(t.body||'')}"</p><div class="t-author">${t.photo_url?`<div class="t-ava"><img src="${escHtml(t.photo_url)}" alt=""/></div>`:`<div class="t-ava">${(t.name||'?')[0].toUpperCase()}</div>`}<div><div class="t-nm">${escHtml(t.name||'')}${t.country?' <span style="font-size:.9em">'+escHtml(t.country)+'</span>':''}</div><div class="t-rl">${escHtml(t.role||'')}</div></div></div></div>`).join('');
    const total = Math.ceil(items.length / testiPerView);
    if (dots) dots.innerHTML = Array.from({length:total}, (_,i) => `<button class="t-dot ${i===0?'on':''}" onclick="goToTesti(${i})" aria-label="Slide ${i+1}"></button>`).join('');
    initTestiSlider(total, track, dots);
  } catch (e) { console.warn('Testimonials load failed:', e); }
}
function initTestiSlider(total, track, dots) {
  let cur = 0;
  function go(idx) { cur = (idx+total)%total; const w = track.querySelector('.t-card')?.offsetWidth+24 || 300; track.style.transform = `translateX(-${cur*testiPerView*w}px)`; if (dots) dots.querySelectorAll('.t-dot').forEach((d,i)=>d.classList.toggle('on',i===cur)); }
  window.goToTesti = go;
  let auto = setInterval(() => go(cur+1), 5200);
  track.parentElement.addEventListener('mouseenter', () => clearInterval(auto));
  track.parentElement.addEventListener('mouseleave', () => { auto = setInterval(() => go(cur+1), 5200); });
  window.addEventListener('resize', () => { testiPerView = window.innerWidth<768?1:3; go(0); });
}

/* ================================================================
   NEW: TEACHERS DIRECTORY
================================================================ */
async function loadTeachersSection() {
  try {
    // Public RLS already restricts to status=approved AND bookable=true
    teachersData = await sbList(TABLES.TEACHERS, { orderBy:'order_index', ascending:true });
    const grid = document.getElementById('teachersGrid');
    if (grid) {
      grid.innerHTML = teachersData.length ? teachersData.map(t => `
        <div class="teach-card" data-aos>
          ${t.photo_url ? `<img class="teach-photo" src="${escHtml(t.photo_url)}" alt="${escHtml(t.name)}" loading="lazy"/>` : `<div class="teach-photo-placeholder"><i class="fas fa-user-tie"></i></div>`}
          <div class="teach-body">
            <div class="teach-name">${escHtml(t.name)}</div>
            <div class="teach-title">${escHtml(t.title||'')}</div>
            <div class="teach-subjects">${(t.subjects||[]).map(s=>`<span class="teach-subj-tag">${escHtml(s)}</span>`).join('')}</div>
            <p class="teach-bio">${escHtml(t.bio||'')}</p>
            <button class="teach-book-btn" onclick="openApptModal('${t.id}')"><i class="fas fa-calendar-check"></i> Book with ${escHtml(t.name.split(' ')[0])}</button>
          </div>
        </div>`).join('') : '<p style="color:var(--text-muted)">No teachers listed yet. Check back soon!</p>';
    }
    // Populate teacher dropdown in appointment modal
    const sel = document.getElementById('amTeacher');
    if (sel) sel.innerHTML = '<option value="">No preference / General</option>' + teachersData.map(t => `<option value="${t.id}">${escHtml(t.name)} — ${escHtml((t.subjects||[]).join(', '))}</option>`).join('');
  } catch (e) { console.warn('Teachers load failed:', e); }
}

/* ================================================================
   NEW: CAREERS / JOB OPENINGS
================================================================ */
async function loadJobsSection() {
  try {
    // Public RLS restricts to status='open'
    jobsData = await sbList(TABLES.JOB_OPENINGS, { orderBy:'created_at', ascending:false });
    const list = document.getElementById('jobsList');
    if (!list) return;
    list.innerHTML = jobsData.length ? jobsData.map(j => `
      <div class="job-card" id="job-${j.id}">
        <div class="job-info">
          <div class="job-title">${escHtml(j.title)}</div>
          <div class="job-meta">
            <span><i class="fas fa-building"></i> ${escHtml(j.department||'General')}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${escHtml(j.location||'Remote')}</span>
            <span><i class="fas fa-clock"></i> ${escHtml(j.employment_type||'')}</span>
          </div>
          <div class="job-desc-full">
            <p style="margin-bottom:.5rem">${escHtml(j.description||'')}</p>
            ${j.requirements ? `<p><strong>Requirements:</strong> ${escHtml(j.requirements)}</p>` : ''}
          </div>
          <a href="#" onclick="toggleJobDesc('${j.id}');return false" style="font-size:.78rem;color:var(--gold);text-decoration:underline;display:inline-block;margin-top:.4rem">View details</a>
        </div>
        <button class="job-apply-btn" onclick="openApplyModal('${j.id}','${j.job_type}','${escHtml(j.title).replace(/'/g,"\\'")}')">Apply Now</button>
      </div>`).join('') : '<p style="color:var(--text-muted)">No open roles right now — check back soon!</p>';
  } catch (e) { console.warn('Jobs load failed:', e); }
}
function toggleJobDesc(id) { document.getElementById(`job-${id}`)?.classList.toggle('expanded'); }

/* ================================================================
   NEW: APPOINTMENT BOOKING MODAL
================================================================ */
function openApptModal(teacherId) {
  const modal = document.getElementById('apptModal');
  if (teacherId) { const sel = document.getElementById('amTeacher'); if (sel) sel.value = teacherId; }
  modal.classList.add('open'); document.body.style.overflow = 'hidden';
}
function closeApptModal() { document.getElementById('apptModal').classList.remove('open'); document.body.style.overflow = ''; document.getElementById('apptForm').reset(); }
function initApptModal() {
  document.getElementById('apptModal').addEventListener('click', e => { if (e.target.id === 'apptModal') closeApptModal(); });
  document.getElementById('apptForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.pm-submit');
    const orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
    try {
      const teacherId = document.getElementById('amTeacher').value || null;
      await sbInsert(TABLES.APPOINTMENTS, {
        name: document.getElementById('amName').value,
        email: document.getElementById('amEmail').value,
        phone: document.getElementById('amPhone').value,
        teacher_id: teacherId,
        subject: document.getElementById('amSubject').value,
        preferred_date: document.getElementById('amDate').value || null,
        preferred_time: document.getElementById('amTime').value || null,
        message: document.getElementById('amMessage').value,
        status: 'pending',
      });
      btn.innerHTML = '<i class="fas fa-check"></i> Request Sent!';
      showToast('Appointment request submitted! We\'ll be in touch shortly.', 'success', 5000);
      setTimeout(() => { closeApptModal(); btn.innerHTML = orig; btn.disabled = false; }, 1800);
    } catch (err) {
      btn.innerHTML = orig; btn.disabled = false;
      showToast('Something went wrong. Please try again.', 'error');
    }
  });
}

/* ================================================================
   NEW: JOB APPLICATION MODAL
================================================================ */
function openApplyModal(jobId, jobType, jobTitle) {
  document.getElementById('apJobId').value = jobId;
  document.getElementById('apJobType').value = jobType;
  document.getElementById('applyModalTitle').textContent = `Apply — ${jobTitle}`;
  document.getElementById('apSubjectsGroup').style.display = jobType === 'teaching' ? 'flex' : 'none';
  document.getElementById('applyModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeApplyModal() { document.getElementById('applyModal').classList.remove('open'); document.body.style.overflow = ''; document.getElementById('applyForm').reset(); document.getElementById('apResumeInfo').textContent = ''; }
function initApplyModal() {
  document.getElementById('applyModal').addEventListener('click', e => { if (e.target.id === 'applyModal') closeApplyModal(); });

  const resumeZone = document.getElementById('apResumeZone'), resumeFile = document.getElementById('apResumeFile');
  resumeZone.addEventListener('click', () => resumeFile.click());
  resumeFile.addEventListener('change', () => { if (resumeFile.files[0]) document.getElementById('apResumeInfo').innerHTML = `<i class="fas fa-check-circle"></i> ${escHtml(resumeFile.files[0].name)}`; });

  document.getElementById('applyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.pm-submit');
    const orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
    try {
      const jobType = document.getElementById('apJobType').value;
      let resumeUrl = '';
      const file = resumeFile.files[0];
      if (file) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading resume…'; resumeUrl = await uploadFile(file, `applications/${Date.now()}_${file.name}`); }

      await sbInsert(TABLES.JOB_APPLICATIONS, {
        job_id: document.getElementById('apJobId').value || null,
        applicant_name: document.getElementById('apName').value,
        email: document.getElementById('apEmail').value,
        phone: document.getElementById('apPhone').value,
        applicant_type: jobType === 'teaching' ? 'teacher' : 'general',
        subjects: jobType === 'teaching' ? document.getElementById('apSubjects').value.split(',').map(s=>s.trim()).filter(Boolean) : [],
        cover_letter: document.getElementById('apCoverLetter').value,
        resume_url: resumeUrl,
        status: 'new',
      });
      btn.innerHTML = '<i class="fas fa-check"></i> Application Sent!';
      showToast('Application submitted successfully! We\'ll review it shortly.', 'success', 5000);
      setTimeout(() => { closeApplyModal(); btn.innerHTML = orig; btn.disabled = false; }, 1800);
    } catch (err) {
      btn.innerHTML = orig; btn.disabled = false;
      showToast('Something went wrong. Please try again.', 'error');
    }
  });
}

// ─── Appointment settings (availability display) ─────────────
async function loadAppointmentSection() {
  try {
    const d = await sbGet(TABLES.APPOINTMENT_SETTINGS); if (!d) return;
    const availEl = document.getElementById('availList');
    if (availEl && d.availability?.length) availEl.innerHTML = d.availability.map(row => `<div class="avail-row"><span class="avail-day">${escHtml(row.day||'')}</span><span class="avail-time">${escHtml(row.time||'')}</span></div>`).join('');
    setText('apptDetails', d.details || '');
    setText('apptFees', d.fees || '');
    const notesEl = document.getElementById('apptNotes');
    if (notesEl && d.notes) notesEl.innerHTML = d.notes.split('\n').filter(Boolean).map(n => `<div class="appt-note"><i class="fas fa-shield-heart"></i>${escHtml(n)}</div>`).join('');
  } catch (e) { console.warn('Appointment settings load failed:', e); }
}

// ─── Contact ────────────────────────────────────────────────
async function loadContact() {
  try {
    const d = await sbGet(TABLES.CONTACT); if (!d) return;
    renderContactInfo(d);
  } catch (e) { console.warn('Contact load failed:', e); }
}
function renderContactInfo(d) {
  const items = [
    { label:'Email', icon:'envelope', value:d.email, href:`mailto:${d.email}` },
    { label:'Phone', icon:'phone', value:d.phone1, href:`tel:${d.phone1}` },
    { label:'Office', icon:'location-dot', value:d.office },
  ];
  const infoEl = document.getElementById('contactInfo');
  if (infoEl) infoEl.innerHTML = items.filter(i=>i.value).map(i => `<div class="c-item"><div class="c-ico"><i class="fas fa-${i.icon}"></i></div><div><div class="c-lbl">${i.label}</div><div class="c-val">${i.href?`<a href="${escHtml(i.href)}" style="color:var(--text)">${escHtml(i.value)}</a>`:escHtml(i.value||'')}</div></div></div>`).join('');

  const socials = [ {icon:'fab fa-linkedin-in',url:d.linkedin}, {icon:'fab fa-x-twitter',url:d.twitter}, {icon:'fab fa-youtube',url:d.youtube}, {icon:'fas fa-graduation-cap',url:d.scholar}, {icon:'fab fa-researchgate',url:d.researchgate}, {icon:'fab fa-orcid',url:d.orcid}, {icon:'fab fa-instagram',url:d.instagram}, {icon:'fab fa-facebook-f',url:d.facebook} ].filter(s=>s.url);
  const socEl = document.getElementById('contactSocials');
  if (socEl) socEl.innerHTML = socials.map(s => `<a href="${escHtml(s.url)}" target="_blank" rel="noopener" class="sc-btn"><i class="${s.icon}"></i></a>`).join('');
  const footSoc = document.getElementById('footerSocials');
  if (footSoc) footSoc.innerHTML = socials.slice(0,5).map(s => `<a href="${escHtml(s.url)}" target="_blank" rel="noopener" class="sc-btn"><i class="${s.icon}"></i></a>`).join('');
}

// ─── Footer brand ──────────────────────────────────────────
async function renderFooterBrand(p) {
  try {
    const d = await sbGet(TABLES.FOOTER) || {};
    const footDesc = document.getElementById('footerDesc'), footCopy = document.getElementById('footerCopyright');
    if (footDesc) footDesc.textContent = d.description || p.mission || '';
    if (footCopy) footCopy.textContent = d.copyright || `© ${new Date().getFullYear()} ${p.name||''}. All rights reserved.`;
    if (d.tagline) setText('footerTagline', d.tagline);
    if (d.col2_title) setText('footerCol2Title', d.col2_title);
    if (d.col3_title) setText('footerCol3Title', d.col3_title);
    if (d.col4_title) setText('footerCol4Title', d.col4_title);
  } catch (e) { document.getElementById('footerCopyright').textContent = `© ${new Date().getFullYear()} ${p.name||''}. All rights reserved.`; }
}

// ─── Contact form ────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contactForm'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]'); const orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    try {
      await sbInsert(TABLES.CONTACT_SUBMISSIONS, {
        name: form.querySelector('#cfName')?.value||'', email: form.querySelector('#cfEmail')?.value||'',
        phone: form.querySelector('#cfPhone')?.value||'', subject: form.querySelector('#cfSubject')?.value||'',
        message: form.querySelector('#cfMessage')?.value||'', status:'new',
      });
      btn.innerHTML = '<i class="fas fa-check"></i> Sent! We\'ll be in touch.'; btn.style.background = 'linear-gradient(135deg,#25D366,#128C7E)';
      form.reset();
      setTimeout(() => { btn.innerHTML = orig; btn.style.background=''; btn.disabled=false; }, 5000);
    } catch (err) { btn.innerHTML = '<i class="fas fa-times"></i> Error — try again'; btn.style.background='#ef4444'; btn.disabled=false; setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';},4000); }
  });
}

// ─── Navbar / theme / hamburger / lightbox ────────────────────
function initNavbar() {
  const nb = document.getElementById('navbar'), btt = document.getElementById('btt');
  window.addEventListener('scroll', () => { nb?.classList.toggle('scrolled', window.scrollY>50); btt?.classList.toggle('show', window.scrollY>300); });
  const sections = document.querySelectorAll('section[id]');
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { const id=e.target.id; document.querySelectorAll('#navLinks a').forEach(a => a.closest('li')?.classList.toggle('active', a.getAttribute('href')===`#${id}`)); } }), { threshold:0.4 });
  sections.forEach(s => obs.observe(s));
  btt?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
}
function initThemeToggle() {
  const btn = document.getElementById('navThemeBtn'); if (!btn) return;
  const saved = localStorage.getItem('pub-theme');
  if (saved) btn.innerHTML = saved==='dark'?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';
  btn.addEventListener('click', () => { const isDark = document.documentElement.getAttribute('data-theme')==='dark'; document.documentElement.setAttribute('data-theme', isDark?'light':'dark'); localStorage.setItem('pub-theme', isDark?'light':'dark'); btn.innerHTML = isDark?'<i class="fas fa-moon"></i>':'<i class="fas fa-sun"></i>'; });
}
function initHamburger() {
  const hbg = document.getElementById('hbg'), mnav = document.getElementById('mnav'); if (!hbg||!mnav) return;
  hbg.addEventListener('click', () => { hbg.classList.toggle('open'); mnav.classList.toggle('open'); document.body.style.overflow = mnav.classList.contains('open')?'hidden':''; });
  window.closeMobileNav = () => { hbg.classList.remove('open'); mnav.classList.remove('open'); document.body.style.overflow=''; };
}
function initLightbox() {
  const lb = document.getElementById('lightbox'); if (!lb) return;
  lb.addEventListener('click', e => { if (e.target===lb || e.target.classList.contains('lightbox-close')) lb.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key==='Escape') { lb.classList.remove('open'); closeApptModal(); closeApplyModal(); } });
}
function openLightbox(src, caption) { const lb=document.getElementById('lightbox'), img=document.getElementById('lightboxImg'); if (!lb||!src) return; img.src=src; img.alt=caption||''; lb.classList.add('open'); }

// ─── Helpers ─────────────────────────────────────────────────
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val || ''; }
