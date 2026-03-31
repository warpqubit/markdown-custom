#!/usr/bin/env node
// install.js — Instalador CLI de Markdown Custom
// Uso: npx github:TU_USUARIO/markdown-custom

'use strict';

const { execSync, spawnSync } = require('child_process');
const path  = require('path');
const os    = require('os');
const fs    = require('fs');

// ── Colores ANSI ──────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  white:  '\x1b[37m',
};
const ok   = msg => console.log(`${c.green}  ✓${c.reset}  ${msg}`);
const info = msg => console.log(`${c.cyan}  →${c.reset}  ${msg}`);
const warn = msg => console.log(`${c.yellow}  ⚠${c.reset}  ${msg}`);
const err  = msg => console.log(`${c.red}  ✗${c.reset}  ${msg}`);

// ── Detectar Escritorio ───────────────────────────────────────────────────────
function getDesktop() {
  const home     = os.homedir();
  const platform = process.platform;

  if (platform === 'win32') {
    // Windows: intentar ruta localizada vía registry, fallback a Desktop
    try {
      const result = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders" /v Desktop',
        { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
      );
      const match = result.match(/Desktop\s+REG_SZ\s+(.+)/);
      if (match) return match[1].trim();
    } catch (_) { /* ignorar, usar fallback */ }
    return path.join(home, 'Desktop');
  }

  if (platform === 'darwin') {
    return path.join(home, 'Desktop');
  }

  // Linux: intentar XDG_DESKTOP_DIR
  try {
    const xdg = execSync('xdg-user-dir DESKTOP', { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
    if (xdg && fs.existsSync(xdg)) return xdg;
  } catch (_) { /* ignorar */ }

  return path.join(home, 'Desktop');
}

// ── Verificar dependencias ────────────────────────────────────────────────────
function checkDeps() {
  // git
  const git = spawnSync('git', ['--version'], { encoding: 'utf8' });
  if (git.status !== 0) {
    err('Git no está instalado o no está en el PATH.');
    err('Descargalo desde: https://git-scm.com/downloads');
    process.exit(1);
  }

  // node/npm
  const node = spawnSync('node', ['--version'], { encoding: 'utf8' });
  if (node.status !== 0) {
    err('Node.js no encontrado.');
    process.exit(1);
  }
}

// ── Instalar ──────────────────────────────────────────────────────────────────
async function install() {
  console.log('');
  console.log(`${c.bold}${c.white}  Markdown Custom — Instalador${c.reset}`);
  console.log(`${c.dim}  ─────────────────────────────────${c.reset}`);
  console.log('');

  checkDeps();

  const desktop = getDesktop();
  const dest    = path.join(desktop, 'markdown-custom');

  // Leer repo URL desde package.json del instalador (o usar placeholder)
  let repoUrl = 'https://github.com/warpqubit/markdown-custom.git';
  try {
    // Si estamos corriendo vía npx desde un paquete publicado,
    // __dirname apunta al directorio del paquete donde está install.js
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    if (pkg.repository?.url) repoUrl = pkg.repository.url.replace(/^git\+/, '');
  } catch (_) { /* usar default */ }

  info(`Destino: ${c.cyan}${dest}${c.reset}`);

  // Verificar si ya existe
  if (fs.existsSync(dest)) {
    warn(`El directorio ya existe: ${dest}`);
    warn('Si querés reinstalar, eliminalo primero y corré el comando de nuevo.');
    process.exit(0);
  }

  // Verificar que el Desktop existe
  if (!fs.existsSync(desktop)) {
    err(`No se encontró el Escritorio en: ${desktop}`);
    err('Verificá que la ruta existe y volvé a intentar.');
    process.exit(1);
  }

  // Clonar
  console.log('');
  info('Clonando repositorio...');
  try {
    execSync(`git clone "${repoUrl}" "${dest}"`, { stdio: 'inherit' });
    ok('Repositorio clonado');
  } catch (_) {
    err('No se pudo clonar el repositorio.');
    err(`URL: ${repoUrl}`);
    err('Verificá tu conexión a internet y que el repo es público.');
    process.exit(1);
  }

  // Instalar dependencias (si hay package-lock o node_modules necesarios)
  const pkgLock = path.join(dest, 'package-lock.json');
  if (fs.existsSync(pkgLock)) {
    info('Instalando dependencias...');
    try {
      execSync('npm install --omit=dev', { cwd: dest, stdio: 'inherit' });
      ok('Dependencias instaladas');
    } catch (_) {
      warn('npm install falló — podés intentarlo manualmente dentro de la carpeta.');
    }
  }

  // Éxito
  console.log('');
  console.log(`${c.green}${c.bold}  ✅ ¡Markdown Custom instalado!${c.reset}`);
  console.log('');
  console.log(`  Carpeta: ${c.cyan}${dest}${c.reset}`);
  console.log('');
  console.log(`  ${c.bold}Para iniciar:${c.reset}`);

  if (process.platform === 'win32') {
    console.log(`    → Doble clic en ${c.yellow}start.bat${c.reset} dentro de la carpeta`);
    console.log(`    → O desde terminal:  ${c.dim}cd "${dest}" && npm start${c.reset}`);
  } else {
    console.log(`    → Desde terminal:    ${c.dim}cd "${dest}" && npm start${c.reset}`);
    console.log(`    → Luego abrir:       ${c.cyan}http://localhost:3000${c.reset}`);
  }

  console.log('');
  console.log(`  ${c.dim}Requiere Chrome 86+ o Edge 86+ (File System Access API)${c.reset}`);
  console.log('');
}

install().catch(e => {
  err('Error inesperado: ' + e.message);
  process.exit(1);
});
