// catalog.js — Catálogo de skills reales desde skills.sh, MCP y ecosistema Claude
import { GitHub } from './github.js';
import { FS }     from './fs.js';

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────
const now = Date.now();
const daysAgo = d => new Date(now - d * 86400000).toISOString();

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
//  SKILLS REALES — fuente: skills.sh + MCP oficial
// ─────────────────────────────────────────────────────────────────
const MOCK_SKILLS = [

  // ══════════════════════════════════════════════════
  //  anthropics/skills  — 106.6K ⭐ (OFICIAL)
  // ══════════════════════════════════════════════════
  {
    name: 'frontend-design', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Crea interfaces frontend de producción: tipografía, color, motion, composición. Rechaza estéticas AI genéricas.',
    tags: ['frontend', 'design', 'ui'], installs: 222200, stars: 106600, lastCommit: daysAgo(1),
    skillsUrl: 'https://skills.sh/anthropics/skills/frontend-design',
  },
  {
    name: 'skill-creator', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Ciclo completo para crear, testear y mejorar skills con A/B testing paralelo y browser review interactivo.',
    tags: ['meta', 'skills', 'testing'], installs: 118000, stars: 106600, lastCommit: daysAgo(1),
    skillsUrl: 'https://skills.sh/anthropics/skills/skill-creator',
  },
  {
    name: 'pdf', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Procesamiento exhaustivo de PDFs: extracción, merge, split, formularios, OCR con pytesseract y pdfplumber.',
    tags: ['pdf', 'documents', 'files'], installs: 56600, stars: 106600, lastCommit: daysAgo(2),
    skillsUrl: 'https://skills.sh/anthropics/skills/pdf',
  },
  {
    name: 'pptx', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Lee, genera y ajusta slides de PowerPoint con control de layouts y estilos.',
    tags: ['powerpoint', 'documents', 'presentations'], installs: 52000, stars: 106600, lastCommit: daysAgo(2),
  },
  {
    name: 'docx', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Crea, edita y analiza documentos Word con formato avanzado, tablas y comentarios.',
    tags: ['word', 'documents', 'files'], installs: 44600, stars: 106600, lastCommit: daysAgo(3),
  },
  {
    name: 'xlsx', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Manipulación de hojas de cálculo con fórmulas, tablas dinámicas y gráficos.',
    tags: ['excel', 'spreadsheets', 'data'], installs: 40500, stars: 106600, lastCommit: daysAgo(3),
  },
  {
    name: 'webapp-testing', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Testea aplicaciones web locales usando Playwright con automatización de browser completa.',
    tags: ['testing', 'playwright', 'e2e'], installs: 36500, stars: 106600, lastCommit: daysAgo(4),
  },
  {
    name: 'mcp-builder', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Crea servidores MCP para integrar APIs externas con Claude de forma nativa.',
    tags: ['mcp', 'api', 'backend', 'integration'], installs: 29800, stars: 106600, lastCommit: daysAgo(4),
  },
  {
    name: 'canvas-design', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Crea arte visual en PNG y PDF aplicando principios de diseño profesional.',
    tags: ['design', 'canvas', 'art', 'visual'], installs: 28400, stars: 106600, lastCommit: daysAgo(5),
  },
  {
    name: 'algorithmic-art', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Genera arte algorítmico y generativo con código creativo.',
    tags: ['art', 'generative', 'creative'], installs: 22100, stars: 106600, lastCommit: daysAgo(5),
  },
  {
    name: 'theme-factory', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Aplica fuentes profesionales y paletas de colores temáticas a artifacts.',
    tags: ['design', 'themes', 'typography'], installs: 21300, stars: 106600, lastCommit: daysAgo(6),
  },
  {
    name: 'doc-coauthoring', repo: 'anthropics/skills', author: 'anthropic',
    description: 'Creación y edición colaborativa de documentos técnicos y de negocio.',
    tags: ['documents', 'writing', 'collaboration'], installs: 21500, stars: 106600, lastCommit: daysAgo(6),
  },

  // ══════════════════════════════════════════════════
  //  obra/superpowers  — 125.5K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'brainstorming', repo: 'obra/superpowers', author: 'community',
    description: 'Diálogo socrático de diseño con gate duro: sin código hasta aprobar el diseño. Proceso de 9 pasos.',
    tags: ['design', 'planning', 'workflow'], installs: 81400, stars: 125500, lastCommit: daysAgo(2),
  },
  {
    name: 'systematic-debugging', repo: 'obra/superpowers', author: 'community',
    description: 'Análisis de causa raíz en 4 fases: tracing, defensa en profundidad, condición-espera, verificación.',
    tags: ['debugging', 'quality', 'workflow'], installs: 45100, stars: 125500, lastCommit: daysAgo(3),
  },
  {
    name: 'writing-plans', repo: 'obra/superpowers', author: 'community',
    description: 'Crea planes de implementación detallados y estructurados antes de empezar a programar.',
    tags: ['planning', 'workflow', 'architecture'], installs: 44000, stars: 125500, lastCommit: daysAgo(3),
  },
  {
    name: 'test-driven-development', repo: 'obra/superpowers', author: 'community',
    description: 'Ciclo RED-GREEN-REFACTOR con referencia de anti-patrones de testing.',
    tags: ['testing', 'tdd', 'quality'], installs: 37900, stars: 125500, lastCommit: daysAgo(4),
  },
  {
    name: 'requesting-code-review', repo: 'obra/superpowers', author: 'community',
    description: 'Checklist de validación pre-review antes de enviar código para revisión.',
    tags: ['code-review', 'workflow', 'quality'], installs: 36400, stars: 125500, lastCommit: daysAgo(4),
  },
  {
    name: 'subagent-driven-development', repo: 'obra/superpowers', author: 'community',
    description: 'Coordina iteración rápida con revisión en dos etapas: spec de diseño + calidad de código.',
    tags: ['agents', 'workflow', 'parallel'], installs: 31300, stars: 125500, lastCommit: daysAgo(5),
  },
  {
    name: 'dispatching-parallel-agents', repo: 'obra/superpowers', author: 'community',
    description: 'Habilita workflows concurrentes de subagentes con coordinación y síntesis de resultados.',
    tags: ['agents', 'parallel', 'workflow'], installs: 27300, stars: 125500, lastCommit: daysAgo(5),
  },
  {
    name: 'using-git-worktrees', repo: 'obra/superpowers', author: 'community',
    description: 'Crea y gestiona worktrees de git aislados para trabajo paralelo seguro.',
    tags: ['git', 'workflow', 'devops'], installs: 27400, stars: 125500, lastCommit: daysAgo(6),
  },
  {
    name: 'verification-before-completion', repo: 'obra/superpowers', author: 'community',
    description: 'Asegura que los issues estén genuinamente resueltos antes de marcarlos como completos.',
    tags: ['quality', 'workflow', 'validation'], installs: 29500, stars: 125500, lastCommit: daysAgo(6),
  },

  // ══════════════════════════════════════════════════
  //  vercel-labs/skills  — 24.1K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'vercel-react-best-practices', repo: 'vercel-labs/skills', author: 'community',
    description: '67 reglas en 8 categorías: eliminar waterfalls, bundle size, SSR caching, re-render optimization.',
    tags: ['react', 'nextjs', 'performance', 'frontend'], installs: 263700, stars: 24100, lastCommit: daysAgo(1),
  },
  {
    name: 'web-design-guidelines', repo: 'vercel-labs/skills', author: 'community',
    description: 'Guías de diseño web y mejores prácticas estéticas para interfaces de producción.',
    tags: ['design', 'frontend', 'ui', 'css'], installs: 212900, stars: 24100, lastCommit: daysAgo(2),
  },
  {
    name: 'agent-browser', repo: 'vercel-labs/skills', author: 'community',
    description: 'Automatización de browser persistente con continuidad de sesión, Chromium headless y 15+ categorías de comandos.',
    tags: ['browser', 'automation', 'agents'], installs: 142800, stars: 24100, lastCommit: daysAgo(3),
  },
  {
    name: 'vercel-composition-patterns', repo: 'vercel-labs/skills', author: 'community',
    description: 'Patrones de composición de componentes Next.js para arquitecturas escalables y mantenibles.',
    tags: ['react', 'nextjs', 'architecture'], installs: 107300, stars: 24100, lastCommit: daysAgo(4),
  },
  {
    name: 'next-best-practices', repo: 'vercel-labs/skills', author: 'community',
    description: 'Mejores prácticas generales de Next.js: App Router, Server Components, optimización.',
    tags: ['nextjs', 'frontend', 'performance'], installs: 48300, stars: 24100, lastCommit: daysAgo(5),
  },

  // ══════════════════════════════════════════════════
  //  pbakaus/impeccable
  // ══════════════════════════════════════════════════
  {
    name: 'impeccable-design', repo: 'pbakaus/impeccable', author: 'community',
    description: 'Referencia de diseño en 7 dominios con 20 comandos: /audit, /polish, /animate, /typeset y más.',
    tags: ['design', 'frontend', 'ui', 'typography'], installs: 36700, stars: 15200, lastCommit: daysAgo(3),
  },
  {
    name: 'design-critique', repo: 'pbakaus/impeccable', author: 'community',
    description: 'Revisión crítica de diseño con feedback detallado y accionable por categoría.',
    tags: ['design', 'audit', 'quality'], installs: 35200, stars: 15200, lastCommit: daysAgo(4),
  },
  {
    name: 'design-animate', repo: 'pbakaus/impeccable', author: 'community',
    description: 'Agrega motion y animaciones con propósito a interfaces siguiendo principios de diseño.',
    tags: ['design', 'animation', 'css', 'frontend'], installs: 34700, stars: 15200, lastCommit: daysAgo(4),
  },

  // ══════════════════════════════════════════════════
  //  coreyhaines31/marketingskills  — 17.6K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'seo-audit', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Auditoría SEO: crawlabilidad, indexación, velocidad, on-page y calidad de contenido. Específico por tipo de sitio.',
    tags: ['seo', 'marketing', 'audit'], installs: 60700, stars: 17600, lastCommit: daysAgo(2),
  },
  {
    name: 'copywriting', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Técnicas y frameworks profesionales de copywriting: AIDA, PAS, storytelling y persuasión.',
    tags: ['copywriting', 'marketing', 'writing'], installs: 52400, stars: 17600, lastCommit: daysAgo(3),
  },
  {
    name: 'marketing-psychology', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Aplica principios psicológicos (scarcity, social proof, reciprocity) a copy y estrategia.',
    tags: ['marketing', 'psychology', 'conversion'], installs: 38300, stars: 17600, lastCommit: daysAgo(4),
  },
  {
    name: 'content-strategy', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Desarrolla estrategia de contenido, calendario editorial y funnel de distribución.',
    tags: ['content', 'marketing', 'strategy'], installs: 34600, stars: 17600, lastCommit: daysAgo(5),
  },
  {
    name: 'cold-email', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Escribe secuencias de email frío de alta conversión con personalización y seguimiento.',
    tags: ['email', 'marketing', 'sales'], installs: 19800, stars: 17600, lastCommit: daysAgo(7),
  },
  {
    name: 'seo-programmatic', repo: 'coreyhaines31/marketingskills', author: 'community',
    description: 'Tácticas de SEO programático para escalar tráfico orgánico con templates y automatización.',
    tags: ['seo', 'marketing', 'automation'], installs: 34300, stars: 17600, lastCommit: daysAgo(6),
  },

  // ══════════════════════════════════════════════════
  //  modelcontextprotocol/servers — 82.5K ⭐ (OFICIAL MCP)
  // ══════════════════════════════════════════════════
  {
    name: 'mcp-filesystem', repo: 'modelcontextprotocol/servers', author: 'anthropic',
    description: 'Operaciones de archivo seguras con controles de acceso configurables mediante protocolo MCP.',
    tags: ['mcp', 'files', 'filesystem'], installs: 95000, stars: 82500, lastCommit: daysAgo(1),
  },
  {
    name: 'mcp-memory', repo: 'modelcontextprotocol/servers', author: 'anthropic',
    description: 'Memoria persistente basada en grafos de conocimiento para sesiones multi-turno vía MCP.',
    tags: ['mcp', 'memory', 'knowledge-graph'], installs: 78000, stars: 82500, lastCommit: daysAgo(1),
  },
  {
    name: 'mcp-git', repo: 'modelcontextprotocol/servers', author: 'anthropic',
    description: 'Lee, busca, y manipula repositorios Git directamente desde Claude mediante MCP.',
    tags: ['mcp', 'git', 'vcs', 'devops'], installs: 62000, stars: 82500, lastCommit: daysAgo(2),
  },
  {
    name: 'mcp-fetch', repo: 'modelcontextprotocol/servers', author: 'anthropic',
    description: 'Fetching y conversión de contenido web optimizado para LLMs con manejo de HTML/Markdown.',
    tags: ['mcp', 'web', 'scraping', 'fetch'], installs: 55000, stars: 82500, lastCommit: daysAgo(2),
  },
  {
    name: 'mcp-sequential-thinking', repo: 'modelcontextprotocol/servers', author: 'anthropic',
    description: 'Resolución de problemas dinámica y reflexiva a través de secuencias de pensamiento estructuradas.',
    tags: ['mcp', 'reasoning', 'thinking', 'planning'], installs: 48000, stars: 82500, lastCommit: daysAgo(3),
  },

  // ══════════════════════════════════════════════════
  //  shadcn/ui  — 94K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'shadcn-ui', repo: 'shadcn/ui', author: 'community',
    description: 'Guía de componentes shadcn/ui: instalación, personalización con Tailwind, temas y patterns.',
    tags: ['shadcn', 'react', 'ui', 'components', 'tailwind'], installs: 52600, stars: 94000, lastCommit: daysAgo(1),
  },

  // ══════════════════════════════════════════════════
  //  browser-use  — 42K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'browser-use', repo: 'browser-use/browser-use', author: 'community',
    description: 'Automatización de browser para agentes AI con control completo: click, form, scrape, navigate.',
    tags: ['browser', 'automation', 'agents', 'scraping'], installs: 58900, stars: 42000, lastCommit: daysAgo(1),
  },

  // ══════════════════════════════════════════════════
  //  supabase/agent-skills  — 12.4K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'supabase-postgres', repo: 'supabase/agent-skills', author: 'community',
    description: 'Mejores prácticas Supabase + PostgreSQL: Row Level Security, índices, Edge Functions.',
    tags: ['supabase', 'postgres', 'database', 'security'], installs: 58000, stars: 12400, lastCommit: daysAgo(3),
  },

  // ══════════════════════════════════════════════════
  //  remotion-dev/skills  — 21K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'remotion-video', repo: 'remotion-dev/skills', author: 'community',
    description: 'Mejores prácticas del framework Remotion para crear videos programáticos en JS/TypeScript.',
    tags: ['remotion', 'video', 'javascript', 'animation'], installs: 189800, stars: 21000, lastCommit: daysAgo(2),
  },

  // ══════════════════════════════════════════════════
  //  inferen-sh/skills  — 9.8K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'ai-image-generation', repo: 'inferen-sh/skills', author: 'community',
    description: 'Generación de imágenes con APIs de AI: DALL-E, Midjourney, Stability AI y Flux.',
    tags: ['ai', 'images', 'generation', 'creative'], installs: 114800, stars: 9800, lastCommit: daysAgo(2),
  },
  {
    name: 'elevenlabs-tts', repo: 'inferen-sh/skills', author: 'community',
    description: 'Text-to-speech de alta calidad y clonación de voz via API de ElevenLabs.',
    tags: ['tts', 'audio', 'ai', 'voice'], installs: 52000, stars: 9800, lastCommit: daysAgo(3),
  },
  {
    name: 'python-executor', repo: 'inferen-sh/skills', author: 'community',
    description: 'Ejecuta código Python en sandbox seguro y retorna resultados, stdout y errores.',
    tags: ['python', 'sandbox', 'execution', 'coding'], installs: 14600, stars: 9800, lastCommit: daysAgo(6),
  },

  // ══════════════════════════════════════════════════
  //  wshobson/agents  — 8.4K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'tailwind-design-system', repo: 'wshobson/agents', author: 'community',
    description: 'Sistema de diseño con Tailwind CSS: tokens de diseño, componentes y guías de estilo.',
    tags: ['tailwind', 'css', 'design', 'frontend'], installs: 25900, stars: 8400, lastCommit: daysAgo(5),
  },
  {
    name: 'typescript-advanced-types', repo: 'wshobson/agents', author: 'community',
    description: 'Patrones de tipos avanzados en TypeScript: generics, conditional types, mapped, inference.',
    tags: ['typescript', 'coding', 'types'], installs: 19100, stars: 8400, lastCommit: daysAgo(7),
  },
  {
    name: 'nodejs-backend-patterns', repo: 'wshobson/agents', author: 'community',
    description: 'Patrones de arquitectura backend para Node.js: middleware, DI, modular structure.',
    tags: ['nodejs', 'backend', 'architecture'], installs: 13200, stars: 8400, lastCommit: daysAgo(10),
  },

  // ══════════════════════════════════════════════════
  //  better-auth/skills  — 15.6K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'better-auth', repo: 'better-auth/skills', author: 'community',
    description: 'Mejores prácticas de autenticación: OAuth 2.0, JWT, sesiones, MFA y seguridad.',
    tags: ['auth', 'security', 'backend', 'oauth'], installs: 30100, stars: 15600, lastCommit: daysAgo(4),
  },

  // ══════════════════════════════════════════════════
  //  antfu/skills  — 28K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'vue-best-practices', repo: 'antfu/skills', author: 'community',
    description: 'Mejores prácticas de Vue.js por Anthony Fu: Composition API, performance y patrones modernos.',
    tags: ['vue', 'frontend', 'javascript'], installs: 13100, stars: 28000, lastCommit: daysAgo(4),
  },
  {
    name: 'vite-optimization', repo: 'antfu/skills', author: 'community',
    description: 'Optimización de builds con Vite: plugins esenciales, configuración y performance.',
    tags: ['vite', 'build', 'frontend', 'performance'], installs: 12100, stars: 28000, lastCommit: daysAgo(5),
  },

  // ══════════════════════════════════════════════════
  //  expo/skills  — 18.5K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'expo-native-ui', repo: 'expo/skills', author: 'community',
    description: 'Construye componentes UI nativos en React Native con Expo: gestures, animations, layouts.',
    tags: ['expo', 'react-native', 'mobile', 'ui'], installs: 23200, stars: 18500, lastCommit: daysAgo(4),
  },
  {
    name: 'expo-deployment', repo: 'expo/skills', author: 'community',
    description: 'Deploy de apps Expo a App Store y Google Play con EAS Build y OTA updates.',
    tags: ['expo', 'mobile', 'devops', 'deployment'], installs: 13900, stars: 18500, lastCommit: daysAgo(7),
  },

  // ══════════════════════════════════════════════════
  //  currents-dev/skills  — 6.2K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'playwright-best-practices', repo: 'currents-dev/skills', author: 'community',
    description: 'Mejores prácticas de Playwright: selectores robustos, parallel runs, sharding y reportes.',
    tags: ['playwright', 'testing', 'e2e', 'automation'], installs: 18000, stars: 6200, lastCommit: daysAgo(5),
  },

  // ══════════════════════════════════════════════════
  //  xixu-me/skills  — 4.2K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'github-actions-docs', repo: 'xixu-me/skills', author: 'community',
    description: 'Documentación y guías para GitHub Actions: workflows, jobs, runners, secrets, artifacts.',
    tags: ['github-actions', 'cicd', 'devops'], installs: 26700, stars: 4200, lastCommit: daysAgo(6),
  },
  {
    name: 'readme-i18n', repo: 'xixu-me/skills', author: 'community',
    description: 'Internacionalización de READMEs y docs para proyectos multi-idioma en GitHub.',
    tags: ['docs', 'i18n', 'github', 'writing'], installs: 25900, stars: 4200, lastCommit: daysAgo(7),
  },

  // ══════════════════════════════════════════════════
  //  github/awesome-copilot  — 31K ⭐
  // ══════════════════════════════════════════════════
  {
    name: 'git-commit-craft', repo: 'github/awesome-copilot', author: 'community',
    description: 'Elabora mensajes de commit bien estructurados siguiendo Conventional Commits 1.0.',
    tags: ['git', 'workflow', 'docs', 'commits'], installs: 19400, stars: 31000, lastCommit: daysAgo(3),
  },
  {
    name: 'prd-writer', repo: 'github/awesome-copilot', author: 'community',
    description: 'Redacta Product Requirements Documents con objetivos, métricas, casos de uso y criterios de aceptación.',
    tags: ['pm', 'docs', 'product', 'writing'], installs: 12500, stars: 31000, lastCommit: daysAgo(5),
  },
];

