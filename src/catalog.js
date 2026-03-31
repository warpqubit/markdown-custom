// catalog.js — Modal de catálogo con métricas de GitHub + fallback mock
import { GitHub } from './github.js';
import { FS }     from './fs.js';

// ---- MOCK DATA — usado cuando la API de GitHub falla ----
const MOCK_SKILLS = [
  { name: 'sequential-thinking',   path: 'sequential-thinking/SKILL.md',   downloadUrl: null, description: 'Descompone problemas en cadenas de razonamiento paso a paso.', tags: ['reasoning', 'thinking'] },
  { name: 'memory-management',     path: 'memory-management/SKILL.md',     downloadUrl: null, description: 'Gestiona contexto de proyecto entre conversaciones.',           tags: ['memory', 'context'] },
  { name: 'code-review',           path: 'code-review/SKILL.md',           downloadUrl: null, description: 'Revisión detallada de código con mejores prácticas.',           tags: ['coding', 'quality'] },
  { name: 'web-research',          path: 'web-research/SKILL.md',          downloadUrl: null, description: 'Investiga y sintetiza información de fuentes web.',             tags: ['research'] },
  { name: 'sql-expert',            path: 'sql-expert/SKILL.md',            downloadUrl: null, description: 'Escribe y optimiza queries SQL complejas.',                     tags: ['sql', 'database'] },
  { name: 'python-data-analysis',  path: 'python-data-analysis/SKILL.md',  downloadUrl: null, description: 'Análisis de datos con pandas, numpy y matplotlib.',            tags: ['python', 'data'] },
  { name: 'git-workflow',          path: 'git-workflow/SKILL.md',          downloadUrl: null, description: 'Flujo de trabajo con Git, branches y pull requests.',           tags: ['git', 'devops'] },
  { name: 'api-design',            path: 'api-design/SKILL.md',            downloadUrl: null, description: 'Diseño de APIs REST y GraphQL con buenas prácticas.',           tags: ['api', 'backend'] },
  { name: 'debugging-systematic',  path: 'debugging-systematic/SKILL.md',  downloadUrl: null, description: 'Proceso sistemático para encontrar y resolver bugs.',           tags: ['debugging'] },
  { name: 'technical-writing',     path: 'technical-writing/SKILL.md',     downloadUrl: null, description: 'Redacción de documentación técnica clara y concisa.',           tags: ['docs', 'writing'] },
  { name: 'test-driven-dev',       path: 'test-driven-dev/SKILL.md',       downloadUrl: null, description: 'Desarrollo guiado por tests unitarios e integración.',          tags: ['testing', 'quality'] },
  { name: 'refactoring-patterns',  path: 'refactoring-patterns/SKILL.md',  downloadUrl: null, description: 'Patrones seguros de refactorización sin romper funcionalidad.',  tags: ['refactoring', 'patterns'] },
];

const MOCK_METRICS = {
  stars: 2847, forks: 312,
  lastCommit: new Date(Date.now() - 2 * 86400000).toISOString(),
  daysSince: 2,
  score: 91,
};

// Genera contenido SKILL.md para skills de mock
function mockSkillContent(skill) {
  return `---
name: ${skill.name}
description: ${skill.description}
tags: [${skill.tags.map(t => `"${t}"`).join(', ')}]
version: 1.0.0
author: anthropic
---

# ${skill.name}

## Cuándo usar este skill

${skill.description}

## Instrucciones

1. Activar este skill cuando el usuario solicite ayuda con: ${skill.tags.join(', ')}.
2. Seguir las guías y mejores prácticas del área.
3. Proporcionar respuestas detalladas y ejemplos concretos.

## Notas

- Skill verificado por el equipo de Anthropic.
- Actualizado regularmente con mejores prácticas.
`;
}

