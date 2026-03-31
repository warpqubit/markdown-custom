---
name: code-review
description: Revisión exhaustiva de código con foco en correctitud, seguridad y mantenibilidad.
tags: ["code-review", "quality", "security"]
version: 1.0.0
author: custom
---

# code-review

## Cuándo usar este skill

Activar cuando el usuario pide revisar, auditar o mejorar un fragmento de código existente, sin importar el lenguaje.

## Instrucciones

Revisar en este orden de prioridad:

### 1. Correctitud
- ¿La lógica produce el resultado esperado?
- ¿Hay casos borde no manejados (null, vacío, negativo, overflow)?
- ¿Las condiciones de borde en loops son correctas (off-by-one)?

### 2. Seguridad
- ¿Hay posibilidad de inyección (SQL, command, XSS)?
- ¿Las entradas externas están validadas y saneadas?
- ¿Las credenciales están hardcodeadas?
- ¿Se expone información sensible en logs o respuestas de error?

### 3. Rendimiento
- ¿Hay queries N+1 o iteraciones anidadas evitables?
- ¿Se reutilizan cálculos costosos?
- ¿El uso de memoria es razonable para el volumen esperado?

### 4. Mantenibilidad
- ¿Los nombres de variables y funciones son descriptivos?
- ¿Las funciones tienen responsabilidad única?
- ¿Hay duplicación de código que podría extraerse?

### 5. Formato del feedback
Para cada problema encontrado, reportar:
- **Ubicación**: línea o función afectada
- **Tipo**: Bug / Seguridad / Rendimiento / Estilo
- **Severidad**: Crítico / Mayor / Menor / Sugerencia
- **Descripción**: qué está mal y por qué
- **Corrección propuesta**: código concreto

## Notas

- Comenzar con un resumen ejecutivo (1-3 oraciones).
- Separar issues obligatorios de mejoras opcionales.
- No reescribir código si solo hay mejoras menores de estilo.
