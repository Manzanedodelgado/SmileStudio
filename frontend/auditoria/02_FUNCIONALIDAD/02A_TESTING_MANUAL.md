# 02A_TESTING_MANUAL.md — Pruebas Funcionales

---

## Módulo: Pacientes

| Prueba | Resultado | Evidencia | Impacto |
|--------|-----------|-----------|---------|
| Buscar paciente por nombre | ✅ PASA | `getPacientes()` usa caché + filtro client-side | OK |
| Buscar paciente con caracteres especiales (ñ, acentos) | 🟡 PARCIAL | `ilike` en FDW puede no soportar acentos en SQL Server collation | Buscar "García" puede no encontrar resultados |
| Buscar paciente vacío | ✅ PASA | `if (!query) return cachedList` | OK |
| 1000+ pacientes en caché | 🟠 FALLA | Todo el listado se carga en memoria sin paginación real | Performance degradada en clínicas grandes |
| Ver historial médico sin NumPac | ✅ CORREGIDO | Fix en INT-005 (NumPac→IdPac) | OK tras fix |
| Crear paciente con datos mínimos | ⚠️ VERIFICAR | `createPaciente()` sin validación visible de campos obligatorios | Datos corruptos en BD |

---

## Módulo: Agenda / Citas

| Prueba | Resultado | Evidencia | Impacto |
|--------|-----------|-----------|---------|
| Ver citas del día actual | ✅ PASA | `getCitasDelDia()` filtra por fecha | OK |
| Crear cita sin paciente | ⚠️ VERIFICAR | Sin validación visible en `createCita()` | Cita huérfana |
| Cita solapada con otra del mismo doctor | ❌ FALLA | Sin lógica de detección de solapamiento | Dos citas en mismo slot horario |
| Cancelar cita ya cancelada | ⚠️ VERIFICAR | Sin estado machine visible | Doble cancelación |
| Cita en pasado | ⚠️ VERIFICAR | Sin validación de fecha futura | Citas en fechas absurdas |

---

## Módulo: Facturación / Gestoría

| Prueba | Resultado | Evidencia | Impacto |
|--------|-----------|-----------|---------|
| Exportar CSV vacío | ✅ PASA | Genera CSV con solo headers | OK |
| Exportar con facturas reales | ✅ PASA | `descargarFactura()` bien implementada | OK |
| Gmail sync sin credenciales | ✅ PASA | Muestra datos mock + warning clara | OK |
| Gmail sync con token expirado | ❌ FALLA | `refreshGmailToken()` puede fallar silenciosamente | Sync falla sin mensaje claro |

---

## Módulo: IA / Automatizaciones

| Prueba | Resultado | Evidencia | Impacto |
|--------|-----------|-----------|---------|
| Chat sin API key Groq | ✅ PASA | Fallback a respuestas predefinidas | OK |
| Chat con respuesta lenta (>30s) | ⚠️ SIN TIMEOUT | Sin `AbortController` detectado | UI congelada si Groq tarda |
| Guardar automatización sin nombre | ⚠️ VERIFICAR | `AutomationEditor` valida campos vacíos client-side | OK si validación correcta |
| Toggle automatización offline | ✅ PASA | `toggleAutomation()` con fallback local | OK |

---

## Módulo: WhatsApp

| Prueba | Resultado | Evidencia | Impacto |
|--------|-----------|-----------|---------|
| Enviar mensaje sin instancia Evolution | ✅ PASA | Manejo de error con throw | Mensaje de error al usuario |
| Webhook recibir mensaje malformado | ❌ FALLA | `supabase/functions/whatsapp-webhook/` sin validación de firma HMAC visible | Posible procesamiento de webhooks falsos |
| QR Code expirado reescaneando | ⚠️ VERIFICAR | Sin polling visible para QR refresh | QR muerto = sin WhatsApp |
