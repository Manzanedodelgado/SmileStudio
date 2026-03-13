# 02C_FORMULARIOS.md — Validaciones y Envíos

---

## Formulario: Login

**Archivo:** `views/Login.tsx`

| Campo | Validación client-side | Validación server-side |
|-------|----------------------|----------------------|
| Username | ⚠️ Sin verificar | ✅ RPC valida |
| Password | ⚠️ Sin verificar | ✅ RPC valida |
| Intento fallido | ❌ SIN BLOQUEO | ❌ SIN RATE LIMIT |

**Hallazgo:** Sin indicador de intentos restantes ni tiempo de bloqueo.

---

## Formulario: Nuevo Paciente

**Archivo:** `services/pacientes.service.ts` → `createPaciente()`

```typescript
export const createPaciente = async (data: Partial<Paciente>): Promise<Paciente | null> => {
    return dbInsert<Paciente>('Pacientes', data);
    // ← Sin validación de campos obligatorios antes del INSERT
};
```

**Campos sin validación:**
- 🔴 `NumPac`: ¿puede ser duplicado? ¿quién genera el ID?
- 🔴 `Apellidos`/`Nombre`: ¿pueden estar vacíos?
- 🟡 `TelMovil`: ¿formato de teléfono validado?
- 🟡 `FechaNac`: ¿fechas futuras posibles?

**Solución:**
```typescript
const validatePaciente = (data: Partial<Paciente>): string[] => {
    const errors: string[] = [];
    if (!data.Apellidos?.trim()) errors.push('Apellidos es obligatorio');
    if (!data.Nombre?.trim()) errors.push('Nombre es obligatorio');
    if (data.TelMovil && !/^\+?[0-9]{9,15}$/.test(data.TelMovil)) 
        errors.push('Teléfono inválido');
    if (data.FechaNac && new Date(data.FechaNac) > new Date()) 
        errors.push('Fecha de nacimiento no puede ser futura');
    return errors;
};
```

---

## Formulario: AutomationEditor

**Archivo:** `views/ia/AutomationEditor.tsx`

```typescript
// Validación detectada (tras fix INT-008):
const isEmpty = !formData.name.trim() || !formData.description.trim() ||
    !formData.trigger.trim() || !formData.message.trim();
// Botón deshabilitado si isEmpty ✅
```

**Estado:** ✅ Validación básica presente.
**Mejora:** No valida longitud máxima de campos (mensajes de 10.000 chars podrían saturar BD).

---

## Formulario: SOAPEditor (Notas Médicas)

**Archivo:** `components/pacientes/SOAPEditor.tsx` (23.7KB)

**Hallazgos esperados (pendiente de análisis profundo):**
- ¿Validación de longitud de texto SOAP?
- ¿Se puede guardar un SOAP note sin ningún campo?
- ¿Los emojis/chars especiales en notas médicas se guardan correctamente?

**Clasificación:** 🟡 MEDIO — Pendiente de revisión detallada.

---

## Formulario: Consentimientos (Documentos.tsx)

**Archivo:** `components/pacientes/Documentos.tsx`

```typescript
// FIRMA COMPLETAMENTE MOCK — no hay formulario real
const handleSign = () => {
    setDocs(updatedDocs); // Solo en state local
    onDocumentSigned(); // Callback sin persistencia
};
```

**Clasificación:** 🔴 CRÍTICO — Sin persistencia real de consentimientos. Invalido legalmente.
