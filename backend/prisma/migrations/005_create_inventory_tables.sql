-- ─── Inventario: productos, lotes y movimientos de stock ─────────────────────
-- Ejecutar en la BBDD PostgreSQL (VPS Hostinger) con usuario smilestudio.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Productos del catálogo de la clínica
CREATE TABLE IF NOT EXISTS products (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    sku         TEXT        NOT NULL UNIQUE,
    category    TEXT        NOT NULL DEFAULT 'Desechable',
    min_reorder INT         NOT NULL DEFAULT 10,
    active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lotes de cada producto (trazabilidad FEFO)
CREATE TABLE IF NOT EXISTS lots (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_number  TEXT        NOT NULL,
    expiry_date TIMESTAMPTZ,
    quantity    INT         NOT NULL DEFAULT 0,
    location    TEXT        NOT NULL DEFAULT 'Almacén Central',
    status      TEXT        NOT NULL DEFAULT 'OK',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Movimientos de stock (trazabilidad completa)
CREATE TABLE IF NOT EXISTS stock_movements (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products(id),
    lot_id      UUID        REFERENCES lots(id),
    type        TEXT        NOT NULL CHECK (type IN ('in','out','adjustment')),
    quantity    INT         NOT NULL,
    reason      TEXT,
    user_id     UUID        REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lots_product_id       ON lots(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_product_id  ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at  ON stock_movements(created_at DESC);

-- Trigger updated_at en products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo — productos típicos de clínica dental
INSERT INTO products (name, sku, category, min_reorder) VALUES
    ('Guantes nitrilo S',          'GLOV-NIT-S',   'EPI',             100),
    ('Guantes nitrilo M',          'GLOV-NIT-M',   'EPI',             100),
    ('Guantes nitrilo L',          'GLOV-NIT-L',   'EPI',             100),
    ('Mascarillas FFP2',           'MASK-FFP2',     'EPI',              50),
    ('Implante Nobel Active 3.5',  'IMP-NA-35',     'Implante',          5),
    ('Implante Nobel Active 4.0',  'IMP-NA-40',     'Implante',          5),
    ('Anestesia Articaína 4%',     'ANES-ART-4',    'Farmacia',         20),
    ('Composite A2 jeringa 4g',    'COMP-A2-4G',    'Material clínico', 10),
    ('Hilo de sutura 3/0 seda',    'SUT-30-SEDA',   'Quirúrgico',       10),
    ('Gasas estériles 10x10',      'GASA-10X10',    'Desechable',       50)
ON CONFLICT (sku) DO NOTHING;
