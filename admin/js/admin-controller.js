/**
 * admin-controller.js
 * Full admin panel controller — Supabase edition.
 * Handles all pages, CRUD, uploads, and UI logic.
 */
'use strict';

let currentPage = 'dashboard';
let currentUser = null;
let qualsAll = [], expList = [], servicesList = [], pubsList = [];
let galleryList = [], mediaList = [], testiList = [], filesList = [];
let teachersList = [], jobsList = [], appsList = [], apptsList = [];

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initAdmin(user) {
  currentUser = user;
  document.getElementById('adminLayout').style.display = 'grid';
  const email = user.email || '';
  document.getElementById('userEmail').textContent = email.split('@')[0];
  document.getElementById('userAvatar').textContent = (email[0] || 'A').toUpperCase();

  const saved = localStorage.getItem('admin-theme');
  if (saved === 'dark') applyTheme('dark');

  setupNav(); setupTopbar(); setupTabSwitching(); setupUploadZones(); setupColorPickers();
  await loadDashboard();
  await updateBadges();
  logActivity('Admin session started');
}

function setupNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      showPage(item.dataset.page);
      if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
    });
  });
}

function showPage(page) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  currentPage = page;

  const titles = { dashboard:'Dashboard', profile:'Profile & Hero', about:'About Section', qualifications:'Qualifications', experience:'Experience', services:'Services', publications:'Publications', metrics:'Research Metrics', gallery:'Gallery', media:'Videos & Media', testimonials:'Testimonials', teachers:'Teachers', careers:'Job Openings', applications:'Applications', appointments:'Appointment Requests', contact:'Contact', navigation:'Navigation', footer:'Footer', seo:'SEO Settings', appearance:'Appearance', homepage:'Homepage Builder', files:'File Manager', backup:'Backup & Restore' };
  document.getElementById('topbarTitle').textContent = titles[page] || page;

  const loaders = { dashboard:loadDashboard, qualifications:loadQuals, experience:loadExperience, services:loadServices, publications:loadPublications, gallery:loadGallery, media:loadMedia, testimonials:loadTestimonials, profile:loadProfile, about:loadAbout, metrics:loadMetrics, teachers:loadTeachers, careers:loadJobs, applications:loadApplications, appointments:loadAppointmentsList, contact:loadContact, navigation:loadNavigation, footer:loadFooter, seo:loadSeo, appearance:loadAppearance, homepage:loadHomepageBuilder, files:loadFiles };
  if (loaders[page]) loaders[page]();
}

function setupTopbar() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    const ok = await showConfirm('Sign Out', 'Are you sure you want to sign out?', 'Sign Out', 'Cancel');
    if (ok) { await sb.auth.signOut(); window.location.href = 'login.html'; }
  });
  document.getElementById('themeBtn').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
  });
  document.getElementById('refreshBtn').addEventListener('click', () => { showPage(currentPage); updateBadges(); showToast('Data refreshed', 'success'); });
  document.getElementById('sidebarToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('adminMain').addEventListener('click', () => { if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open'); });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('admin-theme', theme);
  document.getElementById('themeBtn').innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function setupTabSwitching() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      const container = tab.closest('.admin-page') || tab.closest('.card') || document.body;
      container.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });
}

function openModal(id) { document.getElementById(id)?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow = ''; }

function setupUploadZones() {
  const zones = [
    { zone:'photoUploadZone', file:'photoFile', preview:'photoPreviewWrap' },
    { zone:'heroBgZone', file:'heroBgFile', preview:'heroBgPreview' },
    { zone:'cvUploadZone', file:'cvFile', preview:'cvFileInfo' },
    { zone:'resumeUploadZone', file:'resumeFile', preview:'resumeFileInfo' },
    { zone:'aboutImgZone', file:'aboutImgFile', preview:'aboutImgPreview' },
    { zone:'ogImgZone', file:'ogImgFile', preview:'ogImgPreview' },
    { zone:'logoUploadZone', file:'logoFile', preview:'logoPreview' },
    { zone:'galleryUploadZone', file:'galleryFiles', preview:null },
    { zone:'pubPdfZone', file:'pubPdfFile', preview:'pubPdfInfo' },
    { zone:'testiPhotoZone', file:'testiPhotoFile', preview:'testiPhotoPreview' },
    { zone:'teacherPhotoZone', file:'teacherPhotoFile', preview:'teacherPhotoPreview' },
    { zone:'fileDropZone', file:'fileUploadInput', preview:null },
    { zone:'restoreZone', file:'restoreFile', preview:'restoreInfo' },
  ];
  zones.forEach(({ zone, file, preview }) => {
    const zoneEl = document.getElementById(zone), fileEl = document.getElementById(file);
    if (!zoneEl || !fileEl) return;
    zoneEl.addEventListener('click', () => fileEl.click());
    zoneEl.addEventListener('dragover', e => { e.preventDefault(); zoneEl.classList.add('drag-over'); });
    zoneEl.addEventListener('dragleave', () => zoneEl.classList.remove('drag-over'));
    zoneEl.addEventListener('drop', e => { e.preventDefault(); zoneEl.classList.remove('drag-over'); fileEl.files = e.dataTransfer.files; fileEl.dispatchEvent(new Event('change')); });
    fileEl.addEventListener('change', () => { if (fileEl.files.length && preview) showFilePreview(fileEl.files[0], preview, file); });
  });
  document.getElementById('fileUploadInput')?.addEventListener('change', function() { if (this.files.length) uploadFilesToStorage(Array.from(this.files)); });
  document.getElementById('restoreFile')?.addEventListener('change', function() { if (this.files[0]) prepareRestore(this.files[0]); });
}

function showFilePreview(file, previewId, fileInputId) {
  const el = document.getElementById(previewId); if (!el) return;
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => { el.innerHTML = `<div class="img-preview-wrap" style="margin-top:.75rem"><img class="img-preview" src="${e.target.result}" alt="Preview"/><button class="img-preview-remove" onclick="clearFilePreview('${fileInputId}','${previewId}')">×</button></div>`; };
    reader.readAsDataURL(file);
  } else {
    el.innerHTML = `<div class="badge badge-gold" style="margin-top:.5rem"><i class="fas fa-file"></i> ${escHtml(file.name)} (${(file.size/1024).toFixed(1)} KB)</div>`;
  }
}
function clearFilePreview(fileInputId, previewId) { const fi=document.getElementById(fileInputId), pr=document.getElementById(previewId); if(fi) fi.value=''; if(pr) pr.innerHTML=''; }

