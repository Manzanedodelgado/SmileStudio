# 02_AUDITORIA.md — Auditoría de Integridad (Fase 2)

> Generado tras el escaneo completo de Fase 1. Fecha: 2026-03-01
> **Regla aplicada: Regla 2 (Honestidad) + Regla 5 (Documentar todo)**

---

## 🔴 PROBLEMAS CRÍTICOS (Alta Prioridad)

### [CRIT-01] sara-ai.service.ts es un DUPLICADO EXACTO de ia-dental.service.ts
- **Archivo 1:** `services/ia-dental.service.ts` (10.645 bytes, 252 líneas)
- **Archivo 2:** `services/sara-ai.service.ts` (10.645 bytes, 252 líneas — IDÉNTICO)
- **Evidencia:** Mismo tamaño exacto en bytes. El encabezado interno de `sara-ai.service.ts` dice "ia-dental.service.ts". Mismas funciones: `askIA`, `analyzeOdontograma`, `loadChatHistory`, `saveChatMessage`, `callGroq`, `sanitizeInput`, `fallbackReply`.
- **Riesgo:** Si se actualiza `ia-dental.service.ts` y se olvida `sara-ai.service.ts`, ambos divergen silenciosamente. Cualquier bug se tiene que corregir en dos sitios.
- **Solución:** Eliminar `sara-ai.service.ts` y hacer que cualquier importador use `ia-dental.service.ts`.

### [CRIT-02] supabase.service.ts tiene su propio fetch helper que duplica db.ts
- **Problema:** `supabase.service.ts` define `sbFetch()` que hace exactamente lo mismo que `db.ts::dbFetch()`. Misma lógica, mismo URL base, mismas cabeceras.
- **Riesgo:** Si la `SUPABASE_ANON_KEY` cambia o el patrón de autenticación evoluciona, hay que cambiarlo en dos sitios.
- **Solución:** Refactorizar `supabase.service.ts` para importar `dbFetch` de `db.ts`.

---

## 🟠 PROBLEMAS IMPORTANTES (Media Prioridad)

### [WARN-01] SaraConfig.tsx está prácticamente vacío (138 bytes)
- **Archivo:** `views/ia/SaraConfig.tsx`
- **Contenido:** Solo 138 bytes. Casi con certeza es un stub vacío.
- **Referencia en navegación:** No aparece en `navigation.ts` como subárea, pero existe el archivo.
- **Solución:** Verificar si se referencia desde algún componente. Si no, es un archivo huérfano — marcado como [REVIEW].

### [WARN-02] AutomationRules.tsx y FlowsView.tsx y AutomationEditor.tsx no tienen servicio backend
- **Problema:** Estas vistas de IA parecen ser frontend puro sin llamadas a servicios reales.
- **Comprobación necesaria:** Abrir cada archivo y verificar si usa datos reales o mock.
- **Estado:** Pendiente de verificar en Fase 3.

### [WARN-03] whatsapp.service.ts es solo un wrapper re-export de evolution.service.ts
- **Archivo:** `services/whatsapp.service.ts`
- **Contenido:** Solo `export * from './evolution.service'` + 3 funciones legacy wrap.
- **Evaluación:** No es un duplicado perjudicial — es una capa de compatibilidad válida. Pero se puede simplificar.
- **Decisión:** MANTENER por ahora (Regla 3: No eliminar). Los importadores de `whatsapp.service.ts` funcionan.

### [WARN-04] agenda-config.service.ts vs config-agenda.service.ts — nombres confusos
- **Archivo 1:** `agenda-config.service.ts` — Lee catálogos del FDW GELITE.
- **Archivo 2:** `config-agenda.service.ts` — Guarda configuración en `config_agenda_web`.
- **Evaluación:** Son responsabilidades DISTINTAS (lectura FDW vs persistencia web). NO son duplicados.
- **Problema:** Los nombres son casi idénticos y pueden generar confusión de importaciones.
- **Solución sugerida:** Renombrar para claridad. Pendiente [REVIEW].

### [WARN-05] Archivo raíz contiene ~200MB de archivos de datos y migración
- **Archivos:** `DATOS_50_TABLAS_CORE.md` (88MB), `DATOS_COMPLETOS_BBDD_SQL.md` (100MB), ~15 scripts `.py`, ~25 archivos `.sql`, `*.log`.
- **Riesgo:** Contaminan el directorio del proyecto, pueden ralentizar IDEs, y no deben nunca entrar en el bundle de producción.
- **Solución:** Mover a directorio `/_legacy_tools/` o `.gitignore` adecuado. No afectan al runtime.

