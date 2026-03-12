# 00_INDICE.md — Punto de Entrada del Sistema de Memoria

> **Siempre empezar aquí.** Este archivo orienta sobre el estado actual del proyecto y enlaza a toda la documentación.

---

## 🎯 Resumen Ejecutivo

**Proyecto:** SmilePro — Rubio García Dental  
**Stack:** React 18 + TypeScript + Vite + Tailwind / Supabase (PostgreSQL) + GELITE FDW (SQL Server)  
**Fecha de auditoría:** 2026-03-01  
**Estado actual:** Fase 2 (Auditoría) COMPLETADA → Iniciando Fase 3 (Correcciones)

### ¿Qué se encontró?
Se analizaron **21 servicios**, **11 vistas**, **12 componentes** y **~100 archivos** de raíz.

| Severidad | Hallazgos |
|-----------|----------|
| 🔴 Crítico (corregir ya) | 2 — Duplicado de servicio + fetch helper duplicado |
| 🟠 Importante | 6 — Archivos vacíos, sin backend, nombres confusos, archivos contaminantes |
| 🟡 Inconsistencia | 4 — Tipo huérfano, alias deprecado, bug PATCH headers |
| ✅ Correcto (no tocar) | 11 implementaciones bien hechas |

### Bug más urgente:
**`supabase.service.ts::upsertMedication`** — El filtro PATCH está en las cabeceras HTTP en vez de en la URL, lo que podría actualizar TODOS los registros de medicaciones en lugar del específico.

---

## 📚 Documentos del Sistema de Memoria

| Archivo | Propósito | Estado |
|---------|----------|--------|
| [00_REGLAS_CLAVE.md](./00_REGLAS_CLAVE.md) | Las 5 reglas de oro del proceso | ✅ Completo |
| [00_INSTRUCCIONES_BASE.md](./00_INSTRUCCIONES_BASE.md) | Prompt original completo | ✅ Completo |
| [CHECKPOINT.md](./CHECKPOINT.md) | Estado actual y próximo paso | ✅ Activo |
| [01_ESTRUCTURA_INICIAL.md](./01_ESTRUCTURA_INICIAL.md) | Mapa de archivos y relaciones | ✅ Completo |
| [02_AUDITORIA.md](./02_AUDITORIA.md) | Hallazgos y problemas detectados | ✅ Completo |
| [03_INTERVENCIONES.md](./03_INTERVENCIONES.md) | Registro de cambios realizados | 🔄 Activo |
| [04_CODIGO_NO_CLARO.md](./04_CODIGO_NO_CLARO.md) | Items [REVIEW] para el humano | 🔄 Activo — 6 ítems abiertos |
| [05_ENDPOINTS_MAP.json](./05_ENDPOINTS_MAP.json) | Mapa definitivo Frontend↔Backend | ✅ Completo |

---

## 🚦 Estado de Fase Actual

### ✅ Fase 1: Escaneo Profundo (COMPLETADA)
- Analizados: todos los servicios, vistas, tipos, contextos y navegación
- Resultado: `01_ESTRUCTURA_INICIAL.md` generado

### ✅ Fase 2: Auditoría de Integridad (COMPLETADA)
- 12 hallazgos categorizados en `02_AUDITORIA.md`
- 6 ítems en `04_CODIGO_NO_CLARO.md` para revisión humana
- Mapa completo en `05_ENDPOINTS_MAP.json`

### 🔄 Fase 3: Limpieza y Optimización (EN PROGRESO)
**Correcciones aprobadas para ejecutar:**
- [ ] Eliminar `sara-ai.service.ts` (100% duplicado)
- [ ] Refactorizar `supabase.service.ts` para usar `db.ts::dbFetch`
- [ ] Corregir bug PATCH en `upsertMedication`
- [ ] Eliminar tipo 'Configuración' huérfano de `types.ts`

**Pendiente de verificación humana (ver `04_CODIGO_NO_CLARO.md`):**
- REVIEW-001: ¿Qué debe hacer `SaraConfig.tsx`?
- REVIEW-002: ¿AutomationRules/FlowsView son prototipo o funcionales?
- REVIEW-003: ¿Quién llama a `getHistorialCitasPaciente` sin `idPac`?
- REVIEW-004: ¿Están los archivos grandes en `.gitignore`?
- REVIEW-005: ¿`SUPABASE_MIGRATION_SQL` se usa desde el frontend?
- REVIEW-006: ¿gmail/gdrive/romexis/invoice-parser están activos?

---

## ⚡ Próximo Paso (según CHECKPOINT.md)
Ejecutar las correcciones aprobadas de Fase 3, empezando por el bug crítico de `upsertMedication`.
