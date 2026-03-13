# 06_INTERNACIONALIZACION — Análisis i18n/l10n

---

## 06A_i18n_READINESS.md

### Estado: ❌ NO preparado para internacionalización

**Evidencia:**
```tsx
// Gestoria.tsx (y todos los archivos):
<h2>Facturas desde Gmail</h2>
<button>Conectar Gmail</button>
<p>Mostrando datos de demostración</p>
// → 100% textos hardcodeados en castellano
```

No existe ningún sistema de traducción (i18next, react-intl, etc.).

**Impacto:** Aunque la app es para una clínica española, si se quiere vender a otras clínicas de otros países o cambiar algún texto, requiere editar código.

**Clasificación:** 🟡 MEDIO (clínica española, 1 idioma suficiente por ahora)

**Solución mínima para el futuro:**
```bash
npm install i18next react-i18next
```
```typescript
// i18n/es.json
{
    "gmail.connect": "Conectar Gmail",
    "gmail.sync": "Sincronizar",
    "gmail.connected": "Gmail Conectado"
}
```

---

## 06B_FORMATOS_LOCALES.md

### Fechas: ✅ Consistentemente en formato español

```typescript
// citas.service.ts:
new Date().toLocaleDateString('es-ES', { ... }) // ✅

// Gestoria.tsx:
new Date().toLocaleTimeString('es-ES') // ✅
```

### Monedas: ✅ Euro, formato correcto

```typescript
// Gestoria.tsx:
new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(bar.rawEur)
// → "1.234,56 €" ✅ Correcto
```

### Números: ✅ Separador de miles con punto (es-ES)

---

## 06C_ENCODING_CARACTERES.md

### UTF-8: ✅ Correcto

```typescript
// exportarGestoriaCSV():
const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
// BOM Unicode incluido → Excel abre correctamente con acentos ✅
```

### Caracteres especiales en strings:
- Ñ, acentos en strings TypeScript: ✅
- En búsquedas FDW (`ilike`): ⚠️ Depende de collation SQL Server

---

## 06D_RTL_SUPPORT.md

### Estado: ❌ Sin soporte RTL

**Impacto actual:** 🟢 BAJO — solo se usa en español.

**Para el futuro:** El layout usa `flex-row`, `ml-`, `mr-` en lugar de `ms-` (margin-start) y `me-` (margin-end) de Tailwind v3, que sí respetan RTL.
