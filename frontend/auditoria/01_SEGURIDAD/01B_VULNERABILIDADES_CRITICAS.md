# 01B_VULNERABILIDADES_CRITICAS.md — Vulnerabilidades que pueden tumbar la web

> Clasificadas por impacto real en producción.

---

## 🔴 VULN-001 — Client Secret OAuth2 en bundle JS

**Archivo:** `services/gmail.service.ts:19`
**CVE relacionado:** CWE-798 (Hard-coded Credentials)

```typescript
const CLIENT_SECRET = import.meta.env.VITE_GMAIL_CLIENT_SECRET as string;
// ↑ Vite incluye todo VITE_* en el JS bundle público
```

**Impacto:** Cualquier persona puede extraer el Client Secret desde las DevTools del navegador → suplantar la aplicación en Google OAuth → acceder a correos de `info@rubiogarciandental.com`.

**Fix inmediato:** Mover el intercambio de token a una Edge Function de Supabase.

---

## 🔴 VULN-002 — Sin Rate Limiting en Login

**Archivo:** `services/auth.service.ts`
```typescript
// 0 protección contra fuerza bruta
export const login = async (username: string, password: string) => {
    return dbFetch('rpc/app_login', { method: 'POST', body: JSON.stringify({ p_username: username, p_password: password }) });
};
```

**Impacto:** Un atacante puede automatizar 100.000 intentos de login por hora contra cuentas de dentistas y recepcionistas. Acceso total a datos de pacientes (RGPD → multa hasta 4% facturación anual).

---

## 🔴 VULN-003 — Tokens JWT en localStorage

**Archivo:** `services/auth.service.ts` (patrón detectado — token almacenado en localStorage)
```typescript
localStorage.setItem(LS_KEY, JSON.stringify(tokens)); // gmail.service.ts:139
// También en auth.service.ts: token guardado en localStorage/sessionStorage
```

**Impacto:** Cualquier XSS puede robar el token → secuestro de sesión → acceso a historial médico de pacientes (Art. 9 RGPD, datos de categoría especial).

**Fix:**
```typescript
// Usar HttpOnly cookies (requiere Edge Function como proxy)
// O al menos:
sessionStorage.setItem('token', token); // Muere al cerrar pestaña
// + Content Security Policy estricta para mitigar XSS
```

---

## 🔴 VULN-004 — FDW sin validación de parámetros

**Archivo:** `services/citas.service.ts` (múltiples funciones)
```typescript
const rows = await dbSelect<CitaRow>('DCitas', {
    NumPac: `eq.${numPac}`,  // numPac viene del frontend
    ...
});
```

**Impacto:** Si `numPac` no se sanitiza apropiadamente antes de enviarse, y PostgREST tiene algún bug de parsing, podría haber path traversal en el endpoint REST.

**Fix:**
```typescript
// Validar que numPac sea un número antes de usarlo
const safePac = parseInt(numPac, 10);
if (isNaN(safePac) || safePac <= 0) throw new Error('NumPac inválido');
```

---

## 🔴 VULN-005 — Datos médicos sin auditoría completa

**Archivo:** `services/audit.service.ts`
```typescript
// El audit trail existe pero no todas las acciones están registradas
// Ejemplo: getEntradasMedicas() SÍ registra, pero getPacientes() NO registra el listado completo
```

**Impacto RGPD:** El Art. 30 exige registro de actividades de tratamiento. Un listado de todos los pacientes sin registro viola RGPD.

---

## 🟠 VULN-006 — Console.log con datos sensibles

**Archivos:** Múltiples
```typescript
// citas.service.ts
console.warn('[Citas] getEntradasMedicasByNumPac: no se encontró IdPac para NumPac=${numPac}');
// → expone NumPac en consola del navegador

// automations.service.ts
console.info('[Automations] Semilla completada: 26 automatizaciones guardadas');
// → Información de estructura interna visible en producción
```

**Impacto:** Atacantes con acceso físico a un PC de clínica (o con XSS) pueden leer datos de pacientes en la consola.

**Fix:**
```typescript
// Crear un logger que filtre en producción
const logger = {
    warn: (...args: unknown[]) => import.meta.env.DEV && console.warn(...args),
    info: (...args: unknown[]) => import.meta.env.DEV && console.info(...args),
};
```