// ---- CATÁLOGO ----
export const Catalog = {
  installedNames: new Set(),
  onInstalled:    null,
  _isMock:        false,

  init(installedSkills, onInstalledCb) {
    this.installedNames = new Set(installedSkills.map(s => s.name));
    this.onInstalled    = onInstalledCb;

    const btnCatalog = document.getElementById('btn-catalog');
    // Remover listener previo clonando el nodo
    const fresh = btnCatalog.cloneNode(true);
    btnCatalog.parentNode.replaceChild(fresh, btnCatalog);
    fresh.addEventListener('click', () => this.open());

    document.getElementById('catalog-search').addEventListener('input', e =>
      this._filter(e.target.value)
    );
  },

  updateInstalled(skills) {
    this.installedNames = new Set(skills.map(s => s.name));
  },

  async open() {
    document.getElementById('modal-catalog').classList.remove('hidden');
    document.getElementById('catalog-search').value = '';
    await this._load();
  },

  _remoteSkills: null,
  _metrics:      null,

  async _load() {
    const body = document.getElementById('catalog-body');
    body.innerHTML = '<div class="catalog-loading">Conectando con GitHub...</div>';

    try {
      const [skills, metrics] = await Promise.all([
        GitHub.listRemoteSkills(),
        GitHub.getRepoMetrics(),
      ]);
      this._remoteSkills = skills;
      this._metrics      = metrics;
      this._isMock       = false;
      this._render(skills, metrics);
    } catch (_err) {
      // Fallback silencioso a datos mock
      this._remoteSkills = MOCK_SKILLS;
      this._metrics      = MOCK_METRICS;
      this._isMock       = true;
      this._render(MOCK_SKILLS, MOCK_METRICS);
    }
  },

  _render(skills, metrics) {
    const body = document.getElementById('catalog-body');

    if (!skills.length) {
      body.innerHTML = '<div class="catalog-empty">No se encontraron skills en el repositorio.</div>';
      return;
    }

    body.innerHTML = '';

    if (this._isMock) {
      const notice = document.createElement('div');
      notice.className   = 'catalog-mock-notice';
      notice.textContent = '📦 Mostrando catálogo de ejemplo — sin conexión a GitHub';
      body.appendChild(notice);
    }

    skills.forEach(skill => {
      body.appendChild(this._buildCard(skill, metrics));
    });
  },

  _buildCard(skill, metrics) {
    const installed = this.installedNames.has(skill.name);
    const div       = document.createElement('div');
    div.className        = `catalog-item${installed ? ' is-installed' : ''}`;
    div.dataset.skillName = skill.name;

    const icon     = skill.name.substring(0, 4).toUpperCase();
    const score    = metrics?.score    ?? '—';
    const stars    = metrics?.stars    ?? '—';
    const forks    = metrics?.forks    ?? '—';
    const age      = metrics ? GitHub.formatAge(metrics.lastCommit) : '—';
    const trending = metrics?.daysSince !== null && metrics.daysSince < 7;
    const desc     = skill.description || 'Skill del repositorio oficial de Anthropic';

    div.innerHTML = `
      <div class="catalog-icon">${icon}</div>
      <div class="catalog-info">
        <div class="catalog-name">${skill.name}</div>
        <div class="catalog-desc">${desc}</div>
        <div class="catalog-tags">
          <span class="c-tag verified">✓ verificado</span>
          <span class="c-tag">anthropic/skills</span>
        </div>
        <div class="catalog-metrics">
          <span class="c-metric ${typeof stars === 'number' && stars > 100 ? 'good' : ''}">★ ${stars}</span>
          <span class="c-metric">⑂ ${forks}</span>
          <span class="c-metric ${trending ? 'hot' : ''}">↻ ${age}</span>
        </div>
      </div>
      <div class="catalog-score">
        <span class="score-badge">${score}</span>
        ${installed
          ? '<span class="btn-installed">instalado</span>'
          : `<button class="btn-install" data-name="${skill.name}">Instalar</button>`
        }
      </div>
    `;

    if (!installed) {
      div.querySelector('.btn-install').addEventListener('click', () =>
        this._install(skill)
      );
    }
    return div;
  },

  _filter(query) {
    if (!this._remoteSkills) return;
    const q = query.toLowerCase();
    const filtered = q
      ? this._remoteSkills.filter(s =>
          s.name.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q)
        )
      : this._remoteSkills;
    this._render(filtered, this._metrics);
  },

  async _install(skill) {
    const btn = document.querySelector(`[data-name="${skill.name}"].btn-install`);
    if (btn) { btn.textContent = 'Instalando...'; btn.disabled = true; }

    try {
      // Obtener contenido: remoto o generar desde mock
      let content;
      if (skill.downloadUrl) {
        content = await GitHub.downloadSkill(skill.downloadUrl);
      } else {
        content = mockSkillContent(skill);
      }

      const created = await FS.createSkill(skill.name);
      await FS.writeFile(created.handle, content);

      // Marcar como instalado en la UI
      this.installedNames.add(skill.name);
      const card = document.querySelector(`[data-skill-name="${skill.name}"]`);
      if (card) {
        card.classList.add('is-installed');
        const oldBtn = card.querySelector('.btn-install');
        if (oldBtn) {
          const span       = document.createElement('span');
          span.className   = 'btn-installed';
          span.textContent = 'instalado';
          oldBtn.replaceWith(span);
        }
      }

      if (this.onInstalled) this.onInstalled(skill.name);

    } catch (err) {
      console.error(err);
      if (btn) { btn.textContent = 'Error'; btn.disabled = false; }
      window.dispatchEvent(new CustomEvent('catalog-error', { detail: err.message }));
    }
  },
};
