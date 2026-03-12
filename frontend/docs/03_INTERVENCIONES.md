# 03_INTERVENCIONES.md — Registro de Cambios Realizados

> Cada cambio de código se registra aquí con su contexto completo.
> **Regla aplicada: Regla 5 (Documentar todo) + Regla 3 (No eliminar, completar)**

---

## FASE 3A — Correcciones Críticas (2026-03-01)

### Intervención 001 ✅
- **Archivo:** `services/sara-ai.service.ts`
- **Problema:** 100% duplicado de `ia-dental.service.ts` (10.645 bytes, 252 líneas)
- **Solución:** Archivo ELIMINADO. 0 importadores confirmados por grep.
- **Verificación:** `tsc --noEmit` → 0 errores

### Intervención 002 ✅
- **Archivo:** `services/supabase.service.ts`
- **Problema:** `sbFetch()` duplicaba la lógica de `db.ts::dbFetch()`
- **Solución:** Eliminado `sbFetch`, ahora importa `dbFetch` de `./db`
- **Verificación:** `tsc --noEmit` → 0 errores

### Intervención 003 🐛 BUG CRÍTICO ✅
- **Archivo:** `services/supabase.service.ts` — `upsertMedication` / `upsertAllergy`
- **Problema:** Filtro PATCH `id=eq.${med.id}` en **cabeceras HTTP** → PostgREST lo ignoraba → PATCH actualizaba TODOS los registros
- **Solución:** Filtro movido a la URL: `patient_medications?id=eq.${med.id}`
- **Verificación:** `tsc --noEmit` → 0 errores

### Intervención 004 ✅
- **Archivo:** `types.ts`
- **Problema:** `'Configuración'` en el tipo `Area` sin vista, sin ruta, sin navItem
- **Solución:** Eliminado del union type. Grep confirmó que ningún componente lo referencia como valor.

---

## FASE 3B — Basadas en Respuestas del Usuario (2026-03-01)

### Intervención 005 ✅
- **Archivo:** `services/citas.service.ts`
- **Problema:** `getHistorialCitasPaciente` devolvía `[]` si no se pasaba `idPac` (bug silencioso). El frontend trabaja con `NumPac`, no con `IdPac`.
- **Solución:** Nueva función `getEntradasMedicasByNumPac(numPac)` que resuelve NumPac→IdPac via tabla `Pacientes` FDW y luego llama `getEntradasMedicas(idPac)`. Alias `getHistorialCitasPaciente` actualizado para aceptar `numPac` como parámetro adicional.

### Intervención 006 ✅ (NUEVO SERVICIO)
- **Archivo:** `services/automations.service.ts` (CREADO)
- **Tabla BD:** `automations_config` (creada y verificada en Supabase PRD)
- **Funciones:** `getAutomations()`, `saveAutomation()`, `toggleAutomation()`, `seedAutomations()`
- **Características:** auto-seed 26 automatizaciones en primera carga, caché en memoria, fallback local si BD falla

### Intervención 007 ✅
- **Archivo:** `views/ia/AutomationRules.tsx`
- **Problema:** 26 automatizaciones hardcoded en `INITIAL_AUTOMATIONS`, estado 100% local
- **Solución:** `useEffect` carga desde `getAutomations()`, toggle llama `toggleAutomation()`, saveConfig llama `saveAutomation()`. UI no se rompe si BD falla (fallback transparente).

### Intervención 008 ✅
- **Archivo:** `views/ia/AutomationEditor.tsx`
- **Problema:** `handleSave()` solo hacía `setSaved(true)` sin persistir nada
- **Solución:** `handleSave` async llama `saveAutomation(newAutomation)`. Botón deshabilitado si campos vacíos. Feedback real: ¡Guardado en BD! / Error al guardar / Guardando...

### Intervención 009 ✅
- **Archivo:** `.gitignore`
- **Problema:** `DATOS_50_TABLAS_CORE.md` (88MB), `DATOS_COMPLETOS_BBDD_SQL.md` (100MB) y otros archivos de datos no estaban excluidos
- **Solución:** Añadidas reglas: `_legacy_tools/`, `DATOS_*.md`, `HISTORIAL_*.md`, `LISTADO_*.md`, `DIAGRAMA_*.md`, `ESTRUCTURA_*.md`, `MAPPING_*.md`, `preview_*.html`

### Intervención 010 ✅
- **Archivos:** ~60 archivos raíz no relacionados con la app
- **Problema:** ~26 scripts Python, ~28 SQL, ~10 logs en el directorio raíz del proyecto
- **Solución:** Creado `/_legacy_tools/` y movidos todos. Raíz queda limpio: solo archivos de app React.

### Intervención 011 ✅ (BD)
- **Archivo:** `docs/sql/create_automations_config.sql`
- **Acción:** Ejecutado directamente en Supabase PRD (`SmilePro2026` / `RUBIOGARCIADENTAL`)
- **Resultado confirmado:** 14 columnas, RLS habilitado, policy `clinic_full_access_automations`, grants a `anon` y `authenticated`

---

## Verificaciones externas confirmadas (no requerían intervención)

| Servicio | Vista conectada | Estado |
|----------|----------------|--------|
| `gmail.service.ts` | `Gestoria.tsx` (tab "Facturas Email") | ✅ Ya conectado |
| `invoice-parser.service.ts` | `Gestoria.tsx` | ✅ Ya conectado |
| `romexis.service.ts` | `Pacientes.tsx` (carousel RX) | ✅ Ya conectado |
| `gdrive.service.ts` | `Pacientes.tsx` (carousel Fotos) | ✅ Ya conectado |
