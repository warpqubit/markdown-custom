---
name: git-workflow
description: Flujo de trabajo con Git para proyectos individuales y equipos.
tags: ["git", "version-control", "devops"]
version: 1.0.0
author: custom
---

# git-workflow

## Cuándo usar este skill

Activar cuando el usuario pide ayuda con commits, branches, merges, rebases, resolución de conflictos o configuración de Git.

## Instrucciones

### Convención de commits (Conventional Commits)
```
<tipo>(<scope>): <descripción en imperativo>

feat:     nueva funcionalidad
fix:      corrección de bug
docs:     solo documentación
style:    formato, sin cambio de lógica
refactor: refactorización sin fix ni feat
test:     agregar o corregir tests
chore:    build, deps, configuración
```

### Flujo de branches
1. `main` — siempre deployable, solo merge via PR/MR
2. `develop` — integración continua (opcional en proyectos chicos)
3. `feat/nombre-descriptivo` — features nuevas
4. `fix/descripcion-del-bug` — correcciones
5. `hotfix/descripcion` — fixes urgentes a production

### Antes de cada commit
- Revisar `git diff --staged` para ver exactamente qué se está commitando
- Verificar que no se incluyen archivos sensibles (.env, keys)
- Correr tests locales si los hay

### Comandos frecuentes con contexto
```bash
# Ver estado limpio
git status -s

# Agregar interactivamente (recomendado)
git add -p

# Revertir cambios en staging sin perder el trabajo
git restore --staged <archivo>

# Stash con nombre descriptivo
git stash push -m "wip: feature login modal"

# Ver log compacto
git log --oneline --graph --decorate -15
```

## Notas

- Nunca hacer `git push --force` en `main`/`master` sin confirmación explícita del usuario.
- Para conflictos complejos, recomendar usar `git mergetool` o VS Code.
- Mencionar `.gitignore` si el usuario está commitando archivos que no debería.
