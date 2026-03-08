# 🦷 SmileStudio — Rubio García Dental

**Plataforma integral de gestión para clínica dental**
*Automatización · Contabilidad · IA · Comunicación · Imagen médica*

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Módulos Funcionales](#módulos-funcionales)
5. [Fases de Desarrollo](#fases-de-desarrollo)
6. [Seguridad y Control de Acceso](#seguridad-y-control-de-acceso)
7. [IA y Automatización](#ia-y-automatización)
8. [Infraestructura y Despliegue](#infraestructura-y-despliegue)
9. [Legislación y Cumplimiento Normativo](#legislación-y-cumplimiento-normativo)
10. [Estructura del Proyecto](#estructura-del-proyecto)

---

## 1. Visión General

**SmileStudio** es un sistema de gestión clínica dental diseñado para **Rubio García Dental, SLP** (Sociedad Limitada Profesional) que sustituye por completo la necesidad de una gestoría externa y consolida todas las operaciones en una única plataforma interconectada.

### Principios Fundamentales

| Principio | Descripción |
|-----------|-------------|
| **Unicidad de datos** | Cada concepto se define una sola vez; todas las áreas lo referencian, eliminando duplicidades |
| **Automatización máxima** | Todo proceso automatizable se automatiza: facturación, recordatorios, informes fiscales |
| **IA asistencial** | IA local integrada para escucha activa, asistencia clínica y comunicación con pacientes |
| **Acceso universal** | Accesible desde cualquier lugar, con frontend en Cloudflare Pages y backend en VPS Hostinger |
| **Cumplimiento legal** | Alineado con legislación fiscal y de protección de datos española (RGPD, LOPD-GDD, AEAT) |

### ¿Qué reemplaza SmileStudio?

```
❌ Gestoría externa          → ✅ Contabilidad y fiscalidad integrada
❌ Software de agenda         → ✅ Agenda inteligente con IA
❌ Comunicación manual        → ✅ WhatsApp automatizado
❌ Fichas en papel/Excel      → ✅ Historia clínica digital completa
❌ Facturación separada       → ✅ Facturación automática desde tratamientos
❌ Múltiples apps desconectadas → ✅ Un solo ecosistema interrelacionado
```

---

## 2. Arquitectura del Sistema

### Diagrama de Alto Nivel

```
┌──────────────────────────────────────────────────────────────────┐
│                  FRONTEND (Cloudflare Pages — 0€)                │
│                 React + TypeScript + Vite (PWA)                  │
│           CDN Global · Deploy automático · SSL incluido          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Agenda│ │Pacien│ │Finanz│ │WhatsA│ │  IA  │ │Config│        │
│  │      │ │tes   │ │as    │ │pp    │ │Asist.│ │      │        │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘        │
│     └────────┴────────┴────────┴────────┴────────┘              │
│                           │ HTTPS / WSS                          │
└───────────────────────────┼──────────────────────────────────────┘
                            │ Internet
┌───────────────────────────┼──────────────────────────────────────┐
│              VPS HOSTINGER KVM 2 (~8€/mes)                       │
│         8GB RAM · 2 vCPU · 100GB SSD · IP fija                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              API Gateway (Node.js / Express)             │     │
│  │         Rate Limiting · JWT Auth · CORS · Logging        │     │
│  └─────────┬───────────┬──────────┬──────────┬─────────────┘     │
│            │           │          │          │                    │
│  ┌─────────▼──┐ ┌──────▼────┐ ┌──▼──────┐ ┌▼───────────────┐   │
│  │ API REST   │ │ WebSocket │ │ Cron    │ │ WhatsApp        │   │
│  │ Endpoints  │ │ Server    │ │ Jobs    │ │ Evolution API   │   │
│  └─────┬──────┘ └─────┬─────┘ └────┬───┘ └────┬────────────┘   │
│        │              │            │           │                 │
│  ┌─────▼──────────────▼────────────▼───────────▼─────────────┐  │
│  │                   Capa de Servicios                        │  │
│  │  Pacientes · Agenda · Facturación · Contabilidad · IA     │  │
│  └─────────────────────┬─────────────────────────────────────┘  │
│                        │                                         │
│  ┌─────────────────────▼─────────────────────────────────────┐  │
│  │              PostgreSQL 16 (Base de Datos Principal)       │  │
│  │          + Redis (caché/sesiones) + Nginx (proxy)         │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
          │                                        │
          │ API calls                              │ Backup cifrado
          ▼                                        ▼
┌──────────────────────┐             ┌──────────────────────────┐
│ Gemini API (IA)      │             │ NAS Buffalo 1TB (Clínica)│
│ + Cloudflare R2      │             │ Backup diario automático │
│ (imágenes pesadas)   │             └──────────────────────────┘
└──────────────────────┘
```

### Modelo de Interrelación de Datos

Todas las entidades se conectan a través de un **modelo relacional unificado** donde el **Paciente** es la entidad central:

```
                    ┌───────────────┐
                    │   PACIENTE    │
                    │ (entidad core)│
                    └───────┬───────┘
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  Historia  │    │   Citas   │    │ Comunica- │
    │  Clínica   │    │  /Agenda  │    │   ción    │
    └─────┬─────┘    └─────┬─────┘    └───────────┘
          │                │
    ┌─────▼─────┐    ┌─────▼─────┐
    │Tratamien- │    │Presupues- │
    │   tos     │◄──►│   tos     │
    └─────┬─────┘    └─────┬─────┘
          │                │
    ┌─────▼────────────────▼─────┐
    │       FACTURACIÓN          │
    └────────────┬───────────────┘
                 │
    ┌────────────▼───────────────┐
    │  CONTABILIDAD / FISCAL     │
    └────────────────────────────┘
```

> **Principio clave:** Un tratamiento genera un presupuesto, que al aceptarse genera facturas, que alimentan la contabilidad, que genera los documentos fiscales. Todo vinculado al paciente.

---

## 3. Stack Tecnológico

### Frontend

| Tecnología | Uso | Justificación |
|------------|-----|---------------|
| **React 18+** | UI Framework | Ecosistema maduro, componentes reutilizables |
| **TypeScript** | Lenguaje | Tipado estático, menor tasa de errores |
| **Vite** | Build tool | HMR rápido, build optimizado |
| **React Router v6** | Navegación | Routing declarativo, lazy loading |
| **TanStack Query** | Estado servidor | Caché, sincronización, reintentos automáticos |
| **Zustand** | Estado global | Ligero, sin boilerplate |
| **CSS Modules + Variables** | Estilos | Scoped, temático, sin dependencias externas |
| **Workbox** | PWA | Service workers, offline capability |
| **Web Speech API** | Voz → Texto | Transcripción en navegador para escucha activa |

### Backend (VPS Hostinger KVM 2)

| Tecnología | Uso | Justificación |
|------------|-----|---------------|
| **Node.js 20 LTS** | Runtime | Non-blocking I/O, ecosistema npm |
| **Express.js** | API Framework | Maduro, flexible, middleware extensible |
| **TypeScript** | Lenguaje | Tipado compartido con frontend |
| **Prisma ORM** | Base de datos | Migraciones, tipado, relaciones |
| **PostgreSQL 16** | BBDD principal | ACID, JSON, full-text search, fiable. Con `pgcrypto` para cifrado de campos sensibles |
| **Redis** | Caché / Colas (Fase 4+) | Pub/sub WebSocket multi-proceso. **No incluido en Fase 1** — se usa rate-limiting en memoria (`express-rate-limit` MemoryStore) hasta que haya múltiples procesos |
| **Cloudflare R2** | Almacenamiento pesado | Compatible S3, imágenes RX/CBCT. 10GB gratis, sin costes de salida |
| **Filesystem local** | Fotos / documentos | Fotos paciente, PDFs, consentimientos. En disco VPS (70GB libres) |
| **Socket.io** | Tiempo real | Chat, notificaciones, actualizaciones live |
| **node-cron** | Tareas programadas | Recordatorios, generación informes fiscales |
| **Helmet + express-rate-limit** | Seguridad | Headers HTTP seguros, protección DDoS |
| **Fail2ban + CrowdSec** | Seguridad red | Bloqueo IPs maliciosas, IPS comunitario |

### Integración WhatsApp

| Tecnología | Uso | Justificación |
|------------|-----|---------------|
| **Evolution API** | Gateway WhatsApp | Open-source, API REST, multi-dispositivo |
| **Chatwoot** (opcional) | CRM conversacional | Panel de gestión de conversaciones |

### IA — Estrategia Definitiva (0€/mes)

> **Decisión confirmada:** Groq API como IA principal (0€, ~500 tokens/s). DeepSeek como fallback (~1€/mes si Groq cambia su free tier). Los datos de salud se anonimizan antes de enviar a la nube. Radiografías procesadas localmente (Canvas API en navegador).

| Tarea | Proveedor | Modelo | Coste |
|-------|-----------|--------|---------|
| **WhatsApp 24/7** | Groq API | `llama-3.3-70b-versatile` | 0€ |
| **Copiloto clínico** | Groq API | `llama-3.3-70b-versatile` | 0€ |
| **Visión / Análisis RX** | Groq API | `grok-2-vision` | 0€ |
| **Fallback si Groq cae** | DeepSeek API | `deepseek-chat` | ~1€/mes |
| **Speech-to-Text** | Web Speech API | (navegador nativo) | 0€ |

```typescript
// backend/src/config/ai.config.ts
export const AI_CONFIG = {
  whatsapp: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  copilot:  { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  vision:   { provider: 'groq', model: 'grok-2-vision' },
  fallback: { provider: 'deepseek', model: 'deepseek-chat' },
};
```

> **Groq free tier:** 30 req/min · ~14.400 req/día · sin tarjeta de crédito
> **Orquestación:** Llamadas directas a la API REST de Groq (sin LangChain). Se introduce LangChain solo si se necesitan cadenas con tools/agents complejos en fases posteriores.

### Imagen Médica

| Tecnología | Uso | Justificación |
|------------|-----|---------------|
| **Romexis API/DICOM** | RX intraorales/panorámicas | Integración con equipo Planmeca |
| **Cornerstone.js** | Visor DICOM web | Visualización RX/CBCT en navegador |
| **Three.js** (opcional) | Renders 3D CBCT | Visualización volumétrica |
| **Sharp** | Procesamiento imágenes | Thumbnails, compresión de fotos paciente |

### Contabilidad, Fiscal y CRM Financiero

| Tecnología | Uso | Justificación |
|------------|-----|---------------|
| **PDFKit / Puppeteer** | Generación PDF | Facturas, informes fiscales, modelos AEAT |
| **ExcelJS** | Exportación Excel | Libros contables, listados |
| **SII API (AEAT)** | Suministro Inmediato de Información | Envío automático de facturas a Hacienda |
| **Tesseract.js** | OCR | Lectura automática de facturas escaneadas/foto |
| **pdf-parse / pdf-lib** | Procesamiento PDF | Extracción de datos de facturas PDF de proveedores |
| **Google APIs (Gmail)** | Automatización email | Captura automática de facturas recibidas por email |
| **OFX/CSV parsers** | Importación bancaria | Lectura de extractos bancarios para conciliación |
| **Chart.js / Recharts** | Visualización datos | Dashboards financieros, análisis de tendencias |

### DevOps / Infraestructura

| Tecnología | Uso | Justificación |
|------------|-----|---------------|
| **Docker + Docker Compose** | Contenedores | Reproducibilidad, aislamiento en VPS |
| **Nginx** | Reverse proxy | SSL termination, routing, caché estático |
| **Let's Encrypt (Certbot)** | Certificados SSL | HTTPS obligatorio, renovación automática |
| **Cloudflare** | DNS + CDN + WAF | Protección DDoS, caché global, Pages para frontend |
| **GitHub Actions** | CI/CD | Tests automáticos, deploy frontend a Cloudflare Pages |
| **Winston + Morgan** | Logging | Logs estructurados, auditoría inmutable |
| **PM2** | Process Manager | Reinicio automático, clustering |
| **Uptime Kuma** | Monitorización | Self-hosted, alertas de caída, dashboard de salud (0€) |
| **pg_dump + GPG + rsync** | Backups | Backup cifrado diario a NAS Buffalo (local) |

---

## 4. Módulos Funcionales

### 4.1 📅 Agenda y Citas

- Calendario multi-doctor con vista diaria/semanal/mensual
- Drag & drop para mover/redimensionar citas
- Códigos de color por tipo de tratamiento y estado
- Detección automática de conflictos de horario
- Lista de espera inteligente con asignación automática de huecos
- Recordatorios automáticos por WhatsApp (24h y 2h antes)
- Integración con IA para reserva por voz

### 4.2 🧑‍⚕️ Gestión de Pacientes

- **Ficha completa:** datos personales, médicos, consentimientos firmados
- **Historia clínica:** odontograma digital interactivo
- **Entradas médicas:** registro narrativo de cada visita ("Entrada médica")
- **Imágenes:** galería de fotos (intraoral, extraoral, sonrisa)
- **Radiografías:** visor integrado Romexis (RX periapicales, panorámicas)
- **CBCT:** renders 3D de las tomografías cone-beam
- **Documentos:** consentimientos, recetas, informes adjuntos
- **Timeline:** cronología completa de todas las interacciones

### 4.3 💰 Presupuestos y Tratamientos

- Catálogo de tratamientos con precios configurables
- Generación de presupuestos desde la entrada médica o dictado IA
- Estados: borrador → presentado → aceptado → en curso → finalizado
- Asociación tratamiento-diente en odontograma
- Seguimiento de sesiones por tratamiento
- PDF del presupuesto firmable digitalmente

### 4.4 🧾 Facturación

- Generación automática de factura al cobrar
- Numeración secuencial por serie (según normativa española)
- Tipos de pago: efectivo, tarjeta, transferencia, financiación
- Factura rectificativa y abonos
- Facturas a aseguradoras / terceros pagadores
- Envío automático de factura por email/WhatsApp
- Exportación a formato TicketBAI / FacturaE si requerido

### 4.5 📊 Contabilidad, Fiscal y CRM Financiero

> **Objetivo: Eliminar la dependencia de una gestoría externa. La clínica es una SLP (Sociedad Limitada Profesional) — tributa por Impuesto de Sociedades.**

#### 4.5.1 Ingresos

- **Facturación a pacientes:** generación automática desde tratamientos/cobros
- **Producción por doctor:** tracking de la facturación asociada a cada profesional
- **Libro de ingresos** automático alimentado por cada factura emitida

#### 4.5.2 Gastos y Facturas de Proveedores

- **Registro de facturas de proveedores** (material dental, laboratorio, alquiler, suministros, seguros, etc.)
- **Captura inteligente de facturas:**
  - 📸 **Por foto/cámara:** escaneo con OCR (Tesseract.js) que extrae automáticamente proveedor, CIF, base, IVA, total, fecha
  - 📄 **Desde PDF:** lectura automática del PDF adjunto
  - 📧 **Desde Gmail:** monitorización automática del buzón para detectar facturas adjuntas y registrarlas
  - 🔗 **Por enlace:** acceso a portales de proveedores para descargar y registrar
- **Visualizador de facturas:** preview del PDF/imagen original vinculado al registro
- **Mapeo y categorización automática:** asocia cada gasto a su categoría contable (PGC)
- **Proveedores recurrentes:** detecta patrones y autocompleta datos en facturas repetitivas

#### 4.5.3 Conciliación Bancaria

- **Importación de extractos:** OFX, CSV, o conexión directa via API bancaria (Open Banking / PSD2)
- **Cruce automático:** matching inteligente entre apuntes bancarios ↔ facturas emitidas/recibidas
- **Alertas de descuadre:** notificación cuando un movimiento no tiene factura asociada
- **Conciliación manual asistida:** para movimientos que no se casan automáticamente

#### 4.5.4 CRM Financiero y Análisis

- **Dashboard financiero:** P&L, cash flow, comparativas interanuales, márgenes
- **Análisis de gastos:** evolución por categoría, por proveedor, tendencias mensuales
- **Producción por doctor:** ranking, evolución, comparativa entre profesionales
- **Rentabilidad por tratamiento:** qué tratamientos son más rentables
- **Proyecciones:** estimación de ingresos/gastos futuros basada en histórico
- **Alertas inteligentes:** gastos inusuales, desviaciones sobre presupuesto, proveedores con facturas pendientes
- **Informes personalizados:** generación bajo demanda con filtros por periodo, categoría, doctor

#### 4.5.5 Obligaciones Fiscales (SLP — Impuesto de Sociedades)

- **Modelo 303 (IVA trimestral):** generación automática del borrador
- **Modelo 202 (pago fraccionado IS):** cálculo trimestral del Impuesto de Sociedades
- **Modelo 200 (Impuesto de Sociedades anual):** generación del borrador anual
- **Modelo 390 (resumen anual IVA):** generación automática
- **Modelo 347 (declaración con terceros):** detección automática de operaciones > 3.005,06€
- **Modelo 111 (retenciones profesionales):** trimestral, para doctores colaboradores
- **Modelo 190 (resumen anual retenciones):** generación anual
- **Libro registro de facturas emitidas y recibidas** (SII ready)
- **Cuentas anuales:** balance, cuenta de pérdidas y ganancias, memoria
- **Alertas fiscales:** recordatorios de fechas límite de presentación de cada modelo
- **Exportación PDF** de todos los documentos tributarios

### 4.6 💬 Comunicación (WhatsApp)

- Chat bidireccional integrado (Evolution API)
- Plantillas de mensajes predefinidas (recordatorios, seguimientos)
- Envío masivo segmentado (campañas de recall)
- Respuestas automáticas por IA (configurable por la clínica)
- Historial de conversaciones vinculado a ficha del paciente
- Detección de intención del mensaje para enrutar al personal adecuado

### 4.7 🤖 Asistente IA

- **Escucha activa:** transcripción en tiempo real de la conversación doctor-paciente
- **Autocompletado de Entrada Médica:** la IA sugiere el texto clínico basándose en lo escuchado
- **Generación de presupuestos:** detecta tratamientos mencionados y pre-completa el presupuesto
- **Agendamiento por voz:** "pon cita para el martes a las 10" → crea la cita
- **Bot WhatsApp:** responde preguntas frecuentes, confirma citas, envía indicaciones
- **Asistente interno:** ayuda al personal con dudas sobre protocolos o el propio software
- **Auto-mejora:** sugiere mejoras del software basándose en patrones de uso

### 4.8 🏥 Gestión de la Clínica

- Configuración de gabinetes/sillones
- Horarios de doctores y personal
- Gestión de inventario de materiales
- Pedidos a proveedores
- Control de stock con alertas de mínimo
- KPIs: ocupación de agenda, tasa de aceptación de presupuestos, producción por doctor

---

## 5. Fases de Desarrollo

### Fase 1 — Cimientos (Semanas 1-4)

> **Objetivo:** Infraestructura base funcional

| # | Tarea | Prioridad |
|---|-------|-----------|
| 1.1 | Setup monorepo: `/frontend` (Vite+React+TS) + `/backend` (Node+Express+TS) | 🔴 Crítica |
| 1.2 | Docker Compose: PostgreSQL + Redis + MinIO + Ollama | 🔴 Crítica |
| 1.3 | Esquema Prisma: pacientes, usuarios, roles, permisos | 🔴 Crítica |
| 1.4 | Sistema de autenticación JWT + refresh tokens | 🔴 Crítica |
| 1.5 | RBAC (Role-Based Access Control) con middleware | 🔴 Crítica |
| 1.6 | Design system: tokens CSS, componentes base | 🟡 Alta |
| 1.7 | Layout principal: sidebar, header, routing | 🟡 Alta |
| 1.8 | CI/CD pipeline básico (lint, test, build) | 🟡 Alta |

### Fase 2 — Gestión Clínica Core (Semanas 5-10)

> **Objetivo:** Operativa diaria de la clínica

| # | Tarea | Prioridad |
|---|-------|-----------|
| 2.1 | CRUD completo de pacientes + ficha detallada | 🔴 Crítica |
| 2.2 | Historia clínica + odontograma interactivo | 🔴 Crítica |
| 2.3 | Entradas médicas (registro de visitas) | 🔴 Crítica |
| 2.4 | Agenda multi-doctor con drag & drop | 🔴 Crítica |
| 2.5 | Catálogo de tratamientos configurable | 🟡 Alta |
| 2.6 | Presupuestos: creación, estados, PDF | 🟡 Alta |
| 2.7 | Galería de fotos del paciente | 🟢 Media |
| 2.8 | Subida y gestión de documentos/consentimientos | 🟢 Media |

### Fase 3 — Facturación y Contabilidad (Semanas 11-18)

> **Objetivo:** Autonomía financiera total (adiós gestoría). SLP → Impuesto de Sociedades.

| # | Tarea | Prioridad |
|---|-------|-----------|
| 3.1 | Motor de facturación (series, numeración, PDF) | 🔴 Crítica |
| 3.2 | Registro de cobros y métodos de pago | 🔴 Crítica |
| 3.3 | Libro de ingresos automático + producción por doctor | 🔴 Crítica |
| 3.4 | Registro de facturas de proveedores (manual + OCR foto + PDF) | 🔴 Crítica |
| 3.5 | Automatización Gmail: captura de facturas por email | 🟡 Alta |
| 3.6 | Visor/previsualizador de facturas (PDF/imagen) | 🟡 Alta |
| 3.7 | Mapeo y categorización automática de gastos (PGC) | 🟡 Alta |
| 3.8 | Importación de extractos bancarios (OFX/CSV) | 🔴 Crítica |
| 3.9 | Conciliación bancaria automática | 🔴 Crítica |
| 3.10 | Generación automática Modelo 303 (IVA) | 🟡 Alta |
| 3.11 | Generación automática Modelo 202 (pago fraccionado IS) | 🟡 Alta |
| 3.12 | Modelo 200, 390, 347, 111, 190 | 🟢 Media |
| 3.13 | CRM financiero: dashboards, análisis, proyecciones | 🟡 Alta |
| 3.14 | Alertas de fechas fiscales y descuadres | 🟢 Media |

### Fase 4 — Comunicación y WhatsApp (Semanas 17-20)

> **Objetivo:** Canal de comunicación automatizado con pacientes

| # | Tarea | Prioridad |
|---|-------|-----------|
| 4.1 | Integración Evolution API / despliegue local | 🔴 Crítica |
| 4.2 | Chat bidireccional en panel SmileStudio | 🔴 Crítica |
| 4.3 | Plantillas de mensajes y recordatorios automáticos | 🟡 Alta |
| 4.4 | Vinculación conversación ↔ ficha paciente | 🟡 Alta |
| 4.5 | Campañas de recall / envío masivo segmentado | 🟢 Media |

### Fase 5 — IA y Escucha Activa (Semanas 21-26)

> **Objetivo:** IA como copiloto clínico y de gestión (Gemini API + Web Speech API)

| # | Tarea | Prioridad |
|---|-------|-----------|
| 5.1 | Configuración Gemini API + servicio de anonimización de datos | 🔴 Crítica |
| 5.2 | Transcripción en tiempo real (Web Speech API en navegador) | 🔴 Crítica |
| 5.3 | Autocompletado de Entrada Médica desde dictado | 🟡 Alta |
| 5.4 | Generación automática de presupuesto desde conversación | 🟡 Alta |
| 5.5 | Bot WhatsApp con IA (respuestas automáticas vía Gemini) | 🟡 Alta |
| 5.6 | Asistente interno para personal de la clínica | 🟢 Media |
| 5.7 | Agendamiento por comandos de voz | 🟢 Media |

### Fase 6 — Imagen Médica (Semanas 27-30)

> **Objetivo:** Visualización completa de imágenes diagnósticas

| # | Tarea | Prioridad |
|---|-------|-----------|
| 6.1 | Integración con Romexis (lectura de RX DICOM) | 🔴 Crítica |
| 6.2 | Visor DICOM web (Cornerstone.js) | 🔴 Crítica |
| 6.3 | Renders CBCT en navegador | 🟡 Alta |
| 6.4 | Vinculación imagen ↔ paciente ↔ tratamiento | 🟡 Alta |

### Fase 7 — Pulido y Producción (Semanas 31-36)

> **Objetivo:** Software estable, seguro y listo para uso diario

| # | Tarea | Prioridad |
|---|-------|-----------|
| 7.1 | Auditoría de seguridad completa | 🔴 Crítica |
| 7.2 | Tests E2E de flujos críticos | 🔴 Crítica |
| 7.3 | PWA: offline mode, instalable en dispositivos | 🟡 Alta |
| 7.4 | Backups automáticos (PostgreSQL + MinIO) | 🔴 Crítica |
| 7.5 | Monitorización y alertas (uptime, errores) | 🟡 Alta |
| 7.6 | Documentación de usuario (manuales internos) | 🟢 Media |
| 7.7 | Onboarding / migración de datos existentes | 🟢 Media |
| 7.8 | Performance testing y optimización | 🟢 Media |

---

## 6. Seguridad y Control de Acceso

### Roles y Permisos (RBAC)

| Rol | Descripción | Permisos clave |
|-----|-------------|----------------|
| **Administrador** | Gestión total del sistema | Todo. Configuración, usuarios, fiscal |
| **Doctor** | Profesional clínico | Pacientes, historia, tratamientos, agenda propia |
| **Higienista** | Personal clínico auxiliar | Pacientes (lectura), agenda propia, entradas médicas limitadas |
| **Recepción** | Front desk | Agenda (todas), pacientes (datos básicos), cobros |
| **Contabilidad** | Gestión financiera | Facturación, gastos, informes fiscales |
| **Auxiliar** | Apoyo general | Agenda (lectura), pacientes (lectura) |

### Medidas de Seguridad

```
✅ Autenticación JWT con refresh tokens (httpOnly cookies)
✅ Cifrado de datos sensibles en reposo (AES-256)
✅ HTTPS obligatorio (SSL/TLS)
✅ Rate limiting por IP y por usuario
✅ Protección CSRF, XSS, SQL injection (Prisma parameterized)
✅ Auditoría: log de todas las acciones con usuario, timestamp, IP
✅ Sesiones con timeout configurable
✅ 2FA opcional para roles administrativos
✅ Backup cifrado automático diario
✅ Política de contraseñas fuerte (mínimo 12 chars, complejidad)
```

---

## 7. IA y Automatización

### Flujo de Escucha Activa

```
  🎤 Micrófono del gabinete
         │
         ▼
  ┌──────────────────┐
  │ Web Speech API   │ ← Transcripción en el navegador (gratuita, sin servidor)
  └────────┬─────────┘
           │ Texto transcrito
           ▼
  ┌──────────────────┐
  │  Gemini API      │ ← Análisis del contexto clínico (datos anonimizados)
  │  (Free tier)     │ ← ~100+ tokens/s, 60 req/min gratis
  └────────┬─────────┘
           │ Resultado estructurado
     ┌─────┼─────────────┐
     │     │             │
     ▼     ▼             ▼
  Entrada  Presupuesto  Cita
  Médica   sugerido     sugerida
```

### Modos de Activación IA

| Modo | Activación | Uso |
|------|-----------|-----|
| **Escucha pasiva** | Toggle en interfaz | Transcribe sin intervenir, rellena entrada médica |
| **Asistente activo** | Comando de voz / botón | Responde preguntas, ejecuta acciones |
| **Bot WhatsApp** | Mensaje entrante del paciente | Respuestas automáticas configurables |
| **Copiloto de gestión** | Panel de IA en sidebar | Consultas del personal sobre el software o protocolos |

---

## 8. Infraestructura y Despliegue

### Topología

```
                         Internet
                            │
              ┌─────────────┼─────────────┐
              │                           │
    ┌─────────▼──────────┐     ┌──────────▼──────────┐
    │  Cloudflare Pages  │     │  VPS Hostinger      │
    │  (Frontend — 0€)   │     │  KVM 2 (8€/mes)     │
    │  React SPA + CDN   │     │  8GB · 2vCPU · 100GB│
    │  Deploy: git push  │     │  IP fija · Ubuntu    │
    └────────────────────┘     └──────────┬──────────┘
                                          │
                    ┌─────────────────────┼──────────────────┐
                    │                     │                  │
              ┌─────▼─────┐      ┌───────▼──────┐   ┌──────▼──────┐
              │  Backend  │      │ PostgreSQL 16│   │  Evolution  │
              │  Node.js  │      │ + Redis      │   │  API        │
              │  + Nginx  │      │ + pgcrypto   │   │  (WhatsApp) │
              │  (Docker) │      │ (Docker)     │   │  (Docker)   │
              └───────────┘      └──────────────┘   └─────────────┘
                    │
         ┌──────────┼──────────┐
         │                     │
   ┌─────▼──────┐       ┌──────▼──────┐
   │ Gemini API │       │Cloudflare R2│
   │ (IA cloud) │       │ (RX/CBCT)   │
   │ Free tier  │       │ 10GB gratis │
   └────────────┘       └─────────────┘
```

```
         BACKUP AUTOMÁTICO NOCTURNO

   VPS Hostinger ──── pg_dump + GPG ────▶ NAS Buffalo 1TB
   (PostgreSQL)       (cifrado)            (Red clínica)
```

### VPS Hostinger KVM 2

> **Todo el backend corre en una VPS Hostinger KVM 2**, con IP fija, uptime 99.9%, y ubicación en la UE (RGPD compliant).

| Componente | Detalle |
|------------|--------|
| **Plan** | KVM 2 — 8GB RAM, 2 vCPU, 100GB SSD |
| **SO** | Ubuntu Server 22.04 LTS |
| **Red** | IP fija pública, sin necesidad de DDNS ni puertos abiertos en la clínica |
| **Contenedores** | Docker + Docker Compose (5 servicios) |
| **SSL** | Let's Encrypt (Certbot) con renovación automática |
| **Coste** | ~8€/mes |

> 💡 **Ventaja clave:** Al correr el backend en una VPS profesional, la clínica no depende de su conexión a Internet local ni de un portátil como servidor. Si Internet de la clínica se cae, los datos y la API siguen accesibles desde cualquier dispositivo con conexión.

### Almacenamiento de Imágenes Médicas

| Tipo de archivo | Peso típico | Dónde se almacena | Justificación |
|----------------|-------------|-------------------|---------------|
| Fotos paciente (intraoral, etc.) | 1-5MB | Disco VPS (70GB libres) | Acceso rápido, poco peso |
| Documentos/PDFs | 100KB-2MB | Disco VPS | Poco peso |
| RX periapicales/panorámicas | 5-20MB | Cloudflare R2 (10GB free) | Peso moderado, CDN global |
| CBCT (tomografías 3D) | 100-500MB | Cloudflare R2 | Muy pesadas, sin coste de descarga |

### Backup y Recuperación

| Componente | Destino | Frecuencia | Método |
|------------|---------|-----------|--------|
| PostgreSQL | NAS Buffalo (clínica) | Diario nocturno | `pg_dump` → cifrado GPG → rsync por VPN |
| Archivos/fotos | NAS Buffalo | Diario nocturno | rsync cifrado |
| Imágenes R2 | Ya replicado por Cloudflare | Automático | Durabilidad 99.999999999% |

### Docker Compose Services

```yaml
services:
  backend:     # Node.js API + WebSocket
  postgres:    # Base de datos principal (pgcrypto habilitado)
  redis:       # Caché + sesiones + colas
  evolution:   # WhatsApp gateway
  nginx:       # Reverse proxy + SSL (Let's Encrypt)
```

> **5 contenedores** (vs 7 de la propuesta anterior). Se eliminaron MinIO (reemplazado por filesystem + R2) y Ollama (reemplazado por Gemini API cloud).

---

## 9. Legislación y Cumplimiento Normativo

### Protección de Datos (RGPD / LOPD-GDD)

- **Base legal del tratamiento:** Ejecución de contrato (prestación sanitaria)
- **Registro de actividades de tratamiento (RAT)**
- **Evaluación de impacto (EIPD)** para datos de salud (categoría especial)
- **Consentimiento informado** digital con firma
- **Derecho de acceso, rectificación, supresión y portabilidad**
- **Cifrado de datos de salud** en reposo y en tránsito
- **Periodo de retención:** Historial clínico mínimo 5 años (Ley 41/2002)
- **Delegado de Protección de Datos (DPD)** si procede

### Obligaciones Fiscales Automatizadas (SLP — Impuesto de Sociedades)

> **Rubio García Dental es una SLP**, por lo que tributa por **Impuesto de Sociedades** (no IRPF por estimación directa).

| Modelo | Periodicidad | Descripción |
|--------|-------------|-------------|
| **303** | Trimestral | Autoliquidación IVA |
| **202** | Trimestral (abril, octubre, diciembre) | Pago fraccionado del Impuesto de Sociedades |
| **111** | Trimestral | Retenciones a profesionales/trabajadores |
| **115** | Trimestral | Retenciones por alquileres (si aplica) |
| **390** | Anual | Resumen anual IVA |
| **200** | Anual (julio) | Impuesto de Sociedades |
| **347** | Anual (febrero) | Declaración de operaciones con terceros > 3.005,06€ |
| **190** | Anual (enero) | Resumen anual de retenciones |
| **180** | Anual | Resumen retenciones alquileres (si aplica) |
| — | Anual | **Cuentas anuales** (balance, P&L, memoria) → depósito en Registro Mercantil |

### Facturación (Normativa española)

- Numeración correlativa sin saltos
- Series diferenciadas si aplica
- Datos obligatorios: NIF, razón social, base imponible, tipo IVA, cuota
- Conservación 4 años (obligación fiscal) / 6 años (obligación mercantil)
- Factura rectificativa en lugar de eliminación
- Adaptación al sistema VeriFactu cuando sea obligatorio

---

## 10. Estructura del Proyecto

```
SmileStudio/
├── 📁 frontend/                    # Aplicación React (despliega en Hostinger)
│   ├── public/
│   ├── src/
│   │   ├── assets/                 # Imágenes, fuentes, iconos
│   │   ├── components/             # Componentes reutilizables
│   │   │   ├── ui/                 # Botones, inputs, modals, tables
│   │   │   ├── layout/             # Sidebar, Header, Layout
│   │   │   └── shared/             # Odontograma, Visor DICOM, etc.
│   │   ├── pages/                  # Vistas principales
│   │   │   ├── Dashboard/
│   │   │   ├── Agenda/
│   │   │   ├── Patients/
│   │   │   ├── Billing/
│   │   │   ├── Accounting/
│   │   │   ├── Communication/
│   │   │   ├── AIAssistant/
│   │   │   └── Settings/
│   │   ├── hooks/                  # Custom hooks
│   │   ├── services/               # API calls (axios/fetch)
│   │   ├── stores/                 # Zustand stores
│   │   ├── types/                  # TypeScript interfaces
│   │   ├── utils/                  # Funciones auxiliares
│   │   ├── styles/                 # CSS global, tokens, themes
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── 📁 backend/                     # API Node.js (servidor local)
│   ├── src/
│   │   ├── config/                 # Database, auth, env config
│   │   ├── middleware/             # Auth, RBAC, validation, logging
│   │   ├── modules/                # Organización por dominio
│   │   │   ├── auth/               # Login, registro, JWT
│   │   │   ├── patients/           # CRUD pacientes
│   │   │   ├── appointments/       # Agenda y citas
│   │   │   ├── treatments/         # Tratamientos y presupuestos
│   │   │   ├── billing/            # Facturación
│   │   │   ├── accounting/         # Contabilidad y fiscal
│   │   │   ├── communication/      # WhatsApp, email
│   │   │   ├── ai/                 # Integración Ollama
│   │   │   ├── imaging/            # RX, CBCT, fotos
│   │   │   └── admin/              # Configuración, usuarios
│   │   ├── services/               # Servicios transversales
│   │   ├── utils/                  # Helpers, validators
│   │   ├── jobs/                   # Cron jobs (recordatorios, fiscal)
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma           # Modelo de datos
│   │   └── migrations/
│   ├── tests/
│   ├── tsconfig.json
│   └── package.json
│
├── 📁 docker/                      # Configuración Docker
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── nginx/
│   │   └── nginx.conf
│   └── ollama/
│       └── Modelfile
│
├── 📁 docs/                        # Documentación
│   ├── api/                        # API docs (OpenAPI/Swagger)
│   ├── guides/                     # Manuales de usuario
│   └── fiscal/                     # Documentación fiscal
│
├── 📁 scripts/                     # Scripts utilitarios
│   ├── backup.sh
│   ├── restore.sh
│   └── seed.ts                     # Datos iniciales
│
├── PROGRESS.md                     # 📍 ARCHIVO DE SEGUIMIENTO (ver abajo)
├── README.md                       # Este archivo
├── .env.example
├── .gitignore
└── LICENSE
```

---

> 📍 **El archivo `PROGRESS.md` es el documento vivo de seguimiento del proyecto.** Se actualiza automáticamente con cada acción y contiene el historial de lo realizado, lo que se está haciendo y lo que falta. Consulta `PROGRESS.md` para el estado actual del proyecto.

---

## Licencia

Proyecto privado — **Rubio García Dental** © 2026. Todos los derechos reservados.

---

*Generado por SmileStudio Architecture v1.0 — Marzo 2026*
