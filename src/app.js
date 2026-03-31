// app.js — Orquestador principal — Markdown Custom v1.1
import { FS }      from './fs.js';
import { Catalog } from './catalog.js';

// ---- ESTADO ----
const S = {
  skills:        [],
  active:        null,   // { name, path, handle, dirHandle, dir, virtual, fileType, targetDirHandle? }
  savedContent:  '',
  draftContent:  '',
  pendingSkill:  null,   // skill al que el usuario quiere navegar sin guardar
  directories:   [],     // [{ label, path, handle }] — para el modal de nuevo archivo
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
  editorFileLabel:  el('editor-file-label'),
  editorBadge:      el('editor-skill-badge'),
  textarea:         el('editor-textarea'),
  preview:          el('editor-preview'),
  statusDot:        el('status-indicator'),
  statusText:       el('status-text'),
  statusPath:       el('status-path'),
  statusLineCol:    el('status-line-col'),
  statusFilesize:   el('status-filesize'),
  btnSave:          el('btn-save'),
  btnExport:        el('btn-export-skill'),
  btnDelete:        el('btn-delete-skill'),
  // Modals
  modalNew:          el('modal-new-skill'),
  newName:           el('new-skill-name'),
  newTemplate:       el('new-file-template'),
  newDir:            el('new-skill-dir'),
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
  initResizers();

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
// RESIZERS — sidebar y editor/preview
// =============================================
function initResizers() {
  setupResizer(
    document.getElementById('sidebar-resizer'),
    () => parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--sidebar-w')),
    (px) => {
      const clamped = Math.min(Math.max(px, 160), 480);
      document.documentElement.style.setProperty('--sidebar-w', clamped + 'px');
      localStorage.setItem('mc_sidebar_w', clamped);
    }
  );

  setupResizer(
    document.getElementById('editor-resizer'),
    () => {
      const body = document.getElementById('editor-body');
      if (!body) return 0;
      const cols = getComputedStyle(body).gridTemplateColumns.split(' ');
      return parseInt(cols[0]);
    },
    (px) => {
      const body = document.getElementById('editor-body');
      if (!body) return;
      const totalW  = body.offsetWidth - 4;
      const clamped = Math.min(Math.max(px, 200), totalW - 200);
      body.style.gridTemplateColumns = `${clamped}px 4px 1fr`;
    }
  );

  // Restaurar ancho guardado del sidebar
  const saved = localStorage.getItem('mc_sidebar_w');
  if (saved) document.documentElement.style.setProperty('--sidebar-w', saved + 'px');
}

function setupResizer(handle, getStart, applyWidth) {
  if (!handle) return;
  let startX, startW;

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX;
    startW = getStart();
    handle.classList.add('dragging');
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = e => applyWidth(startW + (e.clientX - startX));
    const onUp   = () => {
      handle.classList.remove('dragging');
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });
}

