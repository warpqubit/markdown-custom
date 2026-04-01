// app.js — Orquestador principal — Markdown Custom v1.3
import { FS } from './fs.js';
import { searchSkillFilesAll, fetchSkillContent, parseSkillMetrics, getRateLimit } from './githubSkills.js';

// ---- ESTADO ----
const S = {
  skills:           [],
  active:           null,   // { name, path, handle, dirHandle, dir, virtual, fileType, targetDirHandle? }
  savedContent:     '',
  draftContent:     '',
  pendingSkill:     null,   // skill al que el usuario quiere navegar sin guardar
  directories:      [],     // [{ label, path, handle }] — para el modal de nuevo archivo
  githubToken:      '',
  githubSkills:     [],     // resultados de la última búsqueda
  githubPanelOpen:  false,
  githubPage:       1,
  githubPerPage:    10,
};

// Estado temporal del modal de instalación de GitHub skills
const GHI = { item: null, skillName: '', _resolvedName: '' };

// Lock para evitar renders concurrentes (enriquecimiento lazy por página)
let _gspRendering = false;

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
  modalNew:           el('modal-new-skill'),
  newName:            el('new-skill-name'),
  newTemplate:        el('new-file-template'),
  newDir:             el('new-skill-dir'),
  newPreview:         el('new-skill-preview-path'),
  btnConfirmNew:      el('btn-confirm-new-skill'),
  modalDelete:        el('modal-delete'),
  deleteSkillName:    el('delete-skill-name'),
  btnConfirmDelete:   el('btn-confirm-delete'),
  modalUnsaved:       el('modal-unsaved'),
  unsavedSkillName:   el('unsaved-skill-name'),
  btnUnsavedDiscard:  el('btn-unsaved-discard'),
  btnUnsavedSave:     el('btn-unsaved-save'),
  // Import
  modalImport:        el('modal-import'),
  btnImport:          el('btn-import'),
  btnPickFile:        el('btn-pick-file'),
  importFileName:     el('import-file-name'),
  importFileError:    el('import-file-error'),
  importDestDir:      el('import-dest-dir'),
  importPreviewPath:  el('import-preview-path'),
  importConflict:     el('import-conflict-notice'),
  btnConfirmImport:   el('btn-confirm-import'),
  compatWarning:      el('compat-warning'),
  // GitHub Skills panel
  btnGithubSkills:      el('btn-github-skills'),
  githubPanel:          el('github-skills-panel'),
  btnGspClose:          el('btn-gsp-close'),
  btnGspSearch:         el('btn-gsp-search'),
  gspSearchInput:       el('gsp-search-input'),
  gspRateBadge:         el('gsp-rate-badge'),
  gspCount:             el('gsp-count'),
  gspBody:              el('gsp-body'),
  btnGspRegisterToken:  el('btn-gsp-register-token'),
  gspTokenStatus:       el('gsp-token-status'),
  // Modal token
  modalGithubToken:     el('modal-github-token'),
  gspTokenInput:        el('gsp-token-input'),
  btnGspTokenAccept:    el('btn-gsp-token-accept'),
  btnGspTokenClear:     el('btn-gsp-token-clear'),
  // GitHub pagination
  gspPagination:        el('gsp-pagination'),
  gspPageInfo:          el('gsp-page-info'),
  btnGspPrev:           el('btn-gsp-prev'),
  btnGspNext:           el('btn-gsp-next'),
  gspPerPage:           el('gsp-per-page'),
  // Install modal
  modalGhInstall:       el('modal-gh-install'),
  ghiSkillName:         el('ghi-skill-name'),
  ghiDestDir:           el('ghi-dest-dir'),
  ghiPreviewPath:       el('ghi-preview-path'),
  ghiConflict:          el('ghi-conflict-notice'),
  btnGhiConfirm:        el('btn-ghi-confirm'),
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
      if (S.githubPanelOpen) closeGithubPanel();
    }
  });

  // GitHub Skills panel
  UI.btnGithubSkills.addEventListener('click',        openGithubPanel);
  UI.btnGspClose.addEventListener('click',            closeGithubPanel);
  UI.btnGspSearch.addEventListener('click',           runGithubSearch);
  UI.btnGspRegisterToken.addEventListener('click',    openTokenModal);
  UI.btnGspTokenAccept.addEventListener('click',      acceptToken);
  UI.btnGspTokenClear.addEventListener('click',       clearToken);
  UI.gspSearchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !UI.btnGspSearch.disabled) runGithubSearch();
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

  // Importar .md
  UI.btnImport.addEventListener('click', openImportModal);
  UI.btnPickFile.addEventListener('click', pickImportFile);
  UI.importDestDir.addEventListener('change', refreshImportPreview);
  UI.btnConfirmImport.addEventListener('click', confirmImport);

  // GitHub pagination
  UI.btnGspPrev.addEventListener('click', () => {
    S.githubPage--;
    _renderGithubSkills(S.githubSkills).catch(e => toast(e.message, 'error'));
  });
  UI.btnGspNext.addEventListener('click', () => {
    S.githubPage++;
    _renderGithubSkills(S.githubSkills).catch(e => toast(e.message, 'error'));
  });
  UI.gspPerPage.addEventListener('change', () => {
    S.githubPerPage = +UI.gspPerPage.value;
    S.githubPage    = 1;
    _renderGithubSkills(S.githubSkills).catch(e => toast(e.message, 'error'));
  });

  // Install modal
  UI.ghiDestDir.addEventListener('change', _updateInstallPreview);
  UI.btnGhiConfirm.addEventListener('click', confirmGhInstall);
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

  if (S.active._githubPreview) {
    toast('Skill de GitHub — usá el panel de GitHub para importarlo a tu proyecto.', 'info');
    return;
  }

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
// GITHUB SKILLS PANEL
// =============================================

