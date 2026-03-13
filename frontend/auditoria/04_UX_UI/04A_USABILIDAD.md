# 04A_USABILIDAD.md — Facilidad de Uso

---

## Evaluación de primeros 5 segundos

**Propósito de la app:** ✅ Claro para usuarios internos (dental clinic management)
**Navegación:** ✅ Sidebar con iconos y labels — intuitivo
**Primera acción disponible:** ✅ Agenda visible en Dashboard

---

## Hallazgo 1 — Demasiados clics para flujo principal 🟡

**Flujo: Ver historial de un paciente**
```
Dashboard → (click sidebar) Pacientes → (click) Buscar paciente → 
(escribir) → (click) Seleccionar paciente → (scroll) Historia Clínica
```
→ **4-5 interacciones** para la tarea más frecuente.

**Mejora:** Barra de búsqueda global accesible con Cmd/Ctrl+K desde cualquier pantalla.

---

## Hallazgo 2 — Sin indicador de "guardado automático" 🟡

En el SOAPEditor (notas médicas), el usuario escribe sin saber si sus datos se están guardando. Un error de red mientras escribe → pérdida de datos.

**Solución:**
```tsx
<span className="text-xs text-slate-400">
    {saveStatus === 'saving' && '💾 Guardando...'}
    {saveStatus === 'saved' && '✓ Guardado'}
    {saveStatus === 'error' && '⚠️ Error al guardar'}
</span>
```

---

## Hallazgo 3 — Icono de WhatsApp sin estado visible 🟡

Si la instancia de WhatsApp (Evolution) no está conectada, el icono del sidebar no muestra ningún indicador de estado. Un recepcionista puede creer que WhatsApp está activo cuando no lo está.

**Solución:** Badge de estado rojo/verde en el navitem de WhatsApp.

---

## Hallazgo 4 — Errores de API mostrados como "Sin datos" 🟠

Cuando hay un error de conexión a Supabase, la pantalla muestra listas vacías sin distinguirlo de "no hay datos aún". El usuario cree que la clínica no tiene citas/pacientes.

---

## Hallazgo 5 — Confirmaciones destructivas sin modal 🟠

**Ejemplo:** Cancelar/anular una cita. Si hay un botón de anular sin confirmación, un click accidental anula una cita real.

**Solución:** Modal de confirmación para acciones destructivas:
```tsx
const confirmarAccion = (mensaje: string, onConfirm: () => void) => {
    if (window.confirm(mensaje)) onConfirm();
    // O mejor: componente ConfirmModal reutilizable
};
```

---

## 04B_CONSISTENCIA_VISUAL.md — Diseño Coherente

## Hallazgo 1 — Mezcla de librería de iconos 🟡

```tsx
// En algunos componentes:
import { Mail, RefreshCw } from 'lucide-react'; // Lucide
// En otros:
<span className="material-icons">security</span> // Material Icons (CDN)
```

**Impacto:** Dos librerías de iconos cargadas. Inconsistencia visual (diferente grosor/estilo).
**Solución:** Migrar todos los `material-icons` a `lucide-react`.

## Hallazgo 2 — Colores hardcodeados mezclados con tokens 🟡

```tsx
// Con tokens:
className="text-primary bg-secondary"
// Hardcoded:
className="text-[#051650] bg-blue-600"
```

Un cambio de marca requiere modificar 200+ archivos en lugar de 1.

## Hallazgo 3 — Dark mode inconsistente 🟡

Algunas vistas tienen clases `dark:` y otras no. En modo oscuro, partes de la UI quedan con fondo blanco.
