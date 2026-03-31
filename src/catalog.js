// catalog.js — Catálogo con downloadUrl reales desde skills.sh + MCP
import { GitHub } from './github.js';
import { FS }     from './fs.js';

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────
const now = Date.now();
const daysAgo = d => new Date(now - d * 86400000).toISOString();

/** URL raw de GitHub al archivo SKILL.md */
const RAW = (owner, repo, filePath, branch = 'main') =>
  `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;

function formatInstalls(n) {
  if (!n) return null;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M/sem`;
  if (n >= 1000)    return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K/sem`;
  return `${n}/sem`;
}
function formatStars(n) {
  if (!n) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}

// ─────────────────────────────────────────────────────────────────
//  SKILLS CON downloadUrl REALES
//  Ruta confirmada: skills/{name}/SKILL.md  (en la mayoría de repos)
// ─────────────────────────────────────────────────────────────────
const MOCK_SKILLS = [

  // ══════════════════════════════════════════════════
  //  anthropics/skills — 106K ⭐ — OFICIAL
  //  Ruta: skills/{name}/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'frontend-design', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Crea interfaces frontend de producción: tipografía, color, motion, composición espacial. Evita estéticas AI genéricas.',
    tags: ['frontend', 'design', 'ui', 'css'], installs: 222200, stars: 106600, lastCommit: daysAgo(1),
    downloadUrl: RAW('anthropics','skills','skills/frontend-design/SKILL.md'),
  },
  {
    name: 'skill-creator', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Ciclo completo para crear, testear y mejorar skills con A/B testing paralelo y browser review interactivo.',
    tags: ['meta', 'skills', 'testing'], installs: 118000, stars: 106600, lastCommit: daysAgo(1),
    downloadUrl: RAW('anthropics','skills','skills/skill-creator/SKILL.md'),
  },
  {
    name: 'pdf', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Procesamiento exhaustivo de PDFs: extracción, merge, split, formularios, OCR con pypdf y pdfplumber.',
    tags: ['pdf', 'documents', 'files', 'python'], installs: 56600, stars: 106600, lastCommit: daysAgo(2),
    downloadUrl: RAW('anthropics','skills','skills/pdf/SKILL.md'),
  },
  {
    name: 'pptx', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Lee, genera y ajusta slides de PowerPoint con control total de layouts, paletas y tipografías.',
    tags: ['powerpoint', 'documents', 'presentations'], installs: 52000, stars: 106600, lastCommit: daysAgo(2),
    downloadUrl: RAW('anthropics','skills','skills/pptx/SKILL.md'),
  },
  {
    name: 'docx', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Crea, edita y analiza documentos Word con formato avanzado, tracked changes, tablas e imágenes.',
    tags: ['word', 'documents', 'files'], installs: 44600, stars: 106600, lastCommit: daysAgo(3),
    downloadUrl: RAW('anthropics','skills','skills/docx/SKILL.md'),
  },
  {
    name: 'xlsx', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Manipulación de hojas de cálculo con fórmulas, tablas dinámicas, gráficos y financial model standards.',
    tags: ['excel', 'spreadsheets', 'data', 'python'], installs: 40500, stars: 106600, lastCommit: daysAgo(3),
    downloadUrl: RAW('anthropics','skills','skills/xlsx/SKILL.md'),
  },
  {
    name: 'webapp-testing', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Testea apps web locales con Playwright: reconnaissance-then-action pattern, with_server.py helper.',
    tags: ['testing', 'playwright', 'e2e', 'automation'], installs: 36500, stars: 106600, lastCommit: daysAgo(4),
    downloadUrl: RAW('anthropics','skills','skills/webapp-testing/SKILL.md'),
  },
  {
    name: 'mcp-builder', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Crea servidores MCP para integrar APIs externas con Claude. 4 fases: research, implement, review, eval.',
    tags: ['mcp', 'api', 'backend', 'typescript'], installs: 29800, stars: 106600, lastCommit: daysAgo(4),
    downloadUrl: RAW('anthropics','skills','skills/mcp-builder/SKILL.md'),
  },
  {
    name: 'canvas-design', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Crea arte visual en PNG/PDF: filosofía de diseño (.md) → expresión visual (.pdf o .png).',
    tags: ['design', 'canvas', 'art', 'visual'], installs: 28400, stars: 106600, lastCommit: daysAgo(5),
    downloadUrl: RAW('anthropics','skills','skills/canvas-design/SKILL.md'),
  },
  {
    name: 'algorithmic-art', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Arte algorítmico con p5.js y seeded randomness: filosofía generativa + artifact HTML interactivo.',
    tags: ['art', 'generative', 'creative', 'javascript'], installs: 22100, stars: 106600, lastCommit: daysAgo(5),
    downloadUrl: RAW('anthropics','skills','skills/algorithmic-art/SKILL.md'),
  },
  {
    name: 'theme-factory', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Aplica 10 temas predefinidos con fuentes y paletas a artifacts. Soporta generación de temas custom.',
    tags: ['design', 'themes', 'typography', 'css'], installs: 21300, stars: 106600, lastCommit: daysAgo(6),
    downloadUrl: RAW('anthropics','skills','skills/theme-factory/SKILL.md'),
  },
  {
    name: 'doc-coauthoring', repo: 'anthropics/skills', author: 'anthropic',
    description: '3 etapas: Context Gathering → Refinement & Structure → Reader Testing con subagentes.',
    tags: ['documents', 'writing', 'collaboration'], installs: 21500, stars: 106600, lastCommit: daysAgo(6),
    downloadUrl: RAW('anthropics','skills','skills/doc-coauthoring/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  obra/superpowers — 125K ⭐
  //  Ruta: skills/{name}/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'brainstorming', repo: 'obra/superpowers', author: 'community',
    description: 'Diálogo socrático de diseño con hard gate: 9 pasos antes de escribir una línea de código.',
    tags: ['design', 'planning', 'workflow'], installs: 81400, stars: 125500, lastCommit: daysAgo(2),
    downloadUrl: RAW('obra','superpowers','skills/brainstorming/SKILL.md'),
  },
  {
    name: 'systematic-debugging', repo: 'obra/superpowers', author: 'community',
    description: '4 fases de root-cause analysis: tracing, defensa en profundidad, condición-espera, verificación.',
    tags: ['debugging', 'quality', 'workflow'], installs: 45100, stars: 125500, lastCommit: daysAgo(3),
    downloadUrl: RAW('obra','superpowers','skills/systematic-debugging/SKILL.md'),
  },
  {
    name: 'writing-plans', repo: 'obra/superpowers', author: 'community',
    description: 'Planes de implementación con estructura de archivos, tareas detalladas y código real — sin placeholders.',
    tags: ['planning', 'workflow', 'architecture'], installs: 44000, stars: 125500, lastCommit: daysAgo(3),
    downloadUrl: RAW('obra','superpowers','skills/writing-plans/SKILL.md'),
  },
  {
    name: 'test-driven-development', repo: 'obra/superpowers', author: 'community',
    description: 'RED-GREEN-REFACTOR con iron law, checklist de verificación y tabla de anti-patrones.',
    tags: ['testing', 'tdd', 'quality'], installs: 37900, stars: 125500, lastCommit: daysAgo(4),
    downloadUrl: RAW('obra','superpowers','skills/test-driven-development/SKILL.md'),
  },
  {
    name: 'requesting-code-review', repo: 'obra/superpowers', author: 'community',
    description: 'Despacha subagente code-reviewer con git SHAs y contexto preciso antes del merge.',
    tags: ['code-review', 'workflow', 'quality'], installs: 36400, stars: 125500, lastCommit: daysAgo(4),
    downloadUrl: RAW('obra','superpowers','skills/requesting-code-review/SKILL.md'),
  },
  {
    name: 'subagent-driven-development', repo: 'obra/superpowers', author: 'community',
    description: 'Subagente fresco por tarea con revisión en dos etapas: spec compliance + calidad de código.',
    tags: ['agents', 'workflow', 'parallel'], installs: 31300, stars: 125500, lastCommit: daysAgo(5),
    downloadUrl: RAW('obra','superpowers','skills/subagent-driven-development/SKILL.md'),
  },
  {
    name: 'dispatching-parallel-agents', repo: 'obra/superpowers', author: 'community',
    description: 'Un agente por dominio de problema independiente, con coordinación y síntesis de resultados.',
    tags: ['agents', 'parallel', 'workflow'], installs: 27300, stars: 125500, lastCommit: daysAgo(5),
    downloadUrl: RAW('obra','superpowers','skills/dispatching-parallel-agents/SKILL.md'),
  },
  {
    name: 'using-git-worktrees', repo: 'obra/superpowers', author: 'community',
    description: 'Worktrees de git aislados con verificación de .gitignore y setup automático del proyecto.',
    tags: ['git', 'workflow', 'devops'], installs: 27400, stars: 125500, lastCommit: daysAgo(6),
    downloadUrl: RAW('obra','superpowers','skills/using-git-worktrees/SKILL.md'),
  },
  {
    name: 'verification-before-completion', repo: 'obra/superpowers', author: 'community',
    description: 'Gate function: identificar comando → correr fresh → leer output → verificar antes de declarar éxito.',
    tags: ['quality', 'workflow', 'validation'], installs: 29500, stars: 125500, lastCommit: daysAgo(6),
    downloadUrl: RAW('obra','superpowers','skills/verification-before-completion/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  vercel-labs/agent-skills — 24K ⭐
  //  Nombres internos distintos a los de skills.sh
  // ══════════════════════════════════════════════════
  {
    name: 'react-best-practices', repo: 'vercel-labs/agent-skills', author: 'community',
    description: '67 reglas en 8 categorías: eliminar waterfalls, bundle size, SSR caching, data fetching, re-render optimization.',
    tags: ['react', 'nextjs', 'performance', 'frontend'], installs: 263700, stars: 24100, lastCommit: daysAgo(1),
    downloadUrl: RAW('vercel-labs','agent-skills','skills/react-best-practices/SKILL.md'),
  },
  {
    name: 'web-design-guidelines', repo: 'vercel-labs/agent-skills', author: 'community',
    description: 'Fetches y revisa las Vercel web-interface-guidelines para compliance de diseño.',
    tags: ['design', 'frontend', 'ui', 'css'], installs: 212900, stars: 24100, lastCommit: daysAgo(2),
    downloadUrl: RAW('vercel-labs','agent-skills','skills/web-design-guidelines/SKILL.md'),
  },
  {
    name: 'deploy-to-vercel', repo: 'vercel-labs/agent-skills', author: 'community',
    description: 'Guía completa de deploy en Vercel: git push, env vars, teams, fallback sin auth para sandboxes.',
    tags: ['vercel', 'deployment', 'devops', 'nextjs'], installs: 18300, stars: 24100, lastCommit: daysAgo(3),
    downloadUrl: RAW('vercel-labs','agent-skills','skills/deploy-to-vercel/SKILL.md'),
  },
  {
    name: 'composition-patterns', repo: 'vercel-labs/agent-skills', author: 'community',
    description: 'Patrones de composición React/Next.js: evitar boolean props, compound components, React 19 APIs.',
    tags: ['react', 'nextjs', 'architecture', 'patterns'], installs: 107300, stars: 24100, lastCommit: daysAgo(4),
    downloadUrl: RAW('vercel-labs','agent-skills','skills/composition-patterns/SKILL.md'),
  },
  {
    name: 'vercel-cli-with-tokens', repo: 'vercel-labs/agent-skills', author: 'community',
    description: 'Auth de Vercel CLI con tokens sin login interactivo: env vars, project/team location, deploy flow.',
    tags: ['vercel', 'cli', 'devops', 'auth'], installs: 48300, stars: 24100, lastCommit: daysAgo(5),
    downloadUrl: RAW('vercel-labs','agent-skills','skills/vercel-cli-with-tokens/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  pbakaus/impeccable
  //  Ruta: .agents/skills/{name}/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'impeccable-frontend', repo: 'pbakaus/impeccable', author: 'community',
    description: 'Fork avanzado de frontend-design: Context Gathering Protocol, DO/DON\'T por dominio, AI Slop Test.',
    tags: ['design', 'frontend', 'ui', 'typography'], installs: 36700, stars: 15200, lastCommit: daysAgo(3),
    downloadUrl: RAW('pbakaus','impeccable','.agents/skills/frontend-design/SKILL.md'),
  },
  {
    name: 'impeccable-audit', repo: 'pbakaus/impeccable', author: 'community',
    description: 'Auditoría exhaustiva de diseño: tipografía, color, espaciado, motion, interacción, responsive, UX writing.',
    tags: ['design', 'audit', 'quality'], installs: 34800, stars: 15200, lastCommit: daysAgo(3),
    downloadUrl: RAW('pbakaus','impeccable','.agents/skills/audit/SKILL.md'),
  },
  {
    name: 'impeccable-animate', repo: 'pbakaus/impeccable', author: 'community',
    description: 'Agrega motion con propósito a interfaces: animaciones de alto impacto, staggered reveals, hover states.',
    tags: ['design', 'animation', 'css', 'frontend'], installs: 34700, stars: 15200, lastCommit: daysAgo(4),
    downloadUrl: RAW('pbakaus','impeccable','.agents/skills/animate/SKILL.md'),
  },
  {
    name: 'impeccable-critique', repo: 'pbakaus/impeccable', author: 'community',
    description: 'Revisión crítica de diseño con feedback accionable categorizado por dominio de diseño.',
    tags: ['design', 'critique', 'quality'], installs: 35200, stars: 15200, lastCommit: daysAgo(4),
    downloadUrl: RAW('pbakaus','impeccable','.agents/skills/critique/SKILL.md'),
  },
  {
    name: 'impeccable-polish', repo: 'pbakaus/impeccable', author: 'community',
    description: 'Refina y eleva la calidad visual de una interfaz con atención a micro-detalles.',
    tags: ['design', 'polish', 'ui'], installs: 35900, stars: 15200, lastCommit: daysAgo(4),
    downloadUrl: RAW('pbakaus','impeccable','.agents/skills/polish/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  coreyhaines31/marketingskills — 17.6K ⭐
  //  Ruta: skills/{name}/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'seo-audit', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Auditoría SEO completa: crawlabilidad, indexación, Core Web Vitals, on-page y E-E-A-T. Específica por tipo de sitio.',
    tags: ['seo', 'marketing', 'audit'], installs: 60700, stars: 17600, lastCommit: daysAgo(2),
    downloadUrl: RAW('coreyhaines31','marketingskills','skills/seo-audit/SKILL.md'),
  },
  {
    name: 'copywriting', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Conversion copywriting: AIDA, PAS, page-specific guidance para homepage/landing/pricing/feature.',
    tags: ['copywriting', 'marketing', 'writing', 'conversion'], installs: 52400, stars: 17600, lastCommit: daysAgo(3),
    downloadUrl: RAW('coreyhaines31','marketingskills','skills/copywriting/SKILL.md'),
  },
  {
    name: 'marketing-psychology', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Mental models: Cialdini, anchoring, framing, pricing psychology, nudge theory, network effects.',
    tags: ['marketing', 'psychology', 'conversion'], installs: 38300, stars: 17600, lastCommit: daysAgo(4),
    downloadUrl: RAW('coreyhaines31','marketingskills','skills/marketing-psychology/SKILL.md'),
  },
  {
    name: 'content-strategy', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Searchable vs. shareable, topic clusters, keyword research por buyer stage, priorización de contenido.',
    tags: ['content', 'marketing', 'seo', 'strategy'], installs: 34600, stars: 17600, lastCommit: daysAgo(5),
    downloadUrl: RAW('coreyhaines31','marketingskills','skills/content-strategy/SKILL.md'),
  },
  {
    name: 'programmatic-seo', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'SEO programático para escalar tráfico orgánico con templates, automatización y contenido a escala.',
    tags: ['seo', 'marketing', 'automation', 'scale'], installs: 34300, stars: 17600, lastCommit: daysAgo(6),
    downloadUrl: RAW('coreyhaines31','marketingskills','skills/programmatic-seo/SKILL.md'),
  },
  {
    name: 'cold-email', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Secuencias de email frío de alta conversión con personalización, seguimiento y A/B testing.',
    tags: ['email', 'marketing', 'sales', 'outreach'], installs: 19800, stars: 17600, lastCommit: daysAgo(7),
    downloadUrl: RAW('coreyhaines31','marketingskills','skills/cold-email/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  browser-use/browser-use — 42K ⭐
  //  Ruta: skills/browser-use/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'browser-use', repo: 'browser-use/browser-use', author: 'community',
    description: 'Browser automation CLI para agentes AI: modos headed/profile/CDP, navegación, extracción, cookies, Python sessions.',
    tags: ['browser', 'automation', 'agents', 'scraping'], installs: 58900, stars: 42000, lastCommit: daysAgo(1),
    downloadUrl: RAW('browser-use','browser-use','skills/browser-use/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  shadcn-ui/ui — 94K ⭐
  //  Ruta: skills/shadcn/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'shadcn-ui', repo: 'shadcn/ui', author: 'community',
    description: 'Gestión de componentes shadcn/ui: reglas críticas, tabla de selección, CLI con dry-run/diff, theming.',
    tags: ['shadcn', 'react', 'ui', 'components', 'tailwind'], installs: 52600, stars: 94000, lastCommit: daysAgo(1),
    downloadUrl: RAW('shadcn-ui','ui','skills/shadcn/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  supabase/agent-skills — 12.4K ⭐
  //  Ruta: skills/supabase-postgres-best-practices/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'supabase-postgres', repo: 'supabase/agent-skills', author: 'community',
    description: '8 categorías: query performance, connection management, RLS, schema design, concurrency, monitoring.',
    tags: ['supabase', 'postgres', 'database', 'rls', 'security'], installs: 58000, stars: 12400, lastCommit: daysAgo(3),
    downloadUrl: RAW('supabase','agent-skills','skills/supabase-postgres-best-practices/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  remotion-dev/skills — 21K ⭐
  //  Ruta: skills/remotion/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'remotion', repo: 'remotion-dev/skills', author: 'community',
    description: '27 reglas para Remotion: 3D, animations, assets, audio, captions, charts, fonts, GIFs, timing, transitions.',
    tags: ['remotion', 'video', 'javascript', 'animation', 'typescript'], installs: 189800, stars: 21000, lastCommit: daysAgo(2),
    downloadUrl: RAW('remotion-dev','skills','skills/remotion/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  better-auth/skills — 15.6K ⭐
  //  Ruta: better-auth/best-practices/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'better-auth', repo: 'better-auth/skills', author: 'community',
    description: 'Better Auth: setup, env vars, session management (cookie cache), database adapters, plugins, gotchas.',
    tags: ['auth', 'security', 'backend', 'typescript'], installs: 30100, stars: 15600, lastCommit: daysAgo(4),
    downloadUrl: RAW('better-auth','skills','better-auth/best-practices/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  inferen-sh/skills — 9.8K ⭐
  //  Ruta standard: skills/{name}/SKILL.md
  // ══════════════════════════════════════════════════
  {
    name: 'ai-image-generation', repo: 'inferen-sh/skills', author: 'community',
    description: 'Generación de imágenes con APIs de AI: DALL-E, Midjourney, Stability AI y Flux.',
    tags: ['ai', 'images', 'generation', 'creative'], installs: 114800, stars: 9800, lastCommit: daysAgo(2),
    downloadUrl: RAW('inferen-sh','skills','skills/ai-image-generation/SKILL.md'),
  },
  {
    name: 'elevenlabs-tts', repo: 'inferen-sh/skills', author: 'community',
    description: 'Text-to-speech de alta calidad y clonación de voz via API de ElevenLabs.',
    tags: ['tts', 'audio', 'ai', 'voice'], installs: 52000, stars: 9800, lastCommit: daysAgo(3),
    downloadUrl: RAW('inferen-sh','skills','skills/elevenlabs-tts/SKILL.md'),
  },
  {
    name: 'python-executor', repo: 'inferen-sh/skills', author: 'community',
    description: 'Ejecuta código Python en sandbox seguro y retorna resultados, stdout y errores.',
    tags: ['python', 'sandbox', 'execution', 'coding'], installs: 14600, stars: 9800, lastCommit: daysAgo(6),
    downloadUrl: RAW('inferen-sh','skills','skills/python-executor/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  wshobson/agents — 8.4K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'tailwind-design-system', repo: 'wshobson/agents', author: 'community',
    description: 'Sistema de diseño con Tailwind CSS: tokens de diseño, componentes reutilizables y guías de estilo.',
    tags: ['tailwind', 'css', 'design', 'frontend'], installs: 25900, stars: 8400, lastCommit: daysAgo(5),
    downloadUrl: RAW('wshobson','agents','skills/tailwind-design-system/SKILL.md'),
  },
  {
    name: 'typescript-advanced-types', repo: 'wshobson/agents', author: 'community',
    description: 'Generics, conditional types, mapped types, template literals e inference avanzada en TypeScript.',
    tags: ['typescript', 'coding', 'types'], installs: 19100, stars: 8400, lastCommit: daysAgo(7),
    downloadUrl: RAW('wshobson','agents','skills/typescript-advanced-types/SKILL.md'),
  },
  {
    name: 'nodejs-backend-patterns', repo: 'wshobson/agents', author: 'community',
    description: 'Patrones de arquitectura backend Node.js: middleware, DI, estructura modular, error handling.',
    tags: ['nodejs', 'backend', 'architecture', 'typescript'], installs: 13200, stars: 8400, lastCommit: daysAgo(10),
    downloadUrl: RAW('wshobson','agents','skills/nodejs-backend-patterns/SKILL.md'),
  },
  {
    name: 'api-design-principles', repo: 'wshobson/agents', author: 'community',
    description: 'REST/GraphQL API design principles: nomenclatura, versioning, error handling, paginación.',
    tags: ['api', 'rest', 'graphql', 'backend'], installs: 13300, stars: 8400, lastCommit: daysAgo(8),
    downloadUrl: RAW('wshobson','agents','skills/api-design-principles/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  expo/skills — 18.5K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'expo-native-ui', repo: 'expo/skills', author: 'community',
    description: 'Componentes UI nativos en React Native con Expo: gestures, animations, NativeWind y layouts.',
    tags: ['expo', 'react-native', 'mobile', 'ui'], installs: 23200, stars: 18500, lastCommit: daysAgo(4),
    downloadUrl: RAW('expo','skills','skills/building-native-ui/SKILL.md'),
  },
  {
    name: 'expo-deployment', repo: 'expo/skills', author: 'community',
    description: 'Deploy de apps Expo a App Store y Google Play con EAS Build y OTA updates.',
    tags: ['expo', 'mobile', 'devops', 'deployment'], installs: 13900, stars: 18500, lastCommit: daysAgo(7),
    downloadUrl: RAW('expo','skills','skills/expo-deployment/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  antfu/skills — 28K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'vue-best-practices', repo: 'antfu/skills', author: 'community',
    description: 'Vue.js por Anthony Fu: Composition API, performance, reactivity, patrones y anti-patrones.',
    tags: ['vue', 'frontend', 'javascript'], installs: 13100, stars: 28000, lastCommit: daysAgo(4),
    downloadUrl: RAW('antfu','skills','skills/vue/SKILL.md'),
  },
  {
    name: 'vite-optimization', repo: 'antfu/skills', author: 'community',
    description: 'Optimización de builds con Vite: plugins esenciales, configuración avanzada y performance.',
    tags: ['vite', 'build', 'frontend', 'performance'], installs: 12100, stars: 28000, lastCommit: daysAgo(5),
    downloadUrl: RAW('antfu','skills','skills/vite/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  currents-dev/skills
  // ══════════════════════════════════════════════════
  {
    name: 'playwright-best-practices', repo: 'currents-dev/skills', author: 'community',
    description: 'Playwright: selectores robustos, parallel runs, sharding, fixtures, reportes y CI integration.',
    tags: ['playwright', 'testing', 'e2e', 'automation'], installs: 18000, stars: 6200, lastCommit: daysAgo(5),
    downloadUrl: RAW('currents-dev','skills','skills/playwright-best-practices/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  xixu-me/skills
  // ══════════════════════════════════════════════════
  {
    name: 'github-actions-docs', repo: 'xixu-me/skills', author: 'community',
    description: 'GitHub Actions: workflows, jobs, runners, secrets, artifacts, caching y best practices.',
    tags: ['github-actions', 'cicd', 'devops'], installs: 26700, stars: 4200, lastCommit: daysAgo(6),
    downloadUrl: RAW('xixu-me','skills','skills/github-actions-docs/SKILL.md'),
  },
  {
    name: 'readme-i18n', repo: 'xixu-me/skills', author: 'community',
    description: 'Internacionalización de READMEs y documentación para proyectos open source multi-idioma.',
    tags: ['docs', 'i18n', 'github', 'writing'], installs: 25900, stars: 4200, lastCommit: daysAgo(7),
    downloadUrl: RAW('xixu-me','skills','skills/readme-i18n/SKILL.md'),
  },

  // ══════════════════════════════════════════════════
  //  github/awesome-copilot — 31K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'git-commit-craft', repo: 'github/awesome-copilot', author: 'community',
    description: 'Mensajes de commit bien estructurados siguiendo Conventional Commits 1.0 con scope y breaking changes.',
    tags: ['git', 'workflow', 'docs', 'commits'], installs: 19400, stars: 31000, lastCommit: daysAgo(3),
    downloadUrl: RAW('github','awesome-copilot','prompts/git-commit.md'),
  },
  {
    name: 'prd-writer', repo: 'github/awesome-copilot', author: 'community',
    description: 'Product Requirements Documents con objetivos, métricas, casos de uso y criterios de aceptación.',
    tags: ['pm', 'docs', 'product', 'writing'], installs: 12500, stars: 31000, lastCommit: daysAgo(5),
    downloadUrl: RAW('github','awesome-copilot','prompts/prd.md'),
  },
];

// ─────────────────────────────────────────────────────────────────
//  FALLBACK METRICS (cuando usa GitHub API real)
// ─────────────────────────────────────────────────────────────────
const MOCK_METRICS = {
  stars: 106600, forks: 8400,
  lastCommit: daysAgo(1),
  daysSince: 1,
  score: 97,
};

// ─────────────────────────────────────────────────────────────────
//  Contenido template si el downloadUrl falla
// ─────────────────────────────────────────────────────────────────
function mockSkillContent(skill) {
  const tagList  = (skill.tags || []).map(t => `"${t}"`).join(', ');
  const instStr  = skill.installs ? `\n- Instalaciones semanales: ${formatInstalls(skill.installs)}` : '';
  const repoUrl  = skill.skillsUrl || `https://skills.sh/${skill.repo}/${skill.name}`;
  return `---
name: ${skill.name}
description: ${skill.description}
tags: [${tagList}]
version: 1.0.0
author: ${skill.author || 'community'}
source: ${skill.repo || 'catalog'}
---

# ${skill.name}

> Fuente: [${skill.repo}](${repoUrl})

## Descripción

${skill.description}

## Cuándo usar este skill

Activar cuando el usuario necesite ayuda con: ${(skill.tags || []).join(', ')}.

## Instrucciones

1. Analizar el contexto y objetivo del usuario.
2. Aplicar las mejores prácticas del área.
3. Proporcionar ejemplos concretos y código cuando sea relevante.
4. Verificar el resultado antes de entregar.

## Metadatos
${instStr}
- Repositorio: ${skill.repo}
- Tags: ${(skill.tags || []).join(', ')}
`;
}

