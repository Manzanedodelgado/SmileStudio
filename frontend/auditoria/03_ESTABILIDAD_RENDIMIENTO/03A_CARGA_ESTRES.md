# 03A_CARGA_ESTRES.md — Qué Pasa con Mucho Tráfico

---

## Análisis de arquitectura bajo carga

El sistema es **Client-heavy** (toda la lógica en el navegador). El backend es Supabase gestionado.

### Modelo de carga actual:

```
Usuario → React SPA → Supabase REST → PostgreSQL
                    → FDW → SQL Server (GELITE)
                    → Groq API
                    → Evolution API
                    → Gmail API
                    → Google Drive API
```

---

## Punto de fallo 1 — Carga de pacientes completa en memoria 🟠

**Archivo:** `services/pacientes.service.ts`
```typescript
// Se carga TODA la lista de pacientes en el primer acceso
const allPatients = await dbSelect<PacRow>('Pacientes', { select: '...' });
_cache = allPatients.map(rowToPaciente);
// → Si hay 5000 pacientes: ~5000 objetos en memoria del navegador
```

**Impacto:** Tiempo de carga inicial de 5-15 segundos en clínicas grandes. El navegador puede quedarse sin memoria en dispositivos con <4GB RAM.

**Solución:**
```typescript
// Paginación real:
const getPacientesPage = async (page: number, limit = 50) => {
    return dbSelect('Pacientes', {
        select: 'NumPac,Apellidos,Nombre,TelMovil',
        limit: String(limit),
        offset: String(page * limit),
        order: 'Apellidos.asc'
    });
};
// + search server-side via RPC cuando ilike funcione con FDW
```

---

## Punto de fallo 2 — Sin límite de peticiones paralelas 🟡

**Archivo:** `services/ia-dental.service.ts`
```typescript
// Cada mensaje del chat llama a Groq API
// Sin debounce ni queue
// Si el usuario escribe rápido: múltiples llamadas simultáneas
```

**Solución:**
```typescript
let pendingRequest: AbortController | null = null;
export const askIADental = async (prompt: string) => {
    if (pendingRequest) pendingRequest.abort(); // Cancelar anterior
    pendingRequest = new AbortController();
    // Pasar signal al fetch...
};
```

---

## Punto de fallo 3 — FDW bajo carga 🟠

Las Foreign Data Wrappers de Supabase → SQL Server añaden latencia adicional:
- Cada query FDW: ~150-500ms extra (vs 5-50ms tabla nativa)
- La pantalla de Agenda hace ~4 queries FDW al cargar
- **Total tiempo de carga estimado:** 1-3 segundos solo en queries FDW

**Solución a largo plazo:** Materializar datos críticos en tablas Supabase nativas mediante replicación, eliminando FDW del path crítico.

---

## Punto de fallo 4 — Bundle JS sin code splitting 🟡

**Sin verificar explícitamente**, pero la app React monolítica con todos los imports incluye:
- React ecosystem
- Tailwind CSS (purgado en build, OK)
- Lucide icons (todos importados, posiblemente tree-shaken)
- Múltiples servicios grandes

**Herramienta de verificación:**
```bash
cd "smilepro---rubio-garcía-dental 2"
npx vite-bundle-analyzer
```
