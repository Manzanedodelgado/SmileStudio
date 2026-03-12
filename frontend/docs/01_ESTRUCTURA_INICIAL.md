# 01_ESTRUCTURA_INICIAL.md — Mapa de Archivos y Relaciones Frontend-Backend

> Generado en Fase 1 (Escaneo Profundo). Fecha: 2026-03-01

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL) + REST v1 API |
| **BD Externa** | GELITE (SQL Server) via FDW (Foreign Data Wrapper) |
| **IA** | Groq API (Llama 3.3 70B) |
| **WhatsApp** | Evolution API + Chatwoot |
| **Auth** | Custom RPC (bcrypt + tokens, sin GoTrue) |

---

## 📁 Estructura de Directorios (App Web)

```
/
├── App.tsx                    ← Router principal (switch por área)
├── types.ts                   ← Tipos TypeScript globales
├── navigation.ts              ← Menú de navegación
├── index.tsx                  ← Entry point React
├── index.css                  ← CSS global
│
├── /components
│   ├── Header.tsx             ← Cabecera con búsqueda global, perfil, tema
│   ├── Sidebar.tsx            ← Navegación lateral con suباreas
│   ├── UI.tsx                 ← Componentes UI reutilizables (AccessDenied, etc.)
│   └── /pacientes
│       ├── AlertasPanel.tsx   ← Panel de alertas del paciente
│       ├── Documentos.tsx     ← Gestión de documentos y consentimientos
│       ├── Economica.tsx      ← Vista económica (presupuestos, cuenta corriente)
│       ├── Odontograma.tsx    ← Odontograma interactivo con IA
│       ├── PatientSearchModal.tsx ← Modal de búsqueda de pacientes
│       ├── Periodontograma.tsx <- Sondaje periodontal
│       └── SOAPEditor.tsx     ← Editor de notas clínicas SOAP
│
├── /context
│   └── AuthContext.tsx        ← Context de autenticación (token, usuario, rol)
│
├── /hooks
│   └── (usePermission.ts implícito en IAAutomatizacion.tsx)
│
├── /services (21 servicios)
│   ├── db.ts                  ← Helper base Supabase REST v1 (REFERENCIA)
│   ├── auth.service.ts        ← Login/logout via RPC custom
│   ├── audit.service.ts       ← RGPD Audit Trail → tabla audit_log
│   ├── citas.service.ts       ← CRUD citas (GELITE FDW + citas_web merge)
│   ├── pacientes.service.ts   ← CRUD pacientes → tabla Pacientes (FDW)
│   ├── soap.service.ts        ← CRUD notas SOAP → tabla soap_notes
│   ├── odontograma.service.ts ← Odontograma → tabla odontograma_web + RPC
│   ├── tratamientos.service.ts ← Catálogo → tabla catalogo_tratamientos
│   ├── inventario.service.ts  ← Inventario FDW (TArticulo/StckMov) + ajustes
│   ├── facturacion.service.ts ← Facturas FDW (NV_CabFactura/BancoMov)
│   ├── agenda-config.service.ts ← Catálogos FDW (IconoTratAgenda/TSitCita/TUsuAgd)
│   ├── config-agenda.service.ts ← Config persistente → tabla config_agenda_web
│   ├── ia-dental.service.ts   ← IA Dental via Groq + chat_history
│   ├── sara-ai.service.ts     ← ⚠️ DUPLICADO EXACTO de ia-dental.service.ts
│   ├── evolution.service.ts   ← WhatsApp (Evolution API) + Chatwoot
│   ├── whatsapp.service.ts    ← Re-export de evolution.service.ts (wrapper legacy)
│   ├── supabase.service.ts    ← Medicaciones/alergias ⚠️ sbFetch duplica db.ts
│   ├── gmail.service.ts       ← Gmail API
│   ├── gdrive.service.ts      ← Google Drive API
│   ├── romexis.service.ts     ← Romexis (RX digitales)
│   └── invoice-parser.service.ts ← Parser de facturas PDF/OCR
│
└── /views (11 vistas)
    ├── Login.tsx              ← Pantalla de login
    ├── Dashboard.tsx          ← Cuadro de mando (KPIs)
    ├── Agenda.tsx             ← Agenda clínica completa
    ├── Pacientes.tsx          ← Ficha de paciente (tabbed)
    ├── IAAutomatizacion.tsx   ← Router de IA & Automatización
    ├── Gestoria.tsx           ← Gestoría inteligente
    ├── Inventario.tsx         ← Smart Inventory
    ├── Whatsapp.tsx           ← Centro de mensajería
    ├── ConfiguracionAgenda.tsx ← Configuración de agenda
    └── /ia (7 sub-vistas)
        ├── IAConfig.tsx       ← Config y chat IA Dental ✦
        ├── AutomationRules.tsx ← Reglas de automatización
        ├── FlowsView.tsx      ← Flujos conversacionales
        ├── AutomationEditor.tsx ← Editor de flujos
        ├── Plantillas.tsx     ← Plantillas de mensajes
        ├── DocumentosClinica.tsx ← Documentos de clínica
        └── SaraConfig.tsx     ← ⚠️ Archivo prácticamente vacío (138 bytes)
```

---

## 🗄️ Tablas de Base de Datos