### [WARN-06] Archivos duplicados con sufijo " 2" en el raíz
- **Pares duplicados:**
  - `supabase-migration-full.sql` ↔ `supabase-migration-full 2.sql`
  - `Untitled-1.yaml` ↔ `Untitled-1 2.yaml`
  - `update_sidebar.py` ↔ `update_sidebar 2.py`
- **Causa probable:** Copias accidentales de Finder (macOS añade " 2" al duplicar).
- **Solución:** Verificar si son idénticos y eliminar los " 2".

---

## 🟡 INCONSISTENCIAS FRONTEND ↔ BACKEND

### [INCO-01] Área 'Configuración' definida en types.ts pero sin vista ni ruta
- **Evidencia:** `types.ts::Area` incluye `'Configuración'` como tipo válido.
- **App.tsx:** El switch en `renderContent()` no tiene un `case 'Configuración'`.
- **navigation.ts:** No existe un item de menú para 'Configuración'.
- **Estado:** `Configuración` es un tipo huérfano. No causa crash (el default del switch es Dashboard), pero es técnica inconsistente.
- **Solución:** Eliminar 'Configuración' de los tipos o añadir la ruta y vista correspondiente.

### [INCO-02] SaraConfig.tsx — vista de área IA que puede estar sin conectar
- **Problema:** Si `SaraConfig` fue diseñada para configurar "Sara AI" (la IA de WhatsApp), debería importar `sara-ai.service.ts`. Dado que ese archivo es un duplicado de `ia-dental.service.ts`, la configuración puede estar incompleta.
- **Estado:** [REVIEW] — Requiere abrir el archivo para verificar.

### [INCO-03] getHistorialCitasPaciente en citas.service.ts es un alias deprecado
- **Función:** `getHistorialCitasPaciente(apellidos, nombre, idPac?)` — Solo llama a `getEntradasMedicas(idPac)` si hay idPac.
- **Comentario en código:** "Alias por compatibilidad con código anterior. DCitas es la agenda, NO el historial clínico."
- **Riesgo:** Si algún componente llama a esta función sin `idPac`, retorna `[]` silenciosamente.
- **Estado:** [REVIEW] — Verificar todos los callers de `getHistorialCitasPaciente`.

### [INCO-04] upsertMedication tiene bug de header HTTP
- **Archivo:** `supabase.service.ts` línea 109
- **Código:** `headers: med.id ? { 'id': \`eq.${med.id}\` } : {}` ← El filtro `id=eq.xxx` debe ir en la **URL**, no en las cabeceras HTTP.
- **Impacto:** El PATCH de medicaciones puede estar actualizando TODOS los registros en lugar del específico.
- **Estado:** BUG CRÍTICO [REVIEW] — Necesita corrección.

---

## ✅ ELEMENTOS CORRECTAMENTE IMPLEMENTADOS

| Elemento | Estado |
|----------|--------|
| Auth system (RPC custom) | ✅ Correcto — sin GoTrue, TTL server-side |
| Merge GELITE+web en citas | ✅ Correcto — soft delete, override pattern |
| Reserve slot (pessimistic lock) | ✅ Correcto — RPC atómica |
| Upsert odontograma | ✅ Correcto — elimina race condition |
| Stock ajustes pendientes (ledger) | ✅ Correcto — no escribe FDW directamente |
| RGPD audit trail | ✅ Correcto — fire-and-forget en audit_log |
| Caché paginada de pacientes | ✅ Correcto — TTL 5min, 1000/página |
| Prompt injection sanitization | ✅ Correcto — 7 patrones bloqueados |
| Fallback IA (sin API key) | ✅ Correcto — respuestas estáticas útiles |
| isDbConfigured guard | ✅ Correcto — todos los servicios lo usan |
| Parallel queries en inventario | ✅ Correcto — Promise.all en vez de N+1 |

---

## 📊 Resumen de Hallazgos

| Severidad | Cantidad | Descripción |
|-----------|---------|-------------|
| 🔴 Crítico | 2 | Duplicado de servicio, fetch helper duplicado |
| 🟠 Importante | 6 | Archivos vacíos, sin backend, nombres confusos, archivos contaminantes |
| 🟡 Inconsistencia | 4 | Tipo sin vista, alias deprecado, bug PATCH headers |
| ✅ Correcto | 11 | Implementaciones bien hechas que no tocar |

**Total de intervenciones: 12 items identificados**
