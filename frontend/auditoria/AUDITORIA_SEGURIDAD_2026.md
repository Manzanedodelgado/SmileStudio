# 🔐 Auditoría Técnica — SmilePro 2026
**Rol:** Senior Staff Engineer + Auditor de Seguridad  
**Especialidad:** Arquitecturas híbridas React 19 + Supabase + SQL Server legacy vía FDW  
**Fecha:** 02/03/2026 | **Clasificación:** CONFIDENCIAL

---

## Resumen Ejecutivo

| Área | Hallazgos | 🔴 Crítico | 🟠 Alto | 🟡 Medio |
|------|-----------|-----------|--------|---------|
| Seguridad / RGPD | 3 | 2 | 1 | 0 |
| Arquitectura / Datos | 3 | 1 | 2 | 0 |
| Rendimiento / Memoria | 2 | 1 | 1 | 0 |
| Lógica de Negocio | 3 | 1 | 1 | 1 |
| **TOTAL** | **11** | **5** | **5** | **1** |

> ⚠️ **5 hallazgos críticos requieren acción antes de escalar a múltiples usuarios simultáneos.**

---

## ÁREA 1 — Seguridad y Cumplimiento RGPD

### 🔴 SEC-01: Exposición de SERVICE_ROLE_KEY en Bundle JS
**Ref:** Secciones 15.4, 16, 5.2 | **CVSS:** 9.8

Con `VITE_SUPABASE_SERVICE_KEY`, Vite inyecta la clave en texto plano en `dist/assets/index-[hash].js`. Un atacante con DevTools tiene acceso de superusuario (bypassea RLS) a toda la BD.

```bash
# Verificar exposición actual:
grep -r "eyJhbGci" dist/assets/index-*.js
```

**Solución: Edge Function `supabase/functions/fdw-proxy/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  'Access-Control-Allow-Origin': 'https://smilepro.tudominio.com',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const FDW_ALLOWLIST = new Set([
  'Pacientes','DCitas','TtosMed','PRESUTTO','NV_CabFactura',
  'TColabos','TArticulo','StckMov','BancoMov','TUsuAgd','NV_LinFactura',
])

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer '))
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })

  const { table, queryString } = await req.json()
  if (!FDW_ALLOWLIST.has(table))
    return new Response(JSON.stringify({ error: 'Forbidden table' }), { status: 403, headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Seguro: solo en servidor

  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryString}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  })
  const data = await res.json()
  return new Response(JSON.stringify(data), { headers: { ...CORS, 'Content-Type': 'application/json' } })
})
```

```bash
supabase functions deploy fdw-proxy
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
# Eliminar VITE_SUPABASE_SERVICE_KEY de .env.local
```

**Adaptar `db.ts`** para llamar al proxy en vez de PostgREST directamente con service key:
```typescript
const dbFetchFDW = (table: string, queryString: string) =>
  fetch(`${SUPABASE_URL}/functions/v1/fdw-proxy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, queryString }),
  })
```

---

### 🔴 SEC-02: Webhook WhatsApp Público Sin Autenticación
**Ref:** Sección 19.2 | **CVSS:** 8.1

`POST /functions/v1/send-whatsapp` expuesto sin validación → inyección de mensajes falsos a pacientes en nombre de la clínica.

**Solución: Validación HMAC en la Edge Function**

```typescript
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const webhookSecret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET')!
const body = await req.text()
const signature = req.headers.get('x-evolution-signature')
const expected = `sha256=${createHmac('sha256', webhookSecret).update(body).digest('hex')}`

if (signature !== expected)
  return new Response('Forbidden', { status: 403 })
```

```bash
supabase secrets set EVOLUTION_WEBHOOK_SECRET=secreto_aleatorio_largo
```

---

### 🟠 SEC-03: Cuestionario Público con Datos Art. 9 Sin 2FA
**Ref:** Sección 13.15

Un enlace con token interceptado expone datos médicos precompletados (alergias, medicación).

**Solución: Verificación de identidad antes de mostrar datos**

```typescript
// QuestionnairePublicPage.tsx
const [verificado, setVerificado] = useState(false)
const [intentos, setIntentos] = useState(0)

const verificar = async (dniOFechaNac: string) => {
  if (intentos >= 3) { await invalidateToken(token); return }
  const ok = await checkIdentity(token, dniOFechaNac)
  ok ? setVerificado(true) : setIntentos(i => i + 1)
}

