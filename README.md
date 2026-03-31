# Markdown Custom

Gestor local de skills para Claude. Detecta, edita, crea y elimina archivos `SKILL.md` desde el browser.

## Requisitos

- **Node.js** instalado ([descargar acá](https://nodejs.org))
- **Chrome 86+** o **Edge 86+** (necesario para File System Access API)

## Instalación rápida (Windows)

### Opción A — Doble click
1. Descomprimí la carpeta `markdown-custom`
2. Hacé doble click en `start.bat`
3. Se abre el browser automáticamente en `http://localhost:3000`

### Opción B — Terminal
```bash
cd markdown-custom
npm start
```
Luego abrí `http://localhost:3000` en Chrome o Edge.

## Primer uso

1. Hacé click en **Conectar directorio**
2. Seleccioná la carpeta de tu proyecto (ej: `mi-proyecto-ejemplo`)
3. La app detecta todos los `SKILL.md` automáticamente
4. Seleccioná un skill para editarlo

## Funcionalidades

| Función | Cómo |
|---------|------|
| Ver skills | Se listan automáticamente en el sidebar |
| Editar | Click en un skill → editor + preview lado a lado |
| Guardar | Botón **Guardar** o `Ctrl+S` |
| Nuevo skill | Botón **+** en el sidebar |
| Eliminar | Botón **eliminar skill** en el editor |
| Catálogo | Botón **Agregar desde catálogo** → instala desde GitHub |

## Estructura esperada del proyecto

La app detecta cualquier `SKILL.md` en cualquier subcarpeta:

```
mi-proyecto/
└── skills/
    ├── docx/
    │   └── SKILL.md   ← detectado
    ├── pdf/
    │   └── SKILL.md   ← detectado
    └── custom/
        └── SKILL.md   ← detectado
```

## Proyecto de ejemplo

Usá `mi-proyecto-ejemplo` (carpeta separada) para probar la app antes de conectarla a tu proyecto real.

## Catálogo remoto

El catálogo se conecta al repositorio oficial de Anthropic:
`https://github.com/anthropics/skills`

Muestra métricas reales: stars, forks, última actualización y score calculado.

---

**Markdown Custom v0.1** · Local · Open Source · Sin backend
