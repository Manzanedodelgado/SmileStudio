# 08_PROPUESTAS DE CAMBIO

---

## 08A_CRITICOS_INMEDIATOS.md — HAY QUE ARREGLARLO YA

### 🔴 PRIORIDAD 1 — Mover API keys privadas a Edge Functions (Groq, Gmail Secret, Romexis)

**Impacto:** Exposición de credenciales de salud + factura de IA a nombre de la clínica
**Esfuerzo:** 4-6 horas
**Plan:**
```
1. Crear supabase/functions/groq-proxy/
2. Crear supabase/functions/gmail-auth/ (intercambio de código OAuth)
3. Crear supabase/functions/romexis-proxy/
4. Eliminar VITE_GROQ_API_KEY, VITE_GMAIL_CLIENT_SECRET, VITE_ROMEXIS_KEY del .env
5. Actualizar los servicios frontend para llamar a las Edge Functions
```

### 🔴 PRIORIDAD 2 — Implementar Rate Limiting en login

**Esfuerzo:** 2 horas
```sql
-- Añadir a app_login RPC en Supabase:
-- Tabla: login_attempts (ip, username, attempted_at)
-- Máximo 5 intentos por 15 minutos por IP
```

### 🔴 PRIORIDAD 3 — Persistir consentimientos reales en Documentos.tsx

**Esfuerzo:** 8-12 horas (requiere tabla BD + UI completa)
**Impacto legal:** Sin esto, los consentimientos informados no son válidos legalmente.

### 🔴 PRIORIDAD 4 — RLS en tablas FDW

**Esfuerzo:** 3-4 horas
**Plan:**
```sql
-- Revocar acceso directo al anon/authenticated roles
REVOKE SELECT ON "DCitas" FROM anon, authenticated;
REVOKE SELECT ON "TtosMed" FROM anon, authenticated;
-- Crear VIEWs de acceso controlado con auth checks
-- Aplicar RLS sobre las VIEWs
```

### 🔴 PRIORIDAD 5 — Tokens JWT en localStorage → sessionStorage + HttpOnly cookie

**Esfuerzo:** 3-4 horas

---

## 08B_IMPORTANTES_MEDIO_PLAZO.md — Próxima iteración

### 🟠 Audit trail completo (Art. 30 RGPD)
- Registrar todos los accesos a datos médicos
- Estimación: 2-3 horas para añadir logAudit() a las funciones faltantes

### 🟠 Error Boundary global + Sentry
- Detectar errores en producción antes de que la clínica llame
- Estimación: 2-3 horas

### 🟠 Timeouts en todas las API calls externas
- `AbortController` con 30s timeout universal
- Estimación: 1-2 horas (helper función en db.ts)

### 🟠 Validación de webhook HMAC (WhatsApp)
- Sin esto cualquiera puede inyectar mensajes falsos
- Estimación: 1-2 horas

### 🟠 Paginación real en listado de pacientes
- Performance crítica con >1000 pacientes
- Estimación: 4-6 horas

---

## 08C_MEJORAS_FUTURO.md — Roadmap

### 🟡 MFA para acceso a datos médicos
- TOTP (Google Authenticator) para roles Admin y Doctor
- Estimación: 8-12 horas (migrar a Supabase Auth nativo)

### 🟡 Búsqueda global Cmd+K
- Buscar pacientes desde cualquier pantalla
- Estimación: 4-6 horas

### 🟡 i18n preparación
- Extraer 200+ strings hardcodeados
- Estimación: 16-24 horas

### 🟡 Sistema de notificaciones en tiempo real
- WebSocket/Realtime de Supabase para alertas
- Estimación: 8-12 horas

### 🟡 Signed URLs para radiografías/fotos
- Mover de Google Drive a Supabase Storage con URLs firmadas
- Estimación: 8-12 horas

---

## 08D_REFACTORIZACIONES.md — Código a Reescribir

### 1. Gestoría.tsx (1290 líneas) → Dividir en 6 componentes
### 2. Material Icons → Migrar completamente a Lucide React
### 3. Colores hardcodeados #051650 → Tokens CSS variables
### 4. Custom Auth → Migrar a Supabase Auth nativo (largo plazo)
### 5. console.log/warn → Logger product-aware (filtra en producción)
### 6. Documentos.tsx mock → Implementación real con tabla BD
