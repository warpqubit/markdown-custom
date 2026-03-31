// catalog.js — Modal de catálogo con métricas de GitHub + fallback mock
import { GitHub } from './github.js';
import { FS }     from './fs.js';

// ---- MOCK DATA ---------------------------------------------------------------
const now = Date.now();
const daysAgo = d => new Date(now - d * 86400000).toISOString();

const MOCK_SKILLS = [
  // Reasoning
  { name: 'sequential-thinking',   description: 'Descompone problemas complejos en cadenas de razonamiento paso a paso.',    tags: ['reasoning', 'thinking'],    stars: 1842, lastCommit: daysAgo(2),  author: 'anthropic' },
  { name: 'chain-of-thought',      description: 'Genera respuestas usando razonamiento explícito antes de la conclusión.',    tags: ['reasoning', 'thinking'],    stars: 1210, lastCommit: daysAgo(5),  author: 'anthropic' },
  { name: 'socratic-questioning',  description: 'Usa preguntas guiadas para descubrir soluciones junto al usuario.',         tags: ['reasoning', 'teaching'],    stars: 742,  lastCommit: daysAgo(12), author: 'anthropic' },
  { name: 'first-principles',      description: 'Razonamiento desde principios fundamentales sin asumir restricciones.',     tags: ['reasoning', 'analysis'],    stars: 680,  lastCommit: daysAgo(8),  author: 'anthropic' },

  // Memory & Context
  { name: 'memory-management',     description: 'Gestiona contexto de proyecto entre conversaciones de forma persistente.',  tags: ['memory', 'context'],        stars: 2140, lastCommit: daysAgo(1),  author: 'anthropic' },
  { name: 'context-summarizer',    description: 'Resume automáticamente conversaciones largas para preservar contexto.',     tags: ['memory', 'context'],        stars: 920,  lastCommit: daysAgo(4),  author: 'anthropic' },
  { name: 'project-tracker',       description: 'Rastrea tareas, decisiones y progreso del proyecto entre sesiones.',        tags: ['memory', 'productivity'],   stars: 1050, lastCommit: daysAgo(3),  author: 'anthropic' },

  // Coding — Quality
  { name: 'code-review',           description: 'Revisión exhaustiva de código: correctitud, seguridad y mantenibilidad.',   tags: ['coding', 'quality'],        stars: 3120, lastCommit: daysAgo(1),  author: 'anthropic' },
  { name: 'test-driven-dev',       description: 'Desarrollo guiado por tests unitarios, de integración y e2e.',             tags: ['testing', 'quality'],       stars: 1860, lastCommit: daysAgo(6),  author: 'anthropic' },
  { name: 'debugging-systematic',  description: 'Proceso sistemático con hipótesis y evidencia para encontrar bugs.',        tags: ['debugging', 'quality'],     stars: 1340, lastCommit: daysAgo(9),  author: 'anthropic' },
  { name: 'refactoring-patterns',  description: 'Patrones seguros de refactorización sin romper funcionalidad existente.',   tags: ['refactoring', 'quality'],   stars: 980,  lastCommit: daysAgo(14), author: 'anthropic' },
  { name: 'code-generation',       description: 'Genera código limpio, documentado y listo para producción.',               tags: ['coding', 'generation'],     stars: 2450, lastCommit: daysAgo(2),  author: 'anthropic' },

  // Languages & Runtimes
  { name: 'python-data-analysis',  description: 'Análisis de datos con pandas, numpy, matplotlib y scikit-learn.',          tags: ['python', 'data'],           stars: 2880, lastCommit: daysAgo(3),  author: 'anthropic' },
  { name: 'typescript-strict',     description: 'TypeScript con tipos estrictos, generics y patrones avanzados.',            tags: ['typescript', 'coding'],     stars: 1640, lastCommit: daysAgo(7),  author: 'community' },
  { name: 'rust-ownership',        description: 'Explica ownership, borrowing y lifetimes de Rust con ejemplos claros.',     tags: ['rust', 'coding'],           stars: 1120, lastCommit: daysAgo(11), author: 'community' },

  // DevOps & Infrastructure
  { name: 'git-workflow',          description: 'Flujo de trabajo con Git, Conventional Commits y pull requests.',           tags: ['git', 'devops'],            stars: 2210, lastCommit: daysAgo(4),  author: 'anthropic' },
  { name: 'docker-compose-expert', description: 'Configuración de contenedores Docker, compose y orquestación.',             tags: ['docker', 'devops'],         stars: 1450, lastCommit: daysAgo(8),  author: 'anthropic' },
  { name: 'ci-cd-pipeline',        description: 'Configuración de pipelines CI/CD con GitHub Actions y GitLab CI.',          tags: ['cicd', 'devops'],           stars: 1280, lastCommit: daysAgo(10), author: 'anthropic' },

  // Data & API
  { name: 'sql-expert',            description: 'Escribe, optimiza y explica queries SQL complejas para cualquier engine.',   tags: ['sql', 'database'],          stars: 2760, lastCommit: daysAgo(2),  author: 'anthropic' },
  { name: 'data-modeling',         description: 'Diseño de esquemas de base de datos relacionales y NoSQL optimizados.',     tags: ['database', 'architecture'], stars: 1180, lastCommit: daysAgo(13), author: 'anthropic' },
  { name: 'api-design',            description: 'Diseño de APIs REST y GraphQL con buenas prácticas y spec OpenAPI.',        tags: ['api', 'backend'],           stars: 2040, lastCommit: daysAgo(5),  author: 'anthropic' },
  { name: 'graphql-schema',        description: 'Diseño de schemas GraphQL, resolvers eficientes y N+1 prevention.',         tags: ['graphql', 'api'],           stars: 880,  lastCommit: daysAgo(18), author: 'community' },

  // Writing & Docs
  { name: 'technical-writing',     description: 'Redacción de documentación técnica clara, concisa y bien estructurada.',    tags: ['docs', 'writing'],          stars: 1540, lastCommit: daysAgo(6),  author: 'anthropic' },
  { name: 'changelog-generator',   description: 'Genera CHANGELOGs claros a partir de commits y pull requests.',             tags: ['docs', 'devops'],           stars: 640,  lastCommit: daysAgo(20), author: 'community' },
  { name: 'blog-post-writer',      description: 'Redacta artículos técnicos con estructura, ejemplos y SEO básico.',         tags: ['writing', 'content'],       stars: 1020, lastCommit: daysAgo(15), author: 'community' },

  // Research & Analysis
  { name: 'web-research',          description: 'Investiga, sintetiza y cita fuentes web con rigor metodológico.',           tags: ['research', 'analysis'],     stars: 1760, lastCommit: daysAgo(3),  author: 'anthropic' },
  { name: 'competitive-analysis',  description: 'Análisis de competencia con framework estructurado y métricas.',            tags: ['research', 'business'],     stars: 820,  lastCommit: daysAgo(22), author: 'community' },

  // Product & PM
  { name: 'user-story-writer',     description: 'Redacta user stories en formato BDD con criterios de aceptación claros.',   tags: ['pm', 'agile'],              stars: 1120, lastCommit: daysAgo(9),  author: 'anthropic' },
  { name: 'meeting-summarizer',    description: 'Estructura notas de reuniones con decisiones, action items y owners.',      tags: ['pm', 'productivity'],       stars: 940,  lastCommit: daysAgo(7),  author: 'anthropic' },
  { name: 'okr-planning',          description: 'Define OKRs SMART con métricas de seguimiento y planes de acción.',         tags: ['pm', 'business'],           stars: 760,  lastCommit: daysAgo(25), author: 'community' },

  // Security
  { name: 'security-audit',        description: 'Auditoría de seguridad: OWASP Top 10, SAST y mejores prácticas.',           tags: ['security', 'quality'],      stars: 1480, lastCommit: daysAgo(4),  author: 'anthropic' },
  { name: 'system-design',         description: 'Diseño de sistemas escalables con patrones de arquitectura modernos.',      tags: ['architecture', 'backend'],  stars: 2320, lastCommit: daysAgo(6),  author: 'anthropic' },
];

