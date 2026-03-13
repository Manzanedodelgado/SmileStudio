-- ═══════════════════════════════════════════════════════════════════
-- FIX AUDIT VLN-001: UNIQUE constraint citas_web para evitar doble booking
-- FIX AUDIT VLN-002: ON CONFLICT DO UPDATE en odontograma_web
-- FIX AUDIT: RPC reserve_slot con pessimistic locking
-- FIX AUDIT: RLS audit_log
-- EJECUTAR EN: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════
-- ─── VLN-001: UNIQUE constraint en citas_web ─────────────────────
-- Evita que dos usuarios reserven el mismo slot simultáneamente
ALTER TABLE citas_web
ADD CONSTRAINT IF NOT EXISTS uq_slot_gabinete UNIQUE (fecha, hora, gabinete)
WHERE deleted = false;
-- Índices necesarios para performance
CREATE INDEX IF NOT EXISTS idx_citas_web_fecha ON citas_web(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_web_gabinete ON citas_web(gabinete);
CREATE INDEX IF NOT EXISTS idx_citas_web_deleted ON citas_web(deleted);
-- ─── VLN-001: RPC reserve_slot con pessimistic locking ───────────
CREATE OR REPLACE FUNCTION public.reserve_slot(
        p_num_pac TEXT,
        p_nombre TEXT,
        p_fecha DATE,
        p_hora TIME,
        p_duracion INT,
        p_tratamiento TEXT,
        p_doctor TEXT,
        p_gabinete TEXT,
        p_notas TEXT DEFAULT ''
    ) RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_existing citas_web %ROWTYPE;
v_new citas_web %ROWTYPE;
BEGIN -- Pessimistic lock: bloquea si ya existe una cita en ese slot
SELECT * INTO v_existing
FROM citas_web
WHERE fecha = p_fecha
    AND hora = p_hora
    AND gabinete = p_gabinete
    AND deleted = false FOR
UPDATE;
IF FOUND THEN RETURN json_build_object(
    'error',
    'Slot ya reservado',
    'existing_id',
    v_existing.id
);
END IF;
INSERT INTO citas_web (
        num_pac,
        nombre,
        fecha,
        hora,
        duracion_min,
        tratamiento,
        doctor,
        gabinete,
        notas,
        estado,
        deleted
    )
VALUES (
        p_num_pac,
        p_nombre,
        p_fecha,
        p_hora,
        p_duracion,
        p_tratamiento,
        p_doctor,
        p_gabinete,
        p_notas,
        'planificada',
        false
    )
RETURNING * INTO v_new;
RETURN json_build_object(
    'id',
    v_new.id,
    'fecha',
    v_new.fecha,
    'hora',
    v_new.hora,
    'gabinete',
    v_new.gabinete
);
END;
$$;
-- ─── VLN-002: Función upsert para odontograma (atómica) ──────────
CREATE OR REPLACE FUNCTION public.upsert_odontograma(p_num_pac TEXT, p_datos JSONB) RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_row odontograma_web %ROWTYPE;
BEGIN
INSERT INTO odontograma_web (num_pac, datos)
VALUES (p_num_pac, p_datos) ON CONFLICT (num_pac) DO
UPDATE
SET datos = EXCLUDED.datos,
    updated_at = now()
RETURNING * INTO v_row;
RETURN json_build_object('id', v_row.id, 'updated_at', v_row.updated_at);
END;
$$;
-- ─── VLN-004: Trigger para reversión de stock al cancelar cita ────
CREATE TABLE IF NOT EXISTS stock_reversiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    pendiente_revision BOOLEAN NOT NULL DEFAULT true,
    notas TEXT
);
CREATE OR REPLACE FUNCTION public.on_cita_cancelled() RETURNS TRIGGER AS $$ BEGIN -- Solo si cambia de 'iniciada' a 'anulada'
    IF NEW.estado = 'anulada'
    AND OLD.estado IN ('iniciada', 'confirmada') THEN
INSERT INTO stock_reversiones (cita_id, created_at, pendiente_revision, notas)
VALUES (
        NEW.id,
        now(),
        true,
        'Cita cancelada — revisar stock GELITE'
    );
PERFORM pg_notify('stock_reversion', row_to_json(NEW)::text);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_cita_cancelled ON citas_web;
CREATE TRIGGER trg_cita_cancelled
AFTER
UPDATE OF estado ON citas_web FOR EACH ROW EXECUTE FUNCTION public.on_cita_cancelled();
-- ─── RLS audit_log: solo admin puede leer ─────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_admin_select ON audit_log;
DROP POLICY IF EXISTS audit_insert_all ON audit_log;
-- Insert permitido a todos (fire-and-forget del servicio)
CREATE POLICY audit_insert_all ON audit_log FOR
INSERT WITH CHECK (true);
-- Select solo admin (mediante app_users.rol)
CREATE POLICY audit_admin_select ON audit_log FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM app_users
            WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
                AND rol = 'admin'
        )
    );
-- ─── Índice num_pac en odontograma_web (necesario) ────────────────
CREATE INDEX IF NOT EXISTS idx_odontograma_num_pac ON odontograma_web(num_pac);
-- ─── Recarga schema ───────────────────────────────────────────────
NOTIFY pgrst,
'reload schema';
SELECT 'FIXES VLN-001, VLN-002, VLN-004, RLS aplicados' AS status;