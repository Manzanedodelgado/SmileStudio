# 04_CODIGO_NO_CLARO.md — Lista de [REVIEW] para Revisión Humana

> Esta lista contiene código o decisiones que requieren validación humana antes de actuar.
> **Regla aplicada: Regla 2 (Honestidad absoluta)**

---

## Formato:
Cada item está marcado con `[REVIEW]` e indica exactamente qué necesita revisión.

---

## [REVIEW-001] — SaraConfig.tsx: ¿Qué debería hacer este componente?

- **Archivo:** `views/ia/SaraConfig.tsx` (138 bytes)
- **Duda:** El archivo tiene solo 138 bytes lo que sugiere que está vacío o es un stub. No aparece como subárea en `navigation.ts`. Sin embargo, el nombre sugiere que fue diseñado para configurar "Sara AI" (la IA de WhatsApp).
- **Pregunta para el humano:** ¿Debería este componente ser la configuración del chatbot de WhatsApp (SARA)? ¿O es un archivo que se puede eliminar?
- **Impacto si se elimina sin verificar:** Ninguno visible (no está en el router de navegación), pero podría ser referenciado desde otro archivo no analizado.
- **Acción sugerida:** Abrir el archivo y ver su contenido. Si es un stub `export default () => null`, se puede eliminar.

---

## [REVIEW-002] — AutomationRules, FlowsView, AutomationEditor: ¿Datos reales o mock?

- **Archivos:**
  - `views/ia/AutomationRules.tsx` (26.183 bytes)
  - `views/ia/FlowsView.tsx` (6.454 bytes)
  - `views/ia/AutomationEditor.tsx` (9.444 bytes)
- **Duda:** No están conectados a ningún servicio backend identificado en el análisis. Pueden estar usando datos hardcoded/mock para la demo.
- **Pregunta para el humano:** ¿Estas vistas son funcionales (guardan reglas/flujos reales en BD) o son prototipos visuales?
- **Impacto:** Si son prototipos, no hay backend que conectar. Si son features reales, falta el servicio backend.
- **Acción sugerida:** Abrir cada archivo y buscar llamadas a servicios o datos hardcoded.

---

## [REVIEW-003] — getHistorialCitasPaciente: Alias deprecado con callers desconocidos

- **Archivo:** `services/citas.service.ts` (líneas 453-459)
- **Código:**
  ```typescript
  export const getHistorialCitasPaciente = async (
      _apellidos: string,
      _nombre: string,
      idPac?: number
  ): Promise<SOAPNote[]> => {
      if (idPac) return getEntradasMedicas(idPac);
      return []; // ← silencioso si no hay idPac
  };
  ```
- **Duda:** Esta función está documentada como "alias de compatibilidad". Si algún componente la llama sin `idPac`, devuelve `[]` silenciosamente sin ningún warning. Esto puede hacer que la historia clínica aparezca vacía sin que el usuario sepa por qué.
- **Pregunta para el humano:** ¿Hay componentes que llamen a `getHistorialCitasPaciente` sin pasar `idPac`? Si es así, el historial clínico puede estar mostrando vacío en producción.
- **Acción sugerida:** `grep -r "getHistorialCitasPaciente"` en el proyecto para verificar todos los callers.

---

## [REVIEW-004] — Archivos de datos gigantes en el raíz del proyecto

- **Archivos:**
  - `DATOS_50_TABLAS_CORE.md` — 88MB
  - `DATOS_COMPLETOS_BBDD_SQL.md` — 100MB
  - `final_rest_migration3.log` — 8.7MB
  - `final_rest_migration4.log` — 8.7MB
  - `rest_migration5.log` — 1.4MB
- **Duda:** Estos archivos no afectan el bundle de producción pero sí al repositorio Git. Un `git clone` descarga ~200MB extra innecesarios.
- **Pregunta para el humano:** ¿Están estos archivos en `.gitignore`? Si no lo están, el repositorio es muy pesado. ¿Se pueden mover a un directorio separado o eliminar del tracking de Git?
- **Acción sugerida:** Verificar `.gitignore` y añadir patrones para `*.log`, archivos `DATOS_*.md`, y scripts de migración si ya no son necesarios.

---

## [REVIEW-005] — supabase.service.ts usa su propio SUPABASE_MIGRATION_SQL

- **Archivo:** `services/supabase.service.ts` (líneas 42-76)
- **Código:** El archivo exporta una constante `SUPABASE_MIGRATION_SQL` con el SQL para crear las tablas `patient_medications` y `patient_allergies`.
- **Duda:** Esta constante está en un archivo de servicio frontend. ¿Se usa realmente desde el frontend para ejecutar migraciones? Eso sería una práctica poco segura (exponer DDL en el bundle del cliente).
- **Pregunta para el humano:** ¿Dónde se usa `SUPABASE_MIGRATION_SQL`? Si no se usa desde el frontend y es solo documentación inline, debería moverse a los archivos `.sql` de migración.
- **Acción sugerida:** `grep -r "SUPABASE_MIGRATION_SQL"` para verificar si se importa en algún componente.

---

## [REVIEW-006] — invoice-parser.service.ts y gdrive.service.ts — ¿están en uso?

- **Archivos:**
  - `services/invoice-parser.service.ts` (22.472 bytes — el más grande de todos los servicios)
  - `services/gdrive.service.ts` (6.065 bytes)
  - `services/gmail.service.ts` (18.408 bytes)
  - `services/romexis.service.ts` (4.849 bytes)
- **Duda:** No se ha verificado cuáles vistas importan estos servicios. Especialmente `invoice-parser.service.ts` (22KB) que es inusualmente grande — si no se usa, es peso muerto en el bundle.
- **Pregunta para el humano:** ¿Están activos `gmail`, `gdrive`, `romexis` e `invoice-parser`? ¿Desde qué vista se usan?
- **Acción sugerida:** Analizar `Gestoria.tsx` y `views/ia/DocumentosClinica.tsx` para ver qué servicios importan.

---

## Estado General de REVIEWs

| ID | Estado | Bloqueante | Quién debe decidir |
|----|--------|-----------|-------------------|
| REVIEW-001 | ⏳ Abierto | No | Humano (Juan Antonio) |
| REVIEW-002 | ⏳ Abierto | No | Humano — ¿features reales o prototipo? |
| REVIEW-003 | ⏳ Abierto | **Sí** — posible bug de historial vacío | Desarrollador |
| REVIEW-004 | ⏳ Abierto | No | Humano — política de repositorio |
| REVIEW-005 | ⏳ Abierto | No | Desarrollador |
| REVIEW-006 | ⏳ Abierto | No | Humano — ¿qué está activo? |
