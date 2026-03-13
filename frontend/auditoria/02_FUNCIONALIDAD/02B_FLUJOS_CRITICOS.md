# 02B_FLUJOS_CRITICOS.md — Happy Paths y Escenarios de Error

---

## Flujo 1 — Login → Ver Paciente → Ver Historia Clínica

```
Login (app_login RPC) ──→ ÉXITO ──→ Token guardado
       │                             │
       └── FALLO ──→ Mensaje error    └── getCitas() + getPacientes()
                       SIN bloqueo         │
                       (0 intentos)        ▼
                                     Buscar paciente
                                           │
                                           ▼
                                     getEntradasMedicas(idPac)
                                     o getEntradasMedicasByNumPac(numPac) ← FIX INT-005
```

**Happy path:** ✅ Funciona con el fix aplicado.

**Escenario de error 1:** Token expirado durante sesión larga
- Consecuencia: Las peticiones fallan con 401
- Manejo actual: ⚠️ Depende de cada servicio individualmente
- Solución: Interceptor global en `dbFetch` que detecte 401 y redirija a login

**Escenario de error 2:** Base de datos GELITE caída
- Consecuencia: FDW retorna error → `dbSelect` retorna `[]`
- Manejo actual: ✅ `return []` en todos los casos de error
- Riesgo: La UI muestra "Sin datos" sin distinguir entre "no hay datos" y "error de conexión"

---

## Flujo 2 — Crear Automatización → Guardar → Auto-seed

```
AutomationEditor (form) ──→ handleSave()
                                │
                                ▼
                         saveAutomation(data)
                                │
                         BD vacía? ──YES──→ seedAutomations() PRIMERO
                                │              luego saveAutomation()
                               NO
                                │
                         upsert en automations_config
                                │
                         ¿Éxito? ──NO──→ fallback local
                                │
                               SÍ──→ toast "Guardado en BD" ✅
```

**Happy path:** ✅ Funciona.
**Escenario de race condition:** Dos usuarios guardan simultáneamente con el mismo ID
- Consecuencia: El último gana (upsert por primary key)
- Evaluación: 🟢 Aceptable para una clínica de 2-3 usuarios

---

## Flujo 3 — Gmail OAuth → Sincronizar Facturas → Cambiar Estado

```
Usuario click "Conectar Gmail"
       │
       ▼
startGmailAuth() ──→ window.location = Google OAuth URL
       │
       ▼ (redirect back)
handleOAuthRedirect() ──→ Detecta ?code= en URL
       │
       ▼
Exchange code → tokens (⚠️ CLIENT_SECRET EN FRONTEND - CRÍTICO)
       │
       ▼
localStorage.setItem(tokens) ⚠️ VULNERABILIDAD
       │
       ▼
fetchInvoiceEmails() ──→ Gmail API
       │
       ▼
parseAllInvoiceEmails() ──→ FacturaExtraida[]
       │
       ▼
loadFacturasFromSupabase() ──→ Merge con BD ✅
```

**Escenario de error: token_expired en medio de sync**
- Consecuencia: `fetchInvoiceEmails` falla en página 3 de 10
- Manejo actual: ❌ No hay retry automático ni refresh automático detectado
- Se pierden las páginas no descargadas

---

## Flujo 4 — WhatsApp Webhook (servidor)

```
Mensaje WhatsApp ──→ Evolution API ──→ Webhook Supabase Edge Function
                                              │
                                              ▼
                                    ¿Firma HMAC válida? (⚠️ SIN VERIFICAR)
                                              │
                                              ▼
                                    Procesar mensaje ──→ Chatwoot
```

**Riesgo:** Sin verificación de firma HMAC, cualquiera puede enviar payloads falsos al webhook.

---

## Flujo 5 — Inventario → Ajuste de Stock

```
Usuario ajusta stock
       │
       ▼
updateStock() en inventario.service.ts
       │
       ▼
✅ NO modifica TArticulo FDW directamente
       │
       ▼
INSERT en stock_ajustes_pendientes ←── CORRECTO (transaccional)
       │
       ▼
GELITE procesa el ajuste ←── ¿Hay confirmación de que GELITE lo procesa?
                              ¿Hay un worker o cron en GELITE?
                              ⚠️ Si GELITE no procesa, los ajustes quedan pendientes indefinidamente
```

**Riesgo:** 🟠 Sin monitorización de ajustes pendientes no procesados.