// =============================================
// EVENTOS
// =============================================
function bindEvents() {
  UI.btnConnect.addEventListener('click',   connectDir);
  UI.btnChangeDir.addEventListener('click', connectDir);
  UI.btnReload.addEventListener('click',    loadSkills);

  UI.skillSearch.addEventListener('input', () => renderList(UI.skillSearch.value));

  // Nuevo archivo: cargar directorios al abrir modal
  UI.btnNewSkill.addEventListener('click', async () => {
    await populateNewSkillDirs();
    openModal('modal-new-skill');
    UI.newName.focus();
  });

  // Preview del path en el modal
  const updateNewPreview = () => {
    const name = sanitizeName(UI.newName.value);
    const dir  = UI.newDir.value;
    const base = dir ? `${dir}/` : '';
    UI.newPreview.textContent = name ? `${base}${name}.md` : `${base}nombre.md`;
  };
  UI.newName.addEventListener('input',  updateNewPreview);
  UI.newDir.addEventListener('change',  updateNewPreview);
  UI.newTemplate.addEventListener('change', updateNewPreview);
  UI.newName.addEventListener('keydown', e => { if (e.key === 'Enter') confirmNew(); });
  UI.btnConfirmNew.addEventListener('click', confirmNew);

  // Eliminar
  UI.btnDelete.addEventListener('click', () => {
    if (!S.active) return;
    UI.deleteSkillName.textContent = S.active.path;
    openModal('modal-delete');
  });
  UI.btnConfirmDelete.addEventListener('click', confirmDelete);

  // Exportar
  UI.btnExport.addEventListener('click', exportSkill);

  // Editor
  UI.textarea.addEventListener('input',  onEdit);
  UI.textarea.addEventListener('keyup',  updateLineCol);
  UI.textarea.addEventListener('click',  updateLineCol);
  UI.textarea.addEventListener('select', updateLineCol);
  UI.btnSave.addEventListener('click', save);

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(o => closeModal(o.id));
    }
  });

  UI.btnUnsavedDiscard.addEventListener('click', () => {
    closeModal('modal-unsaved');
    // Si el archivo activo era virtual, quitarlo de la lista
    if (S.active?.virtual) {
      S.skills = S.skills.filter(s => s.path !== S.active.path);
      S.active = null;
      S.savedContent = '';
      S.draftContent = '';
      renderList();
    } else {
      S.draftContent = S.savedContent;
    }
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
// CARGAR ARCHIVOS
// =============================================
async function loadSkills() {
  UI.skillList.innerHTML = '<li class="skill-empty">Buscando archivos...</li>';
  try {
    // Mantener archivos virtuales activos entre recargas
    const virtualSkills = S.skills.filter(s => s.virtual);
    const found = await FS.findMarkdownFiles();
    S.skills = [...found, ...virtualSkills];
    renderList();
    Catalog.init(S.skills, async (installedName) => {
      await loadSkills();
      toast(`Skill "${installedName}" instalado`, 'success');
    });
  } catch (e) {
    UI.skillList.innerHTML = '<li class="skill-empty">Error al leer el directorio</li>';
    toast('Error leyendo el directorio', 'error');
  }
}

// =============================================
// RENDER SIDEBAR — agrupado por directorio
// =============================================
function getSkillGroup(skill) {
  return skill.dir !== undefined ? skill.dir : '';
}

function renderList(filter = '') {
  const q    = filter.toLowerCase();
  const list = q
    ? S.skills.filter(s => s.name.toLowerCase().includes(q) || s.path.toLowerCase().includes(q))
    : S.skills;

  UI.skillsCount.textContent = S.skills.filter(s => !s.virtual).length;

  if (!list.length) {
    const msg = q
      ? 'Sin resultados'
      : 'No hay archivos .md.<br/>Creá uno con <b>+</b> o desde el catálogo.';
    UI.skillList.innerHTML = `<li class="skill-empty">${msg}</li>`;
    return;
  }

  // Agrupar preservando el orden de aparición (filesystem order)
  const orderedGroups = [];
  const groupMap      = new Map();

  list.forEach(skill => {
    const key = getSkillGroup(skill);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
      orderedGroups.push(key);
    }
    groupMap.get(key).push(skill);
  });

  UI.skillList.innerHTML = '';

  orderedGroups.forEach((groupKey, gi) => {
    // Encabezado de directorio
    const header = document.createElement('li');
    header.className = 'skill-dir-header';
    if (gi > 0) header.classList.add('has-separator');
    header.textContent = groupKey === '' ? '/ raíz' : groupKey;
    UI.skillList.appendChild(header);

    // Archivos del grupo
    groupMap.get(groupKey).forEach(skill => {
      const li = document.createElement('li');
      const isActive = S.active?.path === skill.path;
      li.className = `skill-item${isActive ? ' active' : ''}`;
      if (isActive && S.draftContent !== S.savedContent) li.classList.add('unsaved');
      if (skill.virtual) li.classList.add('is-virtual');

      const displayName = skill.virtual ? `• ${skill.name}` : skill.name;
      const ft          = skill.fileType || 'md';
      const badge       = `<span class="file-type-badge type-${ft}">${ft.toUpperCase()}</span>`;

      li.innerHTML = `
        <div class="skill-item-name">${badge}${escapeHtml(displayName)}</div>
        <div class="skill-item-path">${escapeHtml(skill.path)}</div>
      `;
      li.addEventListener('click', () => selectSkill(skill));
      UI.skillList.appendChild(li);
    });
  });
}

// =============================================
// SELECCIONAR ARCHIVO
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
    let content;
    if (skill.virtual) {
      content = skill._initialContent ?? '';
    } else {
      content = await FS.readFile(skill.handle);
    }

    S.active       = skill;
    S.savedContent = skill.virtual ? '' : content;
    S.draftContent = content;

    UI.emptyState.classList.add('hidden');
    UI.editorPanel.classList.remove('hidden');
    UI.editorName.textContent     = skill.name;
    UI.editorFileLabel.textContent = skill.path.split('/').pop();
    UI.textarea.value              = content;
    updatePreview(content);
    setStatus(skill.virtual ? 'unsaved' : 'saved');
    updateLineCol();
    updateFilesize(content);

    // Badge por tipo de archivo
    const ft = skill.fileType || 'md';
    UI.editorBadge.textContent = skill.virtual ? 'nuevo' : ft;
    UI.editorBadge.className   = `skill-badge type-${ft}${skill.virtual ? ' custom' : ''}`;
    UI.editorBadge.classList.remove('hidden');

    UI.statusPath.textContent = skill.path;
    renderList(UI.skillSearch.value);
    UI.textarea.focus();
  } catch (e) {
    toast('No se pudo abrir el archivo', 'error');
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
  UI.statusDot.className    = `status-dot ${state}`;
  UI.statusText.textContent = saved ? 'guardado' : 'cambios sin guardar';
  UI.btnSave.disabled       = saved;
}