function _syncTokenStatus() {
  const has = S.githubToken.length > 0;
  UI.gspTokenStatus.textContent = has ? '● Token registrado' : '○ Sin token';
  UI.gspTokenStatus.className   = `gsp-token-status ${has ? 'has-token' : 'no-token'}`;
  UI.btnGspSearch.disabled      = !has;
}

// — Token modal —
function openTokenModal() {
  UI.gspTokenInput.value = S.githubToken;
  openModal('modal-github-token');
  UI.gspTokenInput.focus();
}

function acceptToken() {
  const val = UI.gspTokenInput.value.trim();
  S.githubToken = val;
  localStorage.setItem('mc_github_token', val);
  _syncTokenStatus();
  closeModal('modal-github-token');
  toast(val ? 'Token registrado' : 'Token eliminado', 'success');
}

function clearToken() {
  UI.gspTokenInput.value = '';
  S.githubToken = '';
  localStorage.removeItem('mc_github_token');
  _syncTokenStatus();
  closeModal('modal-github-token');
  toast('Token eliminado', 'info');
}

// — Panel open/close —
function openGithubPanel() {
  const saved = localStorage.getItem('mc_github_token') || '';
  S.githubToken = saved;
  _syncTokenStatus();
  S.githubPanelOpen = true;
  UI.githubPanel.classList.add('open');
  UI.gspSearchInput.focus();
}

function closeGithubPanel() {
  S.githubPanelOpen = false;
  UI.githubPanel.classList.remove('open');
}

// — Búsqueda —
async function runGithubSearch() {
  const query = UI.gspSearchInput.value.trim();
  if (!query) { UI.gspSearchInput.focus(); return; }

  S.githubPage    = 1;
  S.githubSkills  = [];
  UI.btnGspSearch.disabled    = true;
  UI.btnGspSearch.textContent = '...';
  UI.gspCount.classList.add('hidden');
  UI.gspPagination.classList.add('hidden');

  // Spinner inicial
  const loadInfo = _showGspLoading(`Buscando "${query}"...`);

  try {
    // 1. Buscar TODOS los resultados disponibles (metadata only, sin contenido)
    //    onPage: actualiza el mensaje de carga conforme llegan páginas
    const results = await searchSkillFilesAll(
      query,
      S.githubToken,
      300,
      (fetched, total) => {
        loadInfo.textContent = `Encontrados ${fetched} de ${Math.min(total, 300)}...`;
      }
    );

    S.githubSkills = results;

    // 2. Renderizar primera página (enriquece lazily los items de esa página)
    await _renderGithubSkills(S.githubSkills);

    // 3. Rate limit
    try {
      const rl  = await getRateLimit(S.githubToken);
      const low = rl.remaining < 10;
      UI.gspRateBadge.textContent = `${rl.remaining}/${rl.limit}`;
      UI.gspRateBadge.className   = `gsp-rate-badge${low ? ' low' : ''}`;
    } catch (_) { /* ignorar */ }

  } catch (err) {
    UI.gspBody.innerHTML = '';
    const errDiv = document.createElement('div');
    errDiv.className   = 'gsp-error';
    errDiv.textContent = err.message;
    UI.gspBody.appendChild(errDiv);
  } finally {
    UI.btnGspSearch.disabled    = false;
    UI.btnGspSearch.textContent = 'Buscar';
  }
}

