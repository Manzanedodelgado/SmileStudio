# 01D_AUTENTICACION.md — Login, Sesiones, Tokens

> Análisis del sistema de autenticación custom (no GoTrue).

---

## Arquitectura actual

```
Usuario → app_login RPC → Supabase → [?? SQL interno] → token custom
         → validate_token RPC → verificación
         → revoke_token RPC → logout
```

Archivo principal: `services/auth.service.ts`

---

## Hallazgo 1 — Sistema de auth completamente custom 🟠

**Problema:** No usa el sistema de autenticación nativo de Supabase (GoTrue). Esto significa:
- ❌ Sin MFA nativo
- ❌ Sin refresh token estándar JWT
- ❌ Sin protección CSRF nativa
- ❌ Sin gestión de sesiones en servidor
- ❌ Sin lista de sesiones activas (no puedes ver qué dispositivos tienen sesión)

**Riesgo:** El sistema depende 100% de la implementación correcta del RPC `app_login`. Si hay un bug en ese SQL, compromete toda la seguridad.

---

## Hallazgo 2 — Expiración de tokens no verificada en frontend 🟡

```typescript
// auth.service.ts — patrón probable
const token = localStorage.getItem('token'); // o sessionStorage
// No se verifica si el token ha expirado antes de usarlo
// Se envía el token caducado → esperar a que la API rechace
```

**Solución:**
```typescript
// Decodificar JWT y verificar exp antes de cada request
const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch { return true; }
};

// En dbFetch, antes de cada request:
if (token && isTokenExpired(token)) {
    await logout(); // Limpiar y redirigir a login
    throw new Error('Sesión expirada');
}
```

---

## Hallazgo 3 — Sin validación de complejidad de password 🟡

**Archivos afectados:** Sin form de cambio de contraseña detectado en el código.

**Riesgo:** Si los usuarios tienen contraseñas simples (ej: '123456'), el ataque de fuerza bruta combinado con la falta de rate limiting (VULN-002) es trivial.

---

## Hallazgo 4 — Tokens JWT sin verificación de firma en cliente 🟡

Los tokens JWT deberían verificarse con la clave pública. En el frontend de clínica, cualquier token JWT formalmente válido (firmado o no) podría ser aceptado si la verificación solo la hace el servidor.

**Estado:** Necesita verificación del código SQL de `validate_token`.

---

## Hallazgo 5 — Sin logout global (revocation en todos los dispositivos) 🟡

```typescript
// Logout actual en auth.service.ts:
export const logout = async () => {
    await dbFetch('rpc/revoke_token', { method: 'POST', body: ... });
    // Solo revoca el token actual — si el usuario tiene sesión abierta
    // en otro dispositivo, esa sesión sigue activa
};
```

**Solución:**
```sql
-- En revoke_token RPC:
-- Borrar TODOS los tokens del usuario, no solo el actual
DELETE FROM user_tokens WHERE user_id = p_user_id; -- no solo WHERE token = p_token
```

---

## Resumen de estado Auth:

| Check | Estado |
|-------|--------|
| Contraseñas hasheadas en BD | ⚠️ Sin verificar (depende del RPC) |
| Rate limiting en login | 🔴 FALLA |
| Tokens en lugar seguro | 🔴 FALLA (localStorage) |
| Expiración de token | 🟡 Parcial |
| MFA | 🔴 No implementado |
| Refresh token | 🟡 Sin verificar |
| Logout global | 🟡 Parcial |
| CSRF protection | 🟡 Sin verificar |