if (!verificado) return <VerificacionIdentidad onVerify={verificar} intentos={intentos} />
return <FormularioCuestionario datos={datosPaciente} />
```

```sql
ALTER TABLE questionnaire_tokens 
  ADD COLUMN intentos_fallidos INTEGER DEFAULT 0,
  ADD COLUMN bloqueado_at TIMESTAMPTZ;
```

---

## ÁREA 2 — Arquitectura y Condiciones de Carrera

### 🔴 ARQ-01: Condición de Carrera en Drag & Drop (Doble Reserva)
**Ref:** Sección 6.6

`hayConflicto()` valida en cliente. Dos recepcionistas simultáneas → doble reserva en el mismo hueco.

```
T=0ms: Recep1 valida hueco 10:30 → sin conflicto
T=0ms: Recep2 valida hueco 10:30 → sin conflicto  
T=50ms: ¡Ambas guardan! → DOBLE RESERVA
```

**Solución: RPC con `pg_advisory_xact_lock` atómico**

```sql
CREATE OR REPLACE FUNCTION reservar_hueco_cita(
  p_gabinete TEXT, p_fecha DATE, p_hora_inicio TIME,
  p_duracion_minutos INT, p_cita_id UUID
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE conflicto_count INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_gabinete || p_fecha::text));
  
  SELECT COUNT(*) INTO conflicto_count FROM citas_web
  WHERE gabinete = p_gabinete AND fecha = p_fecha AND id != p_cita_id
    AND NOT (
      hora_inicio >= (p_hora_inicio + (p_duracion_minutos||' minutes')::INTERVAL)
      OR (hora_inicio + (duracion_minutos||' minutes')::INTERVAL) <= p_hora_inicio
    );
  
  IF conflicto_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'CONFLICTO: hueco ocupado');
  END IF;
  
  UPDATE citas_web SET hora_inicio=p_hora_inicio::text, updated_at=NOW() WHERE id=p_cita_id;
  RETURN jsonb_build_object('success', true);