/** Muestra spinner de carga en el panel y devuelve el nodo de texto editable */
function _showGspLoading(msg) {
  UI.gspBody.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'gsp-loading';
  const sp = document.createElement('div');
  sp.className = 'gsp-spinner';
  const txt = document.createTextNode(msg);
  wrap.appendChild(sp);
  wrap.appendChild(txt);
  UI.gspBody.appendChild(wrap);
  return txt;
}

async function _renderGithubSkills(items) {
  // Evitar renders concurrentes mientras se enriquece una página
  if (_gspRendering) return;
  _gspRendering = true;

  try {
    UI.gspBody.innerHTML = '';

    if (!items.length) {
      UI.gspCount.classList.add('hidden');
      UI.gspPagination.classList.add('hidden');
      const empty = document.createElement('div');
      empty.className   = 'gsp-empty';
      empty.textContent = 'Sin resultados. Probá otro término.';
      UI.gspBody.appendChild(empty);
      return;
    }

    const total      = items.length;
    const perPage    = S.githubPerPage;
    const totalPages = Math.ceil(total / perPage);
    S.githubPage     = Math.min(Math.max(1, S.githubPage), totalPages);
    const start      = (S.githubPage - 1) * perPage;
    const end        = Math.min(start + perPage, total);
    const pageItems  = items.slice(start, end);

    // Actualizar controles de paginación
    UI.gspCount.textContent = total;
    UI.gspCount.classList.remove('hidden');
    UI.gspPagination.classList.remove('hidden');
    UI.gspPageInfo.textContent  = `${start + 1}–${end} de ${total}`;
    UI.btnGspPrev.disabled      = S.githubPage <= 1;
    UI.btnGspNext.disabled      = S.githubPage >= totalPages;
    UI.gspPerPage.value         = String(perPage);

    // Enriquecimiento lazy: solo los items de esta página que aún no tienen contenido
    const toEnrich = pageItems.filter(item => !item._enriched);
    if (toEnrich.length > 0) {
      const txt = _showGspLoading(`Cargando ${toEnrich.length} skills...`);
      let done = 0;

      for (const item of toEnrich) {
        try {
          const content = await fetchSkillContent(item.fullName, item.path, S.githubToken);
          const metrics = parseSkillMetrics(content);
          Object.assign(item, { content, metrics, _enriched: true });
        } catch (_) {
          Object.assign(item, {
            content:   null,
            metrics:   { name: '', description: '', wordCount: 0, hasExamples: false, hasTriggers: false },
            _enriched: true,
          });
        }
        done++;
        txt.textContent = `Cargando skills... ${done}/${toEnrich.length}`;
      }
      UI.gspBody.innerHTML = '';
    }

    pageItems.forEach(item => UI.gspBody.appendChild(_buildGithubCard(item)));

  } finally {
    _gspRendering = false;
  }
}

