-- ─────────────────────────────────────────────────────────────────
-- ARQ-01 FIX: RPC para reservar hueco de cita de forma atómica.
-- Ejecutar en Supabase SQL Editor.
--
-- Garantía: dos recepcionistas simultáneas NO pueden crear doble reserva.
-- El advisory lock serializa los writes del mismo gabinete+fecha.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reservar_hueco_cita(
        p_cita_id UUID,
        p_gabinete TEXT,
        p_fecha DATE,
        p_hora_inicio TEXT,
        -- 'HH:MM'
        p_duracion_min INTEGER
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE conflicto_count INTEGER;
hora_inicio_ts TIME;
hora_fin_ts TIME;
BEGIN -- Convertir texto a TIME para comparar correctamente
hora_inicio_ts := p_hora_inicio::TIME;
hora_fin_ts := hora_inicio_ts + (p_duracion_min || ' minutes')::INTERVAL;
-- Advisory lock por gabinete+fecha — serializa writes concurrentes
PERFORM pg_advisory_xact_lock(hashtext(p_gabinete || p_fecha::TEXT));
-- Verificar solapamiento dentro de la transacción locked
SELECT COUNT(*) INTO conflicto_count
FROM citas_web
WHERE gabinete = p_gabinete
    AND fecha = p_fecha
    AND id != p_cita_id
    AND estado NOT IN ('anulada', 'cancelada')
    AND NOT (
        -- La cita existente empieza DESPUÉS de que termina la nueva
        hora_inicio::TIME >= hora_fin_ts
        OR -- La cita existente termina ANTES de que empiece la nueva
        (
            hora_inicio::TIME + (duracion_minutos || ' minutes')::INTERVAL
        ) <= hora_inicio_ts
    );
IF conflicto_count > 0 THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'CONFLICTO: el hueco ya está ocupado',
    'code',
    'SLOT_TAKEN'
);
END IF;
-- Actualizar la cita de forma atómica
UPDATE citas_web
SET hora_inicio = p_hora_inicio,
    gabinete = p_gabinete,
    fecha = p_fecha,
    updated_at = NOW()
WHERE id = p_cita_id;
RETURN jsonb_build_object('success', true);
END;
$$;
-- Dar permiso de ejecución al rol anon (llamada desde Edge Function o frontend autenticado)
GRANT EXECUTE ON FUNCTION reservar_hueco_cita TO anon;
GRANT EXECUTE ON FUNCTION reservar_hueco_cita TO authenticated;