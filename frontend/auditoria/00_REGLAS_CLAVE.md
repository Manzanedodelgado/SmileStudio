# 00_REGLAS_CLAVE.md — Las 5 Reglas Críticas de Esta Auditoría

## Regla 1 — EVIDENCIA ANTES QUE OPINIÓN
Cada hallazgo debe incluir: el archivo exacto, el número de línea, y el fragmento de código problemático.
No se informa un problema sin mostrar el código vulnerable.

## Regla 2 — SOLUCIÓN CONCRETA, NO TEORÍA
Cada vulnerabilidad debe acompañarse de código de solución real, no de recomendaciones genéricas como "usar HTTPS" o "validar inputs".

## Regla 3 — CLASIFICACIÓN OBLIGATORIA
Todo hallazgo DEBE tener una de estas etiquetas:
- 🔴 CRÍTICO: pérdida de datos, caída del sitio, brecha de seguridad
- 🟠 ALTO: afecta gravemente funcionalidad principal
- 🟡 MEDIO: problema notable con workaround
- 🟢 BAJO: mejora cosmética o de calidad de vida

## Regla 4 — NO DEJAR ÁREAS SIN CUBRIR
Se deben auditar TODOS los módulos del stack:
Frontend (React/TSX), servicios (services/), auth, BD (Supabase + FDW GELITE), APIs externas (Groq, Evolution, Gmail, GDrive, Romexis).

## Regla 5 — ACTUALIZAR CHECKPOINT SIEMPRE
Al final de cada bloque de trabajo, CHECKPOINT.md debe reflejar exactamente qué se ha auditado y qué queda pendiente.
