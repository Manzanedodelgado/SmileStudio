# 📍 PROGRESS.md — SmileStudio Progress Tracker

> **Este archivo se actualiza automáticamente con cada acción del proyecto.**
> Es el mapa de navegación para no perder perspectiva entre sesiones.
> Última actualización: **2026-03-07 17:47 CET**

---

## 📊 Estado General del Proyecto

```
Fase actual:    🏗️ Fase 1 — Cimientos (en curso)
Progreso:       ████░░░░░░░░░░░░░░░░ 12%
Estado:         🟢 En curso
```

---

## ✅ Lo que YA hemos hecho

### Sesión 2026-03-07 — Planificación Inicial

- [x] **Creación del README.md completo** — Documento maestro del proyecto con:
  - Visión general y principios fundamentales
  - Arquitectura del sistema (frontend Hostinger ↔ backend local)
  - Stack tecnológico completo (React, Node, PostgreSQL, Ollama, Evolution API...)
  - 8 módulos funcionales detallados
  - 7 fases de desarrollo con tareas priorizadas
  - Sistema de roles y permisos (RBAC)
  - Flujo de IA y escucha activa
  - Infraestructura y despliegue (Docker, Nginx, servidor local)
  - Cumplimiento normativo (RGPD, modelos fiscales AEAT)
  - Estructura completa del proyecto (directorios y archivos)
- [x] **Actualización mayor del README.md** — Incorporadas aclaraciones del usuario:
  - Entidad jurídica: **SLP** (Sociedad Limitada Profesional) → tributa por Impuesto de Sociedades
  - Servidor: **MacBook Pro** dedicado en la clínica (ya operativo)
  - Módulo de contabilidad ampliado masivamente:
    - Registro de facturas por foto (OCR), PDF, Gmail automático, enlaces
    - Producción por doctor
    - Conciliación bancaria automática (extractos OFX/CSV)
    - CRM financiero con análisis de gastos, proyecciones, rentabilidad por tratamiento
  - Modelos fiscales corregidos: 202/200 (IS) en lugar de 130/100 (IRPF)
  - Añadidos modelos 111, 115, 180 y cuentas anuales

### Sesión 2026-03-07 — Implementación Página Clínica

- [x] **Setup proyecto frontend** — Vite + React + TypeScript
  - `clinic.config.ts` — Configuración white-label (exportable a otras clínicas)
  - `styles/index.css` — Design system completo (60+ CSS variables, Google Fonts Inter/Outfit, animaciones)
  - `types/index.ts` — Definiciones TypeScript para todas las entidades
  - `data/mockData.ts` — Datos simulados realistas
  - `vite.config.ts` — Configuración con plugin React
  - `tsconfig.json` — TypeScript configurado para JSX
- [x] **Layout principal** — `Layout.tsx` + `Layout.css`
  - Sidebar oscura con navegación, logo, usuario
  - Header con barra de búsqueda glassmorphism
  - Responsive con mobile drawer
- [x] **Página Clínica (Home)** — `ClinicaPage.tsx` + `ClinicaPage.css`
  - Hero banner con gradiente (saludo + 4 estadísticas rápidas)
  - Widget: **Gabinetes** — estado en tiempo real de 3 sillones con barras de progreso
  - Widget: **Sala de Espera** — pacientes esperando con tiempo de espera
  - Widget: **Próximas Citas** — timeline vertical del día
  - Widget: **Mensajes Pendientes** — WhatsApp/email ordenados por urgencia
  - Widget: **Documentos Pendientes** — agrupados por paciente, con status (PENDIENTE/ENVIADO/CADUCADO)
  - Widget: **Alertas Clínicas** — ordenadas por severidad (CRÍTICO/ATENCIÓN/INFO)
- [x] **Verificación** — Build 0 errores, verificación visual en navegador OK

---

## 🔄 Lo que ESTAMOS haciendo ahora

- [/] **Fase 1 — Cimientos del proyecto**
  - [x] Setup frontend completo
  - [x] Página Clínica implementada
  - [ ] Backend (Node.js + Express + TypeScript + Prisma)
  - [ ] Docker Compose (PostgreSQL + Redis + MinIO)
  - [ ] Autenticación JWT
  - [ ] RBAC con middleware

---

## 📋 Lo que FALTA por hacer

### 🏗️ Fase 1 — Cimientos (Semanas 1-4)
- [x] 1.1 Setup frontend: Vite+React+TS
- [ ] 1.2 Setup backend: Node+Express+TS
- [ ] 1.3 Docker Compose: PostgreSQL + Redis + MinIO + Ollama
- [ ] 1.4 Esquema Prisma: pacientes, usuarios, roles, permisos
- [ ] 1.5 Sistema de autenticación JWT + refresh tokens
- [ ] 1.6 RBAC con middleware de permisos
- [x] 1.7 Design system: tokens CSS, componentes base
- [x] 1.8 Layout principal: sidebar, header, routing
- [ ] 1.9 CI/CD pipeline básico

