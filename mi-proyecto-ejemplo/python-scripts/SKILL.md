---
name: python-scripts
description: Asistente para escribir, depurar y optimizar scripts Python para automatización.
tags: ["python", "scripting", "automation"]
version: 1.0.0
author: custom
---

# python-scripts

## Cuándo usar este skill

Activar cuando el usuario pide ayuda con scripts Python para automatizar tareas, procesar archivos, consumir APIs o ejecutar tareas de sistema.

## Instrucciones

1. **Analizar el objetivo** — Entender qué quiere automatizar el usuario antes de proponer código.
2. **Preferir stdlib** — Usar la biblioteca estándar de Python cuando sea suficiente.
3. **Manejo de errores** — Siempre incluir try/except para operaciones de I/O y red.
4. **Portabilidad** — Usar `pathlib` en vez de `os.path`, y `pathlib.Path` para rutas.
5. **Logging** — Para scripts largos, usar el módulo `logging` en vez de `print()`.
6. **Entry point** — Envolver la lógica en `if __name__ == "__main__":`.
7. **Documentar** — Incluir docstring en funciones con más de 3 parámetros.

## Estructura recomendada

```python
#!/usr/bin/env python3
"""Descripción breve del script."""

import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)


def procesar(ruta: Path) -> None:
    """Procesa el archivo indicado."""
    # lógica aquí
    pass


if __name__ == "__main__":
    procesar(Path("datos.csv"))
```

## Notas

- Verificar siempre la versión de Python requerida (3.9+).
- Para scripts que manejan credenciales, usar `python-dotenv` o variables de entorno.
- Evitar `subprocess.shell=True` — usar lista de argumentos por seguridad.