const MOCK_METRICS = {
  stars: 2847, forks: 312,
  lastCommit: daysAgo(2),
  daysSince: 2,
  score: 91,
};

function mockSkillContent(skill) {
  const tagList = skill.tags.map(t => `"${t}"`).join(', ');
  return `---
name: ${skill.name}
description: ${skill.description}
tags: [${tagList}]
version: 1.0.0
author: ${skill.author || 'anthropic'}
---

# ${skill.name}

## Cuándo usar este skill

${skill.description}

## Instrucciones

1. Activar este skill cuando el usuario necesite ayuda con: ${skill.tags.join(', ')}.
2. Seguir las guías y mejores prácticas específicas del área.
3. Proporcionar respuestas estructuradas con ejemplos concretos.
4. Verificar el resultado final antes de entregar.

## Notas

- Skill del catálogo oficial de Markdown Custom.
- Actualizado regularmente con mejores prácticas del sector.
- Tags: ${skill.tags.join(', ')}.
`;
}

// ---- CATÁLOGO ----------------------------------------------------------------
export const Catalog = {
  installedNames: new Set(),
  onInstalled:    null,
  _isMock:        false,
  _remoteSkills:  null,
  _metrics:       null,
  _activeTag:     null,

  init(installedSkills, onInstalledCb) {
    this.installedNames = new Set(installedSkills.map(s => s.name));
    this.onInstalled    = onInstalledCb;

    // Remover listener previo clonando el nodo
    const btnCatalog = document.getElementById('btn-catalog');
    const fresh = btnCatalog.cloneNode(true);
    btnCatalog.parentNode.replaceChild(fresh, btnCatalog);
    fresh.addEventListener('click', () => this.open());

    const searchInput = document.getElementById('catalog-search');
    searchInput.addEventListener('input', e => this._filter(e.target.value));
  },

  async open() {
    this._activeTag = null;
    document.getElementById('modal-catalog').classList.remove('hidden');
    document.getElementById('catalog-search').value = '';
    await this._load();
  },

  async _load() {
    const body = document.getElementById('catalog-body');
    body.innerHTML = '<div class="catalog-loading">Conectando con GitHub...</div>';
    document.getElementById('catalog-tags').innerHTML = '';

    try {
      const [skills, metrics] = await Promise.all([
        GitHub.listRemoteSkills(),
        GitHub.getRepoMetrics(),
      ]);

      // Enriquecer skills remotos con descripción si tienen frontmatter
      this._remoteSkills = skills;
      this._metrics      = metrics;
      this._isMock       = false;
      this._render(skills, metrics);
    } catch (_err) {
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

    // Tag chips — siempre reflejan el dataset completo
    this._renderTagChips(this._remoteSkills || skills);

    body.innerHTML = '';

    if (this._isMock) {
      const notice = document.createElement('div');
      notice.className   = 'catalog-mock-notice';
      notice.textContent = '📦 Modo sin conexión — mostrando catálogo de ejemplo';
      body.appendChild(notice);
    }

    skills.forEach(skill => {
      body.appendChild(this._buildCard(skill, metrics));
    });
  },

  _renderTagChips(skills) {
    const bar = document.getElementById('catalog-tags');
    if (!bar) return;

    // Recopilar tags únicos en orden de aparición
    const seen = new Set();
    const tags = [];
    skills.forEach(s => {
      (s.tags || []).forEach(t => {
        if (!seen.has(t)) { seen.add(t); tags.push(t); }
      });
    });

    bar.innerHTML = '';

    // "Todos"
    const allChip = document.createElement('button');
    allChip.className   = `c-chip${this._activeTag === null ? ' active' : ''}`;
    allChip.textContent = 'Todos';
    allChip.addEventListener('click', () => {
      this._activeTag = null;
      this._filter(document.getElementById('catalog-search').value);
    });
    bar.appendChild(allChip);

    tags.forEach(tag => {
      const chip = document.createElement('button');
      chip.className   = `c-chip${this._activeTag === tag ? ' active' : ''}`;
      chip.textContent = tag;
      chip.addEventListener('click', () => {
        this._activeTag = this._activeTag === tag ? null : tag;
        this._filter(document.getElementById('catalog-search').value);
      });
      bar.appendChild(chip);
    });
  },

  _buildCard(skill, metrics) {
    const installed = this.installedNames.has(skill.name);
    const div       = document.createElement('div');
    div.className        = `catalog-item${installed ? ' is-installed' : ''}`;
    div.dataset.skillName = skill.name;

    const icon = skill.name.substring(0, 4).toUpperCase();
    const desc = skill.description || 'Skill del repositorio oficial de Anthropic';

    // Métricas: per-skill si disponible, fallback a repo
    const stars    = skill.stars    ?? metrics?.stars    ?? '—';
    const lastCmt  = skill.lastCommit ?? metrics?.lastCommit ?? null;
    const forks    = metrics?.forks   ?? '—';
    const score    = metrics?.score   ?? '—';
    const age      = lastCmt ? GitHub.formatAge(lastCmt) : '—';

    const daysAgo  = lastCmt ? Math.floor((Date.now() - new Date(lastCmt)) / 86400000) : null;
    const trending = daysAgo !== null && daysAgo < 7;
    const author   = skill.author || 'anthropic';
    const isOfficial = author === 'anthropic';

    // Tags del skill
    const tagsHtml = (skill.tags || []).map(t =>
      `<span class="c-tag">${t}</span>`
    ).join('');

    div.innerHTML = `
      <div class="catalog-icon">${icon}</div>
      <div class="catalog-info">
        <div class="catalog-name">${skill.name}</div>
        <div class="catalog-desc">${desc}</div>
        <div class="catalog-tags">
          <span class="c-tag ${isOfficial ? 'verified' : 'community'}">
            ${isOfficial ? '✓ verificado' : '◈ community'}
          </span>
          ${tagsHtml}
        </div>
        <div class="catalog-metrics">
          <span class="c-metric ${typeof stars === 'number' && stars > 1000 ? 'good' : ''}">★ ${stars}</span>
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

    let filtered = q
      ? this._remoteSkills.filter(s =>
          s.name.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          (s.tags || []).some(t => t.includes(q))
        )
      : [...this._remoteSkills];

    if (this._activeTag) {
      filtered = filtered.filter(s => (s.tags || []).includes(this._activeTag));
    }

    this._render(filtered, this._metrics);
  },

  async _install(skill) {
    const btn = document.querySelector(`[data-name="${skill.name}"].btn-install`);
    if (btn) { btn.textContent = 'Instalando...'; btn.disabled = true; }

    try {
      let content;
      if (skill.downloadUrl) {
        content = await GitHub.downloadSkill(skill.downloadUrl);
      } else {
        content = mockSkillContent(skill);
      }

      const created = await FS.createSkill(skill.name);
      await FS.writeFile(created.handle, content);

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
