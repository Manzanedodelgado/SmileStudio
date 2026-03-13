# 04C_RESPONSIVE.md — Móvil, Tablet, Escritorio

---

## Estado general: 🟡 Diseñado para escritorio, móvil como secundario

---

## Hallazgo 1 — Tablas sin scroll horizontal en móvil 🟠

**Archivo:** `views/Gestoria.tsx` (tabla de facturas, ~530 columnas de ancho)
```tsx
<table className="w-full text-left">
    <thead>
        <th className="px-10 py-6">ID Legal (TBAI)</th>
        <th className="px-10 py-6">Paciente / Titular</th>
        ...6 columnas más
```

En pantallas <768px esta tabla se rompe o aplasta el contenido.

**Solución:**
```tsx
<div className="overflow-x-auto">
    <table className="w-full min-w-[900px]">
```

---

## Hallazgo 2 — Sidebar no se colapsa en móvil 🟠

La app tiene un sidebar colapsable para desktop, pero en móvil (<640px) ocupa espacio de pantalla crítico sin un trigger de hamburguesa clara.

---

## Hallazgo 3 — Touch targets < 44px 🟡

**WCAG 2.5.5 — AAA:** Los elementos interactivos deben tener mínimo 44×44px.

```tsx
// Algunos botones de acción en tablas:
<button className="p-2.5 hover:bg-...">
    <Download className="w-4.5 h-4.5" />
</button>
// p-2.5 = 10px padding + 18px icono = ~38px → FALLA
```

---

## 04D_FEEDBACK_USUARIO.md — Loading, Errores, Confirmaciones

## Inventario de feedback actual:

| Acción | Loading | Error | Éxito |
|--------|---------|-------|-------|
| Login | ⚠️ Sin verificar | ✅ Mensaje error | ✅ Redirige |
| Buscar paciente | ✅ Skeleton? | ❌ Muestra vacío | ✅ Lista |
| Guardar automatización | ✅ "Guardando..." | ✅ "Error al guardar" | ✅ "Guardado en BD" |
| Sync Gmail | ✅ "Sincronizando..." + progreso | ✅ Banner rojo | ✅ Timestamp |
| Toggle WhatsApp | ⚠️ Sin verificar | ❌ | ⚠️ |
| Crear nota SOAP | ⚠️ Sin verificar | ❌ | ⚠️ |
| Exportar CSV | ✅ Inmediato | ❌ Sin error visible | ✅ Descarga |

## Hallazgo: Buscar paciente sin skeleton loader 🟡

Mientras carga el listado de pacientes inicial, la pantalla muestra vacío sin indicar que está cargando. Un recepcionista podría pensar que no hay pacientes.
