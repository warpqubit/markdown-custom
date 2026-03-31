// github.js — GitHub API para métricas de skills
// Usa el repo oficial: github.com/anthropics/skills
// Sin autenticación — límite 60 req/hora por IP

const CACHE_KEY = 'mc_gh_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora en ms
const BASE      = 'https://api.github.com';
const REPO      = 'anthropics/skills'; // repo oficial Anthropic

export const GitHub = {

  // Cache en sessionStorage para no spamear la API
  _cache: null,

  _loadCache() {
    if (this._cache) return;
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      this._cache = raw ? JSON.parse(raw) : {};
    } catch { this._cache = {}; }
  },

  _saveCache() {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(this._cache)); } catch {}
  },

  _get(key) {
    this._loadCache();
    const entry = this._cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.data;
  },

  _set(key, data) {
    this._loadCache();
    this._cache[key] = { ts: Date.now(), data };
    this._saveCache();
  },

  // Fetch con cache
  async _fetch(url) {
    const cached = this._get(url);
    if (cached) return cached;
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
    const data = await res.json();
    this._set(url, data);
    return data;
  },

  // ---- Info del repo principal de Anthropic ----
  async getRepoInfo() {
    return await this._fetch(`${BASE}/repos/${REPO}`);
  },

  // ---- Lista de skills disponibles en el repo ----
  // Busca carpetas en la raíz del repo que tengan SKILL.md
  async listRemoteSkills() {
    const cached = this._get('remote_skills');
    if (cached) return cached;

    // Obtener contenido del repo raíz
    const contents = await this._fetch(`${BASE}/repos/${REPO}/contents`);
    const skills = [];

    for (const item of contents) {
      if (item.type !== 'dir') continue;
      // Intentar obtener el SKILL.md dentro de cada carpeta
      try {
        const inner = await this._fetch(`${BASE}/repos/${REPO}/contents/${item.name}`);
        const skillFile = inner.find(f => f.name === 'SKILL.md');
        if (skillFile) {
          skills.push({
            name: item.name,
            path: `${item.name}/SKILL.md`,
            downloadUrl: skillFile.download_url,
            sha: skillFile.sha,
          });
        }
      } catch { /* carpeta sin SKILL.md */ }
    }

    this._set('remote_skills', skills);
    return skills;
  },

  // ---- Métricas del repo completo ----
  async getRepoMetrics() {
    const cached = this._get('repo_metrics');
    if (cached) return cached;

    const [repo, commits] = await Promise.all([
      this._fetch(`${BASE}/repos/${REPO}`),
      this._fetch(`${BASE}/repos/${REPO}/commits?per_page=1`),
    ]);

    const lastCommit = commits[0]?.commit?.committer?.date ?? null;
    const daysSince  = lastCommit
      ? Math.floor((Date.now() - new Date(lastCommit)) / 86400000)
      : null;

    const metrics = {
      stars:       repo.stargazers_count,
      forks:       repo.forks_count,
      watchers:    repo.watchers_count,
      openIssues:  repo.open_issues_count,
      lastCommit,
      daysSince,
      updatedAt:   repo.updated_at,
      score:       this._calcScore(repo.stargazers_count, repo.forks_count, daysSince),
    };

    this._set('repo_metrics', metrics);
    return metrics;
  },

  // ---- Descarga el contenido de un SKILL.md remoto ----
  async downloadSkill(downloadUrl) {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error('No se pudo descargar el skill');
    return await res.text();
  },

  // ---- Score compuesto 0-100 ----
  _calcScore(stars, forks, daysSince) {
    const s = Math.min(stars / 20, 50);      // hasta 50 pts por stars
    const f = Math.min(forks / 5,  30);      // hasta 30 pts por forks
    const a = daysSince !== null              // hasta 20 pts por actividad
      ? Math.max(0, 20 - daysSince * 0.5)
      : 0;
    return Math.round(s + f + a);
  },

  // ---- Formatea la antigüedad ----
  formatAge(dateStr) {
    if (!dateStr) return 'desconocido';
    const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7)  return `hace ${days} días`;
    if (days < 30) return `hace ${Math.floor(days/7)} sem`;
    if (days < 365) return `hace ${Math.floor(days/30)} meses`;
    return `hace ${Math.floor(days/365)} años`;
  },
};
