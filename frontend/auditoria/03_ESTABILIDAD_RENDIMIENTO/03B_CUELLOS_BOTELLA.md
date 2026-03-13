# 03B_CUELLOS_BOTELLA.md — Lo que Ralentiza la Aplicación

---

## Bottleneck 1 — N+1 Queries implícitas 🟠

**Patrón detectado:**
```typescript
// En Agenda/Citas — se carga la lista de citas, y luego por cada cita
// se puede necesitar el nombre del colaborador
export const getColaboradorNombre = async (idCol: number) => { ... }
// Si hay 30 citas del día → 30 llamadas a getColaboradorNombre
// (a menos que ya se resuelva en la subquery SQL Server)
```

**Solución:** Resolver el nombre del colaborador en la misma query SQL (JOIN en la subquery FDW).

---

## Bottleneck 2 — Caché sin invalidación 🟡

**Archivo:** `services/pacientes.service.ts`
```typescript
let _cache: Paciente[] | null = null;
// La caché nunca se invalida automáticamente
// Si se añade un paciente nuevo en GELITE, la caché muestra datos antiguos
// hasta que el usuario recarga la página manualmente
```

**Solución:**
```typescript
// TTL de 5 minutos:
let _cacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000;

if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;
// Refrescar
```

---

## Bottleneck 3 — Gestoría.tsx: 1290 líneas en un solo componente 🟡

El componente más grande del proyecto tiene 1290 líneas, incluyendo toda la lógica de:
- Estado Gmail
- Estado Facturas
- Estado Banco
- Cálculos de gráficos inline

**Impacto:** React tiene que re-renderizar todo el componente ante cualquier cambio de estado.

**Solución:** Dividir en subcomponentes memoizados:
```typescript
const GmailTab = React.memo(() => { ... });
const FacturacionTab = React.memo(() => { ... });
const BancoTab = React.memo(() => { ... });
```

---

## Bottleneck 4 — Pacientes.tsx con múltiples useEffect encadenados 🟡

```typescript
// Carga secuencial en lugar de paralela:
useEffect(() => { getPaciente(...) }, []);
useEffect(() => { if (paciente) getHistorial() }, [paciente]);
useEffect(() => { if (paciente) getPanoramicas() }, [paciente]);
```

**Solución:**
```typescript
useEffect(() => {
    if (!paciente) return;
    // Cargar todo en paralelo:
    Promise.all([
        getEntradasMedicasByNumPac(paciente.numPac),
        getPatientPanoramicas(paciente.numPac),
        getPatientPhotos(paciente.numPac),
    ]).then(([historial, panoramicas, fotos]) => {
        setHistorial(historial);
        setPanoramicas(panoramicas);
        setFotos(fotos);
    });
}, [paciente?.numPac]);
```
