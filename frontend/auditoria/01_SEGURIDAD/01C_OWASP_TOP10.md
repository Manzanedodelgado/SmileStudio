# 01C_OWASP_TOP10.md — Check OWASP Top 10 (2021)

> Aplicado sobre el stack: React 18 + TypeScript + Supabase + FDW SQL Server

---

| # | Categoría OWASP | Estado | Hallazgo |
|---|----------------|--------|---------|
| A01 | Broken Access Control | 🔴 FALLA | RLS no verificada en todas las tablas FDW |
| A02 | Cryptographic Failures | 🔴 FALLA | Client Secret OAuth2 en bundle JS |
| A03 | Injection | 🟡 PARCIAL | Parámetros numéricos no validados en dbSelect |
| A04 | Insecure Design | 🟠 FALLA | Auth custom sin refresh token, sin MFA |
| A05 | Security Misconfiguration | 🟠 FALLA | Sin CSP, sin HSTS (depende del hosting) |
| A06 | Vulnerable Components | 🟡 PENDIENTE | Revisar npm audit |
| A07 | Identification & Auth Failures | 🔴 FALLA | Sin rate limiting, tokens en localStorage |
| A08 | Software & Data Integrity | 🟡 PARCIAL | No hay verificación de integridad de builds |
| A09 | Security Logging & Monitoring | 🟠 FALLA | Audit trail incompleto, logs en console |
| A10 | Server-Side Request Forgery | 🟢 PASA | No hay SSRF evidente (sin proxy de URLs del user) |

---

## A01 — Broken Access Control 🔴

### Hallazgo: RLS no verificada en tablas FDW

Las tablas FDW de GELITE (`DCitas`, `TtosMed`, `Pacientes`, etc.) son Foreign Tables. Las RLS policies en Supabase **no aplican a las Foreign Tables** por defecto — solo a las tablas nativas.

```sql
-- Esto NO protege la tabla FDW:
ALTER TABLE "DCitas" ENABLE ROW LEVEL SECURITY;
-- Una foreign table ignora las RLS de Supabase

-- Cualquier usuario con el anon key puede hacer:
GET /rest/v1/DCitas?select=*
-- Y obtener TODAS las citas de TODOS los pacientes
```

**Impacto:** Violación masiva de datos médicos. Todos los pacientes expuestos.

**Solución:**
```sql
-- Opción 1: Usar Supabase Views en lugar de Foreign Tables directas
CREATE VIEW citas_safe AS
    SELECT * FROM "DCitas"
    WHERE auth.uid() IS NOT NULL; -- Solo usuarios autenticados
-- Y aplicar RLS sobre la VIEW, no la foreign table

-- Opción 2: Revocar acceso directo al anon
REVOKE SELECT ON "DCitas" FROM anon;
REVOKE SELECT ON "TtosMed" FROM anon;
-- Solo permitir acceso vía RPCs
```

---

## A02 — Cryptographic Failures 🔴

### Hallazgo: Client Secret OAuth2 en frontend
Ver `01B_VULNERABILIDADES_CRITICAS.md` — VULN-001.

### Hallazgo adicional: Tokens en localStorage
```typescript
// gmail.service.ts:139
localStorage.setItem(LS_KEY, JSON.stringify(tokens));
// tokens incluye access_token y refresh_token de Gmail
```
localStorage es accesible por cualquier script en la página → XSS roba tokens permanentemente.

---

## A04 — Insecure Design 🟠

### Hallazgo: Sin Multi-Factor Authentication

El sistema maneja datos médicos (Categoría Especial RGPD Art. 9). Sin MFA, una contraseña débil o comprometida da acceso total a todos los expedientes médicos.

**Solución:**
```typescript
// Integrar TOTP con una Edge Function
// O usar Supabase Auth con MFA habilitado (migrar desde custom auth)
```

---

## A07 — Identification & Auth Failures 🔴

### Sin rate limiting — Ver VULN-002
### Tokens en localStorage — Ver VULN-003
### Tokens en URLs

Verificar que `validate_token` no pase tokens como query params:
```typescript
// auth.service.ts — si el token va como ?token=xxx en la URL, queda en logs del servidor
// CORRECTO: Token en Authorization header (parece que sí se hace via dbFetch)
// ✅ PASA para este punto específico
```

---

## A09 — Security Logging 🟠

### Hallazgo: Audit trail incompleto

```typescript
// AUDITADO ✅: getEntradasMedicas, login, getData
// NO AUDITADO ❌: getPacientes (listado completo), búsquedas de pacientes
// NO AUDITADO ❌: modificaciones de citas
// NO AUDITADO ❌: exportaciones CSV de Gestoría
```

El Art. 30 RGPD exige registrar TODOS los accesos a datos de salud.
