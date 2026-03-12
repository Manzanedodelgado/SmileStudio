-- ─────────────────────────────────────────────────────────────────
-- TABLA: presupuestos_estados_web
-- Almacena el estado de aceptación/rechazo de presupuestos desde SmilePro.
-- El FDW GELITE (PRESUTTO) es solo lectura, por eso los cambios de estado
-- se registran aquí y GELITE puede consultarlos via webhook o sincroniación manual.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS presupuestos_estados_web (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pre integer NOT NULL,
    -- FK PRESUTTO.IdPre
    num_pac text NOT NULL,
    -- NumPac del paciente
    estado text NOT NULL -- Aceptado / Rechazado / En curso / etc.
    CHECK (
        estado IN ('Aceptado', 'Rechazado', 'En curso', 'Caducado')
    ),
    fecha_aceptacion date,
    -- Fecha en que se aceptó (si aplica)
    aceptado_por text,
    -- email del usuario que ejecutó la acción
    created_at timestamptz DEFAULT now()
);
-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_presupuestos_estados_id_pre ON presupuestos_estados_web (id_pre);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estados_num_pac ON presupuestos_estados_web (num_pac);
-- RLS: solo usuarios autenticados pueden leer/escribir
ALTER TABLE presupuestos_estados_web ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read presupuestos_estados" ON presupuestos_estados_web FOR
SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert presupuestos_estados" ON presupuestos_estados_web FOR
INSERT TO authenticated WITH CHECK (true);
-- Comentarios
COMMENT ON TABLE presupuestos_estados_web IS 'Override de estados de presupuestos GELITE. El FDW PRESUTTO es read-only; ' 'los cambios de estado desde SmilePro Web se registran aquí.';