END;$$;
```

```typescript
const resultado = await dbFetch('rpc/reservar_hueco_cita', { method: 'POST', body: JSON.stringify(payload) })
if (!resultado.success) { revertirCita(cita); showToast('Hueco ya ocupado', 'error') }
```

---

### 🟠 ARQ-02: Integridad Referencial Rota (Notas Huérfanas)
**Ref:** Secciones 14.1, 1.2

FDW no soporta `FOREIGN KEY`. Si GELITE fusiona/elimina un `NumPac`, las `soap_notes` quedan huérfanas.

**Solución: Tabla `pacientes_shadow` + null-safe en UI**

```sql
CREATE TABLE pacientes_shadow (
  num_pac TEXT PRIMARY KEY, id_pac INTEGER,
  nombre TEXT, apellidos TEXT, activo BOOLEAN DEFAULT true,
  fecha_sync TIMESTAMPTZ DEFAULT NOW()
);
-- Job nocturno (pg_cron):
SELECT cron.schedule('sync-pacientes', '0 3 * * *', $$
  INSERT INTO pacientes_shadow (num_pac, id_pac, nombre, apellidos)
  SELECT "NumPac","IdPac","Nombre","Apellidos" FROM "Pacientes"
  ON CONFLICT (num_pac) DO UPDATE SET activo=true, fecha_sync=NOW();
$$);
```

```typescript
// Filtrar notas huérfanas en UI
const historial = notas.filter(n => {
  const existe = pacientesCache.has(n.paciente_id)
  if (!existe) console.warn(`[SOAP] Nota huérfana: paciente ${n.paciente_id} no en GELITE`)
  return existe
})
```

---

### 🟠 ARQ-03: Stock Virtual Fantasma en Cancelaciones
**Ref:** Secciones 11, 6.7

Cancelar cirugía no libera el stock reservado de implantes.

**Solución: Database Trigger**

```sql
CREATE OR REPLACE FUNCTION sync_stock_virtual_on_cita_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IN ('anulada','cancelada') AND OLD.estado NOT IN ('anulada','cancelada') THEN
    UPDATE inventario_articulos ia
    SET stock_virtual = GREATEST(0, ia.stock_virtual - cm.cantidad)
    FROM cita_materiales cm WHERE cm.cita_id = NEW.id AND cm.articulo_id = ia.id;
  ELSIF NEW.estado = 'planificada' AND OLD.estado IN ('anulada','cancelada') THEN
    UPDATE inventario_articulos ia
    SET stock_virtual = ia.stock_virtual + cm.cantidad
    FROM cita_materiales cm WHERE cm.cita_id = NEW.id AND cm.articulo_id = ia.id;
  END IF;
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_virtual_on_cita
AFTER UPDATE OF estado ON citas_web FOR EACH ROW
EXECUTE FUNCTION sync_stock_virtual_on_cita_change();
```

---

## ÁREA 3 — Rendimiento y Fugas de Memoria

### 🔴 PERF-01: Memory Leak — Event Listeners sin Cleanup en Agenda
**Ref:** Sección 6.3

Sin `container.innerHTML = ''` al inicio de cada render y sin `removeEventListener`, cada re-render acumula 200 listeners adicionales. En 10 renders: 2.000 listeners activos → crash de tab en móvil.

**Solución: Delegación de eventos + cleanup**

```typescript
useEffect(() => {
  const container = containerRef.current
  if (!container) return

  container.innerHTML = '' // CRÍTICO: limpiar antes de renderizar

  // Un solo listener para todas las citas (Event Delegation)
  const handleClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-cita-id]') as HTMLElement
    if (!el) return
    const cita = citasMap.get(el.dataset.citaId!)
    if (cita) onCitaClick(cita)
  }
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    const el = (e.target as HTMLElement).closest('[data-cita-id]') as HTMLElement
    if (!el) return
    const cita = citasMap.get(el.dataset.citaId!)
    if (cita) onContextMenu(e, cita)
  }

  container.addEventListener('click', handleClick)
  container.addEventListener('contextmenu', handleContextMenu)

  filteredCitas.forEach(cita => {
    const div = document.createElement('div')
    div.dataset.citaId = cita.id  // ← data-attribute para el delegador
    container.appendChild(div)
  })

  return () => {  // CRÍTICO: cleanup al desmontar o cambiar dependencias
    container.removeEventListener('click', handleClick)
    container.removeEventListener('contextmenu', handleContextMenu)
    container.innerHTML = ''
  }
}, [filteredCitas, selectedDate])
```

---

### 🟠 PERF-02: Carga Secuencial de Pacientes — Timeout + 105 Pacientes Perdidos
**Ref:** Secciones 7.1, 5.3

6 requests secuenciales × latencia FDW = riesgo de timeout 30s. Además `6 páginas × 1000 = 6.000` pero hay 6.105 → 105 pacientes nunca cargan si se asume un número fijo de páginas.

**Solución: Count total + carga paralela por chunks**

```typescript
export const cargarTodosPacientes = async (): Promise<Paciente[]> => {
  // 1. Obtener total real (una sola query)
  const countRes = await dbFetch('Pacientes?select=count', { headers: { Prefer: 'count=exact' } })
  const total = parseInt(countRes.headers.get('Content-Range')?.split('/')[1] ?? '7000')

  const pageSize = 1000
  const totalPages = Math.ceil(total / pageSize)

  // 2. Cargar en chunks de 3 páginas paralelas (no saturar FDW)
  const fetchPage = (page: number) => dbSelect<PacienteRow>('Pacientes', {
    select: 'NumPac,IdPac,Nombre,Apellidos,DNI,Movil,FechNac,Deuda',
    order: 'NumPac.asc', limit: String(pageSize), offset: String(page * pageSize),
  })

  const allRows: PacienteRow[] = []
  for (let i = 0; i < totalPages; i += 3) {
    const chunk = await Promise.all(
      Array.from({ length: Math.min(3, totalPages - i) }, (_, j) => fetchPage(i + j))
    )
    chunk.flat().forEach(r => allRows.push(r))
  }
  return allRows.map(rowToPaciente)
}
```

---

## ÁREA 4 — Lógica de Negocio

### 🔴 LOG-01: Timestamps UTC vs CET y Deduplicación Rota
**Ref:** Secciones 7.3, 4.2

**Problema 1:** GELITE guarda `DATETIME` en hora local española. Supabase usa UTC. Una nota de las 00:30 CET aparece como el día anterior en la UI.

**Problema 2 (bug silencioso):**
```typescript
// NUNCA coincidirán: UUID vs 'ttomed-1234'
.filter(e => !soapNotes.find(s => s.id === e.id))
// Resultado: TODOS los registros pasan el filtro → duplicados en pantalla
```

**Solución:**

```typescript
// Normalizar GELITE DATETIME a UTC al extraer
const CET_OFFSET = new Date().getTimezoneOffset() === -120 ? 2 : 1  // CEST:2h, CET:1h
const toUTC = (fechaGelite: string): string => {
  const d = new Date(fechaGelite)
  d.setHours(d.getHours() - CET_OFFSET)
  return d.toISOString()
}
// En mapeo TtosMed:
timestamp: r.FecIni ? toUTC(r.FecIni) : ''

