# 07_COMPATIBILIDAD — Navegadores, Dispositivos y Dependencias

---

## 07A_BROWSERS.md

### Stack de compatibilidad:
- **Vite + React 18** → targets modern browsers (ES2020+)
- **Tailwind CSS** → autoprefixer via PostCSS ✅

| Navegador | Versión mínima | Estado |
|-----------|---------------|--------|
| Chrome 90+ | ✅ PASA | |
| Firefox 90+ | ✅ PASA | |
| Safari 14+ | ⚠️ PARCIAL | `import.meta.env` OK, CSS `backdrop-filter` puede necesitar prefijo |
| Edge 90+ | ✅ PASA | |
| IE 11 | ❌ FALLA | ES2020+ sin polyfills — no soportado (aceptable para clínica) |
| Safari iOS 14 | ⚠️ PARCIAL | Algunos flexbox bugs conocidos |

### Hallazgo: `crypto.randomUUID()` en iOS ≤ 14 🟡
```typescript
// services/db.ts:73
return { ...body, id: crypto.randomUUID() } as T;
// crypto.randomUUID() no disponible en Safari < 15.4
```
**Solución:**
```typescript
const generateId = () => 
    typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
```

---

## 07B_DISPOSITIVOS.md

### Resoluciones críticas:

| Dispositivo | Resolución | Estado |
|-------------|-----------|--------|
| Desktop 1920×1080 | ✅ Diseñado para esto | |
| Laptop 1366×768 | ✅ OK con sidebar colapsado | |
| iPad 1024×768 | 🟡 Funcional con scroll | |
| iPhone 390×844 | 🟠 Problemas en tablas | |
| Monitor 4K 2560×1440 | 🟡 Elementos se ven pequeños | |

### Hallazgo: App es de uso interno en clínica 🟢
Los usuarios son personal de clínica en PCs de escritorio. Compatibilidad móvil es "nice to have" no crítica.

---

## 07C_DEPENDENCIAS_OBSOLETAS.md

**Comando a ejecutar:**
```bash
npm audit
npm outdated
```

**Dependencias clave detectadas en el código:**
- React 18 ✅ (última mayor)
- Vite (sin verificar versión exacta)
- Tailwind CSS v3 ✅
- Lucide React (iconos) ✅

**Riesgo potencial:** Dependencias sin especificar versiones exactas en package.json pueden actualizar y romper la app.
