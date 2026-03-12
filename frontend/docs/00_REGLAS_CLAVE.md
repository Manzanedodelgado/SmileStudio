# 00_REGLAS_CLAVE.md — Las 5 Reglas de Oro del Proyecto

> **LEER ANTES DE CUALQUIER ACCIÓN.** Estas reglas son la brújula de este proceso de auditoría.

---

## Regla 1: NO TOMAR ATAJOS — Proceso manual y deliberado
No crear scripts que automaticen sin entender qué hacen. Cada cambio debe entenderse completamente antes de ejecutarse. Lentitud con precisión supera velocidad con errores.

## Regla 2: HONESTIDAD ABSOLUTA — [REVIEW] si no estás seguro
Si hay código que no se entiende completamente, o cuyo impacto en producción no es seguro, NUNCA se inventa una solución. Se marca con `[REVIEW]` y se documenta en `04_CODIGO_NO_CLARO.md`.

## Regla 3: NO ELIMINAR, COMPLETAR — Todo elemento visual debe funcionar
Ningún elemento de la interfaz de usuario puede perder su funcionalidad. Si un botón llama a un endpoint que no existe, la solución es **crear el endpoint**, no eliminar el botón. El frontend manda.

## Regla 4: NO MENTIR — Cero placeholders vacíos sin lógica real
No generar funciones o endpoints vacíos con `TODO` o `// implementar aquí`. Si se crea código nuevo, debe ser funcional aunque sea básico. Un placeholder vacío es peor que no tener nada porque da falsa sensación de completitud.

## Regla 5: DOCUMENTAR TODO — Cada cambio, duda y decisión queda registrada
Usar `03_INTERVENCIONES.md` para cada cambio de código. Usar `04_CODIGO_NO_CLARO.md` para cada duda. Actualizar `CHECKPOINT.md` tras cada fase o cada 3-5 archivos procesados. La documentación es el producto, el código es la consecuencia.

---

**Última revisión:** 2026-03-01
**Versión:** 1.0
