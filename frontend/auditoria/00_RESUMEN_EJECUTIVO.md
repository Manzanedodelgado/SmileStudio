# 00_RESUMEN_EJECUTIVO.md — Para Dirección: Lo Más Crítico

**Proyecto:** SmilePro — Gestión de Clínica Dental Rubio García
**Fecha de auditoría:** 2026-03-01
**Auditores:** Equipo multi-rol (Security/QA/UX/Architecture/A11y/i18n)

---

## 🔴 ALERTA INMEDIATA — 5 problemas que requieren acción HOY

### 1. Credenciales de acceso a datos médicos expuestas en el código público
**`VITE_ROMEXIS_KEY`** (radiografías) y **`VITE_GMAIL_CLIENT_SECRET`** (facturas con datos de pacientes) están incluidas en el archivo JavaScript descargable por cualquier visitante de la web.

**Riesgo real:** Un competidor, paciente o atacante pueden:
- Acceder a radiografías de todos los pacientes
- Leer y enviar correos como `info@rubiogarciandental.com`
- Generar facturas de IA a cargo de la clínica (Groq API key también expuesta)

**Acción:** En las próximas 24 horas, **revocar y regenerar** las API keys de Romexis, Gmail y Groq. Después implementar proxies server-side.

---

### 2. Sin protección contra fuerza bruta en el login
El sistema de login no tiene límite de intentos. Un atacante puede probar **100.000 contraseñas por hora** de forma automatizada.

**Riesgo real:** Acceso completo al historial médico de todos los pacientes. Multa RGPD de hasta el **4% de la facturación anual** o 20M€.

**Acción:** Añadir rate limiting al RPC `app_login` en Supabase (2-3 horas de trabajo).

---

### 3. Consentimientos informados no son válidos legalmente
Los formularios de consentimiento (RGPD Art. 9) en la app son una **simulación visual** — no guardan nada en la base de datos. Si hay una inspección de la Agencia Española de Protección de Datos, no hay evidencia de consentimientos firmados.

**Acción:** Implementar persistencia real de firmas (tabla `document_signatures` en Supabase).

---

### 4. Datos médicos accesibles sin autenticación vía API directa
Las tablas de datos médicos de GELITE (citas, tratamientos, pacientes) están expuestas como Foreign Tables en Supabase. Sin Row Level Security efectiva, son accesibles con el `anon key` (que está en el JS público) sin necesidad de login.

**Acción:** Revocar acceso directo y canalizar todo a través de RPCs autenticadas.

---

### 5. Radiografías y fotos en Google Drive sin URLs seguras
Las imágenes médicas de pacientes se sirven desde Google Drive con URLs que no expiran. Quien tenga el link accede permanentemente a las imágenes sin autenticación.

**Acción:** Migrar a Supabase Storage con Signed URLs (expiración de 60 segundos).

---

## 📊 Resumen por categoría

| Área | Críticos | Altos | Medios | Total hallazgos |
|------|----------|-------|--------|----------------|
| Seguridad | 5 | 3 | 4 | 12 |
| Funcionalidad | 2 | 4 | 6 | 12 |
| Rendimiento | 0 | 4 | 5 | 9 |
| UX/UI | 0 | 2 | 5 | 7 |
| Accesibilidad | 2 | 3 | 4 | 9 |
| i18n | 0 | 0 | 2 | 2 |
| Compatibilidad | 0 | 0 | 2 | 2 |
| **TOTAL** | **9** | **16** | **28** | **53** |

---

## ✅ Lo que está bien

- Arquitectura FDW para no duplicar datos de GELITE ✅
- Fallbacks y resiliencia en todos los servicios (app nunca se rompe ante error) ✅
- Audit trail básico implementado ✅
- Diseño visual moderno y coherente ✅
- TypeScript sin errores de compilación ✅
- CSVs con BOM Unicode (Excel funciona con acentos) ✅

---

## 🗂️ Plan de acción recomendado

| Sprint | Acciones | Tiempo estimado |
|--------|----------|----------------|
| **Sprint 1 (HOY)** | Revocar y rotar API keys | 2 horas |
| **Sprint 2 (Esta semana)** | Rate limiting + RLS FDW + Proxies Edge Functions | 12 horas |
| **Sprint 3 (Este mes)** | Consentimientos reales + Audit trail completo + Timeouts | 16 horas |
| **Sprint 4 (Próximo trimestre)** | MFA + Paginación + Error monitoring + Signed URLs | 40 horas |
