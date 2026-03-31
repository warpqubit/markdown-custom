// githubSkills.js — GitHub API v3 integration for SKILL.md discovery
const BASE = 'https://api.github.com';

function _headers(token = '') {
  const h = { 'Accept': 'application/vnd.github.v3+json' };
  if (token) h['Authorization'] = `token ${token}`;
  return h;
}

async function _apiFetch(url, token = '') {
  const res = await fetch(url, { headers: _headers(token) });
  if (res.status === 403) {
    throw new Error('Rate limit alcanzado. Agregá un token personal para 5.000 req/hora.');
  }
  if (res.status === 422) {
    throw new Error('La búsqueda requiere autenticación (422). Ingresá un token ghp_...');
  }
  if (res.status === 401) {
    throw new Error('Token inválido o expirado (401). Verificá el token.');
  }
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Busca archivos SKILL.md en repos públicos de GitHub.
 * @returns {Promise<Array<{repo, fullName, path, stars, forks, updatedAt}>>}
 */
export async function searchSkillFiles(token = '') {
  const data = await _apiFetch(
    `${BASE}/search/code?q=SKILL.md+in:path&per_page=30`,
    token
  );
  return (data.items || []).map(item => ({
    repo:      item.repository.full_name,
    fullName:  item.repository.full_name,
    path:      item.path,
    stars:     item.repository.stargazers_count ?? 0,
    forks:     item.repository.forks_count      ?? 0,
    updatedAt: item.repository.updated_at        ?? '',
  }));
}

/**
 * Lee el contenido de un SKILL.md desde la API de GitHub.
 * @returns {Promise<string>} Markdown decodificado
 */
export async function fetchSkillContent(fullName, path, token = '') {
  const data = await _apiFetch(
    `${BASE}/repos/${fullName}/contents/${path}`,
    token
  );
  if (!data.content) throw new Error('No se pudo obtener el contenido del archivo.');
  return atob(data.content.replace(/\n/g, ''));
}

/**
 * Extrae métricas básicas del markdown.
 * @returns {{ name, description, wordCount, hasExamples, hasTriggers }}
 */
export function parseSkillMetrics(markdownContent) {
  let name = '', description = '';

  const fmMatch = markdownContent.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm    = fmMatch[1];
    const nameM = fm.match(/^name:\s*(.+)$/m);
    const descM = fm.match(/^description:\s*(.+)$/m);
    if (nameM) name        = nameM[1].trim().replace(/^['"]|['"]$/g, '');
    if (descM) description = descM[1].trim().replace(/^['"]|['"]$/g, '');
  }

  // Fallback: primer H1 como nombre
  if (!name) {
    const h1 = markdownContent.match(/^#\s+(.+)$/m);
    if (h1) name = h1[1].trim();
  }

  const wordCount   = markdownContent.split(/\s+/).filter(Boolean).length;
  const hasExamples = /##\s*(example|ejemplo|uso|usage)/i.test(markdownContent);
  const hasTriggers = /##\s*(trigger|cuándo usar|cuando usar|activar|when to use)/i.test(markdownContent);

  return { name, description, wordCount, hasExamples, hasTriggers };
}

/**
 * Devuelve el rate limit actual de la API de GitHub.
 * @returns {Promise<{limit, remaining, reset}>}
 */
export async function getRateLimit(token = '') {
  const data = await _apiFetch(`${BASE}/rate_limit`, token);
  const r    = data.resources?.search || data.resources?.core || data.rate || {};
  return {
    limit:     r.limit     ?? 60,
    remaining: r.remaining ?? 0,
    reset:     r.reset     ?? 0,
  };
}