### 🏥 Fase 2 — Gestión Clínica Core (Semanas 5-10)
- [ ] 2.1 CRUD completo de pacientes + ficha detallada
- [ ] 2.2 Historia clínica + odontograma interactivo
- [ ] 2.3 Entradas médicas (registro de visitas)
- [ ] 2.4 Agenda multi-doctor con drag & drop
- [ ] 2.5 Catálogo de tratamientos configurable
- [ ] 2.6 Presupuestos: creación, estados, PDF
- [ ] 2.7 Galería de fotos del paciente
- [ ] 2.8 Documentos y consentimientos

### 💰 Fase 3 — Facturación y Contabilidad (Semanas 11-18)
- [ ] 3.1 Motor de facturación (series, numeración, PDF)
- [ ] 3.2 Registro de cobros y métodos de pago
- [ ] 3.3 Libro de ingresos automático + producción por doctor
- [ ] 3.4 Registro de facturas de proveedores (manual + OCR foto + PDF)
- [ ] 3.5 Automatización Gmail: captura de facturas por email
- [ ] 3.6 Visor/previsualizador de facturas (PDF/imagen)
- [ ] 3.7 Mapeo y categorización automática de gastos (PGC)
- [ ] 3.8 Importación de extractos bancarios (OFX/CSV)
- [ ] 3.9 Conciliación bancaria automática
- [ ] 3.10 Modelo 303 (IVA trimestral)
- [ ] 3.11 Modelo 202 (pago fraccionado Impuesto de Sociedades)
- [ ] 3.12 Modelos 200, 390, 347, 111, 190
- [ ] 3.13 CRM financiero: dashboards, análisis, proyecciones
- [ ] 3.14 Alertas de fechas fiscales y descuadres

### 💬 Fase 4 — Comunicación y WhatsApp (Semanas 17-20)
- [ ] 4.1 Integración Evolution API
- [ ] 4.2 Chat bidireccional
- [ ] 4.3 Plantillas y recordatorios automáticos
- [ ] 4.4 Vinculación conversación ↔ paciente
- [ ] 4.5 Campañas de recall

### 🤖 Fase 5 — IA y Escucha Activa (Semanas 21-26)
- [ ] 5.1 Configuración Ollama
- [ ] 5.2 Transcripción en tiempo real
- [ ] 5.3 Autocompletado de Entrada Médica
- [ ] 5.4 Presupuesto automático desde conversación
- [ ] 5.5 Bot WhatsApp con IA
- [ ] 5.6 Asistente interno
- [ ] 5.7 Agendamiento por voz

### 🏥 Fase 6 — Imagen Médica (Semanas 27-30)
- [ ] 6.1 Integración Romexis
- [ ] 6.2 Visor DICOM web
- [ ] 6.3 Renders CBCT
- [ ] 6.4 Vinculación imagen ↔ paciente

### 🚀 Fase 7 — Pulido y Producción (Semanas 31-36)
- [ ] 7.1 Auditoría de seguridad
- [ ] 7.2 Tests E2E
- [ ] 7.3 PWA
- [ ] 7.4 Backups automáticos
- [ ] 7.5 Monitorización
- [ ] 7.6 Documentación de usuario
- [ ] 7.7 Migración de datos
- [ ] 7.8 Performance testing

---

## 🗂️ Historial de Sesiones

| Fecha | Sesión | Actividades principales |
|-------|--------|------------------------|
| 2026-03-07 | Planificación inicial | README.md completo, PROGRESS.md creado |
| 2026-03-07 | Refinamiento del plan | SLP, MacBook Pro, contabilidad expandida (OCR, Gmail, bancos, CRM) |
| 2026-03-07 | Implementación Clínica | Setup frontend completo, Layout, 6 widgets Clínica page |
| 2026-03-07 | **Revisión de infraestructura** | Evaluación completa: Supabase→PostgreSQL local, MacBook Intel→VPS Hostinger, Ollama→Gemini API, NAS Buffalo para backups |
| 2026-03-07 | **Backend en producción** 🟢 | VPS desplegado con Docker+Traefik+EasyPanel. API en `https://gestion.rubiogarciadental.com/api/health`. 6 tablas, 3 usuarios, 3 gabinetes, 15 tratamientos |
| 2026-03-08 | **AI model selection** | Análisis completo de proveedores. Estrategia multi-modelo definitiva incorporada: Groq+Gemini+OpenRouter |

---

## 📝 Decisiones Técnicas Tomadas