function _buildGithubCard(item) {
  const hasDir      = !!FS.rootHandle;
  const m           = item.metrics;
  const displayName = m.name || item.path.split('/').slice(-2, -1)[0] || item.repo;
  const abbr        = displayName.slice(0, 3).toUpperCase();
  const repoShort   = item.repo.split('/')[1] || item.repo;
  const dateStr     = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString('es-AR',
        { day: '2-digit', month: 'short', year: '2-digit' })
    : '—';

  const card = document.createElement('div');
  card.className = 'gsp-card';
  if (!item.content) card.classList.add('gsp-card--no-content');

  // — Fila 1: icono + nombre + badge palabras —
  const header = document.createElement('div');
  header.className = 'gsp-card-header';

  const icon = document.createElement('div');
  icon.className   = 'gsp-card-icon';
  icon.textContent = abbr;

  const titleEl = document.createElement('div');
  titleEl.className   = 'gsp-card-title';
  titleEl.textContent = displayName;

  const wBadge = document.createElement('span');
  wBadge.className   = 'gsp-word-badge';
  wBadge.textContent = `${m.wordCount}w`;

  header.appendChild(icon);
  header.appendChild(titleEl);
  header.appendChild(wBadge);
  card.appendChild(header);

  // — Fila 2: descripción —
  if (m.description) {
    const desc = document.createElement('div');
    desc.className   = 'gsp-card-desc';
    desc.textContent = m.description;
    card.appendChild(desc);
  }

  // — Fila 3: tags —
  const tags = document.createElement('div');
  tags.className = 'gsp-card-tags';

  const tagGh = document.createElement('span');
  tagGh.className   = 'c-tag community';
  tagGh.textContent = 'GitHub';
  tags.appendChild(tagGh);

  if (m.hasExamples) {
    const t = document.createElement('span');
    t.className = 'c-tag verified'; t.textContent = '✓ ejemplos';
    tags.appendChild(t);
  }
  if (m.hasTriggers) {
    const t = document.createElement('span');
    t.className = 'c-tag verified'; t.textContent = '✓ triggers';
    tags.appendChild(t);
  }

  const tagRepo = document.createElement('span');
  tagRepo.className   = 'c-tag repo-tag';
  tagRepo.title       = item.repo;
  tagRepo.textContent = repoShort;
  tags.appendChild(tagRepo);
  card.appendChild(tags);

  // — Fila 4: métricas + botón instalar —
  const footer = document.createElement('div');
  footer.className = 'gsp-card-footer';

  const metricsEl = document.createElement('div');
  metricsEl.className = 'gsp-card-metrics';
  metricsEl.innerHTML =
    `<span class="${item.stars > 50 ? 'gsp-metric-hot' : ''}">★ ${item.stars.toLocaleString()}</span>` +
    ` · <span>↓ ${item.forks.toLocaleString()}</span>` +
    ` · <span>↻ ${dateStr}</span>`;
  footer.appendChild(metricsEl);

  const btnInst = document.createElement('button');
  btnInst.className   = 'btn-install';
  btnInst.textContent = 'Instalar';
  btnInst.disabled    = !hasDir || !item.content;
  if (!hasDir)       btnInst.title = 'Conectá un directorio primero';
  if (!item.content) btnInst.title = 'Contenido no disponible';
  if (hasDir && item.content) {
    btnInst.addEventListener('click', e => {
      e.stopPropagation();
      openInstallModal(item, displayName);
    });
  }
  footer.appendChild(btnInst);
  card.appendChild(footer);

  // Click en la card (no en instalar) → preview en editor, panel NO se cierra
  if (item.content) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', e => {
      if (e.target === btnInst || btnInst.contains(e.target)) return;
      openGithubPreview(item, displayName);
    });
  }

  return card;
}

// Abre un skill de GitHub en el editor (modo preview, solo lectura inicial)
function openGithubPreview(item, displayName) {
  const content = item.content || '';

  S.active       = {
    name:           displayName,
    path:           `github/${item.repo}/${item.path}`,
    handle:         null,
    dirHandle:      null,
    dir:            `github/${item.repo}`,
    virtual:        false,
    fileType:       'skill',
    _githubPreview: true,
  };
  S.savedContent = content;
  S.draftContent = content;

  UI.emptyState.classList.add('hidden');
  UI.editorPanel.classList.remove('hidden');
  UI.editorName.textContent      = displayName;
  UI.editorFileLabel.textContent = item.path.split('/').pop();
  UI.textarea.value              = content;
  updatePreview(content);
  setStatus('saved');
  updateLineCol();
  updateFilesize(content);

  UI.editorBadge.textContent = 'github';
  UI.editorBadge.className   = 'skill-badge type-skill';
  UI.editorBadge.classList.remove('hidden');
  UI.statusPath.textContent = `github/${item.repo}/${item.path}`;

  // No agregar a S.skills — es solo preview
  // Si había un skill activo seleccionado, limpiar su .active en el sidebar
  renderList(UI.skillSearch.value);
  UI.textarea.focus();
}

