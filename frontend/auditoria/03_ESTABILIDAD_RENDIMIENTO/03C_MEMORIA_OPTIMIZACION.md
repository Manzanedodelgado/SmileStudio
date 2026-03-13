# 03C_MEMORIA_OPTIMIZACION.md — Memory Leaks y Recursos

---

## Leak 1 — Event listeners sin cleanup 🟡

**Patrón a verificar en componentes con setInterval o addEventListener:**
```typescript
// Cualquier componente que use:
useEffect(() => {
    const interval = setInterval(fetchData, 5000);
    // ¿Hay return () => clearInterval(interval)? Si no → memory leak
}, []);
```

**Archivo de mayor riesgo:** `views/Whatsapp.tsx` (polling de mensajes Chatwoot/Evolution).

---

## Leak 2 — URL.createObjectURL sin revokeObjectURL 🟡

**Archivos:** `Gestoria.tsx` y servicios de descarga CSV
```typescript
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.click();
URL.revokeObjectURL(url); // ✅ Está presente en Gestoria.tsx — PASA
```

**Estado:** ✅ PASA para Gestoría. Verificar en otros componentes.

---

## Leak 3 — Historial de chat de IA sin límite 🟡

**Archivo:** `services/ia-dental.service.ts`
```typescript
// chat_history en Supabase crece indefinidamente
// Cada conversación añade filas sin límite
// La consulta carga el historial completo en cada sesión
```

**Solución:**
```typescript
// Limitar a los últimos 50 mensajes en la query:
const rows = await dbSelect('chat_history', {
    order: 'created_at.desc',
    limit: '50',
    patient_id: `eq.${patientId}`,
});
```

---

## Leak 4 — Caché de automatizaciones en memoria sin expiración 🟢

**Archivo:** `services/automations.service.ts`
```typescript
let _cache: AutomationConfig[] | null = null;
// Sin expiración ni invalidación
```

Estado: 🟢 BAJO (datos estáticos de configuración, no crítico).

---

## 03D_ERRORES_MANEJO.md — Try/Catch y Fallos Silenciosos

## Hallazgo 1 — Fallos silenciosos generalizados 🟠

**Patrón en todos los servicios:**
```typescript
// dbSelect:
if (!res.ok) { console.error(`dbSelect ${table}:`, await res.text()); return []; }
// ↑ Error loggeado en consola pero la UI no sabe que hubo error
// La UI muestra "Sin datos" en vez de "Error de conexión"
```

**Impacto:** Los usuarios creen que no hay datos cuando en realidad hay un error de red o de BD.

**Solución:**
```typescript
// Distinguir entre "vacío" y "error":
type ServiceResult<T> = 
    | { ok: true; data: T }
    | { ok: false; error: string; data: T }; // data = fallback

const result = await dbSelect(...);
if (!result.ok) {
    showToast({ type: 'error', message: 'Error cargando datos. Verifica la conexión.' });
}
```

## Hallazgo 2 — Sin timeout en fetch a APIs externas 🟠

```typescript
// ia-dental.service.ts, gmail.service.ts, etc:
const res = await fetch(url, { ... });
// Sin AbortController → si Groq/Gmail no responde, la promesa queda pendiente INDEFINIDAMENTE
```

**Solución universal:**
```typescript
const fetchWithTimeout = (url: string, opts: RequestInit, ms = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
};
```
