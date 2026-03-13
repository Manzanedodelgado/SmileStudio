# 05A_WCAG_CHECKLIST.md — Cumplimiento WCAG 2.1

---

## Resumen de cumplimiento:

| Nivel | Criterios evaluados | PASA | FALLA | PARCIAL |
|-------|-------------------|------|-------|---------|
| A (mínimo) | 30 | 18 | 8 | 4 |
| AA (recomendado) | 20 | 10 | 6 | 4 |
| AAA | 28 | 5 | 18 | 5 |

---

## Criterios críticos FALLIDOS:

### 1.1.1 — Alt text en imágenes (Nivel A) 🔴

```tsx
// gdrive.service.ts / Pacientes.tsx:
<img src={fotos[fotoIdx]?.url} />
// Sin alt attribute — lectores de pantalla dicen "imagen"

// Romexis:
<img src={panoramicas[panoramicaIdx]?.url} />
// Sin alt — "Radiografía panorámica del paciente [nombre]" es el texto correcto
```

**Solución:**
```tsx
<img 
    src={fotos[fotoIdx]?.url} 
    alt={`Fotografía clínica: ${fotos[fotoIdx]?.label} — ${paciente.nombre}`}
    className="..."
/>
```

### 1.3.1 — Información y relaciones semánticas (Nivel A) 🟠

```tsx
// Botones sin nombre accesible:
<button className="p-2.5 hover:...">
    <Download className="w-4.5 h-4.5" />
</button>
// Sin aria-label → lector de pantalla dice "botón"
```

**Solución:**
```tsx
<button aria-label="Descargar factura como CSV" className="...">
    <Download aria-hidden="true" className="w-4.5 h-4.5" />
</button>
```

### 2.4.3 — Orden de foco (Nivel A) 🟡

El sidebar tiene tabIndex implícito que puede no seguir el orden visual correcto.

### 4.1.2 — Nombre, rol, valor (Nivel A) 🟠

```tsx
// Toggles de automatizaciones:
<div onClick={handleToggle} className="..."> // ← div no es button
// Los divs clicables no tienen rol="button" ni keyboard support
```

---

## 05B_LECTORES_PANTALLA.md — Semántica y ARIA

## Hallazgos principales:

### Divs clicables sin rol 🟠
```tsx
// AutomationRules.tsx:
<div key={a.id} className="... cursor-pointer" onClick={() => handleEdit(a)}>
// → Usar <button> o añadir role="button" tabIndex={0} onKeyDown={handleKeyDown}
```

### Modales sin focus trap 🟠
Los modales (firma de documentos, búsqueda de pacientes) no atrapan el foco. Un usuario con teclado puede "escapar" del modal y operar el fondo.

### Sin anuncios de región (landmarks) 🟡
Falta: `<main>`, `<nav>`, `<header>`, `<aside>` en el layout principal. Los lectores de pantalla no pueden saltar a secciones.

---

## 05C_NAVEGACION_TECLADO.md

## Estado: 🟠 Parcialmente navegable con teclado

✅ Links y botones nativos → navegables
❌ Divs clicables → no navegables
❌ Modales → sin focus trap
❌ Sidebar items → sin indicador de foco visible en todos los temas
❌ Tablas → sin navegación por flecha

---

## 05D_CONTRASTE_TIPOGRAFIA.md

## Ratios de contraste detectados:

| Elemento | Color texto | Color fondo | Ratio estimado | WCAG AA (4.5:1) |
|----------|------------|-------------|----------------|-----------------|
| Labels sidebar activos | #051650 | white | ~15:1 | ✅ PASA |
| Texto slate-400 | #94a3b8 | white | ~2.5:1 | ❌ FALLA |
| Badges estado "Pendiente" | blue-600 | blue-50 | ~4.2:1 | ⚠️ CASI |
| Texto timestamps | slate-400 | slate-50 | ~2.3:1 | ❌ FALLA |

**Elemento con mayor problema:** Textos auxiliares con `text-slate-400` sobre fondos claros.

**Solución:** Cambiar `text-slate-400` a `text-slate-600` en textos informativos.