async function openInstallModal(item, skillName) {
  GHI.item      = item;
  GHI.skillName = skillName;

  UI.ghiSkillName.textContent = skillName;
  UI.ghiConflict.classList.add('hidden');

  try {
    S.directories = await FS.findDirectories();
    UI.ghiDestDir.innerHTML = '';
    S.directories.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.path;
      opt.text  = d.label;
      UI.ghiDestDir.appendChild(opt);
    });
  } catch (_) {
    UI.ghiDestDir.innerHTML = '<option value="">/ raíz</option>';
    S.directories = [{ label: '/ raíz', path: '', handle: FS.rootHandle }];
  }

  _updateInstallPreview();
  openModal('modal-gh-install');
}

function _updateInstallPreview() {
  if (!GHI.item) return;
  const destPath  = UI.ghiDestDir.value;
  const baseName  = (sanitizeName(GHI.skillName) || 'skill') + '.md';
  const { finalName, conflict } = _resolveImportName(baseName, destPath);
  const fullPath  = destPath ? `${destPath}/${finalName}` : finalName;

  UI.ghiPreviewPath.textContent = fullPath;
  GHI._resolvedName = finalName;

  if (conflict) {
    UI.ghiConflict.classList.remove('hidden');
    UI.ghiConflict.textContent = `Ya existe "${baseName}". Se instalará como "${finalName}".`;
  } else {
    UI.ghiConflict.classList.add('hidden');
  }
}

async function confirmGhInstall() {
  if (!GHI.item || !GHI.item.content) return;

  const destPath     = UI.ghiDestDir.value;
  const finalName    = GHI._resolvedName || (sanitizeName(GHI.skillName) || 'skill') + '.md';
  const dirEntry     = S.directories.find(d => d.path === destPath);
  const targetHandle = dirEntry ? dirEntry.handle : FS.rootHandle;

  UI.btnGhiConfirm.disabled    = true;
  UI.btnGhiConfirm.textContent = '...';

  try {
    const newHandle = await targetHandle.getFileHandle(finalName, { create: true });
    await FS.writeFile(newHandle, GHI.item.content);

    const fileType = await FS._detectFileType(finalName, newHandle, destPath);
    const name     = finalName.replace(/\.md$/i, '');
    const fullPath = destPath ? `${destPath}/${finalName}` : finalName;

    const newSkill = {
      name, path: fullPath, handle: newHandle,
      dirHandle: targetHandle, dir: destPath,
      virtual: false, fileType,
    };

    S.skills.push(newSkill);
    closeModal('modal-gh-install');
    renderList();
    await openSkill(newSkill);

    const baseName = (sanitizeName(GHI.skillName) || 'skill') + '.md';
    const conflict = finalName !== baseName;
    toast(conflict
      ? `Instalado como "${finalName}" (renombrado)`
      : `"${finalName}" instalado correctamente`, 'success');
  } catch (e) {
    toast('Error al instalar: ' + e.message, 'error');
  } finally {
    UI.btnGhiConfirm.disabled    = false;
    UI.btnGhiConfirm.textContent = 'Instalar';
  }
}

// =============================================
// IMPORTAR .md
// =============================================
// Estado temporal del modal de importar
const IMP = { file: null, baseName: '' };

