---
name: sql-queries
description: Escritura y optimización de queries SQL para bases de datos relacionales.
tags: ["sql", "database", "postgresql", "mysql"]
version: 1.0.0
author: custom
---

# sql-queries

## Cuándo usar este skill

Activar cuando el usuario pide ayuda para escribir, depurar u optimizar queries SQL. Aplica a PostgreSQL, MySQL, SQLite y SQL Server.

## Instrucciones

### 1. Entender el contexto
- Pedir el esquema de tablas si no está claro
- Preguntar el volumen de datos estimado para recomendar índices
- Identificar el engine (PostgreSQL, MySQL, etc.) para sintaxis específica

### 2. Escribir queries claras
```sql
-- Preferir CTEs para queries complejas en vez de subqueries anidadas
WITH ventas_mes AS (
    SELECT
        vendedor_id,
        DATE_TRUNC('month', fecha) AS mes,
        SUM(monto)                 AS total
    FROM ventas
    WHERE fecha >= '2024-01-01'
    GROUP BY vendedor_id, mes
)
SELECT
    v.nombre,
    vm.mes,
    vm.total
FROM ventas_mes vm
JOIN vendedores v ON v.id = vm.vendedor_id
ORDER BY vm.mes, vm.total DESC;
```

### 3. Optimización
- Verificar que los JOINs usan columnas indexadas
- Evitar `SELECT *` en producción
- Usar `EXPLAIN ANALYZE` para diagnosticar queries lentas
- Filtrar temprano: poner condiciones WHERE en CTEs, no solo al final
- Para paginación, preferir `LIMIT/OFFSET` + índice o cursor-based pagination

### 4. Seguridad
- **Siempre** usar queries parametrizadas cuando los valores vienen del usuario
- Nunca concatenar strings para construir queries dinámicas
- Revisar que el usuario de DB tiene solo los permisos necesarios

## Notas

- Para MySQL, mencionar diferencias en funciones de fecha y manejo de NULL.
- Para PostgreSQL, aprovechar tipos específicos: `JSONB`, `ARRAY`, `UUID`.
- Si hay problemas de performance, revisar estadísticas con `ANALYZE` antes de crear índices.
