-- ─────────────────────────────────────────────────────────────────
-- SPRINT 11: Sección N+1 de NumPac para contactos SmilePro
--
-- Los NumPac asignados por SmilePro tienen el formato 'SP-NNNN'.
-- Si el paciente ya existe en GELITE, ese NumPac prevalece sobre el SP-NNNN.
--
-- EJECUTAR EN SUPABASE SQL EDITOR (antes de create_contactos.sql)
-- ─────────────────────────────────────────────────────────────────
-- ── Secuencia ──────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS numpac_sp_seq START WITH 1 INCREMENT BY 1 NO MAXVALUE CACHE 1;
-- ── Registro de NumPacs asignados ──────────────────────────────────
CREATE TABLE IF NOT EXISTS numpac_registry (
    num_pac TEXT PRIMARY KEY,
    -- 'SP-0001', 'SP-0002', ...
    id_pac BIGINT UNIQUE NOT NULL,
    -- Secuencial numérico correlativo
    contacto_id UUID REFERENCES contactos(id) ON DELETE
    SET NULL,
        gelite_num_pac TEXT,
        -- Si se descubre que existe en GELITE, se rellena aquí
        migrado_gelite BOOLEAN NOT NULL DEFAULT FALSE,
        -- TRUE cuando se vincula al NumPac GELITE
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_numpac_registry_contacto ON numpac_registry(contacto_id);
CREATE INDEX IF NOT EXISTS idx_numpac_registry_gelite ON numpac_registry(gelite_num_pac)
WHERE gelite_num_pac IS NOT NULL;
-- ── RLS ────────────────────────────────────────────────────────────
ALTER TABLE numpac_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_crud_numpac" ON numpac_registry FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ── Función auxiliar: asignar el siguiente NumPac ─────────────────
-- Usar SECURITY DEFINER para que anon no pueda llamarla directamente.
CREATE OR REPLACE FUNCTION asignar_numpac(p_contacto_id UUID) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id_pac BIGINT;
v_num_pac TEXT;
BEGIN -- Evitar asignar dos veces al mismo contacto
SELECT num_pac INTO v_num_pac
FROM numpac_registry
WHERE contacto_id = p_contacto_id;
IF v_num_pac IS NOT NULL THEN RETURN v_num_pac;
END IF;
-- Tomar el siguiente valor de la secuencia
SELECT nextval('numpac_sp_seq') INTO v_id_pac;
v_num_pac := 'SP-' || lpad(v_id_pac::TEXT, 4, '0');
INSERT INTO numpac_registry (num_pac, id_pac, contacto_id)
VALUES (v_num_pac, v_id_pac, p_contacto_id);
-- Actualizar también el campo num_pac en contactos
UPDATE contactos
SET num_pac = v_num_pac,
    id_pac = v_id_pac::TEXT,
    updated_at = NOW()
WHERE id = p_contacto_id;
RETURN v_num_pac;
END;
$$;
-- ── Función para vincular SP-NNNN con NumPac GELITE ───────────────
CREATE OR REPLACE FUNCTION vincular_numpac_gelite(p_contacto_id UUID, p_gelite_num_pac TEXT) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE numpac_registry
SET gelite_num_pac = p_gelite_num_pac,
    migrado_gelite = TRUE
WHERE contacto_id = p_contacto_id;
-- El NumPac GELITE sustituye al SP-NNNN como identificador principal
UPDATE contactos
SET num_pac = p_gelite_num_pac,
    updated_at = NOW()
WHERE id = p_contacto_id;
END;
$$;
-- ── Vista de verificación ─────────────────────────────────────────
-- SELECT n.num_pac, n.id_pac, c.nombre, c.apellidos, c.telefono, n.migrado_gelite
-- FROM numpac_registry n JOIN contactos c ON n.contacto_id = c.id
-- ORDER BY n.id_pac DESC LIMIT 20;