async function openImportModal() {
  // Reset estado
  IMP.file     = null;
  IMP.baseName = '';
  UI.importFileName.textContent    = 'Ningún archivo seleccionado';
  UI.importFileError.classList.add('hidden');
  UI.importConflict.classList.add('hidden');
  UI.importPreviewPath.textContent = '—';
  UI.btnConfirmImport.disabled     = true;

  // Poblar directorios destino
  try {
    S.directories = await FS.findDirectories();
    UI.importDestDir.innerHTML = '';
    S.directories.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.path;
      opt.text  = d.label;
      UI.importDestDir.appendChild(opt);
    });
  } catch (_) {
    UI.importDestDir.innerHTML = '<option value="">/ raíz</option>';
    S.directories = [{ label: '/ raíz', path: '', handle: FS.rootHandle }];
  }

  openModal('modal-import');
}

async function pickImportFile() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      multiple: false,
    });
    const file = await fileHandle.getFile();

    // Validar extensión
    if (!file.name.toLowerCase().endsWith('.md')) {
      UI.importFileError.classList.remove('hidden');
      UI.importFileName.textContent = file.name;
      UI.btnConfirmImport.disabled  = true;
      IMP.file = null;
      return;
    }

    UI.importFileError.classList.add('hidden');
    IMP.file     = file;
    IMP.baseName = file.name;
    UI.importFileName.textContent = file.name;

    refreshImportPreview();
  } catch (e) {
    if (e.name !== 'AbortError') toast('No se pudo seleccionar el archivo', 'error');
  }
}

function _resolveImportName(baseName, destPath) {
  // Devuelve { finalName, conflict }
  // Verifica si ya existe en S.skills (incluyendo virtuales)
  const check = name => {
    const candidate = destPath ? `${destPath}/${name}` : name;
    return S.skills.some(s => s.path === candidate);
  };

  if (!check(baseName)) return { finalName: baseName, conflict: false };

  // Generar nombre sin conflicto: nombre-2.md, nombre-3.md, ...
  const stem = baseName.replace(/\.md$/i, '');
  let n = 2;
  while (n < 100) {
    const candidate = `${stem}-${n}.md`;
    if (!check(candidate)) return { finalName: candidate, conflict: true };
    n++;
  }
  return { finalName: `${stem}-${Date.now()}.md`, conflict: true };
}

function refreshImportPreview() {
  if (!IMP.file) return;

  const destPath = UI.importDestDir.value;
  const { finalName, conflict } = _resolveImportName(IMP.baseName, destPath);

  const fullPath = destPath ? `${destPath}/${finalName}` : finalName;
  UI.importPreviewPath.textContent = fullPath;

  if (conflict) {
    UI.importConflict.classList.remove('hidden');
    UI.importConflict.textContent =
      `Ya existe "${IMP.baseName}" en ese directorio. Se importará como "${finalName}".`;
  } else {
    UI.importConflict.classList.add('hidden');
  }

  UI.btnConfirmImport.disabled = false;
  IMP._resolvedName = finalName;
}

async function confirmImport() {
  if (!IMP.file) return;

  const destPath    = UI.importDestDir.value;
  const finalName   = IMP._resolvedName || IMP.baseName;
  const dirEntry    = S.directories.find(d => d.path === destPath);
  const targetHandle = dirEntry ? dirEntry.handle : FS.rootHandle;

  UI.btnConfirmImport.disabled = true;
  UI.btnConfirmImport.textContent = 'Importando...';

  try {
    // Leer contenido del archivo origen
    const content = await IMP.file.text();

    // Crear el archivo en el destino
    const newHandle = await targetHandle.getFileHandle(finalName, { create: true });
    await FS.writeFile(newHandle, content);

    // Detectar fileType del archivo importado
    const fileType = await FS._detectFileType(finalName, newHandle, destPath);
    const name     = finalName.replace(/\.md$/i, '');
    const fullPath = destPath ? `${destPath}/${finalName}` : finalName;

    const newSkill = {
      name, path: fullPath, handle: newHandle,
      dirHandle: targetHandle, dir: destPath,
      virtual: false, fileType,
    };

    S.skills.push(newSkill);
    closeModal('modal-import');
    renderList();
    await openSkill(newSkill);
    toast(`"${finalName}" importado correctamente`, 'success');
  } catch (e) {
    toast('Error al importar: ' + e.message, 'error');
  } finally {
    UI.btnConfirmImport.disabled    = false;
    UI.btnConfirmImport.textContent = 'Importar';
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
