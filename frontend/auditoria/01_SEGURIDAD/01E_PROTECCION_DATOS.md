# 01E_PROTECCION_DATOS.md — RGPD, Privacidad y Datos Médicos

> Categoría especial de datos: Art. 9 RGPD (datos de salud)
> Multas potenciales: hasta 4% de facturación anual o 20M€

---

## Contexto Legal

SmilePro maneja:
- **Datos de categoría especial** (Art. 9 RGPD): historial médico, diagnósticos, tratamientos
- **Datos personales básicos**: nombre, DNI, teléfono, correo
- **Datos financieros**: facturas, cobros, deudas
- **Datos biométricos potenciales**: radiografías (Romexis), fotos clínicas (GDrive)

---

## Hallazgo 1 — Radiografías en URLs externas sin autenticación 🔴

**Archivo:** `services/romexis.service.ts`
```typescript
// Mock data (líneas 42-59):
url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Panoramic_dental_X-ray.jpg',
thumbnail: 'https://...jpg',
```

**Cuando Romexis real está configurado (líneas 110-114):**
```typescript
const res = await fetch(`${ROMEXIS_ENDPOINT}/api/patients/${romexisId}/images`, {
    headers: { 'X-API-Key': ROMEXIS_KEY! },
});
// Las URLs devueltas por Romexis... ¿requieren autenticación para acceder?
// Si son URLs públicas de imágenes, cualquiera con el link ve las RX del paciente.
```

**Clasificación:** 🔴 CRÍTICO — Si las URLs de imágenes son públicas, viola el Art. 9 RGPD.

**Solución requerida:** Las URLs de radiografías deben ser signed URLs con expiración:
```typescript
// La Edge Function de Supabase debe generar Signed URLs
const { data } = await supabase.storage
    .from('rx-pacientes')
    .createSignedUrl(`${patientId}/panoramica.jpg`, 60); // 60 segundos
```

---

## Hallazgo 2 — Fotos clínicas en Google Drive sin control RGPD 🔴

**Archivo:** `services/gdrive.service.ts`
```typescript
url: `https://drive.google.com/uc?id=${f.id}&export=view&key=${GDRIVE_API_KEY}`,
```

**Problemas:**
1. Google (empresa USA) procesa datos médicos → transferencia internacional de datos (Art. 44-49 RGPD)
2. Requiere DPA (Data Processing Agreement) con Google
3. Las URLs con API key exponen las fotos a cualquiera con el link

**Clasificación:** 🔴 CRÍTICO

---

## Hallazgo 3 — Gmail procesa datos médicos (facturas con info de pacientes) 🟠

**Archivo:** `services/gmail.service.ts`
El extractor de facturas de Gmail accede a correos que pueden contener información de pacientes. Google procesa estos correos.

**Solución:** Documentar en el Registro de Actividades (Art. 30 RGPD) el papel de Google como encargado del tratamiento.

---

## Hallazgo 4 — Audit Trail incompleto 🟠

**Archivo:** `services/audit.service.ts`

**Acciones auditadas:**
```typescript
// ✅ VIEW_HISTORIA_CLINICA
// ✅ LOGIN (implícito)
```

**Acciones NO auditadas:**
```typescript
// ❌ Búsqueda de pacientes (getPacientes)
// ❌ Listado de citas (getCitas)
// ❌ Exportación CSV de Gestoría
// ❌ Acceso a facturas
// ❌ Modificación de medicaciones/alergias
// ❌ Acceso a radiografías Romexis
// ❌ Acceso a fotos clínicas GDrive
```

**Clasificación:** 🟠 ALTO — El Delegado de Protección de Datos necesita estos registros.

---

## Hallazgo 5 — Sin política de retención de datos 🟡

No se ha detectado ningún mecanismo de purga automática de:
- Chat history de IA (tabla `chat_history`)
- Audit logs
- Tokens de sesión expirados

**Solución:** Supabase permite pg_cron para purgar datos con retención:
```sql
-- Borrar chat history > 1 año
SELECT cron.schedule('purge-chat-history', '0 2 * * 0',
    'DELETE FROM chat_history WHERE created_at < NOW() - INTERVAL ''1 year''');
```

---

## Hallazgo 6 — Consentimientos en Documentos.tsx son mock 🟠

**Archivo:** `components/pacientes/Documentos.tsx`
```typescript
// Línea 42: la firma es completamente simulada
const handleSign = () => {
    const updatedDocs = docs.map(d =>
        d.id === signingDoc.id
            ? { ...d, estado: 'Firmado' as const, firmante: 'Bárbara Ruiz (Biométrico)' }
            : d
    );
    setDocs(updatedDocs); // Solo en estado local, NO persiste en BD
```

**Impacto RGPD:** Los consentimientos informados (Art. 7, Art. 9) deben persistir con fecha, contenido y firma real. Esta implementación mock no es válida legalmente.

**Clasificación:** 🔴 CRÍTICO para cumplimiento legal.

**Solución:**
```typescript
// Usar una tabla de firmas en Supabase
const signDocument = async (docId: string, patientId: string) => {
    await dbInsert('document_signatures', {
        document_id: docId,
        patient_id: patientId,
        signed_at: new Date().toISOString(),
        ip_address: await getClientIP(),
        document_hash: await sha256(documentContent), // Integridad
    });
};
```