// Deduplicar por tratamiento_id, no por id primario
const soapTtosIds = new Set(soapNotes.filter(n => n.tratamiento_id).map(n => String(n.tratamiento_id)))
const combined = [
  ...soapNotes,
  ...entradasMedicas.filter(e => !e.tratamiento_id || !soapTtosIds.has(String(e.tratamiento_id)))
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
```

---

### 🟠 LOG-02: Context Window Overflow en IA Dental
**Ref:** Sección 10.1

Pacientes con 200+ notas SOAP → ~60.000 tokens → límite LLaMA 3 70B = 8.192 → Error 400.

**Solución: Contexto truncado a 6 meses / 15 entradas / 3.000 tokens máx**

```typescript
const buildContexto = (paciente: Paciente): string => {
  const seisM = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
  const historial = paciente.historial
    .filter(n => n.timestamp && new Date(n.timestamp) > seisM)
    .slice(0, 15)
    .map(n => `[${n.fecha}] ${n.tratamiento_nombre || n.especialidad}: ${n.subjetivo || ''}`)
    .join('\n')

  let ctx = `PACIENTE: ${paciente.nombre} ${paciente.apellidos}
ALERGIAS: ${paciente.alergias.join(', ') || 'Ninguna'}
MEDICACIÓN: ${paciente.medicacionActual || 'Ninguna'}
ÚLTIMAS ENTRADAS:\n${historial}`

  // Truncar si supera ~3.000 tokens estimados (4 chars/token)
  while (ctx.length > 12000) {
    const lines = ctx.split('\n')
    lines.splice(-2, 1)
    ctx = lines.join('\n')
  }
  return ctx
}
```

---

### 🟡 LOG-03: Mixed Content — Romexis HTTP en App HTTPS
**Ref:** Secciones 17.4, 13.13

`SmilePro` en HTTPS llama a `http://localhost:8081` (Romexis). Chrome/Safari abortan el fetch silenciosamente → radiografías no cargan sin error visible.

**Solución: Proxy Nginx local con certificado auto-firmado**

```nginx
server {
    listen 8082 ssl;
    ssl_certificate     /etc/ssl/certs/clinica-local.crt;
    ssl_certificate_key /etc/ssl/private/clinica-local.key;
    location / { proxy_pass http://localhost:8081; }
}
```

```bash
# Generar cert auto-firmado y añadir a macOS System Keychain
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/clinica-local.key \
  -out /etc/ssl/certs/clinica-local.crt -subj "/CN=localhost"
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain /etc/ssl/certs/clinica-local.crt

# .env.local:
VITE_ROMEXIS_API_URL=https://localhost:8082
```

---

## Plan de Acción Priorizado

### 🚨 Sprint Inmediato (BLOQUEANTE)

| Orden | Hallazgo | Esfuerzo |
|-------|---------|---------|
| 1 | **SEC-01** Migrar FDW a Edge Function fdw-proxy | 4h |
| 2 | **ARQ-01** RPC lock atómico para drag & drop | 2h |
| 3 | **PERF-01** Cleanup + delegación de eventos Agenda | 1h |
| 4 | **LOG-01** Fix deduplicación + normalización UTC | 1h |

### Sprint Siguiente (2 semanas)

| Orden | Hallazgo | Esfuerzo |
|-------|---------|---------|
| 5 | **SEC-02** Webhook HMAC validation | 2h |
| 6 | **PERF-02** Carga paralela pacientes | 2h |
| 7 | **LOG-02** Truncado contexto IA | 1h |
| 8 | **ARQ-03** Trigger stock virtual | 2h |

### Backlog (Próximo mes)

| Orden | Hallazgo | Esfuerzo |
|-------|---------|---------|
| 9 | **SEC-03** 2FA cuestionario público | 3h |
| 10 | **ARQ-02** Tabla pacientes_shadow | 4h |
| 11 | **LOG-03** Proxy Nginx para Romexis | 1h |

---

**Total esfuerzo estimado:** ~23h de desarrollo + revisión.  
*Auditoría realizada el 02/03/2026 — Revisión recomendada tras cada sprint.*
