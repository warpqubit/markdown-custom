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

  async findSkills(dir = this.rootHandle, base = '') {
    const skills = [];
    if (!dir) return skills;
    for await (const [name, handle] of dir) {
      if (handle.kind === 'directory') {
        if (name.startsWith('.') || name === 'node_modules' || name === '__pycache__') continue;
        const subPath = base ? `${base}/${name}` : name;
        try {
          const f = await handle.getFileHandle('SKILL.md');
          skills.push({ name, path: `${subPath}/SKILL.md`, handle: f, dirHandle: handle });
        } catch { /* no SKILL.md */ }
        const nested = await this.findSkills(handle, subPath);
        skills.push(...nested);
      }
    }
    return skills;
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

  async createSkill(skillName) {
    if (!this.rootHandle) throw new Error('Sin directorio');
    // Buscar carpeta skills/ o crearla
    let skillsDir;
    try { skillsDir = await this.rootHandle.getDirectoryHandle('skills'); }
    catch { skillsDir = await this.rootHandle.getDirectoryHandle('skills', { create: true }); }
    const newDir  = await skillsDir.getDirectoryHandle(skillName, { create: true });
    const newFile = await newDir.getFileHandle('SKILL.md', { create: true });
    await this.writeFile(newFile, this._template(skillName));
    return { name: skillName, path: `skills/${skillName}/SKILL.md`, handle: newFile, dirHandle: newDir };
  },

  async deleteSkillFile(dirHandle) {
    await dirHandle.removeEntry('SKILL.md');
  },

  getRootName() { return this.rootHandle?.name ?? ''; },

  _template(name) {
    return `---\nname: ${name}\ndescription: Describí cuándo Claude debe usar este skill.\ntags: []\nversion: 1.0.0\nauthor: custom\n---\n\n# ${name}\n\n## Cuándo usar este skill\n\nDescribí el trigger — qué palabras o situaciones activan este skill.\n\n## Instrucciones\n\n1. Paso uno\n2. Paso dos\n3. Paso tres\n\n## Notas\n\nCasos borde, aclaraciones, ejemplos.\n`;
  }
};
