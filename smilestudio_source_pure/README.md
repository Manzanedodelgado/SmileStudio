# 🦷 SmileStudio 2026 — Rubio García Dental

> **Software de gestión integral de clínica dental** diseñado específicamente para Rubio García Dental. Actúa como frontend moderno sobre el sistema heredado GELITE (SQL Server on-premise), conectado mediante Supabase Foreign Data Wrappers. Integra agenda, historia clínica, presupuestos, facturación, inventario, comunicaciones WhatsApp e Inteligencia Artificial clínica en una única interfaz web.

![Version](https://img.shields.io/badge/versión-2026.03-blue)
![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Supabase%20%2B%20TypeScript-blueviolet)
![License](https://img.shields.io/badge/licencia-privada-red)
![Estado](https://img.shields.io/badge/estado-producción-green)

---

## 📋 Índice

1. [Descripción General y Filosofía del Sistema](#1-descripción-general-y-filosofía-del-sistema)
2. [Stack Tecnológico Completo](#2-stack-tecnológico-completo)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Tipos de Datos Centrales (TypeScript)](#4-tipos-de-datos-centrales-typescript)
5. [Capa de Acceso a Datos (services/db.ts)](#5-capa-de-acceso-a-datos-servicesdbts)
6. [Módulo: Agenda](#6-módulo-agenda)
7. [Módulo: Pacientes](#7-módulo-pacientes)
8. [Módulo: Dashboard (Clínica)](#8-módulo-dashboard-clínica)
9. [Módulo: WhatsApp](#9-módulo-whatsapp)
10. [Módulo: IA & Automatización](#10-módulo-ia--automatización)
11. [Módulo: Inventario](#11-módulo-inventario)
12. [Módulo: Gestoría](#12-módulo-gestoría)
13. [Servicios Backend — Referencia Completa](#13-servicios-backend--referencia-completa)
14. [Base de Datos — Esquema Completo](#14-base-de-datos--esquema-completo)
15. [Autenticación y Gestión de Sesión](#15-autenticación-y-gestión-de-sesión)
16. [Variables de Entorno](#16-variables-de-entorno)
17. [Instalación, Desarrollo y Despliegue](#17-instalación-desarrollo-y-despliegue)
18. [Estructura de Directorios](#18-estructura-de-directorios)
19. [Integraciones Externas](#19-integraciones-externas)
20. [Seguridad y Cumplimiento RGPD](#20-seguridad-y-cumplimiento-rgpd)
21. [Rendimiento y Optimizaciones](#21-rendimiento-y-optimizaciones)
22. [Guía de Troubleshooting](#22-guía-de-troubleshooting)
23. [Roadmap y Pendientes](#23-roadmap-y-pendientes)
24. [Glosario](#24-glosario)

---

## 1. Descripción General y Filosofía del Sistema

### 1.1 ¿Qué es SmileStudio?

SmileStudio es una **Single Page Application (SPA)** web que reemplaza la interfaz de usuario de GELITE para la clínica Rubio García Dental. GELITE es un software dental español que almacena toda la información clínica y administrativa en Microsoft SQL Server. SmileStudio **no sustituye a GELITE** — convive con él, leyendo sus datos en tiempo real y permitiendo crear nueva información que GELITE no captura (notas SOAP, firma digital de consentimientos, automatizaciones de WhatsApp, asistente de IA).

### 1.2 Principio de Fuente Única de Verdad

```
GELITE SQL Server = Fuente de Verdad Principal
SmileStudio Supabase = Extensión y Enriquecimiento
```

- **Datos de GELITE** (pacientes, citas, facturas, tratamientos): solo lectura desde SmileStudio
- **Datos nativos de SmileStudio** (SOAP notes, consentimientos, IA sessions, automatizaciones): escritura en Supabase

### 1.3 Usuarios del Sistema

| Perfil | Módulos | Nivel de Acceso |
|--------|---------|----------------|
| **Recepcionista** | Agenda, Pacientes (básico), WhatsApp | Lectura/escritura agenda, pacientes sin datos clínicos |
| **Higienista / Auxiliar** | Agenda, Pacientes (clínico), IA Dental | Historia clínica, odontograma, SOAP |
| **Dentista** | Todos excepto Gestoría | Historia clínica completa, presupuestos, IA |
| **Gerencia / Administración** | Todos incluyendo Gestoría | Acceso completo + facturación + KPIs financieros |

### 1.4 Volumen de Datos (Producción)

| Entidad | Registros |
|---------|-----------|
| Pacientes activos | ~6.105 |
| Citas históricas (DCitas) | ~47.628 |
| Entradas médicas (TtosMed) | ~50.000+ |
| Presupuestos (PRESUTTO) | ~20.000+ |
| Facturas (NV_CabFactura) | ~15.000+ |
| Artículos inventario | ~500+ |
| Movimientos de stock | ~10.000+ |
| Movimientos bancarios | ~5.000+ |

---

## 2. Stack Tecnológico Completo

### 2.1 Frontend

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **React** | 19.2.4 | Framework UI (Concurrent Mode, Server Components ready) |
| **TypeScript** | ~5.8.2 | Tipado estático — crítico con datos de GELITE |
| **Vite** | 6.2.0 | Build tool + HMR en desarrollo |
| **Tailwind CSS** | 3.x | Utility-first CSS (configurado con colores custom de la marca) |
| **Lucide React** | 0.564.0 | Iconografía (450+ iconos SVG) |
| **Zod** | 4.3.6 | Validación de esquemas en runtime |
| **clsx** | 2.1.1 | Composición condicional de clases CSS |
| **tailwind-merge** | 3.4.1 | Fusión inteligente de clases Tailwind |

### 2.2 Backend (Supabase)

| Servicio | Descripción |
|---------|-------------|
| **PostgreSQL** | Base de datos principal con tablas nativas de SmileStudio |
| **PostgREST** | API REST auto-generada sobre PostgreSQL |
| **GoTrue** | Autenticación (modificada con RPC `app_login` personalizada) |
| **Realtime** | WebSockets para actualizaciones en tiempo real (futuro) |
| **Edge Functions** | Deno runtime para `fdw-proxy`, `groq-proxy` y `whatsapp-ia-handler` |
| **Storage** | Almacenamiento de documentos y consentimientos |
| **Vault** | Secretos encriptados para conexión FDW a GELITE |

### 2.3 Integraciones Externas

| Integración | Tecnología | Propósito |
|------------|-----------|-----------|
| **GELITE** | SQL Server via FDW | Fuente de verdad: citas, pacientes, historial |
| **Evolution API** | REST API | WhatsApp Business (envío/recepción) |
| **Groq** | LLaMA 3 70B | IA dental (via Supabase Edge Function) |
| **Gmail API** | OAuth 2.0 | Envío de emails automatizados |
| **Google Drive API** | OAuth 2.0 | Almacenamiento de documentos firmados |
| **Romexis (Planmeca)** | REST API local | Acceso a radiografías/escáneres |

### 2.4 DevOps y Tooling

| Herramienta | Uso |
|------------|-----|
| **Git** | Control de versiones |
| **GitHub** | Repositorio remoto |
| **Vite preview** | Preview de build de producción |
| **TypeScript strict** | Modo estricto habilitado (`strict: true` en tsconfig) |

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama General

```
╔══════════════════════════════════════════════════════════════════════╗
║                         CLIENTE (Navegador)                         ║
║                                                                      ║
║  ┌─────────┐ ┌───────┐ ┌────────────┐ ┌────────┐ ┌──────────────┐  ║
║  │  Agenda │ │Pacien.│ │ Dashboard  │ │Whatsapp│ │IA Automatiz. │  ║
║  └────┬────┘ └───┬───┘ └─────┬──────┘ └───┬────┘ └──────┬───────┘  ║
║       │          │           │             │              │           ║
║  ┌────▼──────────▼───────────▼─────────────▼──────────────▼───────┐ ║
║  │                    services/ (28 servicios)                     │ ║
║  │  db.ts · citas.service · pacientes.service · auth.service · ... │ ║
║  └────────────────────────┬────────────────────────────────────────┘ ║
╚═══════════════════════════│════════════════════════════════════════╝
                            │ HTTPS / PostgREST API
                            │
╔═══════════════════════════▼════════════════════════════════════════╗
║                         SUPABASE CLOUD                              ║
║                                                                     ║
║  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────┐ ║
║  │  PostgreSQL  │  │  Edge Functions  │  │  Auth (app_login RPC)  │ ║
║  │  ┌─────────┐ │  │  ┌────────────┐ │  │                        │ ║
║  │  │Tablas   │ │  │  │groq-proxy  │ │  │  → sessionStorage JWT  │ ║
║  │  │nativas  │ │  │  └────────────┘ │  └────────────────────────┘ ║
║  │  │SmileStudio │ │  │  ┌────────────┐ │                             ║
║  │  └─────────┘ │  │  │send-whats. │ │  ┌─────────────────────┐   ║
║  │  ┌─────────┐ │  │  └────────────┘ │  │  Supabase Vault     │   ║
║  │  │FDW      │ │  └──────────────────┘  │  (MSSQL conn str)   │   ║
║  │  │Tables   │◄├─────────────────────── │                     │   ║
║  │  │(GELITE) │ │    FDW usa Vault para  └─────────────────────┘   ║
║  │  └─────────┘ │    obtener credenciales                          ║
║  └──────┬───────┘                                                   ║
╚═════════│═══════════════════════════════════════════════════════════╝
          │ Foreign Data Wrapper (postgres_fdw / mssql_fdw)
          │ MSSQL Wrapper Server (middleware on-premise)
          │
╔═════════▼═══════════════════════════════════════════════════════════╗
║                    GELITE SQL SERVER (On-Premise)                   ║
║                    Microsoft SQL Server                             ║
║                                                                     ║
║  Pacientes · DCitas · TtosMed · PRESUTTO · NV_CabFactura           ║
║  TColabos · TArticulo · StckMov · BancoMov · TUsuAgd · ...        ║
╚═════════════════════════════════════════════════════════════════════╝
```

### 3.2 Flujo de una Request FDW

```
1. Componente React llama → citas.service.getCitasByFecha(fecha)
2. citas.service llama → db.dbSelect('DCitas', { Fecha: 'eq.2026-03-02' })
3. db.ts detecta 'DCitas' ∈ FDW_TABLES → usa SERVICE_ROLE_KEY (modo directo)
   O → llama fdw-proxy Edge Function (modo seguro, cuando USE_FDW_PROXY = true)
4. POST https://[project].supabase.co/rest/v1/DCitas?Fecha=eq.2026-03-02
   Headers: apikey: ANON_KEY, Authorization: Bearer SERVICE_ROLE_KEY
5. PostgREST → PostgreSQL query sobre foreign table DCitas
6. PostgreSQL FDW → MSSQL Wrapper → SELECT sobre GELITE SQL Server
7. Datos regresan: GELITE → MSSQL Wrapper → PostgREST → React
8. citas.service mapea CitaRow[] → Cita[] (tipos propios)
9. Componente renderiza las citas
```

> ⚠️ **RESTRICCIÓN CONOCIDA (FDW):** Las tablas `TArticulo` y `StckMov` tienen definiciones de columnas parcialmente incorrectas en Supabase. Solo las columnas `IdArticulo` y `Codigo` están confirmadas como válidas en SQL Server GELITE. Ejecutar `docs/sql/fix_fdw_tarticulo.sql` para corregirlas permanentemente.

### 3.3 Flujo de una Request Nativa (Supabase)

```
1. Componente llama → soap.service.getSoapNotes(pacienteId)
2. db.dbSelect('soap_notes', { paciente_id: 'eq.12345' })
3. db.ts detecta 'soap_notes' ∉ FDW_TABLES → usa ANON_KEY
4. GET https://[project].supabase.co/rest/v1/soap_notes?paciente_id=eq.12345
   Headers: apikey: ANON_KEY, Authorization: Bearer ANON_KEY
5. PostgREST → PostgreSQL (RLS activa: solo notas del usuario autenticado)
6. Datos regresan y se mapean
```

### 3.4 Patrón de Paginación (FDW)

PostgREST limita a 1.000 filas por defecto. Para tablas grandes se usa paginación automática:

```typescript
// Ejemplo: getCitasByFecha
let allCitas: CitaRow[] = [];
let offset = 0;
const pageSize = 1000;

while (true) {
    const page = await dbSelect<CitaRow>('DCitas', {
        Fecha: `eq.${dateStr}`,
        order: 'Registro.asc',
        limit: String(pageSize),
        offset: String(offset),
    });
    allCitas = [...allCitas, ...page];
    if (page.length < pageSize) break; // última página
    offset += pageSize;
}
```

### 3.5 Restricción FDW: ORDER BY con LIMIT

El MSSQL Wrapper requiere `ORDER BY` **obligatoriamente** cuando se usa `LIMIT`:

```typescript
// ❌ INCORRECTO — falla con: "syntax error: 'limit' must be with 'order by' clause"
await dbSelect('TColabos', { limit: '50' });

// ✅ CORRECTO
await dbSelect('TColabos', { limit: '50', order: 'IdCol.asc' });
```

---

## 4. Tipos de Datos Centrales (TypeScript)

Todos los tipos globales están en `types.ts`. Los tipos específicos de cada servicio (filas FDW) se definen localmente en el servicio correspondiente.

### 4.1 `Area` (navegación principal)

```typescript
export type Area =
    | 'CLÍNICA'           // Dashboard KPIs
    | 'Agenda'            // Gestión de citas
    | 'Pacientes'         // Ficha de paciente
    | 'IA & Automatización' // Asistente IA + automatizaciones
    | 'Gestoría'          // Facturación y banco
    | 'Inventario'        // Stock clínica
    | 'Whatsapp';         // Mensajería
```

### 4.2 `SOAPNote` (entrada clínica)

Representa tanto las entradas de GELITE (TtosMed) como las notas SOAP nativas de SmileStudio.

```typescript
export interface SOAPNote {
    id: string;                    // UUID (nativo) o 'ttomed-{NumTto}' (GELITE)
    fecha: string;                 // Label formateado: '15 ene. 2025'
    doctor: string;                // Nombre del doctor: 'Dr. Mario Rubio'
    especialidad: string;          // Tipo especialidad: 'Higiene Dental', 'Ortodoncia'
    subjetivo: string;             // Campo libre SOAP-S / Notas de GELITE
    objetivo: string;              // SOAP-O / Pieza dental: 'Pieza 36'
    analisis: string;              // SOAP-A (solo nativo)
    plan: string;                  // SOAP-P / Importe: 'Importe: 150.00€'
    firmada: boolean;              // true si StaTto === 5 en GELITE
    timestamp: string;             // ISO date para ordenación correcta
    eva: number;                   // Escala visual analógica dolor (0-10)
    alertasDetectadas: string[];   // Alertas IA detectadas en el texto
    // Campos de tratamiento (separados de las observaciones)
    tratamiento_id?: number;       // IdTto de GELITE
    tratamiento_nombre?: string;   // Nombre legible del tratamiento
    pieza?: number;                // Pieza dental (11-48, FDI)
    cuadrante?: number;            // Cuadrante (1-4)
    arcada?: string;               // 'superior' | 'inferior'
}
```

**Origen de datos**:
- GELITE (TtosMed): `tratamiento_nombre` ← `ESPEC_MAP[IdTipoEspec]`, `subjetivo` ← `Notas`
- SmileStudio nativo: todos los campos del editor SOAP

### 4.3 `Paciente`

```typescript
export interface Paciente {
    numPac: string;              // Código único GELITE (ej: '4995')
    idPac?: number;              // IdPac numérico interno GELITE
    nombre: string;
    apellidos: string;
    dni: string;
    telefono: string;
    fechaNacimiento: string;     // ISO: '1985-03-15'
    tutor?: string;              // Solo si es menor de edad
    alergias: string[];
    medicacionActual?: string;
    deuda: boolean;              // true si hay deuda pendiente
    historial: SOAPNote[];       // Merge TtosMed + soap_notes
    consentimientosFirmados: boolean;
}
```

### 4.4 `Cita`

```typescript
export interface Cita {
    id: string;                        // Registro de DCitas o UUID web
    gabinete: 'G1' | 'G2';            // G1=Doctores, G2=Sanitarios
    pacienteNumPac: string;            // Código GELITE del paciente
    nombrePaciente: string;            // Nombre completo
    horaInicio: string;                // 'HH:MM'
    duracionMinutos: number;
    tratamiento: string;               // Texto libre del tratamiento
    categoria: TratamientoCategoria;  // Enum para color de la cita
    estado: EstadoCita;
    doctor: string;
    alertasMedicas: string[];
    alertasLegales: string[];
    alertasFinancieras: boolean;
    notas?: string;                    // Notas adicionales de DCitas
    esPadreDesinfeccion?: boolean;    // Genera bloqueo de bioseguridad
    presupuestoPendiente?: boolean;
    pruebasPendientes?: boolean;
    trabajoLaboratorio?: boolean;
}
```

### 4.5 `EstadoCita` (estados de cita)

| Estado | Código SQL | Visual en Agenda |
|--------|-----------|-----------------|
| `planificada` | IdSitC = 0 | Borde punteado |
| `confirmada` | IdSitC = 2 | Ring esmeralda |
| `espera` | IdSitC = 3 | Ring ámbar, parpadeo |
| `gabinete` | IdSitC = 4 | Ring azul |
| `finalizada` | IdSitC = 5 | Semitransparente 60% |
| `fallada` | IdSitC = 6 | No-Show |
| `anulada` | IdSitC = 1 | Sin color |
| `cancelada` | IdSitC = 8 | Sin color |
| `bloqueo_bio` | — (web) | Trama de rayas |

### 4.6 `TratamientoCategoria` (colores de cita)

```typescript
export type TratamientoCategoria =
    | 'Cirugía'      // Morado oscuro
    | 'Implante'     // Rojo
    | 'Endodoncia'   // Naranja
    | 'Higiene'      // Verde
    | 'Ortodoncia'   // Azul
    | 'Diagnostico'  // Amarillo claro
    | 'Urgencia'     // Rojo urgente
    | 'Protesis'     // Cian
    | 'Conservadora' // Verde lima
    | 'Periodoncia'; // Teal
```

### 4.7 `ItemInventario` y `Lote`

```typescript
export interface Lote {
    batchId: string;
    loteFabricante: string;
    fechaCaducidad: string;
    cantidad: number;
    estado: 'OK' | 'Caducidad_Proxima' | 'Caducado' | 'Cuarentena_Sanitaria';
    ubicacion: string;
    temperaturaAlerta?: boolean;
}

export interface ItemInventario {
    id: string;
    nombre: string;
    sku: string;
    categoria: 'Implante' | 'Desechable' | 'Instrumental';
    stockFisico: number;
    stockVirtual: number;   // Reservado por cirugías en agenda
    minimoReorden: number;
    lotes: Lote[];
}
```

### 4.8 `KPI` (Dashboard)

```typescript
export interface KPI {
    label: string;       // 'Facturación Hoy'
    valor: string|number; // '2.450' | 2450
    unidad: string;       // '€' | '%' | 'citas'
    trend: number;        // +12.5 (porcentaje cambio vs período anterior)
    target: number;       // Objetivo diario
}
```

---

## 5. Capa de Acceso a Datos (services/db.ts)

El fichero `db.ts` es el núcleo de todas las comunicaciones con Supabase. **Ningún componente accede directamente a la red** — siempre pasan por este módulo.

### 5.1 Configuración

```typescript
const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
```

Al arrancar, imprime en consola si la DB está configurada y si el service key está disponible para FDW.

### 5.2 Detección de Tablas FDW

```typescript
const FDW_TABLES = new Set([
    'Pacientes', 'DCitas', 'TtosMed', 'PRESUTTO', 'NV_CabFactura',
    'TColabos', 'TArticulo', 'StckMov', 'BancoMov',
    'IconoTratAgenda', 'TSitCita', 'TUsuAgd', 'NV_LinFactura', 'FormPago',
]);
```

Si la tabla está en `FDW_TABLES`, usa `SERVICE_ROLE_KEY` (necesario para que PostgreSQL acceda al Vault con las credenciales de SQL Server). Si no, usa `ANON_KEY`.

### 5.3 API Pública de db.ts

#### `isDbConfigured(): boolean`
Devuelve `true` solo si `SUPABASE_URL` y `SUPABASE_ANON_KEY` están presentes. **Todos los servicios deben llamar esto antes de hacer requests.**

#### `generateId(): string`
UUID v4 usando `crypto.randomUUID()` con fallback manual para navegadores antiguos.

#### `fetchWithTimeout(url, opts, timeoutMs = 30000): Promise<Response>`
Wrapper de `fetch` con abort automático tras 30 segundos.

#### `dbFetch(path, options?): Promise<Response>`
Request HTTP raw contra `SUPABASE_URL/rest/v1/{path}`. Inyecta headers de auth automáticamente según si la tabla es FDW o nativa.

#### `dbSelect<T>(table, params?): Promise<T[]>`
```typescript
// SELECT * FROM citas_web WHERE paciente_id = '4995' ORDER BY created_at DESC LIMIT 50
const notas = await dbSelect<SOAPRow>('soap_notes', {
    paciente_id: 'eq.4995',
    order: 'created_at.desc',
    limit: '50'
});
```
Parámetros admitidos (PostgREST syntax):
- `campo=eq.valor` — igualdad
- `campo=gte.valor` — mayor o igual
- `campo=lte.valor` — menor o igual
- `campo=like.*texto*` — LIKE
- `campo=ilike.*texto*` — ILIKE (insensible a mayúsculas)
- `or=(campo1.eq.v1,campo2.eq.v2)` — OR
- `order=campo.asc` / `order=campo.desc`
- `limit=N` (requiere `order` en FDW)
- `offset=N` — para paginación

#### `dbInsert<T>(table, body): Promise<T | null>`
```typescript
const nota = await dbInsert<SOAPNote>('soap_notes', {
    paciente_id: '4995',
    subjetivo: 'Paciente refiere dolor',
    doctor: 'Dr. Rubio',
    created_at: new Date().toISOString()
});
```

#### `dbUpdate<T>(table, id, body, idColumn?): Promise<T | null>`
```typescript
await dbUpdate('citas_web', citaId, { estado: 'finalizada' });
// Con columna ID personalizada:
await dbUpdate('citas_web', citaId, { estado: 'finalizada' }, 'registro_id');
```

#### `dbDelete(table, id, idColumn?): Promise<boolean>`
```typescript
const ok = await dbDelete('soap_notes', noteId);
```

---

## 6. Módulo: Agenda

**Archivo principal:** `views/Agenda.tsx` (1.650+ líneas)
**Configuración:** `views/ConfiguracionAgenda.tsx`
**Servicio:** `services/citas.service.ts`

### 6.1 Descripción

La Agenda es el módulo más complejo de SmileStudio. Implementa un calendario de doble columna (G1: Doctores, G2: Sanitarios/Higienistas) con citas renderizadas imperativament usando DOM directo (para máximo rendimiento con cientos de citas).

### 6.2 Layout de la Agenda

```
┌─────────────────────────────────────────────────────────┐
│  TOOLBAR: [◄][02/03/2026][►][HOY] | Buscar... | Filtros │
├───────────┬─────────────────┬───────┬─────────────────── ┤
│   HORA    │   G1 (Doctores) │ HORA  │  G2 (Sanitarios)  │
├───────────┼─────────────────┼───────┼───────────────────┤
│  10:00    │  █████████████  │       │                   │
│           │  Rodriguez, L.  │       │  ███████████████  │
│  10:15    │  Ortodoncia 45' │10:15  │  Garcia, M.       │
│  10:30    │                 │       │  Higiene D. 30'  │
│  ...      │                 │       │                   │
└───────────┴─────────────────┴───────┴───────────────────┘
```

### 6.3 Renderizado Imperativo de Citas

Las citas NO se renderizan con JSX — se generan con `document.createElement` e `innerHTML` en un `useEffect`. Esto permite renderizar 200+ citas sin lag porque evita el reconciliador de React para elementos absolutamente posicionados:

```typescript
filteredCitas.forEach(cita => {
    const div = document.createElement('div');
    div.style.cssText = `position:absolute; top:${top}px; left:${leftPct}%; width:${widthPct}%; height:${height}px;`;
    div.innerHTML = `
        <div style="position:relative;width:100%;height:100%;...">
            <span style="position:absolute;top:50%;right:4px;transform:translateY(-50%);...">
                ${cita.estado}
            </span>
            <span>${cita.pacienteNumPac}</span>
            <span>${cita.nombrePaciente}</span>
            · <span>${cita.tratamiento}</span>
            <span>${cita.duracionMinutos}'</span>
        </div>
    `;
    container.appendChild(div);
});
```

**Formato de cita en pantalla:**
```
[4995]  LUCIA RODRIGUEZ MORENO · Ortodoncia  45'    [Planificada]
```
- Todo en una sola línea, truncado con `…` si no cabe
- Estado fijo a la derecha con `position:absolute`
- El nombre tiene prioridad de espacio (`flex-shrink:1`), el tratamiento cede antes (`flex-shrink:2`)

### 6.4 Sistema de Colores de Citas

```typescript
const getTreatmentColor = (tto: string, estado: string) => {
    if (estado === 'finalizada') return { main: '#9ca3af', ... }; // gray
    
    const colorMap: Record<string, string> = {
        'Primera Visita':        '#FF4B68', // Rosa coral
        'Urgencia':              '#FF2D55', // Rojo urgente
        'Control':               '#FBFFA3', // Amarillo pastel
        'Higiene Dental':        '#A9E6E6', // Cian
        'Ortodoncia':            '#4A90D9', // Azul
        'Endodoncia':            '#FF9500', // Naranja
        'Cirugia/Injerto':       '#7B2FBE', // Morado
        'Cirugia de Implante':   '#BF4080', // Rosa oscuro
        'Periodoncia':           '#2ECC71', // Verde
        ...
    };
};
```

El color de texto es **blanco** sobre colores oscuros y **azul oscuro (#0a3d91)** sobre colores claros (amarillo, cian).

### 6.5 Detección y Gestión de Solapamientos

Cuando dos citas se solapan en el mismo gabinete, el algoritmo divide el ancho disponible:

```
Algoritmo de columnas:
1. Para cada gabinete, ordenar citas por hora de inicio
2. Para cada cita, buscar la primera "columna" donde no solape
3. Si no hay columna libre, crear una nueva
4. Al final, recalcular el ancho: widthPct = 100 / totalCols
5. Posicionar: leftPct = col * widthPct
```

**Ejemplo visual:**
```
10:00 ┌──────────────┐
      │   Cita A     │
10:30 │     ┌────────────┐
      │     │   Cita B   │
11:00 └──────────────┘  │
           └────────────┘
Resultado: A=[0-50%], B=[50-100%]
```

### 6.6 Drag & Drop

Las citas son arrastrables. Al soltar:
1. Se calcula la nueva hora con snap a intervalos de 15 minutos
2. Se verifica que no haya solapamiento (`hayConflicto`)
3. Si hay conflicto, se muestra flash rojo visual (sin alert bloqueante)
4. Si no hay conflicto, se actualiza estado y se persiste en BD

### 6.7 Menú Contextual (Clic Derecho)

```
┌─────────────────┐
│ Acciones         │
│ LUCIA RODRIGUEZ  │
├─────────────────┤
│ Copiar   ⌘C     │
│ Cortar   ⌘X     │
│ Pegar    ⌘V     │
├─────────────────┤
│ Cambiar Estado ► │──► confirmada
├─────────────────┤      espera
│ Imprimir Cita   │      gabinete
│ Justificante    │      finalizada
│ 💬 WhatsApp     │
├─────────────────┤
│ Anular Cita     │
└─────────────────┘
```

**Justificante de asistencia**: Modal editable con nombre, fecha, hora y texto de justificación médica, listo para imprimir.

**WhatsApp desde menú**: Abre conversación con el paciente o envía via Evolution API si está configurado.

### 6.8 Gestión de Horarios

**Segmentos de trabajo:**
- Mañana: 10:00 – 14:00 (4 horas)
- Tarde: 16:00 – 20:00 (4 horas)

Cada hora = `pxPerHour = 100px` (fijo, no responsive). Total scroll: 800px.

**Bloqueo de Bioseguridad:**
Los tramos de desinfección se crean como citas especiales con `estado='bloqueo_bio'`, visibles como trama rayada gris. No se pueden arrastrar ni editar.

### 6.9 Mapeo GELITE → Cita

| Campo GELITE (DCitas) | Campo Cita | Transformación |
|----------------------|-----------|----------------|
| `Registro` | `id` | string |
| `NumPac` | `pacienteNumPac` | string |
| `Nombre + Apellidos` | `nombrePaciente` | join(' ') |
| `Fecha` | — | filtro de query |
| `Hora` | `horaInicio` | `'HH:MM'` |
| `Duracion` | `duracionMinutos` | segundos → minutos |
| `Tratamiento` | `tratamiento` | texto directo |
| `Tratamiento` | `categoria` | `tratamientoToCategoria()` |
| `EstadoCita` | `estado` | `estadoTextToEnum()` |
| `Odontologo` | `doctor` | texto directo |
| `Odontologo.startsWith('Dr')` | `gabinete` | `'G1'` si Dr., `'G2'` si no |
| `Notas` | `notas` | texto directo |

---

## 7. Módulo: Pacientes

**Archivo principal:** `views/Pacientes.tsx` (930+ líneas)
**Componentes:** `components/pacientes/` (9 componentes)
**Servicios:** `pacientes.service.ts`, `citas.service.ts`, `soap.service.ts`, `odontograma.service.ts`, `presupuestos.service.ts`, `facturacion.service.ts`, `documentos.service.ts`

### 7.1 Búsqueda de Pacientes

La búsqueda se realiza sobre una **caché completa en memoria** de los 6.105 pacientes. La caché se carga al arrancar la aplicación mediante paginación automática (6 páginas × 1.000 = 6.105 registros).

```typescript
// pacientes.service.ts
export const cargarTodosPacientes = async (): Promise<Paciente[]> => {
    let todos: PacienteRow[] = [];
    let offset = 0;
    while (true) {
        const page = await dbSelect<PacienteRow>('Pacientes', {
            select: 'NumPac,Nombre,Apellidos,DNI,Movil,FechNac',
            order: 'NumPac.asc',
            limit: '1000',
            offset: String(offset),
        });
        todos = [...todos, ...page];
        if (page.length < 1000) break;
        offset += 1000;
    }
    return todos.map(rowToPaciente);
};
```

La búsqueda client-side filtra por nombre, apellidos y DNI con debounce de 200ms.

### 7.2 Estructura de la Ficha de Paciente

La ficha tiene un layout de **3 columnas**:
- **Columna 1 (izq)**: Entradas Médicas (historial) + Editor SOAP
- **Columna 2 (centro)**: Información del paciente + Odontograma + Alertas
- **Columna 3 (dcha)**: Presupuestos / Económica / Documentos (toggle)

### 7.3 Entradas Médicas (Historial Clínico)

El historial combina dos fuentes:
1. **GELITE TtosMed** — tratamientos realizados (via `getEntradasMedicas`)
2. **SmileStudio soap_notes** — notas clínicas web nativas

```typescript
Promise.all([
    getSoapNotes(numPac),
    getEntradasMedicas(idPac)
]).then(([soapNotes, entradasMedicas]) => {
    // Las SOAP notes nativas prevalecen (más detalladas)
    const combined = [
        ...soapNotes,
        ...entradasMedicas.filter(e => !soapNotes.find(s => s.id === e.id))
    ].sort((a, b) => parseDate(b) - parseDate(a));
    setPaciente(prev => ({ ...prev, historial: combined }));
});
```

**Ordenación**: De más reciente a más antigua, usando `new Date(n.timestamp).getTime()` para comparación correcta incluso con timestamps ISO.

**Formato de cada entrada médica:**
```
┌─────────────────────────────────────────────────────┐
│ ┌──────┐  [HIGIENE DENTAL] 🦷 36  ✓                │
│ │ MAR  │  Dr. Mario Rubio                           │
│ │  02  │  Obs: Hecha a mano con ultrasonidos        │
│ │ 2026 │                                            │
└─────────────────────────────────────────────────────┘
```

### 7.4 Editor SOAP (`components/pacientes/SOAPEditor.tsx`)

Editor clínico estructurado con los 4 campos SOAP:
- **S** (Subjetivo): Síntomas referidos por el paciente
- **O** (Objetivo): Exploración, hallazgos clínicos
- **A** (Análisis/Assessment): Diagnóstico
- **P** (Plan): Tratamiento propuesto

Campos adicionales:
- EVA (Escala Visual Analógica, 0-10)
- Tratamiento vinculado (selector del catálogo)
- Pieza dental (numeración FDI 11-48)
- Cuadrante (1-4) y arcada (superior/inferior)
- Fecha (con selector)

### 7.5 Odontograma (`components/pacientes/Odontograma.tsx`)

Representación gráfica interactiva de las 32 piezas dentales usando numeración FDI internacional. Permite marcar el estado de cada pieza (sana, caries, obturada, ausente, corona, implante, etc.) y persiste en `odontograma_estados` en Supabase.

### 7.6 Periodontograma (`components/pacientes/Periodontograma.tsx`)

Registro de sondajes periodontales con:
- Seis puntos de medición por pieza (vestibular y palatino/lingual)
- Código de colores según profundidad de bolsa
- Movilidad dentaria
- Sangrado al sondaje
- Bifurcaciones

### 7.7 Mapeo GELITE → SOAPNote (Entradas Médicas)

```typescript
// Del TtosMedRow al SOAPNote
const ESPEC_MAP: Record<number, string> = {
    1: 'Odontología General',
    2: 'Ortodoncia',
    3: 'Cirugía Oral',
    4: 'Periodoncia',
    5: 'Implantología',
    6: 'Endodoncia',
    7: 'Higiene Dental',
    8: 'Estética Dental',
    // ...
};

return {
    id: `ttomed-${r.NumTto}`,
    fecha: isoToLabel(r.FecIni),        // '15 ene. 2025'
    doctor: DOCTOR_MAP[r.IdCol] ?? 'Dr. #IdCol',
    especialidad: ESPEC_MAP[r.IdTipoEspec] ?? 'Odontología General',
    tratamiento_nombre: ESPEC_MAP[r.IdTipoEspec] ?? undefined,
    subjetivo: r.Notas ?? '',           // Campo libre = Observaciones
    objetivo: r.PiezasAdu ? `Pieza ${r.PiezasAdu}` : '',
    plan: r.Importe ? `Importe: ${r.Importe.toFixed(2)}€` : '',
    pieza: r.PiezasAdu ?? undefined,
    firmada: r.StaTto === 5,
    timestamp: r.FecIni ?? '',
};
```

---

## 8. Módulo: Dashboard (Clínica)

**Archivo:** `views/Dashboard.tsx`

### 8.1 KPIs Mostrados

| KPI | Fuente | Cálculo |
|-----|--------|---------|
| Citas hoy | DCitas | COUNT WHERE Fecha = hoy |
| Citas finalizadas | DCitas | COUNT WHERE EstadoCita = 'Finalizada' AND Fecha = hoy |
| Tasa finalización | Calculado | finalizadas / total × 100 |
| Facturación bruta | NV_CabFactura | SUM(TotalFactura) WHERE FechaFactura = hoy |
| Citas pendientes | DCitas | total - finalizadas |
| Alerta quirúrgica | Agenda | SUM(duracionMinutos cirugías) / 300 > 40% |

### 8.2 Widgets

- **Sala de Espera**: Pacientes en estado `espera`
- **En Gabinete**: Pacientes actualmente en consulta (estado `gabinete`)
- **Heatmap de Ocupación**: Grid LUN-VIE × slots horarios con intensidad de color

---

## 9. Módulo: WhatsApp

**Archivo:** `views/Whatsapp.tsx`
**Servicio:** `services/whatsapp.service.ts` + `services/evolution.service.ts`

### 9.1 Integraciones Soportadas

| Modo | Configuración | Descripción |
|------|-------------|-------------|
| **Evolution API** | `VITE_EVOLUTION_API_URL` + `VITE_EVOLUTION_API_KEY` | Envío real via API (producción) |
| **WhatsApp Web link** | Sin configuración | Fallback: abre `wa.me/+34XXXXXX?text=...` |

### 9.2 `isEvolutionConfigured(): boolean`
Retorna `true` si ambas variables de Evolution están definidas.

### 9.3 Envío de Mensajes

```typescript
export const sendTextMessage = async (telefono: string, mensaje: string) => {
    const tel = telefono.replace(/\D/g, ''); // Solo dígitos
    await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
        method: 'POST',
        headers: { apikey: EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: `34${tel}@s.whatsapp.net`, text: mensaje }),
    });
};
```

### 9.4 Plantilla de Recordatorio de Cita

```
👋 Hola {nombre}, te confirmamos tu cita en Rubio García Dental:

📅 Lunes 3 de marzo
⏰ 10:30 h
🦷 Higiene Dental
👨‍⚕️ Dr. Mario Rubio

¿Necesitas cambiarla? Respóndenos a este mensaje. ¡Hasta pronto! 😊
```

---

## 10. Módulo: IA & Automatización

**Archivo:** `views/IAAutomatizacion.tsx`
**Servicio:** `services/ia-dental.service.ts`
**Edge Function:** `supabase/functions/groq-proxy/`

### 10.1 Asistente IA Dental

Modelo: **LLaMA 3 70B** via Groq API (ultra-baja latencia: <500ms).

El prompt de sistema incluye:
- Rol: "Asistente clínico dental de Rubio García Dental"
- Restricciones RGPD (no almacenar PII fuera de la plataforma)
- Contexto del paciente activo (alergias, medicación, alertas médicas)
- Historial de la conversación (últimos N turnos)
- Base de conocimiento clínica dental

```typescript
// Llamada a través de Edge Function para proteger API key
const response = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        messages: historial,
        contexto_paciente: pacienteActivo,
    }),
});
```

### 10.2 Automatizaciones

Tipos de automatización configurables:
- **Recordatorio 24h antes**: WhatsApp/email al día siguiente de la cita
- **Recordatorio 2h antes**: WhatsApp justo antes
- **Post-tratamiento**: Seguimiento 24h/48h/7 días después
- **Cumpleaños**: Felicitación automática
- **Presupuesto pendiente**: Recordatorio tras N días sin aceptar

---

## 11. Módulo: Inventario

**Archivo:** `views/Inventario.tsx`
**Servicio:** `services/inventario.service.ts`

Gestión de artículos clínicos con:
- Lectura de `TArticulo` y `StckMov` via FDW
- Alertas de stock mínimo
- Control de lotes y caducidades
- Reserva virtual de stock por cirugías programadas

---

## 12. Módulo: Gestoría

**Archivo:** `views/Gestoria.tsx`
**Servicio:** `services/facturacion.service.ts`

### 12.1 Fuentes de Datos

| Sección | Tabla GELITE FDW |
|---------|-----------------|
| Facturas emitidas | NV_CabFactura + NV_LinFactura |
| Cobros/pagos | BancoMov |
| Formas de pago | FormPago |

### 12.2 KPIs de Gestoría

- Facturación mensual (suma NV_CabFactura.TotalFactura)
- Cobros pendientes (suma facturas pendientes)
- Comparativa vs mes anterior (trend %)
- Top tratamientos por facturación

---

## 13. Servicios Backend — Referencia Completa

### 13.1 `services/auth.service.ts`

**Propósito:** Autenticación de usuarios via RPC personalizada de Supabase.

```typescript
// Login
export const login = async (usuario: string, password: string): Promise<Session | null>

// Logout
export const logout = (): void

// Sesión activa
export const getSession = (): Session | null

// Comprobación rápida
export const isAuthenticated = (): boolean
```

La sesión se persiste en `sessionStorage` bajo la clave `smile_session` como JSON con `{ token, usuario, perfil, expiresAt }`.

---

### 13.2 `services/pacientes.service.ts`

**Fuente:** `Pacientes` (FDW) + `patient_medications`, `patient_allergies` (nativas Supabase)

**Funciones principales:**

| Función | Descripción | Tabla |
|---------|-------------|-------|
| `cargarTodosPacientes()` | Carga los 6.105 pacientes en caché | Pacientes (FDW) |
| `getPaciente(numPac)` | Ficha completa de un paciente | Pacientes (FDW) |
| `buscarPacientes(query)` | Búsqueda client-side en caché | Caché local |
| `createPaciente(data)` | Crea paciente provisional en Supabase | citas_web / Supabase |
| `getMedicaciones(numPac)` | Medicaciones activas | patient_medications |
| `getAllergias(numPac)` | Alergias | patient_allergies |

**Mapeo PacienteRow → Paciente:**

```typescript
interface PacienteRow {
    NumPac: string;      // '4995'
    Nombre: string;      // 'LUCIA'
    Apellidos: string;   // 'RODRIGUEZ MORENO'
    DNI: string;
    Movil: string;
    FechNac: string;     // '1985-03-15T00:00:00'
    Deuda?: number;      // 1 si tiene deuda
}
```

---

### 13.3 `services/citas.service.ts`

**Fuente:** `DCitas` (FDW) + `citas_web` (Supabase)

**Funciones principales:**

| Función | Descripción |
|---------|-------------|
| `getCitasByFecha(fecha)` | Citas de un día para la agenda (paginado) |
| `getCitasByPaciente(numPac)` | Historial de citas de un paciente (últimos 6 meses) |
| `getEntradasMedicas(idPac)` | Historia clínica desde TtosMed |
| `createCita(cita, fecha)` | Crea cita en Supabase (no en GELITE) |
| `updateCita(id, data)` | Actualiza cita web |
| `deleteCita(id)` | Elimina cita web |
| `updateEstadoCita(id, estado)` | Cambio de estado (web only) |
| `getTratamientosPaciente(idPac)` | Lista de tratamientos realizados |
| `getColaboradorNombre(idCol)` | Resuelve IdCol → nombre del doctor |

**Mapeo completo TtosMedRow → SOAPNote:**

```typescript
interface TtosMedRow {
    NumTto?: number;        // Clave primaria
    IdPac?: number;         // FK a paciente
    IdCol?: number;         // FK a colaborador (doctor)
    IdTipoEspec?: number;   // Tipo de especialidad (1-N)
    IdTto?: number;         // Tipo de tratamiento
    FecIni?: string;        // Fecha inicio ISO
    FecFin?: string;        // Fecha fin ISO
    Notas?: string;         // Observaciones libres (campo libre)
    Importe?: number;       // Importe del tratamiento
    PiezasAdu?: number;     // Pieza dental FDI
    StaTto?: number;        // Estado: 5 = firmado/finalizado
}
```

---

### 13.4 `services/soap.service.ts`

**Fuente:** `soap_notes` (Supabase nativa)

Gestiona las notas SOAP creadas desde SmileStudio (no proceden de GELITE).

```typescript
export const getSoapNotes = async (numPac: string): Promise<SOAPNote[]>
export const createSoapNote = async (numPac: string, data: SOAPNoteInput): Promise<SOAPNote>
export const updateSoapNote = async (id: string, data: Partial<SOAPNoteInput>): Promise<SOAPNote>
export const deleteSoapNote = async (id: string): Promise<boolean>
```

---

### 13.5 `services/facturacion.service.ts`

**Fuente:** `NV_CabFactura`, `NV_LinFactura`, `BancoMov`, `FormPago` (todas FDW)

```typescript
export const getFacturasByPaciente = async (numPac: string): Promise<Factura[]>
export const getFacturasRango = async (desde: Date, hasta: Date): Promise<Factura[]>
export const getBancoMovimientos = async (desde: Date, hasta: Date): Promise<BancoMov[]>
export const getGestoriaStats = async (): Promise<GestoriaKPIs>
```

`getGestoriaStats` retorna para el dashboard: facturación total del mes, cobros pendientes, gastos, beneficio estimado.

---

### 13.6 `services/presupuestos.service.ts`

**Fuente:** `PRESUTTO` (FDW)

```typescript
export const getPresupuestosByPaciente = async (idPac: number): Promise<Presupuesto[]>
export const getPresupuestoPendiente = async (numPac: string): Promise<boolean>
```

Los presupuestos se muestran en la pestaña "Económica" de la ficha de paciente junto a las facturas.

---

### 13.7 `services/odontograma.service.ts`

**Fuente:** `odontograma_estados` (Supabase nativa)

```typescript
export const getOdontograma = async (numPac: string): Promise<OdontogramaEstado[]>
export const updatePiezaEstado = async (numPac: string, pieza: number, estado: EstadoPieza): Promise<void>
```

`EstadoPieza`: `'sana' | 'caries' | 'obturada' | 'ausente' | 'corona' | 'implante' | 'puente' | 'endodoncia'`

---

### 13.8 `services/documentos.service.ts`

**Fuente:** `documentos`, `document_signatures` (Supabase nativa)

Gestiona el ciclo de vida de documentos de consentimiento informado:
1. Generación del PDF de consentimiento
2. Envío al paciente (email/WhatsApp) para firma digital
3. Almacenamiento del documento firmado (Supabase Storage o Google Drive)
4. Registro de la firma con timestamp y IP

---

### 13.9 `services/evolution.service.ts`

**API:** Evolution API (WhatsApp Business)

```typescript
export const isEvolutionConfigured = (): boolean
export const sendTextMessage = async (telefono: string, mensaje: string): Promise<void>
export const sendMediaMessage = async (telefono: string, mediaUrl: string, caption: string): Promise<void>
export const getConversaciones = async (): Promise<Conversacion[]>
export const getHistorialConversacion = async (telefono: string): Promise<Mensaje[]>
```

---

### 13.10 `services/ia-dental.service.ts`

**API:** Groq (LLaMA 3) via Supabase Edge Function `groq-proxy`

```typescript
export const sendMessage = async (mensaje: string, contexto?: PacienteContexto): Promise<string>
export const getHistorialChat = async (sessionId: string): Promise<MensajeIA[]>
export const createSession = async (pacienteId?: string): Promise<string>
export const clearSession = async (sessionId: string): Promise<void>
```

El contexto del paciente inyecta: nombre, edad, alergias, medicación actual y alertas médicas.

---

### 13.11 `services/agenda-config.service.ts`

**Fuente:** `TUsuAgd`, `TColabos`, `IconoTratAgenda`, `TSitCita` (FDW)

```typescript
export const loadAgendaConfig = async (): Promise<AgendaConfig>
export const getDoctoresAgenda = async (): Promise<Doctor[]>
export const getTratamientosConfig = async (): Promise<TratamientoConfig[]>
export const getEstadosConfig = async (): Promise<EstadoConfig[]>
```

`AgendaConfig` devuelve: doctores, tratamientos con iconos y colores, y estados de cita configurados en GELITE.

---

### 13.12 `services/audit.service.ts`

**Fuente:** `audit_logs` (Supabase nativa)

Cumplimiento RGPD — registro de accesos a datos de salud (Art. 9):

```typescript
export const logAudit = async (
    accion: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT',
    entidad: 'paciente' | 'historia_clinica' | 'receta' | 'factura',
    entidadId: string,
    detalles?: string
): Promise<void>
```

---

### 13.13 `services/romexis.service.ts`

**API:** Romexis (Planmeca) — servidor local en `http://localhost:8081`

```typescript
export const isRomexisConfigured = (): boolean
export const getRadiografiasPaciente = async (numPac: string): Promise<Radiografia[]>
export const abrirRadiografia = async (id: string): Promise<void>
```

Requiere que Romexis esté instalado en el mismo equipo o en la red local de la clínica.

---

### 13.14 `services/gmail.service.ts` y `services/gdrive.service.ts`

Integración con Google Workspace via OAuth 2.0:

```typescript
// Gmail
export const sendEmail = async (to: string, subject: string, body: string): Promise<void>
export const isGmailConfigured = (): boolean

// Drive
export const uploadDocument = async (file: File, folder: string): Promise<string> // → URL pública
export const getDocumentUrl = async (fileId: string): Promise<string>
```

---

### 13.15 `services/questionnaire.service.ts`

Cuestionario médico para pacientes nuevos con enlace público (sin autenticación):

```typescript
export const getQuestionnaireByToken = async (token: string): Promise<Questionnaire>
export const submitQuestionnaire = async (token: string, respuestas: Respuestas): Promise<void>
export const generateQuestionnaireLink = async (numPac: string): Promise<string>
```

El enlace es único por paciente con token UUID y expira en 7 días.

---

### 13.16 `services/logger.ts`

Logger centralizado sin PII (datos personales):

```typescript
export const logger = {
    info: (msg: string, meta?: object) => void,
    warn: (msg: string, meta?: object) => void,
    error: (msg: string, error?: unknown) => void,
    debug: (msg: string, meta?: object) => void,
};
```

**Regla**: ningún log debe contener nombres, DNIs, teléfonos ni datos clínicos. Solo IDs y acciones.

---

## 14. Base de Datos — Esquema Completo

### 14.1 Tablas Nativas Supabase

#### `citas_web`
Citas creadas desde SmileStudio (complementan DCitas de GELITE):

```sql
CREATE TABLE citas_web (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_num_pac TEXT NOT NULL,
    nombre_paciente  TEXT,
    gabinete         TEXT CHECK (gabinete IN ('G1','G2')),
    hora_inicio      TEXT NOT NULL,           -- 'HH:MM'
    duracion_minutos INTEGER DEFAULT 30,
    tratamiento      TEXT,
    categoria        TEXT,
    estado           TEXT DEFAULT 'planificada',
    doctor           TEXT,
    notas            TEXT,
    fecha            DATE NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

#### `soap_notes`
Notas clínicas SOAP nativas (no provienen de GELITE):

```sql
CREATE TABLE soap_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id     TEXT NOT NULL,            -- numPac de GELITE
    fecha           DATE NOT NULL,
    doctor          TEXT,
    especialidad    TEXT,
    subjetivo       TEXT,                     -- S: síntomas del paciente
    objetivo        TEXT,                     -- O: exploración
    analisis        TEXT,                     -- A: diagnóstico
    plan            TEXT,                     -- P: tratamiento
    eva             INTEGER DEFAULT 0,        -- Escala dolor 0-10
    firmada         BOOLEAN DEFAULT false,
    tratamiento_id  INTEGER,
    tratamiento_nombre TEXT,
    pieza           INTEGER,                  -- FDI 11-48
    cuadrante       INTEGER,                  -- 1-4
    arcada          TEXT,                     -- 'superior' | 'inferior'
    alertas_detectadas TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `odontograma_estados`
```sql
CREATE TABLE odontograma_estados (
    id          UUID PRIMARY KEY,
    paciente_id TEXT NOT NULL,
    pieza       INTEGER NOT NULL,             -- FDI 11-48
    estado      TEXT NOT NULL,               -- 'sana','caries','obturada'...
    color       TEXT,
    notas       TEXT,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(paciente_id, pieza)
);
```

#### `documentos`
```sql
CREATE TABLE documentos (
    id              UUID PRIMARY KEY,
    paciente_id     TEXT NOT NULL,
    tipo            TEXT,                     -- 'consentimiento','receta'...
    nombre_archivo  TEXT,
    url_storage     TEXT,
    url_gdrive      TEXT,
    firmado         BOOLEAN DEFAULT false,
    fecha_firma     TIMESTAMPTZ,
    ip_firma        TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `contactos`
CRM de leads y primeras visitas:

```sql
CREATE TABLE contactos (
    id          UUID PRIMARY KEY,
    nombre      TEXT NOT NULL,
    apellidos   TEXT,
    telefono    TEXT,
    email       TEXT,
    canal       TEXT,    -- 'whatsapp','web','llamada','referido'
    estado      TEXT DEFAULT 'nuevo',
    notas       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `ia_sessions`
Historial de conversaciones con el asistente IA:

```sql
CREATE TABLE ia_sessions (
    id          UUID PRIMARY KEY,
    paciente_id TEXT,
    usuario     TEXT,
    mensajes    JSONB DEFAULT '[]',          -- [{role,content,timestamp}]
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `automations_config`
```sql
CREATE TABLE automations_config (
    id          UUID PRIMARY KEY,
    tipo        TEXT NOT NULL,              -- 'recordatorio_24h','post_tto'...
    activo      BOOLEAN DEFAULT true,
    configuracion JSONB,                   -- {template, horas_antes, canal}
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY,
    accion      TEXT NOT NULL,             -- 'VIEW','CREATE','UPDATE','DELETE'
    entidad     TEXT NOT NULL,             -- 'paciente','historia_clinica'
    entidad_id  TEXT,
    detalles    TEXT,
    usuario_hash TEXT,                     -- Hash del token (no PII)
    ip          TEXT,
    timestamp   TIMESTAMPTZ DEFAULT NOW()
);
```

### 14.2 Foreign Tables (FDW — GELITE SQL Server)

#### `Pacientes` (FDW)

| Columna | Tipo SQL Server | Descripción |
|---------|----------------|-------------|
| `NumPac` | VARCHAR(20) | Código único de paciente |
| `Nombre` | NVARCHAR(100) | Nombre |
| `Apellidos` | NVARCHAR(150) | Apellidos |
| `DNI` | VARCHAR(20) | DNI/NIE |
| `Movil` | VARCHAR(20) | Teléfono móvil |
| `FechNac` | DATETIME | Fecha de nacimiento |
| `Deuda` | BIT | 1 si tiene deuda |
| `IdPac` | INT | Clave numérica interna |

#### `DCitas` (FDW)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `Registro` | VARCHAR | ID único de la cita |
| `NumPac` | VARCHAR | FK a Pacientes |
| `Nombre` + `Apellidos` | VARCHAR | Del paciente (extraído de Texto) |
| `Fecha` | DATE | Fecha de la cita (`YYYY-MM-DD`) |
| `Hora` | TIME | Hora de inicio |
| `Duracion` | INT | Duración en **segundos** (÷60 para minutos) |
| `Tratamiento` | VARCHAR | Texto libre del tratamiento |
| `EstadoCita` | VARCHAR | Estado textual |
| `Odontologo` | VARCHAR | Nombre del profesional |
| `IdSitC` | INT | Código de estado numérico |
| `Notas` | NVARCHAR | Notas adicionales |

#### `TtosMed` (FDW)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `NumTto` | INT | PK |
| `IdPac` | INT | FK a Pacientes.IdPac |
| `IdCol` | INT | FK a TColabos (doctor) |
| `IdTipoEspec` | INT | Tipo de especialidad dental |
| `IdTto` | INT | Código de tratamiento específico |
| `FecIni` | DATETIME | Fecha de inicio |
| `FecFin` | DATETIME | Fecha de fin |
| `Notas` | NVARCHAR | Observaciones clínicas (campo libre) |
| `Importe` | DECIMAL | Importe del tratamiento |
| `PiezasAdu` | INT | Pieza dental (FDI) |
| `StaTto` | INT | Estado: 5=finalizado/firmado |

#### `TColabos` (FDW)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `IdCol` | INT | PK |
| `NomColAcort` | VARCHAR | Nombre abreviado |
| `NomCol` | VARCHAR | Nombre completo |
| `EsDoctor` | BIT | 1 si es doctor |

#### `NV_CabFactura` (FDW)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `IdFactura` | INT | PK |
| `NumPac` | VARCHAR | FK a Pacientes |
| `FechaFactura` | DATETIME | Fecha |
| `TotalFactura` | DECIMAL | Importe total |
| `EstadoPago` | VARCHAR | 'Pagada', 'Pendiente' |
| `FormaPago` | INT | FK a FormPago |

---

## 15. Autenticación y Gestión de Sesión

### 15.1 Flujo de Login Detallado

```
┌─────────────────────────────────────────────────────────────┐
│                     views/Login.tsx                         │
│                                                             │
│  Usuario + Password  →  auth.service.login()               │
│                               │                            │
│                               ▼                            │
│          POST /rest/v1/rpc/app_login                        │
│          { username, password_hash }                        │
│                               │                            │
│                               ▼                            │
│          Supabase PostgreSQL RPC                            │
│          SELECT * FROM usuarios WHERE ...                   │
│          RETURNS: { token, perfil, nombre, expires_at }     │
│                               │                            │
│                               ▼                            │
│          sessionStorage.setItem('smile_session', JSON)      │
│          db.setSessionToken(token)                          │
│          → Redirigir a Dashboard                            │
└─────────────────────────────────────────────────────────────┘
```

### 15.2 Estructura de Sesión

```typescript
interface SmileSession {
    token: string;          // Token único del usuario
    usuario: string;        // Login
    nombre: string;         // Nombre completo
    perfil: 'recepcion' | 'clinico' | 'gerencia' | 'admin';
    expiresAt: string;      // ISO timestamp de expiración
}
```

### 15.3 Expiración de Sesión

La sesión expira tras 8 horas de inactividad. Al expirar, cualquier llamada a `getSession()` devuelve `null` y se redirige al login.

### 15.4 Estrategia Dual de Autenticación

```typescript
// Para tablas FDW (bypassean RLS — necesitan service_role)
Headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer SERVICE_ROLE_KEY`  // ← service_role bypassa RLS
}

// Para tablas nativas con RLS
Headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ANON_KEY`  // ← RLS evalúa el rol
}
```

> ⚠️ **Advertencia de Seguridad**: La `SERVICE_ROLE_KEY` con prefijo `VITE_` queda embebida en el bundle JavaScript. Cualquier usuario puede extraerla con las DevTools. Para producción, las queries FDW deben migrar a Supabase Edge Functions o un backend proxy.

---

## 16. Variables de Entorno

Archivo: `.env.local` (raíz del proyecto, **NO commitear**)

```bash
# ══════════════════════════════════════════════════════════════
# SUPABASE — Obligatorio
# ══════════════════════════════════════════════════════════════
VITE_SUPABASE_URL=https://ltfstsjfybpbtiakopor.supabase.co
# Clave pública (anon) — para tablas nativas con RLS
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clave service_role — para tablas FDW que usan vault
# ⚠️ EXPUESTA EN EL BUNDLE — solo para desarrollo / clínica cerrada
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ══════════════════════════════════════════════════════════════
# EVOLUTION API (WhatsApp Business) — Opcional
# Sin estas variables, WhatsApp abre wa.me en el navegador
# ══════════════════════════════════════════════════════════════
VITE_EVOLUTION_API_URL=https://evolution.rubiogarcia.dental
VITE_EVOLUTION_API_KEY=B6D8A13F...
VITE_EVOLUTION_INSTANCE=rubiogarcia-principal

# ══════════════════════════════════════════════════════════════
# GOOGLE WORKSPACE — Opcional
# Para envío de emails (Gmail) y almacenamiento (Drive)
# ══════════════════════════════════════════════════════════════
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-...
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# ══════════════════════════════════════════════════════════════
# ROMEXIS (Planmeca) — Opcional
# Servidor local de software de radiología
# ══════════════════════════════════════════════════════════════
VITE_ROMEXIS_API_URL=http://localhost:8081
VITE_ROMEXIS_API_KEY=rm_key_...

# ══════════════════════════════════════════════════════════════
# GROQ (IA Dental) — Configurar en Supabase Dashboard
# La API key NO va en .env.local del frontend
# Ir a: Supabase Dashboard → Edge Functions → Secrets → GROQ_API_KEY
# ══════════════════════════════════════════════════════════════
# GROQ_API_KEY=gsk_...  ← Solo en Supabase Secrets, jamás en frontend
```

### 16.1 Variables por Entorno

| Variable | Desarrollo | Producción | Obligatoria |
|----------|-----------|-----------|-------------|
| `VITE_SUPABASE_URL` | `https://[id].supabase.co` | Igual | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clave dev | Clave prod | ✅ |
| `VITE_SUPABASE_SERVICE_KEY` | Clave dev | Edge Function | ⚠️ Solo dev |
| `VITE_EVOLUTION_*` | Instancia test | Instancia real | ❌ Opcional |
| `VITE_GOOGLE_*` | App dev Google | App prod Google | ❌ Opcional |
| `VITE_ROMEXIS_*` | `localhost:8081` | IP clínica | ❌ Opcional |

---

## 17. Instalación, Desarrollo y Despliegue

### 17.1 Prerrequisitos

- **Node.js** 18.x o superior (recomendado 20 LTS)
- **npm** 9.x o superior
- **Git** 2.40+
- Acceso a Supabase project: `ltfstsjfybpbtiakopor`
- (Opcional) Acceso a Evolution API para WhatsApp
- (Opcional) Credenciales Google Cloud para Gmail/Drive

### 17.2 Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/[org]/smilestudio---rubio-garcia-dental.git
cd "smilestudio---rubio-garcía-dental 2"

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con las credenciales reales

# 4. Verificar configuración
npm run dev
# → Abrir http://localhost:5173
# → Comprobar en consola: "[DB] Supabase conectado → ..."
# → Comprobar: "[DB] Service key disponible → FDW tables usarán service_role"
```

### 17.3 Comandos Disponibles

```bash
npm run dev        # Servidor de desarrollo con HMR (Hot Module Replacement)
npm run build      # Build de producción → /dist
npm run preview    # Preview del build → http://localhost:4173
npm run typecheck  # tsc --noEmit (verificar tipos sin compilar)
```

### 17.4 Build de Producción

```bash
npm run build
# Genera /dist con:
# - index.html
# - assets/index-[hash].js   (bundle principal ~2MB)
# - assets/index-[hash].css  (estilos ~150KB)
```

Para servir en producción, usar Nginx, Caddy o cualquier servidor estático apuntando a `/dist`.

**Ejemplo Nginx:**
```nginx
server {
    listen 443 ssl;
    server_name smilestudio.rubiogarcia.dental;

    root /var/www/smilestudio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    location /api {
        proxy_pass https://ltfstsjfybpbtiakopor.supabase.co;
    }
}
```

### 17.5 Actualización Post-Despliegue

```bash
git pull origin main
npm install          # Por si hay nuevas dependencias
npm run build
# Reemplazar /dist en el servidor
```

---

## 18. Estructura de Directorios

```
smilestudio---rubio-garcía-dental 2/
│
├── .env.local                        # ⚠️ SECRETO — nunca al repositorio
├── .gitignore                        # node_modules, dist, .env.local
├── package.json                      # Dependencias y scripts
├── tsconfig.json                     # TypeScript strict mode
├── tailwind.config.js                # Colores custom (#051650 azul marca)
├── vite.config.ts                    # Alias de paths (@/components, etc.)
│
├── index.html                        # HTML base con meta SEO
├── index.tsx                         # Entry point React — ReactDOM.createRoot
├── index.css                         # Reset + variables CSS globales
├── App.tsx                           # Router principal por Area
├── types.ts                          # Tipos TypeScript globales
├── navigation.ts                     # Config del menú de navegación
│
├── views/                            # Páginas completas (rutas)
│   ├── Login.tsx                     # Pantalla de acceso
│   ├── Dashboard.tsx                 # 🏠 Vista CLÍNICA: KPIs, sala espera, heatmap
│   ├── Agenda.tsx                    # 📅 Calendario de citas (archivo más grande ~1.650 líneas)
│   ├── ConfiguracionAgenda.tsx       # ⚙️ Configuración de horarios, tratamientos
│   ├── Pacientes.tsx                 # 👤 Ficha de paciente (~930 líneas)
│   ├── Gestoria.tsx                  # 📊 Facturación, banco, gestoría
│   ├── Inventario.tsx                # 📦 Stock clínica
│   ├── IAAutomatizacion.tsx          # 🤖 IA Dental + Automatizaciones
│   ├── Whatsapp.tsx                  # 💬 Centro de mensajería
│   ├── QuestionnairePublicPage.tsx   # 📋 Cuestionario médico (sin login)
│   ├── agenda/                       # Sub-componentes de Agenda
│   └── ia/                           # Sub-componentes de IA
│
├── components/                       # Componentes reutilizables
│   ├── Header.tsx                    # Barra superior con navegación por módulos
│   ├── Sidebar.tsx                   # Panel izquierdo: sala espera, en gabinete
│   ├── UI.tsx                        # Toast, Modal, Spinner, Badge, Button...
│   ├── ErrorBoundary.tsx             # Captura errores React con fallback UI
│   └── pacientes/                    # Componentes exclusivos de la ficha
│       ├── AlertasPanel.tsx          # Alertas médicas, legales, financieras
│       ├── ContactosPanel.tsx        # CRM: referidos, familia
│       ├── Documentos.tsx            # Gestión de documentos y firmas
│       ├── Economica.tsx             # Facturas + presupuestos del paciente
│       ├── Odontograma.tsx           # Mapa dental interactivo (32 piezas)
│       ├── PatientSearchModal.tsx    # Modal de búsqueda/creación de paciente
│       ├── Periodontograma.tsx       # Registro de sondajes periodontales
│       ├── QuestionnairePanel.tsx    # Cuestionario médico integrado
│       └── SOAPEditor.tsx            # Editor clínico SOAP estructurado
│
├── services/                         # Capa de servicios (acceso a datos)
│   ├── db.ts                         # ⭐ Core: wrapper REST Supabase
│   ├── auth.service.ts               # Autenticación + sesión
│   ├── pacientes.service.ts          # CRUD pacientes
│   ├── citas.service.ts              # Agenda + entradas médicas
│   ├── soap.service.ts               # Notas SOAP nativas
│   ├── odontograma.service.ts        # Estado pieza dental
│   ├── presupuestos.service.ts       # PRESUTTO (FDW)
│   ├── facturacion.service.ts        # Facturas, banco, KPIs
│   ├── documentos.service.ts         # Documentos + firmas
│   ├── documentos-firmados.service.ts # Procesado de firmas
│   ├── contactos.service.ts          # CRM contactos/leads
│   ├── whatsapp.service.ts           # WhatsApp business logic
│   ├── evolution.service.ts          # Evolution API HTTP client
│   ├── ia-dental.service.ts          # IA Groq + historial chat
│   ├── automations.service.ts        # Reglas de automatización
│   ├── gmail.service.ts              # Gmail OAuth + envío
│   ├── gdrive.service.ts             # Google Drive upload/URL
│   ├── inventario.service.ts         # Stock + artículos
│   ├── romexis.service.ts            # Planmeca radiografías
│   ├── agenda-config.service.ts      # Configuración de agenda GELITE
│   ├── config-agenda.service.ts      # Config interna agenda web
│   ├── tratamientos.service.ts       # Catálogo de tratamientos
│   ├── busqueda-unificada.service.ts # Búsqueda cross-módulo
│   ├── supabase.service.ts           # Medicaciones y alergias
│   ├── audit.service.ts              # Log RGPD de accesos
│   ├── logger.ts                     # Logger sin PII
│   ├── invoice-parser.service.ts     # Parser de facturas
│   └── questionnaire.service.ts      # Cuestionario médico
│
├── supabase/
│   └── functions/
│       ├── groq-proxy/               # Edge Function: proxy Groq IA
│       │   └── index.ts              # Deno runtime, LLaMA 3 via Groq SDK
│       └── send-whatsapp/            # Edge Function: WhatsApp serverless
│           └── index.ts
│
├── context/
│   └── AppContext.tsx                # React Context: sesión, paciente activo
│
├── hooks/
│   └── useDebounce.ts                # Hook debounce para búsqueda
│
├── docs/
│   └── sql/                          # Migraciones SQL Supabase
│       ├── create_automations_config.sql
│       ├── create_contactos.sql
│       ├── create_document_signatures.sql
│       ├── create_error_logs.sql
│       ├── fdw_rls_views.sql
│       └── rate_limiting_login.sql
│
├── auditoria/                        # Documentación técnica de auditoría
│   ├── 00_RESUMEN_EJECUTIVO.md
│   ├── 00_INSTRUCCIONES_BASE.md
│   ├── 01_SEGURIDAD/                 # Pentest, vulnerabilidades, OWASP, auth
│   ├── 02_FUNCIONALIDAD/             # Testing manual, flujos críticos, API
│   ├── 03_ESTABILIDAD_RENDIMIENTO/   # Carga, memoria, optimización
│   ├── 04_UX_UI/                     # Usabilidad, accesibilidad, responsive
│   └── 08_PROPUESTAS_CAMBIO/         # Backlog priorizado de mejoras
│
└── CSVs_WEB_CORE_50/                 # Volcado histórico de 50 tablas GELITE (setup)
```

---

## 19. Integraciones Externas

### 19.1 GELITE (SQL Server via FDW)

**Tipo:** Lectura. No se escribe en GELITE desde SmileStudio.

**Configuración FDW** (ya hecha en Supabase, no requiere acción):

```sql
-- En Supabase SQL Editor:
CREATE SERVER gelite_server
    FOREIGN DATA WRAPPER mssql_fdw
    OPTIONS (servername 'IP_SQLSERVER', port '1433', database 'GELITE');

CREATE USER MAPPING FOR postgres
    SERVER gelite_server
    OPTIONS (username 'sa', password '...');  -- En Supabase Vault

-- Ejemplo de foreign table:
CREATE FOREIGN TABLE "DCitas" (
    "Registro" text, "NumPac" text, "Fecha" date,
    "Hora" time, "Duracion" integer, "Tratamiento" text, ...
) SERVER gelite_server OPTIONS (table_name 'DCitas', ...);
```

Las credenciales SQL Server se guardan en **Supabase Vault** (secretos encriptados) y se acceden via `vault.decrypted_secrets` — por eso las queries FDW necesitan `service_role` key.

### 19.2 Evolution API (WhatsApp)

**Versión soportada:** Evolution API v2+

**Configuración de la instancia:**
1. Ir al panel de Evolution API
2. Crear instancia: `rubiogarcia-principal`
3. Configurar webhook: `POST https://[supabase-url]/functions/v1/send-whatsapp`
4. Escanear QR con el teléfono de WhatsApp Business de la clínica

**Endpoints utilizados:**
- `POST /message/sendText/{instance}` — texto
- `POST /message/sendMedia/{instance}` — imágenes/PDFs
- `GET /chat/findChats/{instance}` — lista de conversaciones
- `GET /chat/findMessages/{instance}` — historial

### 19.3 Groq API (IA Dental)

**Configuración en Supabase Dashboard:**
```
Supabase Dashboard → Edge Functions → Secrets → New Secret
Nombre: GROQ_API_KEY
Valor: gsk_...
```

**Modelos disponibles:**
- `llama3-70b-8192` — máxima calidad (recomendado para clínica)
- `llama3-8b-8192` — más rápido, menor coste
- `mixtral-8x7b-32768` — contexto largo

**System prompt del asistente:**
```
Eres el asistente clínico de Rubio García Dental.
Especialidad: odontología general, ortodoncia, implantología, periodoncia.
Respondes en español de España, de forma precisa y profesional.
NO diagnosticas enfermedades sistémicas fuera del ámbito dental.
Contexto del paciente actual: [inyectado dinámicamente]
Alergias: [inyectadas dinámicamente]
```

### 19.4 Google OAuth 2.0

**Scopes necesarios:**
```
Gmail:  https://www.googleapis.com/auth/gmail.send
Drive:  https://www.googleapis.com/auth/drive.file
```

**Configurar en Google Cloud Console:**
1. Crear proyecto en console.cloud.google.com
2. Habilitar Gmail API y Drive API
3. Crear credenciales OAuth 2.0 (tipo "Web application")
4. Añadir `http://localhost:5173/auth/google/callback` a URIs autorizados
5. Copiar Client ID y Secret a `.env.local`

### 19.5 Romexis (Planmeca)

**Requisitos:**
- Software Romexis instalado en el equipo de trabajo o accessible en red local
- API REST habilitada en configuración de Romexis (puerto 8081 por defecto)
- SmileStudio en el mismo equipo o en la misma red local que Romexis

---

## 20. Seguridad y Cumplimiento RGPD

### 20.1 Clasificación de Datos

| Categoría | Ejemplos | Art. RGPD | Medida |
|----------|---------|-----------|--------|
| **Datos básicos** | Nombre, teléfono, email | Art. 6 | RLS básica |
| **Datos de salud** | Historia clínica, diagnósticos, tratamientos | Art. 9 | Auditoría + RLS estricta |
| **Datos financieros** | Facturas, adeudos | Art. 6 | Acceso solo gerencia |
| **Radiografías** | DICOM via Romexis | Art. 9 | Solo clínicos |

### 20.2 Medidas Implementadas

- ✅ **Auditoría completa**: `audit_logs` registra TODO acceso a historia clínica
- ✅ **Sin PII en logs**: El logger nunca registra nombres, DNIs ni datos clínicos
- ✅ **Sesión temporal**: Expiración tras 8h de inactividad
- ✅ **HTTPS obligatorio**: Supabase fuerza TLS 1.3
- ✅ **RLS en tablas nativas**: Row Level Security habilitada
- ✅ **FDW read-only**: Las tablas de GELITE son de solo lectura
- ⚠️ **SERVICE_ROLE_KEY en bundle**: Pendiente mover a Edge Functions
- ⚠️ **Tokens Google en localStorage**: Pendiente usar HttpOnly cookies

### 20.3 Derechos del Paciente (Ejercicio de Derechos RGPD)

- **Derecho de acceso**: El paciente puede solicitar su historia clínica
- **Derecho de rectificación**: Corrección de datos incorrectos
- **Derecho de supresión**: Anonimización de datos (no borrado de GELITE — afectaría continuidad asistencial)
- **Portabilidad**: Exportación de historia clínica en PDF

---

## 21. Rendimiento y Optimizaciones

### 21.1 Estrategias Implementadas

| Técnica | Aplicación | Beneficio |
|---------|-----------|-----------|
| **Caché cliente-side** | 6.105 pacientes en memoria | Búsqueda instantánea sin requests |
| **Paginación automática** | getCitasByFecha, getCitasByPaciente | Supera límite 1.000 de PostgREST |
| **Filtro 6 meses** | getCitasByPaciente | Reduce carga del historial de citas |
| **Renderizado imperativo** | Citas en Agenda | Evita reconciliador React para 200+ citas |
| **Debounce 200ms** | Búsqueda de pacientes | Evita requests por cada tecla |
| **Lazy loading** | Componentes de pestaña paciente | Solo carga el tab activo |

### 21.2 Benchmarks Observados

| Operación | Tiempo |
|-----------|--------|
| Carga inicial de 6.105 pacientes | ~3-5s (6 páginas × 1000) |
| Búsqueda en caché | <10ms |
| Carga citas de un día | <1s (aprox. 50-200 citas) |
| Carga historial TtosMed (6 meses) | ~1-2s |
| Respuesta IA (Groq LLaMA 70B) | <500ms |

### 21.3 Mejoras de Rendimiento Pendientes

- [ ] Service Worker para caché offline de pacientes
- [ ] IndexedDB para persistir caché entre recargas (evitar los 3-5s de carga inicial)
- [ ] Virtualización de listas largas (>1.000 items)
- [ ] Suspense + lazy loading de módulos (Agenda, Gestoría no cargan hasta que se navega a ellos)

---

## 22. Guía de Troubleshooting

### 22.1 Error: `[CITAS] DB no configurada`

**Causa:** Las variables de entorno no se cargan correctamente.

**Solución:**
```bash
# Verificar que .env.local existe y tiene las variables
cat .env.local | grep VITE_SUPABASE_URL

# Las variables DEBEN empezar por VITE_ para que Vite las exponga
# ✅ VITE_SUPABASE_URL=...
# ❌ SUPABASE_URL=...   (¡no funciona!)

# Reiniciar el servidor de desarrollo tras modificar .env.local
npm run dev
```

### 22.2 Error FDW: `syntax error: 'limit' must be with 'order by' clause`

**Causa:** El MSSQL Wrapper requiere `ORDER BY` junto a todo `LIMIT`.

**Solución:**
```typescript
// ❌ Falla
await dbSelect('TColabos', { limit: '50' });

// ✅ Correcto
await dbSelect('TColabos', { limit: '50', order: 'IdCol.asc' });
```

### 22.3 Error: `vault: permission denied`

**Causa:** La query FDW se está ejecutando con `ANON_KEY` en vez de `SERVICE_ROLE_KEY`.

**Solución:**
```typescript
// Verificar que la tabla está en FDW_TABLES en db.ts
const FDW_TABLES = new Set([
    'Pacientes', 'DCitas', 'TtosMed', /* ... */
    'MiNuevaTabla', // ← Añadir aquí
]);
```

### 22.4 Pacientes no cargan en el buscador

**Causa posible 1:** La tabla FDW `Pacientes` no está accesible.
```javascript
// En DevTools Console:
// Si ves "[PACIENTES] Error cargando..." verificar permiso FDW
```

**Causa posible 2:** La caché no se inicializó (componente desmontado antes de terminar).
```typescript
// Verificar en Network tab: ¿hay requests a /rest/v1/Pacientes?
// ¿Devuelven 200 o error?
```

### 22.5 WhatsApp no envía mensajes

**Verificar en orden:**
1. `isEvolutionConfigured()` devuelve `true`
2. Instancia de Evolution API está conectada (escanear QR de nuevo si expiró)
3. El teléfono tiene prefijo `34` (España): `34612345678`
4. Evolution API URL no tiene `/` final

### 22.6 IA Dental no responde

**Diagnóstico:**
```bash
# Verificar Edge Function desplegada
supabase functions list

# Verificar secret configurado
supabase secrets list | grep GROQ

# Probar Edge Function directamente
curl -X POST https://[project].supabase.co/functions/v1/groq-proxy \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hola"}]}'
```

### 22.7 Citas no aparecen en Agenda

**Verificar:**
1. La fecha seleccionada tiene citas en GELITE (comprobar directamente en GELITE)
2. El horario de las citas está dentro de los segmentos de trabajo definidos (10-14h, 16-20h)
3. No hay filtro de doctor activo que excluya las citas

---

## 23. Roadmap y Pendientes

> Última actualización: **2026-03-05** tras auditoría técnica completa.

### 🔴 Crítico (Pre-Producción — Bloqueante)

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| **Corregir FDW TArticulo/StckMov** | Ejecutar `docs/sql/fix_fdw_tarticulo.sql` en Supabase SQL Editor. Requiere conocer los nombres reales de columnas en SQL Server GELITE (ejecutar `INFORMATION_SCHEMA.COLUMNS` en SSMS). | 🔲 Pendiente |
| **Desplegar fdw-proxy** | `supabase functions deploy fdw-proxy` → cambiar `USE_FDW_PROXY = true` en `db.ts` → eliminar `VITE_SUPABASE_SERVICE_KEY` del hosting. La Edge Function ya está escrita en `supabase/functions/fdw-proxy/`. | 🔲 Pendiente |
| **HTTPS forzado + HSTS** | Redirigir todo HTTP a HTTPS en producción. | 🔲 Pendiente |

### 🟠 Alta Prioridad (post-producción inmediata)

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| RLS server-side para FDW | Activar `docs/sql/fdw_rls_views.sql` para revocar acceso `anon` a tablas FDW | 🔲 Pendiente |
| Caducidad de sesión con refresh | Renovar token antes de expiración automática — hoy expira sin aviso | 🔲 Pendiente |
| Validación server-side en `createCita` | Añadir validación de solapamiento en el RPC `reserve_slot` | 🔲 Pendiente |

### ✅ Resuelto en Auditoría 2026-03-05

| Tarea | Descripción |
|-------|-------------|
| Bug `NumPac → IdPac` en presupuestos | Corregido en `presupuestos.service.ts` — ahora resuelve el `IdPac` real desde Pacientes antes de filtrar PRESUTTO |
| Columnas inválidas en `TUsuAgd` | Eliminada la columna `Nombre` de la query FDW (no existe en SQL Server). Nombre obtenido de `TColabos` |
| Columnas inválidas en `StckMov` | Eliminada la columna `IdMov` de la query FDW (no existe en SQL Server). StckMov deshabilitado hasta corregir FDW |
| Errores TypeScript en `ia-control.service.ts` | Corregidos 3 errores de tipos (dbSelect params, dbUpsert return) |
| Propiedad `replyTo` faltante en `MensajeUI` | Añadida en `evolution.service.ts` — eliminado error TS en `Whatsapp.tsx` |
| Auditoría técnica completa | Informe generado en `/docs/02_AUDITORIA.md` con 7 riesgos priorizados |

### 🟡 Alta Prioridad (funcionalidades)

| Módulo | Funcionalidad | Estado |
|--------|-------------|--------|
| Agenda | Vista Semana (L-V) | 🔲 Pendiente |
| Dashboard | Sala de Espera en tiempo real | 🔲 Pendiente |
| Dashboard | Heatmap con datos reales DCitas | 🔲 Pendiente |
| Pacientes | Consentimientos con firma tablet | 🔲 Pendiente |
| Automatizaciones | Recordatorios WhatsApp activos | 🔲 Pendiente |

### 🟢 Mejoras

| Funcionalidad | Descripción |
|-------------|-------------|
| PWA (Progressive Web App) | Acceso offline + instalable en tablet |
| IndexedDB cache | Caché persistente de pacientes entre recargas |
| Notificaciones push | Alertas de cita próxima en el navegador |
| Exportación PDF | Historia clínica completa en PDF |
| BI Avanzado | Gráficas de evolución: facturación, ocupación, cancelaciones |
| Integración seguros | Adeslas, Sanitas, DKV — envío de partes |
| TicketBAI / VeriFactu | Facturación electrónica obligatoria (2025) |
| Sincronización bidireccional GELITE | Escribir citas en GELITE desde SmileStudio |
| App móvil | React Native o Capacitor sobre el mismo código |

### 🔵 Largp Plazo

- Módulo de formación para el equipo (videos, protocolos)
- Chat interno entre personal de la clínica
- Portal del paciente (ver sus citas, historial, facturas)
- Telerradiología (consulta de radiografías remotamente)
- Integración con laboratorio dental (envío de trabajos, tracking)

---

## 24. Glosario

| Término | Definición |
|---------|-----------|
| **GELITE** | Software dental heredado (empresa española). Gestiona citas, pacientes y facturación en SQL Server |
| **FDW** | Foreign Data Wrapper — extensión PostgreSQL que permite hacer SELECT sobre tablas externas (SQL Server en este caso) como si fueran tablas locales |
| **PostgREST** | Servidor que expone automáticamente una API REST sobre cualquier base PostgreSQL |
| **MSSQL Wrapper** | Middleware que traduce queries PostgreSQL FDW a queries T-SQL para SQL Server |
| **Supabase Vault** | Sistema de secretos encriptados de Supabase, usado para guardar las credenciales de conexión a GELITE |
| **service_role** | Clave de Supabase que bypassa Row Level Security — usada para acceder a datos FDW que requieren Vault |
| **anon** | Clave pública de Supabase — usada para accesos con RLS activa |
| **RLS** | Row Level Security — políticas PostgreSQL que controlan qué filas ve cada usuario |
| **DCitas** | Tabla de GELITE que contiene todas las citas de agenda |
| **TtosMed** | Tabla de GELITE con los tratamientos médicos realizados (historia clínica) |
| **PRESUTTO** | Tabla de GELITE con los presupuestos de tratamiento |
| **NumPac** | Código único del paciente en GELITE (ej: `'4995'`) |
| **IdPac** | Clave numérica interna del paciente en GELITE (para joins con TtosMed) |
| **IdCol** | ID del colaborador (doctor) en GELITE — resuelto a nombre via TColabos |
| **IdTipoEspec** | Código de especialidad en GELITE — resuelto a nombre via ESPEC_MAP |
| **G1 / G2** | Gabinetes de la clínica: G1=Doctores (Dr./Dra.), G2=Sanitarios (higienistas, auxiliares) |
| **SOAP** | Metodología de nota clínica: **S**ubjetivo, **O**bjetivo, **A**nálisis, **P**lan |
| **EVA** | Escala Visual Analógica — puntuación de dolor del paciente (0-10) |
| **FDI** | Federación Dental Internacional — sistema de numeración de piezas dentales (11-48) |
| **Evolution API** | Software open-source que actúa como cliente WhatsApp Business API |
| **Groq** | Proveedor de IA de ultra-baja latencia — sirve LLaMA 3 a <500ms |
| **Edge Function** | Función serverless en Deno runtime, desplegada en Supabase, ejecutada near-edge |
| **HMR** | Hot Module Replacement — recarga instantánea de módulos en desarrollo sin recargar la página |
| **SPA** | Single Page Application — toda la navegación es client-side, solo hay un HTML inicial |
| **OLE Date** | Formato de fecha del Automation OLE: número de días desde 30/12/1899. Usado en algunos campos de GELITE |
| **Romexis** | Software de radiología dental de Planmeca (empresa finlandesa) |
| **RGPD** | Reglamento General de Protección de Datos (UE) — aplica a todos los datos del paciente |
| **TicketBAI** | Sistema de control fiscal para Hacienda española (obligatorio 2025 en algunas CCAA) |

---

*README actualizado el **05/03/2026** tras auditoría técnica completa (Sprint de estabilización). Actualizar con cada sprint o cambio de arquitectura significativo.*
*Mantenido por el equipo de desarrollo de SmileStudio — Rubio García Dental.*

