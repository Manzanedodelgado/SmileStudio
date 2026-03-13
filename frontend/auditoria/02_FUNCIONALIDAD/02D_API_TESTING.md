# 02D_API_TESTING.md — Endpoints y Respuestas

---

## API Interna: Supabase REST v1

### Endpoint: `POST /rest/v1/rpc/app_login`
```
Input:  { p_username: string, p_password: string }
Output esperado: { token: string, role: string, user_id: string }
Output en error: { message: "Credenciales incorrectas" }

Pruebas:
- ✅ Credenciales válidas → token devuelto
- ⚠️ Usuario no existe → ¿error genérico o específico? (user enumeration risk)
- ❌ Rate limiting → SIN LÍMITE (ya documentado)
- ⚠️ p_username con SQL injection → depende del RPC SQL (sin verificar)
```

**Riesgo de enumeración de usuarios:** Si el mensaje de error es diferente para "usuario no existe" vs "password incorrecta", un atacante puede determinar qué usernames son válidos.

**Solución:**
```sql
-- El RPC siempre debe devolver el mismo mensaje:
RAISE EXCEPTION 'Credenciales incorrectas'; -- NUNCA diferenciar
```

---

### Endpoints FDW (Foreign Tables)
```
GET /rest/v1/DCitas?NumPac=eq.XXX
GET /rest/v1/Pacientes?select=*
GET /rest/v1/TtosMed?IdPac=eq.XXX
GET /rest/v1/NV_CabFactura?select=*
```

**Problema:** Sin RLS en foreign tables, estos endpoints devuelven ALL ROWS a cualquier usuario con el anon key.

---

## API Externa: Groq

```
POST https://api.groq.com/openai/v1/chat/completions
Headers: Authorization: Bearer VITE_GROQ_API_KEY
```

**Hallazgo:** La API key de Groq está en VITE_GROQ_API_KEY → en el bundle JS → accesible públicamente.

**Clasificación:** 🔴 CRÍTICO — Un atacante usa tu API key para generar contenido free.

**Solución:** Todas las llamadas a APIs con key privada deben pasar por una Edge Function:
```typescript
// supabase/functions/groq-proxy/index.ts
Deno.serve(async (req) => {
    const body = await req.json();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`, // SEGURO
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return new Response(await res.text(), { headers: { 'Content-Type': 'application/json' }});
});
```

---

## API Externa: Evolution API (WhatsApp)

```
POST ${EVOLUTION_URL}/message/sendText/${INSTANCE}
Headers: apikey: VITE_EVOLUTION_API_KEY
```

**Hallazgo:** API key de Evolution expuesta en bundle.
**Clasificación:** 🟠 ALTO — Permite enviar mensajes WhatsApp a nombre de la clínica.

---

## API Externa: Romexis

```
GET ${ROMEXIS_ENDPOINT}/api/patients/${romexisId}/images
Headers: X-API-Key: VITE_ROMEXIS_KEY
```

**Hallazgo:** API key en bundle. Acceso potencial a radiografías de pacientes.
**Clasificación:** 🔴 CRÍTICO — Datos médicos.

---

## Resumen de API Keys expuestas en bundle:

| Variable | API | Clasificación |
|----------|-----|--------------|
| VITE_GROQ_API_KEY | Groq AI | 🔴 CRÍTICO |
| VITE_GMAIL_CLIENT_SECRET | Gmail OAuth2 | 🔴 CRÍTICO |  
| VITE_ROMEXIS_KEY | Radiografías | 🔴 CRÍTICO |
| VITE_EVOLUTION_API_KEY | WhatsApp | 🟠 ALTO |
| VITE_GDRIVE_API_KEY | Google Drive | 🟠 ALTO |
| VITE_SUPABASE_ANON_KEY | Supabase | 🟡 MEDIO (por diseño) |