// ─────────────────────────────────────────────────────────────────
//  CATÁLOGO
// ─────────────────────────────────────────────────────────────────
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

    const btnCatalog = document.getElementById('btn-catalog');
    const fresh      = btnCatalog.cloneNode(true);
    btnCatalog.parentNode.replaceChild(fresh, btnCatalog);
    fresh.addEventListener('click', () => this.open());

    document.getElementById('catalog-search').addEventListener('input', e =>
      this._filter(e.target.value)
    );
  },

  async open() {
    this._activeTag = null;
    document.getElementById('modal-catalog').classList.remove('hidden');
    document.getElementById('catalog-search').value = '';
    await this._load();
  },

  async _load() {
    const body = document.getElementById('catalog-body');
    body.innerHTML = '<div class="catalog-loading">Cargando catálogo...</div>';
    document.getElementById('catalog-tags').innerHTML = '';

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
      // Fallback al catálogo embebido con downloadUrls reales
      this._remoteSkills = MOCK_SKILLS;
      this._metrics      = MOCK_METRICS;
      this._isMock       = true;
      this._render(MOCK_SKILLS, MOCK_METRICS);
    }
  },

  _render(skills, metrics) {
    const body = document.getElementById('catalog-body');

    if (!skills.length) {
      body.innerHTML = '<div class="catalog-empty">No se encontraron skills.</div>';
      return;
    }

    this._renderTagChips(this._remoteSkills || skills);

    body.innerHTML = '';

    if (this._isMock) {
      const notice       = document.createElement('div');
      notice.className   = 'catalog-mock-notice';
      notice.textContent = `📦 ${skills.length} skills desde skills.sh y MCP — contenido real al instalar`;
      body.appendChild(notice);
    }

    skills.forEach(s => body.appendChild(this._buildCard(s, metrics)));
  },

  _renderTagChips(skills) {
    const bar = document.getElementById('catalog-tags');
    if (!bar) return;

    const seen = new Set();
    const tags = [];
    skills.forEach(s => {
      (s.tags || []).forEach(t => {
        if (!seen.has(t)) { seen.add(t); tags.push(t); }
      });
    });

    bar.innerHTML = '';
    const allChip       = document.createElement('button');
    allChip.className   = `c-chip${this._activeTag === null ? ' active' : ''}`;
    allChip.textContent = 'Todos';
    allChip.addEventListener('click', () => {
      this._activeTag = null;
      this._filter(document.getElementById('catalog-search').value);
    });
    bar.appendChild(allChip);

    tags.slice(0, 35).forEach(tag => {
      const chip       = document.createElement('button');
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
    const installed   = this.installedNames.has(skill.name);
    const div         = document.createElement('div');
    div.className         = `catalog-item${installed ? ' is-installed' : ''}`;
    div.dataset.skillName = skill.name;

    const icon       = skill.name.substring(0, 4).toUpperCase();
    const desc       = skill.description || 'Skill del catálogo.';
    const isOfficial = skill.author === 'anthropic';
    const stars      = formatStars(skill.stars ?? metrics?.stars);
    const instStr    = formatInstalls(skill.installs);
    const lastCmt    = skill.lastCommit ?? metrics?.lastCommit ?? null;
    const age        = lastCmt ? GitHub.formatAge(lastCmt) : '—';
    const daysN      = lastCmt ? Math.floor((Date.now() - new Date(lastCmt)) / 86400000) : null;
    const trending   = daysN !== null && daysN < 7;
    const orgName    = (skill.repo || '').split('/')[0] || '—';
    const repoSlug   = (skill.repo || '').split('/')[1] || skill.repo || '—';
    const hasReal    = !!skill.downloadUrl;

    const tagsHtml = (skill.tags || []).map(t =>
      `<span class="c-tag">${t}</span>`
    ).join('');

    div.innerHTML = `
      <div class="catalog-icon">${icon}</div>
      <div class="catalog-info">
        <div class="catalog-name">${skill.name}${hasReal ? '' : ' <span class="badge-template">template</span>'}</div>
        <div class="catalog-desc">${desc}</div>
        <div class="catalog-tags">
          <span class="c-tag ${isOfficial ? 'verified' : 'community'}">
            ${isOfficial ? '✓ oficial' : '◈ community'}
          </span>
          <span class="c-tag repo-tag" title="${skill.repo}">${orgName}</span>
          ${tagsHtml}
        </div>
        <div class="catalog-metrics">
          <span class="c-metric ${(skill.stars ?? 0) >= 10000 ? 'good' : ''}">★ ${stars}</span>
          ${instStr ? `<span class="c-metric ${trending ? 'hot' : ''}">↓ ${instStr}</span>` : ''}
          <span class="c-metric">↻ ${age}</span>
        </div>
      </div>
      <div class="catalog-score">
        <span class="score-badge repo-badge" title="${skill.repo}">${repoSlug}</span>
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
          (s.repo || '').toLowerCase().includes(q) ||
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
    if (btn) { btn.textContent = 'Descargando...'; btn.disabled = true; }

    try {
      let content;

      if (skill.downloadUrl) {
        try {
          content = await GitHub.downloadSkill(skill.downloadUrl);
        } catch (_fetchErr) {
          // Si el raw URL falla (repo renombrado, privado, etc.) → usar template
          content = mockSkillContent(skill);
        }
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