function setupColorPickers() {
  [['appNavy','navySwatch'],['appGold','goldSwatch'],['appCream','creamSwatch'],['appGoldLight','goldLightSwatch']].forEach(([input,swatch]) => {
    const inp=document.getElementById(input), sw=document.getElementById(swatch);
    if (!inp||!sw) return;
    sw.addEventListener('click', () => { const p=document.createElement('input'); p.type='color'; p.value=inp.value; p.click(); p.addEventListener('input',()=>{inp.value=p.value; sw.style.background=p.value;}); });
    inp.addEventListener('input', () => { if (/^#[0-9A-Fa-f]{6}$/.test(inp.value)) sw.style.background=inp.value; });
  });
}

// ─── Badges (pending counts in sidebar) ────────────────────────────────────────
async function updateBadges() {
  try {
    const [{ count: apptCount }, { count: appCount }] = await Promise.all([
      sb.from(TABLES.APPOINTMENTS).select('*', { count:'exact', head:true }).eq('status','pending'),
      sb.from(TABLES.JOB_APPLICATIONS).select('*', { count:'exact', head:true }).eq('status','new'),
    ]);
    const b1 = document.getElementById('badgeAppts'), b2 = document.getElementById('badgeApps');
    if (b1) { if (apptCount>0) { b1.textContent=apptCount; b1.style.display='inline-flex'; } else b1.style.display='none'; }
    if (b2) { if (appCount>0) { b2.textContent=appCount; b2.style.display='inline-flex'; } else b2.style.display='none'; }
  } catch(e) { console.warn('Badge update failed', e); }
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [{count:pendingAppts}, {count:newApps}, {count:teacherCount}, {count:pubCount}] = await Promise.all([
      sb.from(TABLES.APPOINTMENTS).select('*',{count:'exact',head:true}).eq('status','pending'),
      sb.from(TABLES.JOB_APPLICATIONS).select('*',{count:'exact',head:true}).eq('status','new'),
      sb.from(TABLES.TEACHERS).select('*',{count:'exact',head:true}).eq('status','approved'),
      sb.from(TABLES.PUBLICATIONS).select('*',{count:'exact',head:true}),
    ]);
    setText('statAppts', pendingAppts ?? 0);
    setText('statApps', newApps ?? 0);
    setText('statTeachers', teacherCount ?? 0);
    setText('statPubs', pubCount ?? 0);

    const upcoming = await sbList(TABLES.APPOINTMENTS, { eq:{status:'pending'}, orderBy:'created_at', ascending:false, limit:5 });
    const upEl = document.getElementById('upcomingAppts');
    upEl.innerHTML = upcoming.length ? upcoming.map(a => `<div class="activity-item"><div class="activity-dot"></div><div class="activity-text">${escHtml(a.name)} — ${escHtml(a.subject||'General')}</div><div class="activity-time">${formatDate(a.created_at)}</div></div>`).join('') : '<div class="empty-state"><p>No pending appointments</p></div>';

    const latestApps = await sbList(TABLES.JOB_APPLICATIONS, { orderBy:'created_at', ascending:false, limit:5 });
    const laEl = document.getElementById('latestApps');
    laEl.innerHTML = latestApps.length ? latestApps.map(a => `<div class="activity-item"><div class="activity-dot"></div><div class="activity-text">${escHtml(a.applicant_name)} <span class="badge badge-gray" style="margin-left:.3rem">${escHtml(a.applicant_type)}</span></div><div class="activity-time">${formatDate(a.created_at)}</div></div>`).join('') : '<div class="empty-state"><p>No applications yet</p></div>';

    document.getElementById('contentSummary').innerHTML = `<div style="display:flex;flex-direction:column;gap:.6rem;font-size:.875rem"><div style="display:flex;justify-content:space-between"><span>Publications</span><strong>${pubCount??0}</strong></div><div style="display:flex;justify-content:space-between"><span>Approved Teachers</span><strong>${teacherCount??0}</strong></div><div style="display:flex;justify-content:space-between"><span>Pending Appointments</span><strong>${pendingAppts??0}</strong></div><div style="display:flex;justify-content:space-between"><span>New Applications</span><strong>${newApps??0}</strong></div></div>`;
  } catch(e) { console.error('Dashboard load error:', e); }
}

async function logActivity(msg) {
  try {
    await sbInsert(TABLES.ACTIVITY_LOG, { message: msg, user_email: currentUser?.email });
    const list = await sbList(TABLES.ACTIVITY_LOG, { orderBy:'created_at', ascending:false, limit:8 });
    const el = document.getElementById('activityList'); if (!el) return;
    el.innerHTML = list.length ? list.map(d => `<div class="activity-item"><div class="activity-dot"></div><div class="activity-text">${escHtml(d.message||'')}</div><div class="activity-time">${formatDate(d.created_at)}</div></div>`).join('') : '<div class="empty-state"><p>No activity yet.</p></div>';
  } catch(e) {}
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const d = await sbGet(TABLES.PROFILE) || {};
    setVal('pName', d.name); setVal('pDisplayName', d.display_name);
    setVal('pTitles', (d.titles||[]).join('\n'));
    setVal('pEmail', d.email); setVal('pPhone', d.phone);
    setVal('pInstitution', d.institution); setVal('pLocation', d.location);
    setVal('pIntro', d.intro); setVal('pBio', d.bio);
    setVal('pMission', d.mission); setVal('pQuote', d.quote);
    setVal('pSpecializations', (d.specializations||[]).join('\n'));
    setVal('pHeroHeadline', d.hero_headline); setVal('pHeroSub', d.hero_sub);
    setVal('pCta1Text', d.cta1_text); setVal('pCta1Link', d.cta1_link);
    setVal('pCta2Text', d.cta2_text); setVal('pCta2Link', d.cta2_link);
    setVal('pTrustBadges', (d.trust_badges||[]).join('\n'));
    setVal('pCvBtnText', d.cv_btn_text);
    if (d.photo_url) document.getElementById('photoPreviewWrap').innerHTML = `<div class="img-preview-wrap"><img class="img-preview" src="${d.photo_url}" alt="Profile"/></div>`;
    if (d.hero_bg_url) document.getElementById('heroBgPreview').innerHTML = `<img src="${d.hero_bg_url}" style="width:100%;border-radius:var(--r-sm);margin-top:.5rem;max-height:200px;object-fit:cover" alt="Hero BG"/>`;
    if (d.cv_url) document.getElementById('cvFileInfo').innerHTML = `<a href="${d.cv_url}" target="_blank" class="badge badge-gold" style="margin-top:.5rem"><i class="fas fa-file-pdf"></i> Current CV uploaded</a>`;
  } catch(e) { showToast('Failed to load profile', 'error'); }
}

document.getElementById('saveProfile')?.addEventListener('click', async () => {
  showLoading('Saving profile…');
  try {
    let photoUrl = getExistingUrl('photoPreviewWrap','img');
    let heroBgUrl = getExistingUrl('heroBgPreview','img');
    let cvUrl = getExistingUrl('cvFileInfo','a');
    let resumeUrl = '';
    const photoFile = document.getElementById('photoFile')?.files[0];
    const heroBgFile = document.getElementById('heroBgFile')?.files[0];
    const cvFile = document.getElementById('cvFile')?.files[0];
    const resumeFile = document.getElementById('resumeFile')?.files[0];
    if (photoFile) photoUrl = await uploadFile(photoFile, `profile/photo_${Date.now()}_${photoFile.name}`);
    if (heroBgFile) heroBgUrl = await uploadFile(heroBgFile, `profile/herobg_${Date.now()}_${heroBgFile.name}`);
    if (cvFile) cvUrl = await uploadFile(cvFile, `profile/cv_${Date.now()}.pdf`);
    if (resumeFile) resumeUrl = await uploadFile(resumeFile, `profile/resume_${Date.now()}.pdf`);

    await sbUpsert(TABLES.PROFILE, {
      name:getVal('pName'), display_name:getVal('pDisplayName'),
      titles: getVal('pTitles').split('\n').filter(Boolean),
      email:getVal('pEmail'), phone:getVal('pPhone'), institution:getVal('pInstitution'), location:getVal('pLocation'),
      intro:getVal('pIntro'), bio:getVal('pBio'), mission:getVal('pMission'), quote:getVal('pQuote'),
      specializations: getVal('pSpecializations').split('\n').filter(Boolean),
      hero_headline:getVal('pHeroHeadline'), hero_sub:getVal('pHeroSub'),
      cta1_text:getVal('pCta1Text'), cta1_link:getVal('pCta1Link'), cta2_text:getVal('pCta2Text'), cta2_link:getVal('pCta2Link'),
      trust_badges: getVal('pTrustBadges').split('\n').filter(Boolean),
      cv_btn_text:getVal('pCvBtnText'), photo_url:photoUrl, hero_bg_url:heroBgUrl, cv_url:cvUrl, resume_url:resumeUrl,
    });
    hideLoading(); showToast('Profile saved!', 'success'); logActivity('Profile updated');
  } catch(e) { hideLoading(); showToast('Save failed: '+e.message, 'error'); }
});

// ─── ABOUT ───────────────────────────────────────────────────────────────────
async function loadAbout() {
  try {
    const d = await sbGet(TABLES.ABOUT) || {};
    setVal('aboutHeading', d.heading); setVal('aboutEyebrow', d.eyebrow); setVal('aboutText', d.text);
    if (d.image_url) document.getElementById('aboutImgPreview').innerHTML = `<img src="${d.image_url}" style="width:100%;max-height:200px;object-fit:cover;border-radius:var(--r-sm);margin-top:.5rem" alt="About"/>`;
    document.getElementById('aboutCardsEditor').innerHTML = '';
    (d.cards||[]).forEach(card => addAboutCard(card));
  } catch(e) { showToast('Failed to load about section','error'); }
}
function addAboutCard(data = {}) {
  const row = document.getElementById('aboutCardTemplate').content.cloneNode(true);
  if (data.icon) row.querySelector('[data-field="icon"]').value = data.icon;
  if (data.title) row.querySelector('[data-field="title"]').value = data.title;
  if (data.desc) row.querySelector('[data-field="desc"]').value = data.desc;
  document.getElementById('aboutCardsEditor').appendChild(row);
}
document.getElementById('saveAbout')?.addEventListener('click', async () => {
  showLoading('Saving…');
  try {
    let imageUrl = getExistingUrl('aboutImgPreview','img');
    const imgFile = document.getElementById('aboutImgFile')?.files[0];
    if (imgFile) imageUrl = await uploadFile(imgFile, `about/image_${Date.now()}_${imgFile.name}`);
    const cards = Array.from(document.querySelectorAll('#aboutCardsEditor .about-card-row')).map(row => ({ icon:row.querySelector('[data-field="icon"]')?.value||'', title:row.querySelector('[data-field="title"]')?.value||'', desc:row.querySelector('[data-field="desc"]')?.value||'' }));
    await sbUpsert(TABLES.ABOUT, { heading:getVal('aboutHeading'), eyebrow:getVal('aboutEyebrow'), text:getVal('aboutText'), image_url:imageUrl, cards });
    hideLoading(); showToast('About section saved!', 'success');
  } catch(e) { hideLoading(); showToast('Save failed: '+e.message, 'error'); }
});

// ─── QUALIFICATIONS ───────────────────────────────────────────────────────────
async function loadQuals() {
  document.getElementById('qualsTable').innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="loading-spinner" style="margin:auto"></div></div></td></tr>';
  qualsAll = await sbList(TABLES.QUALIFICATIONS, { orderBy:'order_index', ascending:true });
  renderQuals(qualsAll);
}
function filterQuals(q) { renderQuals(qualsAll.filter(r => `${r.name}${r.institution}${r.year}`.toLowerCase().includes(q.toLowerCase()))); }
function renderQuals(list) {
  const tbody = document.getElementById('qualsTable');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🎓</div><h3>No qualifications yet</h3></div></td></tr>'; return; }
  tbody.innerHTML = list.map(q => `<tr><td><span class="badge badge-gold">${escHtml(q.year||'—')}</span></td><td><strong>${escHtml(q.name||'')}</strong></td><td>${escHtml(q.institution||'')}</td><td><span class="badge badge-gray">${escHtml(q.type||'')}</span></td><td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="editQual('${q.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deleteQual('${q.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openQualModal(id) {
  clearQualForm(); document.getElementById('qualModalTitle').textContent = id?'Edit Qualification':'Add Qualification'; document.getElementById('qualId').value = id||'';
  if (id) { const q=qualsAll.find(x=>x.id===id); if(q){setVal('qualYear',q.year);setVal('qualName',q.name);setVal('qualInstitution',q.institution);setVal('qualDesc',q.description);setVal('qualOrder',q.order_index||0);document.getElementById('qualType').value=q.type||'degree';} }
  openModal('qualModal');
}
function editQual(id) { openQualModal(id); }
function clearQualForm() { ['qualYear','qualName','qualInstitution','qualDesc','qualOrder'].forEach(id=>setVal(id,'')); document.getElementById('qualId').value=''; }
async function saveQual() {
  const name = getVal('qualName'); if (!name) { showToast('Name is required','warning'); return; }
  showLoading('Saving…');
  try {
    const data = { year:getVal('qualYear'), name, institution:getVal('qualInstitution'), type:document.getElementById('qualType').value, description:getVal('qualDesc'), order_index:parseInt(getVal('qualOrder')||0) };
    const id = getVal('qualId');
    if (id) await sbUpdate(TABLES.QUALIFICATIONS,id,data); else await sbInsert(TABLES.QUALIFICATIONS,data);
    hideLoading(); closeModal('qualModal'); loadQuals(); showToast('Saved!','success'); logActivity('Qualification '+(id?'updated':'added')+': '+name);
  } catch(e) { hideLoading(); showToast('Save failed: '+e.message,'error'); }
}
async function deleteQual(id) { if (await showConfirm('Delete Qualification','This cannot be undone.','Delete')) { await sbDelete(TABLES.QUALIFICATIONS,id); loadQuals(); showToast('Deleted','success'); } }

// ─── EXPERIENCE ───────────────────────────────────────────────────────────────
async function loadExperience() {
  document.getElementById('expTable').innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="loading-spinner" style="margin:auto"></div></div></td></tr>';
  const cat = document.getElementById('expCategoryFilter')?.value || '';
  expList = await sbList(TABLES.EXPERIENCE, { orderBy:'created_at', ascending:false, ...(cat?{eq:{category:cat}}:{}) });
  renderExp(expList);
}
function renderExp(list) {
  const tbody = document.getElementById('expTable');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">💼</div><h3>No experience yet</h3></div></td></tr>'; return; }
  tbody.innerHTML = list.map(e => `<tr><td><small style="color:var(--text-muted)">${escHtml(e.period||'')}</small></td><td><strong>${escHtml(e.role||'')}</strong></td><td>${escHtml(e.org||'')}</td><td><span class="badge badge-gold">${escHtml(e.category||'')}</span></td><td>${e.current?'<span class="badge badge-success">Current</span>':'<span class="badge badge-gray">Past</span>'}</td><td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="editExp('${e.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deleteExp('${e.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openExpModal() { clearExpForm(); document.getElementById('expModalTitle').textContent='Add Experience'; openModal('expModal'); }
function editExp(id) { const e=expList.find(x=>x.id===id); if(!e) return; document.getElementById('expModalTitle').textContent='Edit Experience'; document.getElementById('expId').value=id; setVal('expPeriod',e.period); setVal('expRole',e.role); setVal('expOrg',e.org); setVal('expDesc',e.description); document.getElementById('expCategory').value=e.category||'teaching'; document.getElementById('expCurrent').checked=!!e.current; openModal('expModal'); }
function clearExpForm() { ['expId','expPeriod','expRole','expOrg','expDesc'].forEach(id=>setVal(id,'')); document.getElementById('expCurrent').checked=false; }
async function saveExp() {
  const role = getVal('expRole'); if (!role) { showToast('Role is required','warning'); return; }
  showLoading('Saving…');
  try {
    const data = { period:getVal('expPeriod'), role, org:getVal('expOrg'), description:getVal('expDesc'), category:document.getElementById('expCategory').value, current:document.getElementById('expCurrent').checked };
    const id = getVal('expId');
    if (id) await sbUpdate(TABLES.EXPERIENCE,id,data); else await sbInsert(TABLES.EXPERIENCE,data);
    hideLoading(); closeModal('expModal'); loadExperience(); showToast('Saved!','success');
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
}
async function deleteExp(id) { if (await showConfirm('Delete Experience','This cannot be undone.','Delete')) { await sbDelete(TABLES.EXPERIENCE,id); loadExperience(); showToast('Deleted','success'); } }

// ─── SERVICES ─────────────────────────────────────────────────────────────────
async function loadServices() {
  servicesList = await sbList(TABLES.SERVICES, { orderBy:'order_index', ascending:true });
  renderServices(); initServicesSortable();
}
function renderServices() {
  const tbody = document.getElementById('servicesTable');
  if (!servicesList.length) { tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🎁</div><h3>No services yet</h3></div></td></tr>'; return; }
  tbody.innerHTML = servicesList.map(s => `<tr data-id="${s.id}"><td><div class="drag-handle"><i class="fas fa-grip-vertical"></i></div></td><td><i class="${escHtml(s.icon||'fas fa-star')}" style="color:var(--gold);font-size:1.2rem"></i></td><td><strong>${escHtml(s.name||'')}</strong></td><td><span class="badge badge-gray">${escHtml(s.tag||'')}</span></td><td><div class="toggle-wrap"><label class="toggle"><input type="checkbox" onchange="toggleServiceVisible('${s.id}',this.checked)" ${s.visible!==false?'checked':''}><span class="toggle-slider"></span></label></div></td><td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="editService('${s.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deleteService('${s.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function initServicesSortable() {
  const el = document.getElementById('servicesTable'); if (!el||!window.Sortable) return;
  Sortable.create(el, { handle:'.drag-handle', animation:150, ghostClass:'sortable-ghost', onEnd: async () => {
    const rows = el.querySelectorAll('tr[data-id]');
    await sbReorder(TABLES.SERVICES, Array.from(rows).map((r,i)=>({id:r.dataset.id, order_index:i})));
    showToast('Order saved', 'success');
  }});
}
function openServiceModal() { clearServiceForm(); document.getElementById('serviceModalTitle').textContent='Add Service'; openModal('serviceModal'); }
function editService(id) { const s=servicesList.find(x=>x.id===id); if(!s) return; document.getElementById('serviceModalTitle').textContent='Edit Service'; document.getElementById('serviceId').value=id; setVal('serviceName',s.name); setVal('serviceIcon',s.icon); setVal('serviceDesc',s.description); setVal('serviceTag',s.tag); setVal('serviceOrder',s.order_index||0); document.getElementById('serviceVisible').checked=s.visible!==false; openModal('serviceModal'); }
function clearServiceForm() { ['serviceId','serviceName','serviceIcon','serviceDesc','serviceTag','serviceOrder'].forEach(id=>setVal(id,'')); document.getElementById('serviceVisible').checked=true; }
async function saveService() {
  const name = getVal('serviceName'); if (!name) { showToast('Name required','warning'); return; }
  showLoading('Saving…');
  try {
    const data = { name, icon:getVal('serviceIcon'), description:getVal('serviceDesc'), tag:getVal('serviceTag'), order_index:parseInt(getVal('serviceOrder')||0), visible:document.getElementById('serviceVisible').checked };
    const id = getVal('serviceId');
    if (id) await sbUpdate(TABLES.SERVICES,id,data); else await sbInsert(TABLES.SERVICES,data);
    hideLoading(); closeModal('serviceModal'); loadServices(); showToast('Saved!','success');
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
}
async function deleteService(id) { if (await showConfirm('Delete Service','This cannot be undone.','Delete')) { await sbDelete(TABLES.SERVICES,id); loadServices(); showToast('Deleted','success'); } }
async function toggleServiceVisible(id,val) { await sbUpdate(TABLES.SERVICES,id,{visible:val}); }

// ─── PUBLICATIONS ─────────────────────────────────────────────────────────────
async function loadPublications() {
  const type = document.getElementById('pubTypeFilter')?.value||'';
  pubsList = await sbList(TABLES.PUBLICATIONS, { orderBy:'year', ascending:false, ...(type?{eq:{type}}:{}) });
  renderPubs(pubsList);
}
function filterPubs(q) { renderPubs(pubsList.filter(p => `${p.title}${p.journal}${p.authors||''}`.toLowerCase().includes(q.toLowerCase()))); }
function renderPubs(list) {
  const tbody = document.getElementById('pubsTable');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📚</div><h3>No publications yet</h3></div></td></tr>'; return; }
  tbody.innerHTML = list.map(p => `<tr><td><span class="badge badge-gold">${escHtml(String(p.year||''))}</span></td><td style="max-width:280px"><strong style="font-size:.85rem;line-height:1.4">${escHtml(p.title||'')}</strong><br><small style="color:var(--text-muted)">${escHtml(p.authors||'')}</small></td><td><span class="badge badge-info">${escHtml(p.type||'')}</span></td><td style="font-size:.82rem">${escHtml(p.journal||'')}</td><td>${p.pdf_url?`<a href="${p.pdf_url}" target="_blank" class="btn btn-sm btn-ghost"><i class="fas fa-file-pdf" style="color:var(--error)"></i></a>`:'—'}</td><td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="editPub('${p.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deletePub('${p.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openPubModal() { clearPubForm(); document.getElementById('pubModalTitle').textContent='Add Publication'; openModal('pubModal'); }
function editPub(id) { const p=pubsList.find(x=>x.id===id); if(!p) return; document.getElementById('pubModalTitle').textContent='Edit Publication'; document.getElementById('pubId').value=id; setVal('pubYear',p.year); setVal('pubTitle',p.title); setVal('pubAuthors',p.authors); setVal('pubJournal',p.journal); setVal('pubVolume',p.volume); setVal('pubDoi',p.doi); setVal('pubImpact',p.impact); setVal('pubAbstract',p.abstract); setVal('pubPdfUrl',p.pdf_url); document.getElementById('pubType').value=p.type||'journal'; if(p.pdf_url) document.getElementById('pubPdfInfo').innerHTML=`<a href="${p.pdf_url}" target="_blank" class="badge badge-gold" style="margin-top:.5rem"><i class="fas fa-file-pdf"></i> PDF uploaded</a>`; openModal('pubModal'); }
function clearPubForm() { ['pubId','pubYear','pubTitle','pubAuthors','pubJournal','pubVolume','pubDoi','pubImpact','pubAbstract','pubPdfUrl'].forEach(id=>setVal(id,'')); document.getElementById('pubPdfInfo').innerHTML=''; }
async function savePub() {
  const title = getVal('pubTitle'); if (!title) { showToast('Title required','warning'); return; }
  showLoading('Saving publication…');
  try {
    let pdfUrl = getVal('pubPdfUrl');
    const pdfFile = document.getElementById('pubPdfFile')?.files[0];
    if (pdfFile) { showLoading('Uploading PDF…'); pdfUrl = await uploadFile(pdfFile, `publications/${slugify(title)}_${Date.now()}.pdf`); }
    const data = { year:parseInt(getVal('pubYear')||new Date().getFullYear()), title, authors:getVal('pubAuthors'), journal:getVal('pubJournal'), volume:getVal('pubVolume'), doi:getVal('pubDoi'), impact:getVal('pubImpact'), abstract:getVal('pubAbstract'), pdf_url:pdfUrl, type:document.getElementById('pubType').value };
    const id = getVal('pubId');
    if (id) await sbUpdate(TABLES.PUBLICATIONS,id,data); else await sbInsert(TABLES.PUBLICATIONS,data);
    hideLoading(); closeModal('pubModal'); loadPublications(); showToast('Saved!','success'); logActivity('Publication '+(id?'updated':'added')+': '+title.slice(0,40));
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
}
async function deletePub(id) { if (await showConfirm('Delete Publication','This cannot be undone.','Delete')) { await sbDelete(TABLES.PUBLICATIONS,id); loadPublications(); showToast('Deleted','success'); } }

// ─── METRICS ─────────────────────────────────────────────────────────────────
async function loadMetrics() {
  const d = await sbGet(TABLES.METRICS) || {};
  setVal('mPubs',d.pubs); setVal('mCitations',d.citations); setVal('mHindex',d.hindex); setVal('mI10',d.i10);
  setVal('mStudents',d.students); setVal('mYears',d.years); setVal('mConferences',d.conferences);
  setVal('mGrants',d.grants); setVal('mAwards',d.awards); setVal('mCountries',d.countries); setVal('mSuffix',d.suffix);
  setVal('mCustom', JSON.stringify(d.custom||[], null, 2));
}
document.getElementById('saveMetrics')?.addEventListener('click', async () => {
  showLoading('Saving metrics…');
  try {
    let custom = []; try { custom = JSON.parse(getVal('mCustom')||'[]'); } catch(e){}
    await sbUpsert(TABLES.METRICS, { pubs:getVal('mPubs'), citations:getVal('mCitations'), hindex:getVal('mHindex'), i10:getVal('mI10'), students:getVal('mStudents'), years:getVal('mYears'), conferences:getVal('mConferences'), grants:getVal('mGrants'), awards:getVal('mAwards'), countries:getVal('mCountries'), suffix:getVal('mSuffix'), custom });
    hideLoading(); showToast('Metrics saved!','success');
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
});

// ─── GALLERY ──────────────────────────────────────────────────────────────────
async function loadGallery() {
  const cat = document.getElementById('galleryCatFilter')?.value||'';
  galleryList = await sbList(TABLES.GALLERY, { orderBy:'order_index', ascending:true, ...(cat?{eq:{category:cat}}:{}) });
  document.getElementById('galleryCount').textContent = galleryList.length + ' items';
  renderGallery(); initGallerySortable();
}
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!galleryList.length) { grid.innerHTML='<div class="empty-state"><div class="empty-icon">🖼</div><h3>No photos yet</h3></div>'; return; }
  grid.innerHTML = galleryList.map(g => `<div class="gallery-card" data-id="${g.id}"><img class="gallery-img" src="${escHtml(g.url||'')}" alt="${escHtml(g.caption||'')}" loading="lazy"/><div class="gallery-footer"><span class="gallery-caption">${escHtml(g.caption||'')}</span><button class="btn btn-icon btn-sm" onclick="deleteGalleryItem('${g.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></div></div>`).join('');
}
function initGallerySortable() {
  const el = document.querySelector('.sortable-gallery'); if (!el||!window.Sortable) return;
  Sortable.create(el, { animation:150, ghostClass:'sortable-ghost', onEnd: async () => {
    const items = el.querySelectorAll('[data-id]');
    await sbReorder(TABLES.GALLERY, Array.from(items).map((it,i)=>({id:it.dataset.id, order_index:i})));
    showToast('Gallery order saved','success');
  }});
}
function openGalleryModal() { openModal('galleryModal'); }
async function uploadGalleryImages() {
  const files = document.getElementById('galleryFiles')?.files;
  if (!files?.length) { showToast('Select at least one image','warning'); return; }
  const cat = document.getElementById('galleryCat')?.value||'professional';
  const caption = document.getElementById('galleryCaption')?.value||'';
  const prog = document.getElementById('galleryUploadProgress');
  const total = files.length; let done = 0;
  prog.innerHTML = `<div class="progress-bar"><div class="progress-fill" id="galleryProg" style="width:0%"></div></div><p style="font-size:.8rem;margin-top:.5rem">Uploading 0 of ${total}…</p>`;
  showLoading('Uploading images…');
  try {
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, `gallery/${Date.now()}_${file.name}`);
      await sbInsert(TABLES.GALLERY, { url, caption, category:cat, order_index: galleryList.length + done });
      done++;
      const pct = Math.round((done/total)*100);
      const el = document.getElementById('galleryProg'); if (el) el.style.width = pct+'%';
      prog.querySelector('p').textContent = `Uploading ${done} of ${total}…`;
    }
    hideLoading(); closeModal('galleryModal'); loadGallery(); showToast(`${done} photo(s) uploaded!`, 'success'); logActivity(`${done} gallery image(s) uploaded`);
  } catch(e) { hideLoading(); showToast('Upload failed: '+e.message,'error'); }
}
async function deleteGalleryItem(id) {
  if (!await showConfirm('Delete Photo','This cannot be undone.','Delete')) return;
  const item = galleryList.find(x=>x.id===id);
  if (item?.url) await deleteFile(item.url);
  await sbDelete(TABLES.GALLERY,id); loadGallery(); showToast('Photo deleted','success');
}

// ─── MEDIA ────────────────────────────────────────────────────────────────────
async function loadMedia() { mediaList = await sbList(TABLES.MEDIA, { orderBy:'created_at', ascending:false }); renderMedia(); }
function getYouTubeId(url) { const m = (url||'').match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m?m[1]:null; }
function previewYouTube(url) { const id=getYouTubeId(url); const el=document.getElementById('mediaThumbPreview'); if(!el) return; el.innerHTML = id?`<img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" style="border-radius:var(--r-sm);width:100%;max-width:300px" alt="Thumbnail"/>`:''; }
function renderMedia() {
  const tbody = document.getElementById('mediaTable');
  if (!mediaList.length) { tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📺</div><h3>No videos yet</h3></div></td></tr>'; return; }
  tbody.innerHTML = mediaList.map(m => { const ytId = m.url?getYouTubeId(m.url):null; const thumb = ytId?`<img src="https://img.youtube.com/vi/${ytId}/default.jpg" style="width:70px;border-radius:var(--r-sm)" alt=""/>`:`<div style="width:70px;height:40px;background:var(--navy);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;color:var(--gold)"><i class="fab fa-youtube"></i></div>`; return `<tr><td>${thumb}</td><td><strong>${escHtml(m.title||'')}</strong></td><td><span class="badge badge-gray">${escHtml(m.type||'')}</span></td><td>${escHtml(m.platform||'')}</td><td><div class="toggle-wrap"><label class="toggle"><input type="checkbox" onchange="toggleMediaVisible('${m.id}',this.checked)" ${m.visible!==false?'checked':''}><span class="toggle-slider"></span></label></div></td><td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="editMedia('${m.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deleteMedia('${m.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td></tr>`; }).join('');
}
function openMediaModal() { clearMediaForm(); document.getElementById('mediaModalTitle').textContent='Add Video'; openModal('mediaModal'); }
function editMedia(id) { const m=mediaList.find(x=>x.id===id); if(!m) return; document.getElementById('mediaModalTitle').textContent='Edit Video'; document.getElementById('mediaId').value=id; setVal('mediaTitle',m.title); setVal('mediaUrl',m.url); setVal('mediaPlatform',m.platform); setVal('mediaDuration',m.duration); setVal('mediaDesc',m.description); document.getElementById('mediaType').value=m.type||'youtube'; document.getElementById('mediaVisible').checked=m.visible!==false; if(m.url) previewYouTube(m.url); openModal('mediaModal'); }
function clearMediaForm() { ['mediaId','mediaTitle','mediaUrl','mediaPlatform','mediaDuration','mediaDesc'].forEach(id=>setVal(id,'')); document.getElementById('mediaThumbPreview').innerHTML=''; document.getElementById('mediaVisible').checked=true; }
async function saveMedia() {
  const title=getVal('mediaTitle'); if (!title) { showToast('Title required','warning'); return; }
  showLoading('Saving…');
  try {
    const data = { title, url:getVal('mediaUrl'), type:document.getElementById('mediaType').value, platform:getVal('mediaPlatform'), duration:getVal('mediaDuration'), description:getVal('mediaDesc'), visible:document.getElementById('mediaVisible').checked };
    const id = getVal('mediaId');
    if (id) await sbUpdate(TABLES.MEDIA,id,data); else await sbInsert(TABLES.MEDIA,data);
    hideLoading(); closeModal('mediaModal'); loadMedia(); showToast('Saved!','success');
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
}
async function deleteMedia(id) { if (await showConfirm('Delete Video','This cannot be undone.','Delete')) { await sbDelete(TABLES.MEDIA,id); loadMedia(); showToast('Deleted','success'); } }
async function toggleMediaVisible(id,val) { await sbUpdate(TABLES.MEDIA,id,{visible:val}); }

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
async function loadTestimonials() { testiList = await sbList(TABLES.TESTIMONIALS, { orderBy:'created_at', ascending:false }); renderTestis(); }
function renderTestis() {
  const tbody = document.getElementById('testiTable');
  if (!testiList.length) { tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">⭐</div><h3>No testimonials yet</h3></div></td></tr>'; return; }
  tbody.innerHTML = testiList.map(t => `<tr><td>${t.photo_url?`<img src="${escHtml(t.photo_url)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" alt=""/>`:`<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy-mid));display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--gold)">${(t.name||'?')[0]}</div>`}</td><td><strong>${escHtml(t.name||'')}</strong></td><td>${escHtml(t.role||'')} · ${escHtml(t.country||'')}</td><td>${'★'.repeat(parseInt(t.rating)||5)}</td><td><div class="toggle-wrap"><label class="toggle"><input type="checkbox" onchange="toggleTestiVisible('${t.id}',this.checked)" ${t.visible!==false?'checked':''}><span class="toggle-slider"></span></label></div></td><td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="editTesti('${t.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deleteTesti('${t.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openTestimonialModal() { clearTestiForm(); document.getElementById('testiModalTitle').textContent='Add Testimonial'; openModal('testiModal'); }
function editTesti(id) { const t=testiList.find(x=>x.id===id); if(!t) return; document.getElementById('testiModalTitle').textContent='Edit Testimonial'; document.getElementById('testiId').value=id; setVal('testiName',t.name); setVal('testiRole',t.role); setVal('testiCountry',t.country); setVal('testiBody',t.body); document.getElementById('testiRating').value=t.rating||'5'; document.getElementById('testiVisible').checked=t.visible!==false; if(t.photo_url) document.getElementById('testiPhotoPreview').innerHTML=`<div class="img-preview-wrap" style="margin-top:.5rem"><img class="img-preview" src="${t.photo_url}" alt=""/></div>`; openModal('testiModal'); }
function clearTestiForm() { ['testiId','testiName','testiRole','testiCountry','testiBody'].forEach(id=>setVal(id,'')); document.getElementById('testiPhotoPreview').innerHTML=''; document.getElementById('testiVisible').checked=true; }
async function saveTesti() {
  const name=getVal('testiName'); if (!name) { showToast('Name required','warning'); return; }
  const body=getVal('testiBody'); if (!body) { showToast('Review text required','warning'); return; }
  showLoading('Saving testimonial…');
  try {
    let photoUrl = getExistingUrl('testiPhotoPreview','img');
    const photoFile = document.getElementById('testiPhotoFile')?.files[0];
    if (photoFile) photoUrl = await uploadFile(photoFile, `testimonials/${slugify(name)}_${Date.now()}`);
    const data = { name, role:getVal('testiRole'), country:getVal('testiCountry'), body, rating:parseInt(document.getElementById('testiRating').value), photo_url:photoUrl, visible:document.getElementById('testiVisible').checked };
    const id = getVal('testiId');
    if (id) await sbUpdate(TABLES.TESTIMONIALS,id,data); else await sbInsert(TABLES.TESTIMONIALS,data);
    hideLoading(); closeModal('testiModal'); loadTestimonials(); showToast('Saved!','success');
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
}
async function deleteTesti(id) { if (await showConfirm('Delete Testimonial','This cannot be undone.','Delete')) { await sbDelete(TABLES.TESTIMONIALS,id); loadTestimonials(); showToast('Deleted','success'); } }
async function toggleTestiVisible(id,val) { await sbUpdate(TABLES.TESTIMONIALS,id,{visible:val}); }

/* ================================================================
   NEW: TEACHERS MANAGER
================================================================ */
async function loadTeachers() {
  const status = document.getElementById('teacherStatusFilter')?.value || '';
  teachersList = await sbList(TABLES.TEACHERS, { orderBy:'created_at', ascending:false, ...(status?{eq:{status}}:{}) });
  renderTeachers();
}
function renderTeachers() {
  const tbody = document.getElementById('teachersTable');
  if (!teachersList.length) { tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">🧑‍🏫</div><h3>No teachers yet</h3><p>Approve applicants from Applications, or add one manually.</p></div></td></tr>'; return; }
  tbody.innerHTML = teachersList.map(t => {
    const statusBadge = { pending:'badge-warning', approved:'badge-success', rejected:'badge-error' }[t.status] || 'badge-gray';
    return `<tr>
      <td>${t.photo_url?`<img src="${escHtml(t.photo_url)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" alt=""/>`:`<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy-mid));display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--gold)">${(t.name||'?')[0]}</div>`}</td>
      <td><strong>${escHtml(t.name||'')}</strong><br><small style="color:var(--text-muted)">${escHtml(t.title||'')}</small></td>
      <td>${(t.subjects||[]).map(s=>`<span class="badge badge-gray" style="margin:1px">${escHtml(s)}</span>`).join(' ')}</td>
      <td><span class="badge ${statusBadge}">${escHtml(t.status||'pending')}</span></td>
      <td><div class="toggle-wrap"><label class="toggle"><input type="checkbox" onchange="toggleTeacherBookable('${t.id}',this.checked)" ${t.bookable?'checked':''}><span class="toggle-slider"></span></label></div></td>
      <td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="editTeacher('${t.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deleteTeacher('${t.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  }).join('');
}
function openTeacherModal() { clearTeacherForm(); document.getElementById('teacherModalTitle').textContent='Add Teacher'; openModal('teacherModal'); }
function editTeacher(id) {
  const t = teachersList.find(x=>x.id===id); if (!t) return;
  document.getElementById('teacherModalTitle').textContent='Edit Teacher'; document.getElementById('teacherId').value=id;
  setVal('teacherName',t.name); setVal('teacherTitle',t.title); setVal('teacherBio',t.bio);
  setVal('teacherSubjects', (t.subjects||[]).join(', '));
  setVal('teacherEmail',t.email); setVal('teacherPhone',t.phone);
  document.getElementById('teacherStatus').value = t.status||'pending';
  document.getElementById('teacherBookable').checked = !!t.bookable;
  if (t.photo_url) document.getElementById('teacherPhotoPreview').innerHTML = `<div class="img-preview-wrap" style="margin-top:.5rem"><img class="img-preview" src="${t.photo_url}" alt=""/></div>`;
  openModal('teacherModal');
}
function clearTeacherForm() { ['teacherId','teacherName','teacherTitle','teacherBio','teacherSubjects','teacherEmail','teacherPhone'].forEach(id=>setVal(id,'')); document.getElementById('teacherPhotoPreview').innerHTML=''; document.getElementById('teacherStatus').value='pending'; document.getElementById('teacherBookable').checked=false; }
async function saveTeacher() {
  const name = getVal('teacherName'); if (!name) { showToast('Name required','warning'); return; }
  showLoading('Saving teacher…');
  try {
    let photoUrl = getExistingUrl('teacherPhotoPreview','img');
    const photoFile = document.getElementById('teacherPhotoFile')?.files[0];
    if (photoFile) photoUrl = await uploadFile(photoFile, `teachers/${slugify(name)}_${Date.now()}`);
    const data = {
      name, title:getVal('teacherTitle'), bio:getVal('teacherBio'),
      subjects: getVal('teacherSubjects').split(',').map(s=>s.trim()).filter(Boolean),
      email:getVal('teacherEmail'), phone:getVal('teacherPhone'), photo_url:photoUrl,
      status: document.getElementById('teacherStatus').value,
      bookable: document.getElementById('teacherBookable').checked,
    };
    const id = getVal('teacherId');
    if (id) await sbUpdate(TABLES.TEACHERS,id,data); else await sbInsert(TABLES.TEACHERS,data);
    hideLoading(); closeModal('teacherModal'); loadTeachers(); showToast('Teacher saved!','success'); logActivity('Teacher '+(id?'updated':'added')+': '+name);
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
}
async function deleteTeacher(id) { if (await showConfirm('Delete Teacher','This removes them from the public directory.','Delete')) { await sbDelete(TABLES.TEACHERS,id); loadTeachers(); showToast('Deleted','success'); } }
async function toggleTeacherBookable(id,val) { await sbUpdate(TABLES.TEACHERS,id,{bookable:val}); showToast(val?'Teacher is now bookable':'Teacher hidden from booking','success'); }

/* ================================================================
   NEW: CAREERS / JOB OPENINGS MANAGER
================================================================ */
async function loadJobs() {
  jobsList = await sbList(TABLES.JOB_OPENINGS, { orderBy:'created_at', ascending:false });
  // Also populate application filter dropdown
  const filterSel = document.getElementById('appJobFilter');
  if (filterSel) {
    filterSel.innerHTML = '<option value="">All Roles</option>' + jobsList.map(j => `<option value="${j.id}">${escHtml(j.title)}</option>`).join('');
  }
  renderJobs();
}
async function renderJobs() {
  const tbody = document.getElementById('jobsTable');
  if (!jobsList.length) { tbody.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">💼</div><h3>No roles posted yet</h3></div></td></tr>'; return; }

  // Get application counts per job
  const counts = {};
  for (const j of jobsList) {
    const { count } = await sb.from(TABLES.JOB_APPLICATIONS).select('*',{count:'exact',head:true}).eq('job_id', j.id);
    counts[j.id] = count || 0;
  }

  tbody.innerHTML = jobsList.map(j => `<tr>
    <td><strong>${escHtml(j.title||'')}</strong><br><small style="color:var(--text-muted)">${escHtml(j.department||'')}</small></td>
    <td><span class="badge badge-gold">${escHtml(j.job_type||'')}</span></td>
    <td><span class="badge badge-gray">${escHtml(j.employment_type||'')}</span></td>
    <td><a href="#" onclick="showPage('applications');document.getElementById('appJobFilter').value='${j.id}';loadApplications();return false" class="badge badge-info" style="cursor:pointer">${counts[j.id]} applicant(s)</a></td>
    <td>${j.status==='open'?'<span class="badge badge-success">Open</span>':'<span class="badge badge-gray">Closed</span>'}</td>
    <td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="editJob('${j.id}')"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deleteJob('${j.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td>
  </tr>`).join('');
}
function openJobModal() { clearJobForm(); document.getElementById('jobModalTitle').textContent='Post a Role'; openModal('jobModal'); }
function editJob(id) {
  const j = jobsList.find(x=>x.id===id); if (!j) return;
  document.getElementById('jobModalTitle').textContent='Edit Role'; document.getElementById('jobId').value=id;
  setVal('jobTitle',j.title); setVal('jobDepartment',j.department); setVal('jobLocation',j.location);
  setVal('jobDescription',j.description); setVal('jobRequirements',j.requirements);
  document.getElementById('jobType').value = j.job_type||'teaching';
  document.getElementById('jobEmploymentType').value = j.employment_type||'part-time';
  document.getElementById('jobStatus').value = j.status||'open';
  openModal('jobModal');
}
function clearJobForm() { ['jobId','jobTitle','jobDepartment','jobLocation','jobDescription','jobRequirements'].forEach(id=>setVal(id,'')); document.getElementById('jobType').value='teaching'; document.getElementById('jobEmploymentType').value='part-time'; document.getElementById('jobStatus').value='open'; }
async function saveJob() {
  const title = getVal('jobTitle'); if (!title) { showToast('Job title required','warning'); return; }
  showLoading('Saving role…');
  try {
    const data = { title, department:getVal('jobDepartment'), job_type:document.getElementById('jobType').value, location:getVal('jobLocation')||'Remote', employment_type:document.getElementById('jobEmploymentType').value, description:getVal('jobDescription'), requirements:getVal('jobRequirements'), status:document.getElementById('jobStatus').value };
    const id = getVal('jobId');
    if (id) await sbUpdate(TABLES.JOB_OPENINGS,id,data); else await sbInsert(TABLES.JOB_OPENINGS,data);
    hideLoading(); closeModal('jobModal'); loadJobs(); showToast('Role saved!','success'); logActivity('Job opening '+(id?'updated':'posted')+': '+title);
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
}
async function deleteJob(id) { if (await showConfirm('Delete Role','Applications linked to this role will remain but lose their job reference.','Delete')) { await sbDelete(TABLES.JOB_OPENINGS,id); loadJobs(); showToast('Deleted','success'); } }

/* ================================================================
   NEW: APPLICATIONS (Kanban board)
================================================================ */
async function loadApplications() {
  const type = document.getElementById('appTypeFilter')?.value || '';
  const jobId = document.getElementById('appJobFilter')?.value || '';
  const opts = { orderBy:'created_at', ascending:false };
  const eq = {};
  if (type) eq.applicant_type = type;
  if (jobId) eq.job_id = jobId;
  if (Object.keys(eq).length) opts.eq = eq;

  appsList = await sbList(TABLES.JOB_APPLICATIONS, opts);
  renderKanban();
  updateBadges();
}
function renderKanban() {
  const cols = { new:[], reviewed:[], shortlisted:[], hired:[] };
  appsList.forEach(a => {
    const status = a.status === 'rejected' ? null : (cols[a.status] ? a.status : 'new');
    if (status) cols[status].push(a);
  });
  Object.entries(cols).forEach(([status, items]) => {
    const el = document.getElementById(`col-${status}`);
    const cntEl = document.getElementById(`cnt${status.charAt(0).toUpperCase()+status.slice(1)}`);
    if (cntEl) cntEl.textContent = items.length;
    if (!el) return;
    el.innerHTML = items.length ? items.map(a => `
      <div class="kanban-card" onclick="openAppDetail('${a.id}')">
        <div class="kanban-card-name">${escHtml(a.applicant_name)} <span class="badge ${a.applicant_type==='teacher'?'badge-gold':'badge-gray'}" style="font-size:.6rem">${escHtml(a.applicant_type)}</span></div>
        <div class="kanban-card-meta">${escHtml(a.email)}</div>
        <div class="kanban-card-meta">${formatDate(a.created_at)}</div>
      </div>`).join('') : '<p style="font-size:.78rem;color:var(--text-muted);text-align:center;padding:1rem">Empty</p>';
  });
}
function openAppDetail(id) {
  const a = appsList.find(x=>x.id===id); if (!a) return;
  const job = jobsList.find(j=>j.id===a.job_id);
  document.getElementById('appDetailBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:1rem">
      <div><strong style="font-size:1.05rem">${escHtml(a.applicant_name)}</strong> <span class="badge ${a.applicant_type==='teacher'?'badge-gold':'badge-gray'}">${escHtml(a.applicant_type)}</span></div>
      <div style="font-size:.85rem;color:var(--text-muted)"><i class="fas fa-envelope"></i> ${escHtml(a.email)} &nbsp; ${a.phone?`<i class="fas fa-phone"></i> ${escHtml(a.phone)}`:''}</div>
      ${job ? `<div style="font-size:.85rem"><i class="fas fa-briefcase"></i> Applied for: <strong>${escHtml(job.title)}</strong></div>` : ''}
      ${(a.subjects||[]).length ? `<div>${(a.subjects||[]).map(s=>`<span class="badge badge-gray" style="margin:2px">${escHtml(s)}</span>`).join('')}</div>` : ''}
      <div class="form-group"><label>Cover Letter</label><div style="font-size:.88rem;color:var(--text);background:var(--bg-alt);padding:1rem;border-radius:var(--r-sm);white-space:pre-wrap">${escHtml(a.cover_letter||'—')}</div></div>
      ${a.resume_url ? `<a href="${escHtml(a.resume_url)}" target="_blank" class="btn btn-ghost btn-sm"><i class="fas fa-file-pdf"></i> View Resume/CV</a>` : ''}
      <div class="form-group"><label>Internal Notes</label><textarea class="form-control" id="appNotesField" rows="3">${escHtml(a.notes||'')}</textarea></div>
    </div>`;
  document.getElementById('appDetailFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="setAppStatus('${a.id}','new')">Mark New</button>
    <button class="btn btn-ghost" onclick="setAppStatus('${a.id}','reviewed')">Reviewed</button>
    <button class="btn btn-ghost" onclick="setAppStatus('${a.id}','shortlisted')">Shortlist</button>
    <button class="btn btn-danger" onclick="setAppStatus('${a.id}','rejected')">Reject</button>
    <button class="btn btn-primary" onclick="hireApplicant('${a.id}')"><i class="fas fa-check"></i> Hire${a.applicant_type==='teacher'?' → Create Teacher Profile':''}</button>`;
  openModal('appDetailModal');
}
async function setAppStatus(id, status) {
  const notes = document.getElementById('appNotesField')?.value || '';
  await sbUpdate(TABLES.JOB_APPLICATIONS, id, { status, notes });
  closeModal('appDetailModal'); loadApplications(); showToast('Status updated to '+status,'success');
}
async function hireApplicant(id) {
  const a = appsList.find(x=>x.id===id); if (!a) return;
  showLoading('Processing…');
  try {
    await sbUpdate(TABLES.JOB_APPLICATIONS, id, { status:'hired' });
    if (a.applicant_type === 'teacher') {
      await sbInsert(TABLES.TEACHERS, {
        name: a.applicant_name, title:'Tutor', bio: a.cover_letter || '',
        subjects: a.subjects || [], email: a.email, phone: a.phone||'',
        cv_url: a.resume_url || '', status: 'approved', bookable: false,
      });
      hideLoading(); closeModal('appDetailModal'); loadApplications();
      showToast('Hired! A teacher profile has been created (currently hidden — enable "Bookable" in Teachers Manager when ready).', 'success', 6000);
    } else {
      hideLoading(); closeModal('appDetailModal'); loadApplications();
      showToast('Marked as hired.', 'success');
    }
    logActivity('Applicant hired: '+a.applicant_name);
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
}

/* ================================================================
   NEW: APPOINTMENTS MANAGER
================================================================ */
async function loadAppointmentsList() {
  const status = document.getElementById('apptStatusFilter')?.value || '';
  apptsList = await sbList(TABLES.APPOINTMENTS, { orderBy:'created_at', ascending:false, ...(status?{eq:{status}}:{}) });
  // resolve teacher names
  const teacherIds = [...new Set(apptsList.map(a=>a.teacher_id).filter(Boolean))];
  let teacherMap = {};
  if (teacherIds.length) {
    const { data } = await sb.from(TABLES.TEACHERS).select('id,name').in('id', teacherIds);
    (data||[]).forEach(t => teacherMap[t.id] = t.name);
  }
  renderAppts(teacherMap);
  updateBadges();
}
function renderAppts(teacherMap) {
  const tbody = document.getElementById('apptsTable');
  if (!apptsList.length) { tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📅</div><h3>No appointment requests yet</h3></div></td></tr>'; return; }
  const statusBadge = { pending:'badge-warning', confirmed:'badge-success', completed:'badge-info', cancelled:'badge-error' };
  tbody.innerHTML = apptsList.map(a => `<tr>
    <td><small>${formatDate(a.created_at)}</small></td>
    <td><strong>${escHtml(a.name||'')}</strong></td>
    <td><small>${escHtml(a.email||'')}<br>${escHtml(a.phone||'')}</small></td>
    <td>${a.teacher_id ? escHtml(teacherMap[a.teacher_id]||'—') : '<span class="badge badge-gray">General</span>'}</td>
    <td>${escHtml(a.preferred_date||'—')} ${escHtml(a.preferred_time||'')}</td>
    <td><span class="badge ${statusBadge[a.status]||'badge-gray'}">${escHtml(a.status||'pending')}</span></td>
    <td class="col-actions"><button class="btn btn-sm btn-ghost btn-icon" onclick="openApptDetail('${a.id}')"><i class="fas fa-eye"></i></button><button class="btn btn-sm btn-ghost btn-icon" onclick="deleteAppt('${a.id}')" style="color:var(--error)"><i class="fas fa-trash"></i></button></td>
  </tr>`).join('');
}
function openApptDetail(id) {
  const a = apptsList.find(x=>x.id===id); if (!a) return;
  document.getElementById('apptDetailBody').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.75rem;font-size:.9rem">
      <div><strong>${escHtml(a.name)}</strong></div>
      <div><i class="fas fa-envelope"></i> ${escHtml(a.email)}</div>
      ${a.phone?`<div><i class="fas fa-phone"></i> ${escHtml(a.phone)}</div>`:''}
      <div><i class="fas fa-book"></i> ${escHtml(a.subject||'General consultation')}</div>
      <div><i class="fas fa-calendar"></i> ${escHtml(a.preferred_date||'Not specified')} ${escHtml(a.preferred_time||'')}</div>
      <div class="form-group"><label>Message</label><div style="background:var(--bg-alt);padding:.85rem;border-radius:var(--r-sm);white-space:pre-wrap">${escHtml(a.message||'—')}</div></div>
    </div>`;
  document.getElementById('apptDetailFooter').innerHTML = `
    <button class="btn btn-ghost" onclick="setApptStatus('${a.id}','pending')">Pending</button>
    <button class="btn btn-secondary" onclick="setApptStatus('${a.id}','confirmed')">Confirm</button>
    <button class="btn btn-primary" onclick="setApptStatus('${a.id}','completed')">Completed</button>
    <button class="btn btn-danger" onclick="setApptStatus('${a.id}','cancelled')">Cancel</button>`;
  openModal('apptDetailModal');
}
async function setApptStatus(id, status) { await sbUpdate(TABLES.APPOINTMENTS, id, { status }); closeModal('apptDetailModal'); loadAppointmentsList(); showToast('Status updated','success'); }
async function deleteAppt(id) { if (await showConfirm('Delete Appointment','This cannot be undone.','Delete')) { await sbDelete(TABLES.APPOINTMENTS,id); loadAppointmentsList(); showToast('Deleted','success'); } }

// ─── CONTACT ─────────────────────────────────────────────────────────────────
async function loadContact() {
  const d = await sbGet(TABLES.CONTACT) || {};
  const map = { ctEmail:'email', ctEmail2:'email2', ctPhone1:'phone1', ctPhone2:'phone2', ctOffice:'office', ctAcademic:'academic', ctMaps:'maps', ctLinkedIn:'linkedin', ctTwitter:'twitter', ctResearchGate:'researchgate', ctScholar:'scholar', ctYouTube:'youtube', ctInstagram:'instagram', ctFacebook:'facebook', ctOrcid:'orcid' };
  Object.entries(map).forEach(([field,key]) => setVal(field, d[key]||''));
}
document.getElementById('saveContact')?.addEventListener('click', async () => {
  showLoading('Saving…');
  try {
    await sbUpsert(TABLES.CONTACT, { email:getVal('ctEmail'), email2:getVal('ctEmail2'), phone1:getVal('ctPhone1'), phone2:getVal('ctPhone2'), office:getVal('ctOffice'), academic:getVal('ctAcademic'), maps:getVal('ctMaps'), linkedin:getVal('ctLinkedIn'), twitter:getVal('ctTwitter'), researchgate:getVal('ctResearchGate'), scholar:getVal('ctScholar'), youtube:getVal('ctYouTube'), instagram:getVal('ctInstagram'), facebook:getVal('ctFacebook'), orcid:getVal('ctOrcid') });
    hideLoading(); showToast('Contact info saved!','success');
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
});

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const DEFAULT_NAV = [
  {key:'section-hero',label:'Home',visible:true,order:0}, {key:'section-about',label:'About',visible:true,order:1},
  {key:'section-qualifications',label:'Education',visible:true,order:2}, {key:'section-services',label:'Services',visible:true,order:3},
  {key:'section-publications',label:'Research',visible:true,order:4}, {key:'section-teachers',label:'Our Teachers',visible:true,order:5},
  {key:'section-careers',label:'Careers',visible:true,order:6}, {key:'section-testimonials',label:'Testimonials',visible:true,order:7},
  {key:'section-contact',label:'Contact',visible:true,order:8},
];
async function loadNavigation() {
  const d = await sbGet(TABLES.NAVIGATION) || {};
  const items = d.items?.length ? d.items : DEFAULT_NAV;
  renderNavItems(items); initNavSortable();
}
function renderNavItems(items) {
  document.getElementById('navItemsList').innerHTML = items.map(item => `<div class="section-row" data-key="${item.key}"><div class="drag-handle"><i class="fas fa-grip-vertical"></i></div><div class="section-info"><div class="section-name">${escHtml(item.key)}</div></div><input class="form-control" value="${escHtml(item.label||item.key)}" data-label style="max-width:200px"/><div class="toggle-wrap"><label class="toggle"><input type="checkbox" ${item.visible!==false?'checked':''} data-visible><span class="toggle-slider"></span></label><span class="toggle-label" style="font-size:.8rem">Visible</span></div></div>`).join('');
}
function initNavSortable() { const el=document.getElementById('navItemsList'); if(!el||!window.Sortable) return; Sortable.create(el,{handle:'.drag-handle',animation:150}); }
document.getElementById('saveNavigation')?.addEventListener('click', async () => {
  const rows = document.querySelectorAll('#navItemsList .section-row');
  const items = Array.from(rows).map((row,i) => ({ key:row.dataset.key, label:row.querySelector('[data-label]')?.value||row.dataset.key, visible:row.querySelector('[data-visible]')?.checked!==false, order:i }));
  await sbUpsert(TABLES.NAVIGATION, { items }); showToast('Navigation saved!','success'); logActivity('Navigation updated');
});

// ─── FOOTER ───────────────────────────────────────────────────────────────────
async function loadFooter() {
  const d = await sbGet(TABLES.FOOTER) || {};
  setVal('footerTagline',d.tagline); setVal('footerDesc',d.description); setVal('footerCopyright',d.copyright);
  setVal('footerCol2Title',d.col2_title); setVal('footerCol3Title',d.col3_title); setVal('footerCol4Title',d.col4_title);
  if (document.getElementById('footerSocials')) document.getElementById('footerSocials').checked = d.socials !== false;
}
document.getElementById('saveFooter')?.addEventListener('click', async () => {
  await sbUpsert(TABLES.FOOTER, { tagline:getVal('footerTagline'), description:getVal('footerDesc'), copyright:getVal('footerCopyright'), col2_title:getVal('footerCol2Title'), col3_title:getVal('footerCol3Title'), col4_title:getVal('footerCol4Title'), socials:document.getElementById('footerSocials')?.checked!==false });
  showToast('Footer saved!','success');
});

// ─── SEO ─────────────────────────────────────────────────────────────────────
async function loadSeo() {
  const d = await sbGet(TABLES.SEO) || {};
  setVal('seoTitle',d.title); setVal('seoDesc',d.description); setVal('seoKeywords',d.keywords); setVal('seoFavicon',d.favicon);
  setVal('ogTitle',d.og_title); setVal('ogDesc',d.og_desc); setVal('seoCanonical',d.canonical); setVal('seoGA',d.ga); setVal('seoJsonLd',d.json_ld);
  if (d.robots) document.getElementById('seoRobots').value = d.robots;
  if (d.twitter_card) document.getElementById('twitterCard').value = d.twitter_card;
  if (d.og_image) document.getElementById('ogImgPreview').innerHTML=`<img src="${d.og_image}" style="width:100%;max-height:120px;object-fit:cover;border-radius:var(--r-sm);margin-top:.5rem" alt="OG"/>`;
}
document.getElementById('saveSeo')?.addEventListener('click', async () => {
  showLoading('Saving SEO…');
  try {
    let ogImage = getExistingUrl('ogImgPreview','img');
    const ogFile = document.getElementById('ogImgFile')?.files[0];
    if (ogFile) ogImage = await uploadFile(ogFile, `seo/og_${Date.now()}_${ogFile.name}`);
    await sbUpsert(TABLES.SEO, { title:getVal('seoTitle'), description:getVal('seoDesc'), keywords:getVal('seoKeywords'), favicon:getVal('seoFavicon'), og_title:getVal('ogTitle'), og_desc:getVal('ogDesc'), og_image:ogImage, robots:document.getElementById('seoRobots')?.value, twitter_card:document.getElementById('twitterCard')?.value, canonical:getVal('seoCanonical'), ga:getVal('seoGA'), json_ld:getVal('seoJsonLd') });
    hideLoading(); showToast('SEO saved!','success');
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
});

// ─── APPEARANCE ───────────────────────────────────────────────────────────────
async function loadAppearance() {
  const d = await sbGet(TABLES.APPEARANCE) || {};
  setVal('appNavy',d.color_navy||'#1F2A44'); setVal('appGold',d.color_gold||'#C8A24A'); setVal('appCream',d.color_cream||'#F5F1E6'); setVal('appGoldLight',d.color_gold_light||'#DDB96A');
  ['navySwatch','goldSwatch','creamSwatch','goldLightSwatch'].forEach((id,i) => { const vals=[d.color_navy,d.color_gold,d.color_cream,d.color_gold_light]; if(vals[i]){const el=document.getElementById(id); if(el) el.style.background=vals[i];} });
  if (d.font_display) document.getElementById('appFontDisplay').value = d.font_display;
  if (d.font_body) document.getElementById('appFontBody').value = d.font_body;
  setVal('appLogoText',d.logo_text); setVal('appLogoAccent',d.logo_accent);
  if (document.getElementById('appDarkDefault')) document.getElementById('appDarkDefault').checked = !!d.dark_mode_default;
  if (document.getElementById('appAnimations')) document.getElementById('appAnimations').checked = d.animations !== false;
  if (document.getElementById('appFloatCard')) document.getElementById('appFloatCard').checked = d.float_card !== false;
  if (document.getElementById('appShimmer')) document.getElementById('appShimmer').checked = d.shimmer !== false;
  if (document.getElementById('appCounters')) document.getElementById('appCounters').checked = d.counters !== false;
  if (d.logo_url) document.getElementById('logoPreview').innerHTML=`<img src="${d.logo_url}" style="max-height:60px;margin-top:.5rem" alt="Logo"/>`;
  loadSectionVisibility(d.section_visibility||{});
}
function loadSectionVisibility(vis) {
  const sections = ['hero','about','qualifications','experience','services','publications','metrics','gallery','media','testimonials','teachers','careers','appointment','contact'];
  const list = document.getElementById('sectionVisibilityList'); if (!list) return;
  list.innerHTML = sections.map(s => `<div class="section-row"><div class="section-info"><div class="section-name" style="text-transform:capitalize">${s}</div></div><div class="toggle-wrap"><label class="toggle"><input type="checkbox" id="sv_${s}" ${vis[s]!==false?'checked':''}><span class="toggle-slider"></span></label><span class="toggle-label">Visible</span></div></div>`).join('');
}
document.getElementById('saveAppearance')?.addEventListener('click', async () => {
  showLoading('Saving appearance…');
  try {
    let logoUrl = getExistingUrl('logoPreview','img');
    const logoFile = document.getElementById('logoFile')?.files[0];
    if (logoFile) logoUrl = await uploadFile(logoFile, `branding/logo_${Date.now()}_${logoFile.name}`);
    const sections = ['hero','about','qualifications','experience','services','publications','metrics','gallery','media','testimonials','teachers','careers','appointment','contact'];
    const sectionVisibility = {};
    sections.forEach(s => { const el=document.getElementById('sv_'+s); if(el) sectionVisibility[s]=el.checked; });
    await sbUpsert(TABLES.APPEARANCE, { color_navy:getVal('appNavy'), color_gold:getVal('appGold'), color_cream:getVal('appCream'), color_gold_light:getVal('appGoldLight'), font_display:document.getElementById('appFontDisplay')?.value, font_body:document.getElementById('appFontBody')?.value, logo_url:logoUrl, logo_text:getVal('appLogoText'), logo_accent:getVal('appLogoAccent'), dark_mode_default:document.getElementById('appDarkDefault')?.checked||false, animations:document.getElementById('appAnimations')?.checked!==false, float_card:document.getElementById('appFloatCard')?.checked!==false, shimmer:document.getElementById('appShimmer')?.checked!==false, counters:document.getElementById('appCounters')?.checked!==false, section_visibility:sectionVisibility });
    hideLoading(); showToast('Appearance saved!','success');
  } catch(e) { hideLoading(); showToast('Error: '+e.message,'error'); }
});

// ─── HOMEPAGE BUILDER ─────────────────────────────────────────────────────────
const HOME_SECTIONS_DEFAULT = [
  {key:'hero',label:'Hero Section',desc:'Main banner',visible:true,order:0}, {key:'ages',label:'Ages & Levels',desc:'Age groups',visible:true,order:1},
  {key:'about',label:'About',desc:'Bio & photo',visible:true,order:2}, {key:'why',label:'Why Choose Us',desc:'Feature cards',visible:true,order:3},
  {key:'services',label:'Services',desc:'Offered services',visible:true,order:4}, {key:'teachers',label:'Our Teachers',desc:'Bookable teacher directory',visible:true,order:5},
  {key:'publications',label:'Publications',desc:'Research list',visible:true,order:6}, {key:'stats',label:'Statistics',desc:'Animated counters',visible:true,order:7},
  {key:'testimonials',label:'Testimonials',desc:'Reviews',visible:true,order:8}, {key:'media',label:'Videos',desc:'YouTube grid',visible:true,order:9},
  {key:'careers',label:'Careers',desc:'Job openings + apply',visible:true,order:10}, {key:'cta',label:'CTA / Book',desc:'Appointment banner',visible:true,order:11},
];
async function loadHomepageBuilder() {
  const d = await sbGet(TABLES.HOME_SECTIONS) || {};
  const sections = d.sections?.length ? d.sections : HOME_SECTIONS_DEFAULT;
  renderHomepageBuilder(sections); initHomepageSortable();
}
function renderHomepageBuilder(sections) {
  document.getElementById('homepageBuilder').innerHTML = sections.sort((a,b)=>a.order-b.order).map((s,i) => `<div class="section-row" data-key="${s.key}"><div class="drag-handle"><i class="fas fa-grip-vertical"></i></div><div style="width:28px;height:28px;border-radius:var(--r-sm);background:rgba(200,162,74,.12);display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:.75rem;font-weight:700">${i+1}</div><div class="section-info"><div class="section-name">${escHtml(s.label)}</div><div class="section-order">${escHtml(s.desc||'')}</div></div><div class="toggle-wrap"><label class="toggle"><input type="checkbox" data-visible ${s.visible!==false?'checked':''}><span class="toggle-slider"></span></label><span class="toggle-label" style="font-size:.8rem">Visible</span></div></div>`).join('');
}
function initHomepageSortable() { const el=document.getElementById('homepageBuilder'); if(!el||!window.Sortable) return; Sortable.create(el,{handle:'.drag-handle',animation:150}); }
document.getElementById('saveHomepage')?.addEventListener('click', async () => {
  const rows = document.querySelectorAll('#homepageBuilder .section-row');
  const sections = Array.from(rows).map((row,i) => ({ key:row.dataset.key, label:HOME_SECTIONS_DEFAULT.find(s=>s.key===row.dataset.key)?.label||row.dataset.key, desc:HOME_SECTIONS_DEFAULT.find(s=>s.key===row.dataset.key)?.desc||'', visible:row.querySelector('[data-visible]')?.checked!==false, order:i }));
  await sbUpsert(TABLES.HOME_SECTIONS, { sections }); showToast('Homepage layout saved!','success'); logActivity('Homepage order updated');
});

// ─── FILE MANAGER ─────────────────────────────────────────────────────────────
async function loadFiles() { filesList = await sbList(TABLES.FILES, { orderBy:'created_at', ascending:false }); renderFiles(filesList); }
function filterFiles(q) { renderFiles(filesList.filter(f => (f.name||'').toLowerCase().includes(q.toLowerCase()))); }
function renderFiles(list) {
  const grid = document.getElementById('filesGrid');
  if (!list.length) { grid.innerHTML='<div class="empty-state"><div class="empty-icon">📁</div><h3>No files yet</h3></div>'; return; }
  grid.innerHTML = list.map(f => { const isImg=(f.type||'').startsWith('image/'); return `<div class="media-item" data-id="${f.id}">${isImg?`<img class="media-thumb" src="${escHtml(f.url||'')}" alt="${escHtml(f.name||'')}" loading="lazy"/>`:`<div class="media-thumb vid-thumb"><i class="fas fa-file" style="font-size:2rem"></i></div>`}<div class="media-info"><div class="media-name">${escHtml(f.name||'')}</div><div class="media-size">${f.size?(f.size/1024).toFixed(1)+' KB':''}</div></div><div class="media-actions"><a href="${escHtml(f.url||'')}" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-eye"></i></a><button class="btn btn-sm btn-danger" onclick="deleteFileItem('${f.id}','${escHtml(f.url||'')}')"><i class="fas fa-trash"></i></button></div></div>`; }).join('');
}
async function uploadFilesToStorage(files) {
  showLoading('Uploading files…');
  try { for (const file of files) { const url = await uploadFile(file, `files/${Date.now()}_${file.name}`); await sbInsert(TABLES.FILES, { name:file.name, url, type:file.type, size:file.size }); } hideLoading(); loadFiles(); showToast(`${files.length} file(s) uploaded!`,'success'); } catch(e) { hideLoading(); showToast('Upload failed: '+e.message,'error'); }
}
async function deleteFileItem(id, url) { if (!await showConfirm('Delete File','This cannot be undone.','Delete')) return; if (url) await deleteFile(url); await sbDelete(TABLES.FILES, id); loadFiles(); showToast('Deleted','success'); }

// ─── BACKUP & RESTORE ─────────────────────────────────────────────────────────
async function exportBackup() {
  showLoading('Preparing backup…');
  try {
    const backup = { exportedAt: new Date().toISOString(), version:'2.0-supabase', tables:{} };
    for (const table of Object.values(TABLES)) {
      const { data, error } = await sb.from(table).select('*');
      if (!error) backup.tables[table] = data;
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
    hideLoading(); showToast('Backup exported!','success'); document.getElementById('lastExport').textContent = new Date().toLocaleString(); logActivity('Full backup exported');
  } catch(e) { hideLoading(); showToast('Export failed: '+e.message,'error'); }
}
async function prepareRestore(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data.tables) throw new Error('Invalid backup file format');
    const totalRows = Object.values(data.tables).reduce((sum,rows)=>sum+(rows?.length||0),0);
    document.getElementById('restoreInfo').innerHTML = `<div class="card" style="padding:1rem;border-color:var(--warning)"><p style="font-size:.875rem;margin-bottom:.75rem"><strong>From:</strong> ${data.exportedAt||'Unknown'}</p><p style="font-size:.875rem;margin-bottom:.75rem"><strong>Tables:</strong> ${Object.keys(data.tables).length} | <strong>Rows:</strong> ${totalRows}</p><p style="font-size:.82rem;color:var(--error);margin-bottom:1rem">⚠️ This will overwrite matching rows. Cannot be undone.</p><button class="btn btn-danger" onclick="doRestore(${JSON.stringify(JSON.stringify(data)).slice(1,-1)})">Confirm Restore</button></div>`;
  } catch(e) { showToast('Invalid backup file: '+e.message,'error'); }
}
async function doRestore(dataStr) {
  if (!await showConfirm('Restore Backup','⚠️ Matching rows will be overwritten. Cannot be undone.','Restore Now','Cancel')) return;
  showLoading('Restoring backup…');
  try {
    const data = JSON.parse(dataStr);
    for (const [table, rows] of Object.entries(data.tables)) {
      if (!rows?.length) continue;
      await sb.from(table).upsert(rows);
    }
    hideLoading(); showToast('Backup restored!','success',6000); logActivity('Backup restored'); setTimeout(()=>location.reload(), 2000);
  } catch(e) { hideLoading(); showToast('Restore failed: '+e.message,'error'); }
}

// ─── Utility helpers ──────────────────────────────────────────────────────────
function getVal(id) { const el=document.getElementById(id); return el?el.value:''; }
function setVal(id, val) { const el=document.getElementById(id); if (el) el.value = val??''; }
function setText(id, val) { const el=document.getElementById(id); if (el) el.textContent = val??''; }
function getExistingUrl(containerId, tag) { const el=document.querySelector(`#${containerId} ${tag}`); return el?.src || el?.href || ''; }
