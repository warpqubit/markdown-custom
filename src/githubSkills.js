/**
 * Markdown Custom — githubSkills.js
 * Integración con GitHub API v3 para descubrimiento de SKILL.md.
 *
 * Developed by Warpqubit Software
 * © 2025 Warpqubit — warpqubit@gmail.com
 */
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
 * Decodifica base64 a UTF-8 correctamente (atob() sólo maneja Latin-1).
 */
function _b64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function _mapItem(item) {
  return {
    repo:      item.repository.full_name,
    fullName:  item.repository.full_name,
    path:      item.path,
    stars:     item.repository.stargazers_count ?? 0,
    forks:     item.repository.forks_count      ?? 0,
    updatedAt: item.repository.updated_at        ?? '',
    // content y metrics se rellenan lazily desde app.js
    content:   null,
    metrics:   null,
    _enriched: false,
  };
}

/**
 * Busca archivos SKILL.md en repos públicos de GitHub.
 * Itera páginas de 100 hasta agotar resultados o alcanzar maxItems.
 * @param {string}   query     Término de búsqueda
 * @param {string}   token     PAT de GitHub
 * @param {number}   maxItems  Máximo de resultados a traer (default 300)
 * @param {Function} onPage    Callback opcional llamado tras cada página: onPage(fetched, total)
 * @returns {Promise<Array>}
 */
export async function searchSkillFilesAll(query = '', token = '', maxItems = 300, onPage = null) {
  const term = query.trim()
    ? `${query.trim()} filename:SKILL.md`
    : 'filename:SKILL.md';

  const allItems = [];
  let page = 1;

  while (allItems.length < maxItems) {
    const data = await _apiFetch(
      `${BASE}/search/code?q=${encodeURIComponent(term)}&per_page=100&page=${page}`,
      token
    );

    const items = (data.items || []).map(_mapItem);
    allItems.push(...items);

    if (onPage) onPage(allItems.length, data.total_count ?? allItems.length);

    // ¿Hay más páginas?
    if (items.length < 100) break;
    if (allItems.length >= maxItems) break;

    page++;
    // Pausa para respetar el rate-limit de search (30 req/min con auth)
    await new Promise(r => setTimeout(r, 500));
  }

  return allItems;
}

/**
 * Lee el contenido de un SKILL.md desde la API de GitHub.
 * Usa TextDecoder para decodificar UTF-8 correctamente.
 * @returns {Promise<string>} Markdown decodificado
 */
export async function fetchSkillContent(fullName, path, token = '') {
  const data = await _apiFetch(
    `${BASE}/repos/${fullName}/contents/${path}`,
    token
  );
  if (!data.content) throw new Error('No se pudo obtener el contenido del archivo.');
  return _b64ToUtf8(data.content.replace(/\n/g, ''));
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
