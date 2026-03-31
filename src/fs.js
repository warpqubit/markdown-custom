// fs.js — File System Access API
export const FS = {
  rootHandle: null,

  async pickDirectory() {
    try {
      const h = await window.showDirectoryPicker({ mode: 'readwrite' });
      this.rootHandle = h;
      return h;
    } catch (e) {
      if (e.name === 'AbortError') return null;
      throw e;
    }
  },

  // Detecta el tipo de archivo markdown
  async _detectFileType(fileName, fileHandle, parentDir) {
    const RULES_NAMES = ['CLAUDE.md', 'GEMINI.md', 'CODEX.md', '.cursorrules', 'AGENTS.md'];
    if (RULES_NAMES.includes(fileName)) return 'rules';

    if (fileName === 'SKILL.md') return 'skill';

    const parentLower = (parentDir || '').toLowerCase();
    const baseName    = fileName.replace(/\.md$/i, '').toLowerCase();
    if (parentLower.includes('prompt') || baseName.includes('prompt')) return 'prompt';

    // Leer primeros 200 chars para detectar frontmatter con "name:"
    try {
      const file = await fileHandle.getFile();
      const text = await file.slice(0, 200).text();
      if (text.startsWith('---') && /^name:\s/m.test(text)) return 'skill';
    } catch { /* ignore */ }

    return 'md';
  },

  // Busca TODOS los archivos .md recursivamente
  async findMarkdownFiles(dir = this.rootHandle, base = '') {
    const files = [];
    if (!dir) return files;
    for await (const [entryName, handle] of dir) {
      if (handle.kind === 'directory') {
        if (entryName.startsWith('.') || entryName === 'node_modules' ||
            entryName === '__pycache__' || entryName === '.git') continue;
        const subPath = base ? `${base}/${entryName}` : entryName;
        const nested  = await this.findMarkdownFiles(handle, subPath);
        files.push(...nested);
      } else if (handle.kind === 'file' && entryName.toLowerCase().endsWith('.md')) {
        const filePath = base ? `${base}/${entryName}` : entryName;
        // Para SKILL.md usamos el nombre del directorio padre; resto, el nombre de archivo sin .md
        const name = entryName === 'SKILL.md'
          ? (base ? base.split('/').pop() : 'SKILL')
          : entryName.replace(/\.md$/i, '');
        const fileType = await this._detectFileType(entryName, handle, base);
        files.push({
          name,
          path:      filePath,
          handle,
          dirHandle: dir,
          dir:       base,
          virtual:   false,
          fileType,
        });
      }
    }
    return files;
  },

  // Alias de compatibilidad
  findSkills: function(...args) { return this.findMarkdownFiles(...args); },

  // Retorna todos los directorios del proyecto (máx. 3 niveles)
  async findDirectories(dir = this.rootHandle, base = '', depth = 0) {
    const result = [];
    if (!dir) return result;

    if (depth === 0) {
      result.push({ label: '/ raíz', path: '', handle: dir });
    }

    if (depth >= 3) return result;

    for await (const [name, handle] of dir) {
      if (handle.kind !== 'directory') continue;
      if (name.startsWith('.') || name === 'node_modules' ||
          name === '__pycache__' || name === '.git') continue;
      const subPath = base ? `${base}/${name}` : name;
      result.push({ label: subPath, path: subPath, handle });
      const nested = await this.findDirectories(handle, subPath, depth + 1);
      result.push(...nested);
    }
    return result;
  },

  async readFile(fileHandle) {
    const f = await fileHandle.getFile();
    return await f.text();
  },

  async writeFile(fileHandle, content) {
    const w = await fileHandle.createWritable();
    await w.write(content);
    await w.close();
  },

  // Crea un archivo .md en el directorio indicado
  // options.createSubdir: false → crea el archivo directo (nombre.md)
  // options.createSubdir: true  → crea subcarpeta + SKILL.md (legacy)
  async materializeSkill(targetDirHandle, skillName, content, options = { createSubdir: false }) {
    if (!targetDirHandle) throw new Error('Handle de directorio inválido');
    if (options.createSubdir === false) {
      const newFile = await targetDirHandle.getFileHandle(`${skillName}.md`, { create: true });
      await this.writeFile(newFile, content);
      return { handle: newFile, dirHandle: targetDirHandle };
    }
    // Legacy: subcarpeta + SKILL.md
    const newDir  = await targetDirHandle.getDirectoryHandle(skillName, { create: true });
    const newFile = await newDir.getFileHandle('SKILL.md', { create: true });
    await this.writeFile(newFile, content);
    return { handle: newFile, dirHandle: newDir };
  },

  // Elimina el archivo markdown usando el nombre del fileHandle
  async deleteSkillFile(fileHandle, dirHandle) {
    const fileName = fileHandle ? fileHandle.name : 'SKILL.md';
    await dirHandle.removeEntry(fileName);
  },

  // Crea skill en skills/ (usado por el catálogo)
  async createSkill(skillName) {
    if (!this.rootHandle) throw new Error('Sin directorio');
    let skillsDir;
    try { skillsDir = await this.rootHandle.getDirectoryHandle('skills'); }
    catch { skillsDir = await this.rootHandle.getDirectoryHandle('skills', { create: true }); }
    const newDir  = await skillsDir.getDirectoryHandle(skillName, { create: true });
    const newFile = await newDir.getFileHandle('SKILL.md', { create: true });
    await this.writeFile(newFile, this._template(skillName));
    return { name: skillName, path: `skills/${skillName}/SKILL.md`, handle: newFile, dirHandle: newDir, dir: 'skills', virtual: false, fileType: 'skill' };
  },

  getRootName() { return this.rootHandle?.name ?? ''; },

  _template(name) {
    return `---\nname: ${name}\ndescription: Describí cuándo Claude debe usar este skill.\ntags: []\nversion: 1.0.0\nauthor: custom\n---\n\n# ${name}\n\n## Cuándo usar este skill\n\nDescribí el trigger — qué palabras o situaciones activan este skill.\n\n## Instrucciones\n\n1. Paso uno\n2. Paso dos\n3. Paso tres\n\n## Notas\n\nCasos borde, aclaraciones, ejemplos.\n`;
  },

  _templateRules() {
    return `# Reglas del proyecto\n\n## Stack\n-\n\n## Convenciones\n-\n\n## No hacer\n-\n`;
  },

  _templatePrompt() {
    return `# Nombre del Prompt\n\n## Rol\nEres un asistente...\n\n## Instrucciones\n\n## Restricciones\n-\n`;
  },

  _templateGemini() {
    return `# Instructions\n\n## Role\n\n## Guidelines\n\n## Constraints\n-\n`;
  },
};