function updateLineCol() {
  const ta    = UI.textarea;
  const pos   = ta.selectionStart;
  const val   = ta.value.substring(0, pos);
  const lines = val.split('\n');
  const ln    = lines.length;
  const col   = lines[lines.length - 1].length + 1;
  UI.statusLineCol.textContent = `Ln ${ln}, Col ${col}`;
}

function updateFilesize(content) {
  const bytes = new TextEncoder().encode(content).length;
  UI.statusFilesize.textContent = bytes < 1024
    ? `${bytes} B`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

// =============================================
// GUARDAR (materializa el archivo si es virtual)
// =============================================
async function save() {
  if (!S.active) return;

  if (S.active.virtual) {
    try {
      const { handle, dirHandle } = await FS.materializeSkill(
        S.active.targetDirHandle,
        S.active.name,
        S.draftContent,
        { createSubdir: false }
      );

      S.active.handle          = handle;
      S.active.dirHandle       = dirHandle;
      S.active.virtual         = false;
      delete S.active.targetDirHandle;
      delete S.active._initialContent;
      S.savedContent = S.draftContent;
      setStatus('saved');

      // Actualizar en el array de skills
      const idx = S.skills.findIndex(s => s.path === S.active.path);
      if (idx !== -1) S.skills[idx] = S.active;
      renderList(UI.skillSearch.value);

      // Actualizar badge
      const ft = S.active.fileType || 'md';
      UI.editorBadge.textContent = ft;
      UI.editorBadge.className   = `skill-badge type-${ft}`;

      toast(`"${S.active.name}.md" creado en disco`, 'success');
    } catch (e) {
      toast('Error al crear el archivo: ' + e.message, 'error');
    }
    return;
  }

  if (S.draftContent === S.savedContent) return;

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
// EXPORTAR ARCHIVO
// =============================================
async function exportSkill() {
  if (!S.active) return;

  if (!window.showSaveFilePicker) {
    toast('Tu navegador no soporta exportación directa', 'error');
    return;
  }

  try {
    const pickedHandle = await window.showSaveFilePicker({
      suggestedName: `${S.active.name}.md`,
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
    });

    if (S.active.handle) {
      const isSame = await pickedHandle.isSameEntry(S.active.handle).catch(() => false);
      if (isSame) {
        toast('No podés exportar sobre el archivo fuente. Elegí un nombre diferente.', 'error');
        return;
      }
    }

    await FS.writeFile(pickedHandle, S.draftContent);
    toast(`Exportado como "${pickedHandle.name}"`, 'success');
  } catch (e) {
    if (e.name !== 'AbortError') toast('Error al exportar', 'error');
  }
}

// =============================================
// NUEVO ARCHIVO — modal con selección de directorio
// =============================================
async function populateNewSkillDirs() {
  UI.newDir.innerHTML = '<option value="" disabled>Cargando...</option>';
  try {
    S.directories = await FS.findDirectories();
    UI.newDir.innerHTML = '';
    S.directories.forEach(d => {
      const opt   = document.createElement('option');
      opt.value   = d.path;
      opt.text    = d.label;
      UI.newDir.appendChild(opt);
    });
  } catch (_) {
    UI.newDir.innerHTML = '<option value="">/ raíz</option>';
    S.directories = [{ label: '/ raíz', path: '', handle: FS.rootHandle }];
  }
  UI.newPreview.textContent = 'nombre.md';
  UI.newName.value     = '';
  UI.newTemplate.value = 'blank';
}

function _getTemplateContent(templateKey, name) {
  switch (templateKey) {
    case 'skill':  return FS._template(name);
    case 'rules':  return FS._templateRules();
    case 'prompt': return FS._templatePrompt();
    case 'gemini': return FS._templateGemini();
    default:       return '';
  }
}

function _getFileTypeFromTemplate(templateKey) {
  switch (templateKey) {
    case 'skill':  return 'skill';
    case 'rules':  return 'rules';
    case 'prompt': return 'prompt';
    case 'gemini': return 'rules';
    default:       return 'md';
  }
}

async function confirmNew() {
  const name = sanitizeName(UI.newName.value);
  if (!name) { UI.newName.focus(); return; }

  const selectedPath  = UI.newDir.value;
  const templateKey   = UI.newTemplate.value;
  const dirEntry      = S.directories.find(d => d.path === selectedPath);
  const targetHandle  = dirEntry ? dirEntry.handle : FS.rootHandle;

  const fullPath = selectedPath ? `${selectedPath}/${name}.md` : `${name}.md`;

  // Verificar duplicado
  if (S.skills.find(s => s.path === fullPath)) {
    toast(`Ya existe "${name}.md" en ese directorio`, 'error');
    return;
  }

  const initialContent = _getTemplateContent(templateKey, name);
  const fileType       = _getFileTypeFromTemplate(templateKey);

  // Crear archivo virtual (en memoria, sin archivo en disco)
  const virtualSkill = {
    name,
    path:            fullPath,
    handle:          null,
    dirHandle:       null,
    dir:             selectedPath,
    virtual:         true,
    fileType,
    targetDirHandle: targetHandle,
    _initialContent: initialContent,
  };

  closeModal('modal-new-skill');
  UI.newName.value = '';

  S.skills.push(virtualSkill);
  renderList();
  await openSkill(virtualSkill);
  toast(`"${name}.md" listo — guardá para crear el archivo`, 'info');
}

// =============================================
// ELIMINAR ARCHIVO
// =============================================
async function confirmDelete() {
  if (!S.active) return;

  // Archivo virtual: solo quitar de memoria
  if (S.active.virtual) {
    const name   = S.active.name;
    S.skills     = S.skills.filter(s => s.path !== S.active.path);
    S.active     = null;
    S.savedContent = '';
    S.draftContent = '';
    closeModal('modal-delete');
    UI.editorPanel.classList.add('hidden');
    UI.emptyState.classList.remove('hidden');
    renderList();
    toast(`"${name}.md" descartado`, 'success');
    return;
  }

  try {
    await FS.deleteSkillFile(S.active.handle, S.active.dirHandle);
    const name = S.active.name;
    S.skills       = S.skills.filter(s => s.path !== S.active.path);
    S.active       = null;
    S.savedContent = '';
    S.draftContent = '';
    closeModal('modal-delete');
    UI.editorPanel.classList.add('hidden');
    UI.emptyState.classList.remove('hidden');
    renderList();
    toast(`"${name}" eliminado`, 'success');
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
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