### Supabase Nativas (lectura/escritura desde web)
| Tabla | Servicio | Uso |
|-------|---------|-----|
| `citas_web` | citas.service.ts | Citas creadas/editadas desde web |
| `soap_notes` | soap.service.ts | Notas SOAP clínicas |
| `odontograma_web` | odontograma.service.ts | Estado odontograma por paciente |
| `catalogo_tratamientos` | tratamientos.service.ts | Catálogo de tratamientos |
| `config_agenda_web` | config-agenda.service.ts | Config doctores/horarios |
| `chat_history` | ia-dental.service.ts | Historial de chat IA |
| `audit_log` | audit.service.ts | RGPD audit trail |
| `stock_ajustes_pendientes` | inventario.service.ts | Ajustes de stock pendientes |
| `patient_medications` | supabase.service.ts | Medicaciones por paciente |
| `patient_allergies` | supabase.service.ts | Alergias por paciente |

### FDW GELITE (SQL Server — solo lectura recomendada)
| Tabla FDW | Servicio | Uso |
|----------|---------|-----|
| `Pacientes` | pacientes.service.ts | Datos maestros pacientes |
| `DCitas` | citas.service.ts | Agenda GELITE |
| `TtosMed` | citas.service.ts | Entradas médicas / historial |
| `PRESUTTO` | citas.service.ts | Presupuestos |
| `TColabos` | citas.service.ts, agenda-config | Colaboradores/doctores |
| `TArticulo` | inventario.service.ts | Artículos de inventario |
| `StckMov` | inventario.service.ts | Movimientos de stock |
| `NV_CabFactura` | facturacion.service.ts | Facturas |
| `BancoMov` | facturacion.service.ts | Movimientos bancarios |
| `IconoTratAgenda` | agenda-config.service.ts | Tipos de tratamiento |
| `TSitCita` | agenda-config.service.ts | Estados de cita |
| `TUsuAgd` | agenda-config.service.ts | Usuarios de agenda |

### RPCs Supabase Personalizadas
| RPC | Servicio | Propósito |
|-----|---------|-----------|
| `app_login` | auth.service.ts | Login sin GoTrue |
| `validate_token` | auth.service.ts | Validación de token con TTL |
| `revoke_token` | auth.service.ts | Logout real server-side |
| `reserve_slot` | citas.service.ts | Reserva atómica de cita |
| `upsert_odontograma` | odontograma.service.ts | Upsert atómico sin race condition |

---

## 🗺️ Mapa de Navegación → Vistas → Servicios

```
App.tsx
├── Área: 'CLÍNICA' → Dashboard.tsx
│   └── [KPIs: facturacion.service.ts, citas.service.ts]
│
├── Área: 'Agenda' → Agenda.tsx
│   ├── agenda-config.service.ts (catálogos)
│   ├── citas.service.ts (CRUD citas)
│   └── ConfiguracionAgenda.tsx (config-agenda.service.ts)
│
├── Área: 'Pacientes' → Pacientes.tsx
│   ├── pacientes.service.ts (búsqueda, CRUD)
│   ├── soap.service.ts (historial SOAP)
│   ├── citas.service.ts (historial citas, presupuestos)
│   ├── odontograma.service.ts (odontograma)
│   ├── supabase.service.ts (medicaciones, alergias)
│   ├── ia-dental.service.ts (análisis odontograma)
│   └── audit.service.ts (RGPD log)
│
├── Área: 'Whatsapp' → Whatsapp.tsx
│   └── whatsapp.service.ts → evolution.service.ts
│       ├── Evolution API (envío mensajes)
│       └── Chatwoot API (conversaciones)
│
├── Área: 'IA & Automatización' → IAAutomatizacion.tsx
│   ├── IAConfig.tsx → ia-dental.service.ts (chat + chat_history)
│   ├── AutomationRules.tsx → [frontend solo, no servicio backend]
│   ├── FlowsView.tsx → [frontend solo]
│   ├── AutomationEditor.tsx → [frontend solo]
│   └── Plantillas.tsx → evolution.service.ts (envío plantillas)
│
├── Área: 'Inventario' → Inventario.tsx
│   └── inventario.service.ts → TArticulo + StckMov + stock_ajustes_pendientes
│
└── Área: 'Gestoría' → Gestoria.tsx
    ├── facturacion.service.ts → NV_CabFactura + BancoMov
    ├── gmail.service.ts → Gmail API
    ├── gdrive.service.ts → Google Drive
    └── invoice-parser.service.ts → Parser PDF
```

---

## 📦 Archivos en Raíz que NO son parte de la app web
Estos archivos están mezclados con el código fuente pero son **herramientas de migración/análisis** que no pertenecen al bundle de producción:

- `*.py` — 15 scripts Python de migración de datos
- `*.sql` — 25+ scripts SQL de migración/configuración
- `*.log` — 10 archivos de log de migración (algunos de ~8MB)
- `*.md` grandes — DATOS_50_TABLAS_CORE.md (88MB), DATOS_COMPLETOS_BBDD_SQL.md (100MB)
- `actualizar_fdw_a_vistas.sql`, `crear_vistas_fdw.sql` etc.
- `update_sidebar.py`, `update_sidebar 2.py` — Scripts con duplicado (el " 2")
- `Untitled-1.yaml`, `Untitled-1 2.yaml` — Archivos sin nombre significativo duplicados
- `supabase-migration-full.sql`, `supabase-migration-full 2.sql` — Duplicado con " 2"

**Estos archivos aumentan el directorio de desarrollo en ~200MB pero no afectan el bundle.**
