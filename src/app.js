// app.js — Orquestador principal — Markdown Custom v1.0
import { FS }      from './fs.js';
import { Catalog } from './catalog.js';

// ---- ESTADO ----
const S = {
  skills:        [],
  active:        null,   // { name, path, handle, dirHandle }
  savedContent:  '',
  draftContent:  '',
  pendingSkill:  null,   // skill al que el usuario quiere navegar sin guardar
};

// ---- DOM ----
const el = id => document.getElementById(id);
const UI = {
  welcome:          el('welcome-screen'),
  shell:            el('app-shell'),
  btnConnect:       el('btn-connect'),
  btnChangeDir:     el('btn-change-dir'),
  btnReload:        el('btn-reload'),
  btnTheme:         el('btn-theme-toggle'),
  themeIconSun:     el('theme-icon-sun'),
  themeIconMoon:    el('theme-icon-moon'),
  topbarPath:       el('topbar-path'),
  skillList:        el('skill-list'),
  skillsCount:      el('skills-count'),
  skillSearch:      el('skill-search'),
  btnNewSkill:      el('btn-new-skill'),
  emptyState:       el('empty-state'),
  editorPanel:      el('editor-panel'),
  editorName:       el('editor-skill-name'),
  editorBadge:      el('editor-skill-badge'),
  textarea:         el('editor-textarea'),
  preview:          el('editor-preview'),
  statusDot:        el('status-indicator'),
  statusText:       el('status-text'),
  statusPath:       el('status-path'),
  statusLineCol:    el('status-line-col'),
  statusFilesize:   el('status-filesize'),
  btnSave:          el('btn-save'),
  btnDelete:        el('btn-delete-skill'),
  // Modals
  modalNew:          el('modal-new-skill'),
  newName:           el('new-skill-name'),
  newPreview:        el('new-skill-preview-path'),
  btnConfirmNew:     el('btn-confirm-new-skill'),
  modalDelete:       el('modal-delete'),
  deleteSkillName:   el('delete-skill-name'),
  btnConfirmDelete:  el('btn-confirm-delete'),
  modalUnsaved:      el('modal-unsaved'),
  unsavedSkillName:  el('unsaved-skill-name'),
  btnUnsavedDiscard: el('btn-unsaved-discard'),
  btnUnsavedSave:    el('btn-unsaved-save'),
  modalCatalog:      el('modal-catalog'),
  compatWarning:     el('compat-warning'),
};

// =============================================
// ARRANCAR
// =============================================
function init() {
  initTheme();

  // Verificar soporte del browser
  if (!window.showDirectoryPicker) {
    UI.compatWarning.classList.remove('hidden');
    UI.btnConnect.disabled = true;
    return;
  }
  bindEvents();
}

// =============================================
// TEMA — Dark / Light
// =============================================
function initTheme() {
  // El atributo ya fue aplicado por el script anti-FOUC en <head>
  // Solo sincronizar el ícono
  syncThemeIcon();

  UI.btnTheme.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const html    = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('mc_theme', next);
  syncThemeIcon();
}

function syncThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  UI.themeIconSun.classList.toggle('hidden',  isDark);
  UI.themeIconMoon.classList.toggle('hidden', !isDark);
}

