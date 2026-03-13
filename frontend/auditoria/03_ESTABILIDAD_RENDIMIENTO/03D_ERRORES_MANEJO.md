# 03D_ERRORES_MANEJO.md — Try/Catch, Fallos Silenciosos

---

## Inventario de manejo de errores en servicios críticos:

| Servicio | Try/Catch | Fallback | Toast UI | Clasificación |
|---------|-----------|---------|----------|--------------|
| `auth.service.ts` | ✅ | ❌ Redirige a login | ⚠️ Sin verificar | 🟡 MEDIO |
| `pacientes.service.ts` | ✅ `return []` | ✅ caché | ❌ Sin toast | 🟡 MEDIO |
| `citas.service.ts` | ✅ `return []` | ✅ | ❌ Sin toast | 🟡 MEDIO |
| `ia-dental.service.ts` | ✅ fallback text | ✅ respuestas predefinidas | ✅ | 🟢 BIEN |
| `automations.service.ts` | ✅ | ✅ INITIAL_AUTOMATIONS | ✅ | 🟢 BIEN |
| `gmail.service.ts` | Parcial | ✅ mock data | ⚠️ En Gestoria | 🟡 MEDIO |
| `facturacion.service.ts` | ✅ | ❌ `return []` | ❌ | 🟡 MEDIO |
| `evolution.service.ts` | ✅ throw | ❌ | ❌ depende del caller | 🟠 ALTO |
| Edge Function webhook | ⚠️ Sin verificar | ❌ | N/A | 🟠 ALTO |

---

## Hallazgo principal: Sin sistema centralizado de notificación de errores 🟠

No existe un error boundary global ni un sistema de notificación de errores de producción (Sentry, Datadog, etc.).

Cuando algo falla en producción en la clínica, nadie recibe una alerta.

**Solución mínima:**
```typescript
// main.tsx — Error Boundary global
class AppErrorBoundary extends React.Component {
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // En producción: enviar a Sentry o log a Supabase
        if (import.meta.env.PROD) {
            fetch('/api/log-error', {
                method: 'POST',
                body: JSON.stringify({ error: error.message, stack: info.componentStack }),
            }).catch(() => {}); // Silent — no queremos error en el error handler
        }
    }
    render() {
        return this.props.hasError ? <ErrorScreen /> : this.props.children;
    }
}
```

---

## Hallazgo: WhatsApp webhook sin manejo de errores robusto 🟠

**Archivo:** `supabase/functions/whatsapp-webhook/`

Si el procesamiento del webhook falla, Evolution API puede reenviar el mensaje → duplicados en Chatwoot.

**Solución:** Idempotency key:
```typescript
// Guardar IDs de mensajes ya procesados
const existing = await supabase.from('webhook_processed').select('id').eq('id', messageId);
if (existing.data?.length) return new Response('Already processed', { status: 200 });
```