| Fecha | Decisión | Justificación |
|-------|----------|---------------|
| 2026-03-07 | Frontend en React + TS + Vite | Ecosistema maduro, componentes reutilizables, HMR rápido |
| 2026-03-07 | Backend en Node.js + Express + TS | TypeScript compartido con frontend, npm ecosystem |
| 2026-03-07 | PostgreSQL como BBDD principal | ACID compliance, soporte JSON, full-text search |
| 2026-03-07 | Evolution API para WhatsApp | Open-source, multi-dispositivo, API REST |
| 2026-03-07 | Entidad jurídica: SLP | Tributa por IS (modelos 200/202), no IRPF |
| 2026-03-07 | OCR con Tesseract.js | Captura de facturas por foto/escáner sin dependencia cloud |
| 2026-03-07 | Google APIs para Gmail | Automatización de captura de facturas recibidas por email |
| 2026-03-07 | Config white-label en `clinic.config.ts` | Un solo archivo para exportar a otra clínica |
| 2026-03-07 | CSS variables + design system | Tema fácil de customizar, sin dependencias externas |
| 2026-03-07 | lucide-react para iconos | Consistente, ligero, tree-shakeable |
| 2026-03-07 | **~~Ollama~~** → **~~Gemini API~~** → **Estrategia multi-modelo** | WhatsApp: Groq (~500 tok/s, 0€) · Copiloto: Gemini Flash-Lite (~1€/mes) · Visión/RX: Gemini Flash (~0.50€/mes) · Fallback: OpenRouter (todos los modelos con una API key) |
| 2026-03-08 | **Backend URL de producción** | `https://gestion.rubiogarciadental.com` — VPS KVM 2, Traefik SSL, EasyPanel, Evolution API, Chatwoot ya activos |
| 2026-03-08 | **DeepSeek API** como fallback IA | ~1€/mes si Groq cambia su free tier. Compatible OpenAI SDK. |
| 2026-03-08 | **Redis diferido a Fase 4** | En Fase 1 se usa `express-rate-limit` en memoria. Redis solo cuando haya WebSocket multi-proceso. |
| 2026-03-07 | **~~Frontend en Hostinger~~** → **Cloudflare Pages** | CDN global gratuito, deploy automático con git push, SSL incluido |
| 2026-03-07 | **~~MacBook Pro como servidor~~** → **VPS Hostinger KVM 2** | IP fija, 99.9% uptime, 8GB RAM, no depende de Internet de la clínica. 8€/mes |
| 2026-03-07 | **~~MinIO~~** → **Filesystem + Cloudflare R2** | Menos complejidad. R2: 10GB gratis, compatible S3, sin costes de salida |
| 2026-03-07 | **NAS Buffalo como backup** | Backup cifrado diario (pg_dump + GPG) al NAS de la clínica |
| 2026-03-07 | **pgcrypto** en PostgreSQL | Cifrado de campos sensibles (datos de salud) directamente en BBDD |

---

## ⚠️ Riesgos y Dependencias Identificadas

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| ~~MacBook Pro como servidor 24/7~~ | ~~🟡 Medio~~ | ✅ **RESUELTO:** Migrado a VPS Hostinger KVM 2 |
| ~~Puerto abierto = superficie de ataque~~ | ~~🔴 Alto~~ | ✅ **RESUELTO:** VPS con IP fija, sin puertos abiertos en clínica |
| Romexis sin API documentada | 🟡 Medio | Acceder a archivos DICOM directamente del filesystem |
| Cambios legislación fiscal | 🟡 Medio | Módulo fiscal configurable con reglas actualizables |
| ~~Rendimiento de Ollama en CPU~~ | ~~🟢 Bajo~~ | ✅ **RESUELTO:** **Groq API** (0€, ~500 tok/s, no requiere GPU ni Mac encendido) |
| OCR impreciso en facturas | 🟡 Medio | Revisión manual post-OCR + aprendizaje de patrones |
| Gmail API requiere OAuth | 🟡 Medio | Configuración inicial guiada + refresh tokens |
| Datos de salud en VPS (RGPD) | 🟡 Medio | VPS en UE + pgcrypto + DPA con Hostinger |
| Free tier Groq API cambia | 🟢 Bajo | 30 req/min suficientes. Fallback automático a DeepSeek (~1€/mes) si cambia |

---

## 📁 Archivos Creados en Esta Sesión

```
frontend/
├── index.html                          # Entry point (SEO + emoji favicon)
├── vite.config.ts                      # Vite + React plugin
├── tsconfig.json                       # TypeScript config
├── package.json                        # Dependencies
├── src/
│   ├── main.tsx                        # React root
│   ├── App.tsx                         # Router + routes
│   ├── config/
│   │   └── clinic.config.ts            # ⭐ White-label config
│   ├── styles/
│   │   └── index.css                   # ⭐ Design system (60+ variables)
│   ├── types/
│   │   └── index.ts                    # TypeScript interfaces
│   ├── data/
│   │   └── mockData.ts                 # Realistic mock data
│   ├── components/
│   │   └── layout/
│   │       ├── Layout.tsx              # Sidebar + Header
│   │       └── Layout.css
│   └── pages/
│       └── Clinica/
│           ├── ClinicaPage.tsx          # ⭐ 6 widgets dashboard
│           └── ClinicaPage.css
```

---

> 💡 **Nota:** Este archivo es la brújula del proyecto. Antes de empezar cualquier sesión de trabajo, leer este archivo para retomar el contexto. Después de cada sesión, actualizar con lo realizado.