// =============================================
// EVENTOS
// =============================================
function bindEvents() {
  UI.btnConnect.addEventListener('click',   connectDir);
  UI.btnChangeDir.addEventListener('click', connectDir);
  UI.btnReload.addEventListener('click',    loadSkills);

  UI.skillSearch.addEventListener('input', () => renderList(UI.skillSearch.value));

  UI.btnNewSkill.addEventListener('click', () => openModal('modal-new-skill'));
  UI.newName.addEventListener('input', () => {
    const v = sanitizeName(UI.newName.value);
    UI.newPreview.textContent = v ? `skills/${v}/SKILL.md` : 'skills/nombre/SKILL.md';
  });
  UI.newName.addEventListener('keydown', e => { if (e.key === 'Enter') confirmNew(); });
  UI.btnConfirmNew.addEventListener('click', confirmNew);

  UI.btnDelete.addEventListener('click', () => {
    if (!S.active) return;
    UI.deleteSkillName.textContent = S.active.name;
    openModal('modal-delete');
  });
  UI.btnConfirmDelete.addEventListener('click', confirmDelete);

  UI.textarea.addEventListener('input',   onEdit);
  UI.textarea.addEventListener('keyup',   updateLineCol);
  UI.textarea.addEventListener('click',   updateLineCol);
  UI.textarea.addEventListener('select',  updateLineCol);
  UI.btnSave.addEventListener('click', save);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
  });

  UI.btnUnsavedDiscard.addEventListener('click', () => {
    closeModal('modal-unsaved');
    S.draftContent = S.savedContent;
    proceedPending();
  });
  UI.btnUnsavedSave.addEventListener('click', async () => {
    await save();
    closeModal('modal-unsaved');
    proceedPending();
  });

  // Cerrar modales con botones y click en overlay
  document.querySelectorAll('[data-modal]').forEach(b =>
    b.addEventListener('click', () => closeModal(b.dataset.modal))
  );
  document.querySelectorAll('.modal-overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); })
  );

  // Escape cierra modales
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(o => closeModal(o.id));
    }
  });

  // Error desde catálogo
  window.addEventListener('catalog-error', e => toast(e.detail, 'error'));
}

// =============================================
// CONECTAR DIRECTORIO
// =============================================
async function connectDir() {
  try {
    const h = await FS.pickDirectory();
    if (!h) return;
    UI.topbarPath.textContent = FS.getRootName();
    UI.welcome.classList.add('hidden');
    UI.shell.classList.remove('hidden');
    await loadSkills();
  } catch (e) {
    toast('No se pudo conectar al directorio', 'error');
  }
}

// =============================================
// CARGAR SKILLS
// =============================================
async function loadSkills() {
  UI.skillList.innerHTML = '<li class="skill-empty">Buscando skills...</li>';
  try {
    S.skills = await FS.findSkills();
    renderList();
    // Inicializar catálogo con la lista actualizada
    Catalog.init(S.skills, async (installedName) => {
      await loadSkills();
      toast(`Skill "${installedName}" instalado`, 'success');
    });
  } catch (e) {
    UI.skillList.innerHTML = '<li class="skill-empty">Error al leer el directorio</li>';
    toast('Error leyendo el directorio', 'error');
  }
}

function renderList(filter = '') {
  const q    = filter.toLowerCase();
  const list = q
    ? S.skills.filter(s => s.name.toLowerCase().includes(q) || s.path.toLowerCase().includes(q))
    : S.skills;

  UI.skillsCount.textContent = S.skills.length;

  if (!list.length) {
    const msg = q
      ? 'Sin resultados'
      : 'No hay skills.<br/>Creá uno con <b>+</b> o desde el catálogo.';
    UI.skillList.innerHTML = `<li class="skill-empty">${msg}</li>`;
    return;
  }

  UI.skillList.innerHTML = '';
  list.forEach(skill => {
    const li = document.createElement('li');
    li.className = `skill-item${S.active?.path === skill.path ? ' active' : ''}`;
    if (S.active?.path === skill.path && S.draftContent !== S.savedContent) {
      li.classList.add('unsaved');
    }
    li.innerHTML = `
      <div class="skill-item-name">${escapeHtml(skill.name)}</div>
      <div class="skill-item-path">${escapeHtml(skill.path)}</div>
    `;
    li.addEventListener('click', () => selectSkill(skill));
    UI.skillList.appendChild(li);
  });
}

// =============================================
// SELECCIONAR SKILL
// =============================================
async function selectSkill(skill) {
  if (S.active?.path === skill.path) return;

  if (S.active && S.draftContent !== S.savedContent) {
    S.pendingSkill = skill;
    UI.unsavedSkillName.textContent = S.active.name;
    openModal('modal-unsaved');
    return;
  }
  await openSkill(skill);
}

async function openSkill(skill) {
  try {
    const content = await FS.readFile(skill.handle);
    S.active       = skill;
    S.savedContent = content;
    S.draftContent = content;

    UI.emptyState.classList.add('hidden');
    UI.editorPanel.classList.remove('hidden');
    UI.editorName.textContent = skill.name;
    UI.textarea.value         = content;
    updatePreview(content);
    setStatus('saved');
    updateLineCol();
    updateFilesize(content);

    // Badge: verificado vs custom
    const isCustom = !content.includes('author: anthropic');
    UI.editorBadge.textContent = isCustom ? 'custom' : 'verificado';
    UI.editorBadge.className   = `skill-badge${isCustom ? ' custom' : ''}`;
    UI.editorBadge.classList.remove('hidden');

    UI.statusPath.textContent = skill.path;
    renderList(UI.skillSearch.value);
    UI.textarea.focus();
  } catch (e) {
    toast('No se pudo abrir el skill', 'error');
  }
}

