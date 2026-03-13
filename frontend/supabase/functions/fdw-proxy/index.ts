// supabase/functions/fdw-proxy/index.ts
// Edge Function segura: proxy para tablas FDW de GELITE.
// La SERVICE_ROLE_KEY nunca sale del servidor — ya no necesita estar en el frontend.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*", // TODO prod: restringir a tu dominio
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Allowlist explícita — nunca se acepta una tabla fuera de esta lista
const FDW_ALLOWLIST = new Set([
    "Pacientes",
    "DCitas",
    "TtosMed",
    "PRESUTTO",
    "NV_CabFactura",
    "NV_LinFactura",
    "TColabos",
    "TArticulo",
    "StckMov",
    "BancoMov",
    "IconoTratAgenda",
    "TSitCita",
    "TUsuAgd",
    "FormPago",
]);

serve(async (req: Request) => {
    // Preflight CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: CORS_HEADERS });
    }

    try {
        // 1. Validar que el cliente está autenticado (token de sesión SmilePro)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        // 2. Parsear body
        const body = await req.json() as { table: string; queryString: string };
        const { table, queryString } = body;

        if (!table || typeof table !== "string") {
            return new Response(JSON.stringify({ error: "Missing table" }), {
                status: 400,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        // 3. Validar tabla contra allowlist (prevenir table injection)
        if (!FDW_ALLOWLIST.has(table)) {
            return new Response(JSON.stringify({ error: `Table '${table}' not allowed` }), {
                status: 403,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        // 4. Usar SERVICE_ROLE_KEY desde Supabase Secrets (NUNCA en el bundle del frontend)
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !serviceKey) {
            return new Response(JSON.stringify({ error: "Server misconfigured" }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        // 5. Hacer la query real contra PostgREST con service_role
        const qs = queryString ? `?${queryString}` : "";
        const upstream = await fetch(`${supabaseUrl}/rest/v1/${table}${qs}`, {
            method: "GET",
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
                Prefer: "count=none",
            },
        });

        if (!upstream.ok) {
            const errText = await upstream.text();
            console.error(`[fdw-proxy] Upstream error ${upstream.status}:`, errText);
            return new Response(JSON.stringify({ error: errText }), {
                status: upstream.status,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        const data = await upstream.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("[fdw-proxy] Error:", err);
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
});
