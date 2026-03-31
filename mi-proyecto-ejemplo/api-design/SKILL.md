---
name: api-design
description: Diseño de APIs REST con buenas prácticas, versionado y documentación OpenAPI.
tags: ["api", "rest", "backend", "openapi"]
version: 1.0.0
author: custom
---

# api-design

## Cuándo usar este skill

Activar cuando el usuario diseña o revisa una API REST, define endpoints, maneja errores HTTP o documenta contratos de API.

## Instrucciones

### 1. Nomenclatura de endpoints
```
# Recursos en plural, sin verbos en la URL
GET    /api/v1/usuarios          → listar usuarios
POST   /api/v1/usuarios          → crear usuario
GET    /api/v1/usuarios/{id}     → obtener uno
PUT    /api/v1/usuarios/{id}     → reemplazar
PATCH  /api/v1/usuarios/{id}     → actualizar parcial
DELETE /api/v1/usuarios/{id}     → eliminar

# Relaciones anidadas (máximo 2 niveles)
GET    /api/v1/usuarios/{id}/pedidos
POST   /api/v1/pedidos/{id}/items
```

### 2. Códigos HTTP correctos
| Situación                  | Código   |
|---------------------------|----------|
| Creación exitosa           | 201      |
| Operación sin respuesta    | 204      |
| Recurso no encontrado      | 404      |
| Validación fallida         | 422      |
| No autenticado             | 401      |
| Sin permiso                | 403      |
| Conflicto (duplicado)      | 409      |
| Error interno              | 500      |

### 3. Formato de errores consistente
```json
{
  "error": {
    "code":    "VALIDATION_ERROR",
    "message": "El campo email es requerido.",
    "details": [
      { "field": "email", "issue": "required" }
    ],
    "request_id": "req_abc123"
  }
}
```

### 4. Versionado
- Versionar en la URL: `/api/v1/`, `/api/v2/`
- Mantener v anterior activa por al menos 6 meses al deprecar
- Documentar breaking changes en `CHANGELOG.md`

### 5. Paginación estándar
```json
{
  "data": [...],
  "pagination": {
    "page":        1,
    "per_page":    20,
    "total":       847,
    "total_pages": 43
  }
}
```

## Notas

- Para APIs públicas, siempre generar spec OpenAPI 3.1.
- Rate limiting: responder con `429` y header `Retry-After`.
- CORS: configurar explícitamente, no usar wildcard `*` en producción.