function proceedPending() {
  if (S.pendingSkill) {
    const target   = S.pendingSkill;
    S.pendingSkill = null;
    openSkill(target);
  }
}

// =============================================
// EDITOR
// =============================================
function onEdit() {
  S.draftContent = UI.textarea.value;
  const changed  = S.draftContent !== S.savedContent;
  setStatus(changed ? 'unsaved' : 'saved');
  updatePreview(S.draftContent);
  updateFilesize(S.draftContent);

  const li = UI.skillList.querySelector('.skill-item.active');
  if (li) li.classList.toggle('unsaved', changed);
}

function updatePreview(md) {
  UI.preview.innerHTML = window.marked ? marked.parse(md) : `<pre>${md}</pre>`;
}

function setStatus(state) {
  const saved = state === 'saved';
  UI.statusDot.className  = `status-dot ${state}`;
  UI.statusText.textContent = saved ? 'guardado' : 'cambios sin guardar';
  UI.btnSave.disabled = saved;
}

// ---- Línea, columna ----
function updateLineCol() {
  const ta  = UI.textarea;
  const pos = ta.selectionStart;
  const val = ta.value.substring(0, pos);
  const lines = val.split('\n');
  const ln    = lines.length;
  const col   = lines[lines.length - 1].length + 1;
  UI.statusLineCol.textContent = `Ln ${ln}, Col ${col}`;
}

// ---- Tamaño del archivo ----
function updateFilesize(content) {
  const bytes = new TextEncoder().encode(content).length;
  if (bytes < 1024)
    UI.statusFilesize.textContent = `${bytes} B`;
  else
    UI.statusFilesize.textContent = `${(bytes / 1024).toFixed(1)} KB`;
}

async function save() {
  if (!S.active || S.draftContent === S.savedContent) return;
  try {
    await FS.writeFile(S.active.handle, S.draftContent);
    S.savedContent = S.draftContent;
    setStatus('saved');
    const li = UI.skillList.querySelector('.skill-item.active');
    if (li) li.classList.remove('unsaved');
    toast('Guardado', 'success');
  } catch (e) {
    toast('Error al guardar', 'error');
  }
}

// =============================================
// CREAR NUEVO SKILL
// =============================================
async function confirmNew() {
  const name = sanitizeName(UI.newName.value);
  if (!name) { UI.newName.focus(); return; }

  if (S.skills.find(s => s.name === name)) {
    toast(`Ya existe un skill llamado "${name}"`, 'error');
    return;
  }

  try {
    const skill = await FS.createSkill(name);
    closeModal('modal-new-skill');
    UI.newName.value = '';
    S.skills.push(skill);
    renderList();
    await openSkill(skill);
    toast(`Skill "${name}" creado`, 'success');
  } catch (e) {
    toast('Error al crear el skill: ' + e.message, 'error');
  }
}

// =============================================
// ELIMINAR SKILL
// =============================================
async function confirmDelete() {
  if (!S.active) return;
  try {
    await FS.deleteSkillFile(S.active.dirHandle);
    const name = S.active.name;
    S.skills       = S.skills.filter(s => s.path !== S.active.path);
    S.active       = null;
    S.savedContent = '';
    S.draftContent = '';
    closeModal('modal-delete');
    UI.editorPanel.classList.add('hidden');
    UI.emptyState.classList.remove('hidden');
    renderList();
    toast(`Skill "${name}" eliminado`, 'success');
  } catch (e) {
    toast('Error al eliminar: ' + e.message, 'error');
    closeModal('modal-delete');
  }
}

// =============================================
// HELPERS
// =============================================
function sanitizeName(v) {
  return v.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function openModal(id)  { el(id).classList.remove('hidden'); }
function closeModal(id) { el(id).classList.add('hidden'); }

function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className   = `toast ${type}`;
  t.textContent = msg;
  el('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ---- ARRANCAR ----
init();
