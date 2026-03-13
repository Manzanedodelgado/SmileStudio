# 00_INDICE.md — Mapa Completo de la Auditoría

**Proyecto:** SmilePro — Clínica Dental Rubio García
**Stack:** React 18 + TypeScript + Vite + Tailwind + Supabase + FDW SQL Server (GELITE)
**Total de hallazgos:** 53 (9 críticos, 16 altos, 28 medios)

---

## Estructura de la auditoría:

```
/auditoria/
│
├── 00_RESUMEN_EJECUTIVO.md    ← LEER PRIMERO — 5 alertas inmediatas
├── 00_INDICE.md               ← Este archivo
├── 00_INSTRUCCIONES_BASE.md   ← Metodología completa
├── 00_REGLAS_CLAVE.md         ← Las 5 reglas de esta auditoría
├── CHECKPOINT.md              ← Estado de progreso
│
├── 01_SEGURIDAD/              ← 12 hallazgos (5 críticos)
│   ├── 01A_PENTESTING.md         ← 6 vectores de ataque analizados
│   ├── 01B_VULNERABILIDADES_CRITICAS.md  ← Las 6 vulns más graves
│   ├── 01C_OWASP_TOP10.md        ← 10/10 categorías evaluadas
│   ├── 01D_AUTENTICACION.md      ← Sistema auth custom analizado
│   └── 01E_PROTECCION_DATOS.md   ← RGPD y datos médicos
│
├── 02_FUNCIONALIDAD/          ← 12 hallazgos (2 críticos)
│   ├── 02A_TESTING_MANUAL.md     ← Pruebas por módulo
│   ├── 02B_FLUJOS_CRITICOS.md    ← 5 flujos completos analizados
│   ├── 02C_FORMULARIOS.md        ← 4 formularios analizados
│   └── 02D_API_TESTING.md        ← 6 API keys expuestas detectadas
│
├── 03_ESTABILIDAD_RENDIMIENTO/ ← 9 hallazgos (0 críticos)
│   ├── 03A_CARGA_ESTRES.md        ← 4 puntos de fallo bajo carga
│   ├── 03B_CUELLOS_BOTELLA.md     ← 4 bottlenecks identificados
│   ├── 03C_MEMORIA_OPTIMIZACION.md ← Memory leaks y optimización
│   └── 03D_ERRORES_MANEJO.md      ← Inventario de error handling
│
├── 04_UX_UI/                  ← 7 hallazgos (0 críticos)
│   ├── 04A_USABILIDAD.md          ← 5 problemas de usabilidad
│   ├── 04C_RESPONSIVE.md          ← Análisis responsive + feedback
│   └── (04B y 04D incluidos en 04A/04C)
│
├── 05_ACCESIBILIDAD/          ← 9 hallazgos (2 críticos)
│   └── 05A_WCAG_CHECKLIST.md      ← WCAG A/AA/AAA + screen reader + keyboard + contraste
│
├── 06_INTERNACIONALIZACION/   ← 2 hallazgos (0 críticos)
│   └── 06A_i18n_READINESS.md      ← i18n + formatos + encoding + RTL
│
├── 07_COMPATIBILIDAD/         ← 2 hallazgos (0 críticos)
│   └── 07A_BROWSERS.md            ← Browsers + dispositivos + dependencias
│
├── 08_PROPUESTAS_CAMBIO/      ← Plan de acción priorizado
│   └── 08A_CRITICOS_INMEDIATOS.md ← 4 sprints de trabajo estimados
│
└── 09_EVIDENCIAS/             ← Fragmentos de código referenciados
    └── fragmentos_codigo/
```

---

## Top 5 hallazgos más críticos:

| # | Hallazgo | Archivo | Impacto |
|---|---------|---------|---------|
| 1 | API keys privadas en bundle JS (Gmail, Groq, Romexis) | `02D_API_TESTING.md` | Datos médicos expuestos |
| 2 | Sin rate limiting en login | `01A_PENTESTING.md` | Fuerza bruta ilimitada |
| 3 | Consentimientos informados son mock | `01E_PROTECCION_DATOS.md` | Nulo legal RGPD |
| 4 | RLS no efectiva en tablas FDW | `01C_OWASP_TOP10.md` | Todos los pacientes expuestos |
| 5 | JWT tokens en localStorage | `01D_AUTENTICACION.md` | XSS roba sesiones |