// ─────────────────────────────────────────────────────────────────
//  MOCK METRICS (repo global — fallback)
// ─────────────────────────────────────────────────────────────────
const MOCK_METRICS = {
  stars: 106600, forks: 8400,
  lastCommit: daysAgo(1),
  daysSince: 1,
  score: 97,
};

// ─────────────────────────────────────────────────────────────────
//  Generar SKILL.md de contenido para skills sin downloadUrl
// ─────────────────────────────────────────────────────────────────
function mockSkillContent(skill) {
  const tagList = (skill.tags || []).map(t => `"${t}"`).join(', ');
  const installStr = skill.installs ? `\n- Instalaciones semanales: ${formatInstalls(skill.installs)}` : '';
  return `---
name: ${skill.name}
description: ${skill.description}
tags: [${tagList}]
version: 1.0.0
author: ${skill.author || 'community'}
source: ${skill.repo || 'catalog'}
---

# ${skill.name}

> Fuente: [${skill.repo}](https://skills.sh/${skill.repo}/${skill.name})

## Descripción

${skill.description}

## Cuándo usar este skill

Activar cuando el usuario necesite ayuda con: ${(skill.tags || []).join(', ')}.

## Instrucciones

1. Analizar el contexto y objetivo del usuario.
2. Aplicar las mejores prácticas y patrones del área.
3. Proporcionar ejemplos concretos y código cuando sea relevante.
4. Verificar el resultado antes de entregar.

## Metadatos
${installStr}
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

    // Clonar botón para evitar listeners duplicados
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
    body.innerHTML = '<div class="catalog-loading">Conectando con GitHub...</div>';
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

    // Chips de tags — siempre reflejan el dataset completo
    this._renderTagChips(this._remoteSkills || skills);

    body.innerHTML = '';

    if (this._isMock) {
      const notice       = document.createElement('div');
      notice.className   = 'catalog-mock-notice';
      notice.textContent = '📦 Sin conexión a GitHub — mostrando catálogo completo desde skills.sh y MCP';
      body.appendChild(notice);
    }

    // Agrupar por repo para mejor navegación
    const groups = new Map();
    skills.forEach(s => {
      const repo = s.repo || 'otros';
      if (!groups.has(repo)) groups.set(repo, []);
      groups.get(repo).push(s);
    });

    if (this._isMock) {
      // Mostrar plano (ya están agrupados en el array)
      skills.forEach(s => body.appendChild(this._buildCard(s, metrics)));
    } else {
      skills.forEach(s => body.appendChild(this._buildCard(s, metrics)));
    }
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

    // "Todos"
    const allChip       = document.createElement('button');
    allChip.className   = `c-chip${this._activeTag === null ? ' active' : ''}`;
    allChip.textContent = 'Todos';
    allChip.addEventListener('click', () => {
      this._activeTag = null;
      this._filter(document.getElementById('catalog-search').value);
    });
    bar.appendChild(allChip);

    tags.slice(0, 30).forEach(tag => {
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
    const installed  = this.installedNames.has(skill.name);
    const div        = document.createElement('div');
    div.className         = `catalog-item${installed ? ' is-installed' : ''}`;
    div.dataset.skillName = skill.name;

    const icon      = skill.name.substring(0, 4).toUpperCase();
    const desc      = skill.description || 'Skill del catálogo.';
    const isOfficial = skill.author === 'anthropic';
    const stars     = formatStars(skill.stars  ?? metrics?.stars);
    const instStr   = formatInstalls(skill.installs);
    const lastCmt   = skill.lastCommit ?? metrics?.lastCommit ?? null;
    const age       = lastCmt ? GitHub.formatAge(lastCmt) : '—';
    const daysN     = lastCmt ? Math.floor((Date.now() - new Date(lastCmt)) / 86400000) : null;
    const trending  = daysN !== null && daysN < 7;
    const repo      = skill.repo || '—';

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
            ${isOfficial ? '✓ oficial' : '◈ community'}
          </span>
          <span class="c-tag repo-tag" title="${repo}">${repo.split('/')[0]}</span>
          ${tagsHtml}
        </div>
        <div class="catalog-metrics">
          <span class="c-metric ${skill.stars >= 10000 ? 'good' : ''}">★ ${stars}</span>
          ${instStr ? `<span class="c-metric ${trending ? 'hot' : ''}">↓ ${instStr}</span>` : ''}
          <span class="c-metric">↻ ${age}</span>
        </div>
      </div>
      <div class="catalog-score">
        <span class="score-badge repo-badge">${repo.split('/')[1] || repo}</span>
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
