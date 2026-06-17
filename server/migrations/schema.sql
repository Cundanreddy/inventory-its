-- ============================================================
--  OFFICE INVENTORY TRACKING SYSTEM
--  Complete PostgreSQL Schema — v1.0
--  Run order: top to bottom (respects FK dependencies)
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(100) NOT NULL,
    email                   VARCHAR(150) NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,
    role                    VARCHAR(20)  NOT NULL DEFAULT 'staff'
                                CHECK (role IN ('admin','staff','auditor')),
    phone                   VARCHAR(20),
    department              VARCHAR(100),
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at           TIMESTAMP,
    failed_login_attempts   INTEGER      NOT NULL DEFAULT 0,
    locked_until            TIMESTAMP,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20)  NOT NULL CHECK (type IN ('asset','consumable')),
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (name, type)
);

-- ─────────────────────────────────────────────
-- 3. LOCATIONS
-- ─────────────────────────────────────────────
CREATE TABLE locations (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    building    VARCHAR(100) NOT NULL,
    room        VARCHAR(100) NOT NULL,
    notes       TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (building, room)
);

-- ─────────────────────────────────────────────
-- 4. SUPPLIERS
-- ─────────────────────────────────────────────
CREATE TABLE suppliers (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL UNIQUE,
    contact_person  VARCHAR(100),
    email           VARCHAR(150),
    phone           VARCHAR(30),
    address         TEXT,
    website         VARCHAR(255),
    notes           TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. ASSETS
-- ─────────────────────────────────────────────
CREATE TABLE assets (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        VARCHAR(150)    NOT NULL,
    asset_tag                   VARCHAR(50)     UNIQUE,
    serial_number               VARCHAR(100)    UNIQUE,
    brand                       VARCHAR(100),
    model                       VARCHAR(100),

    category_id                 UUID            NOT NULL REFERENCES categories(id)  ON DELETE RESTRICT,
    location_id                 UUID            REFERENCES locations(id)             ON DELETE SET NULL,
    supplier_id                 UUID            REFERENCES suppliers(id)             ON DELETE SET NULL,

    purchase_date               DATE,
    purchase_price              DECIMAL(12,2),
    invoice_number              VARCHAR(100),
    warranty_expiry             DATE,

    status                      VARCHAR(20)     NOT NULL DEFAULT 'available'
                                    CHECK (status IN ('available','assigned','maintenance','retired','lost','disposed')),

    assigned_to                 UUID            REFERENCES users(id)                ON DELETE SET NULL,
    assigned_since              DATE,

    next_maintenance_date       DATE,
    maintenance_interval_days   INTEGER,

    photo_url                   VARCHAR(500),
    notes                       TEXT,
    is_active                   BOOLEAN         NOT NULL DEFAULT TRUE,

    created_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_status        ON assets(status);
CREATE INDEX idx_assets_category      ON assets(category_id);
CREATE INDEX idx_assets_location      ON assets(location_id);
CREATE INDEX idx_assets_assigned_to   ON assets(assigned_to);
CREATE INDEX idx_assets_warranty      ON assets(warranty_expiry);
CREATE INDEX idx_assets_maintenance   ON assets(next_maintenance_date);
CREATE INDEX idx_assets_fts           ON assets
    USING GIN (to_tsvector('english', name || ' ' || COALESCE(serial_number,'') || ' ' || COALESCE(asset_tag,'')));

-- ─────────────────────────────────────────────
-- 6. CONSUMABLES
-- ─────────────────────────────────────────────
CREATE TABLE consumables (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    sku              VARCHAR(80)     NOT NULL UNIQUE,
    name             VARCHAR(150)    NOT NULL,
    description      TEXT,

    category_id      UUID            NOT NULL REFERENCES categories(id)  ON DELETE RESTRICT,
    location_id      UUID            REFERENCES locations(id)             ON DELETE SET NULL,
    supplier_id      UUID            REFERENCES suppliers(id)             ON DELETE SET NULL,

    quantity         INTEGER         NOT NULL DEFAULT 0,
    min_threshold    INTEGER         NOT NULL DEFAULT 5,
    reorder_quantity INTEGER,
    unit             VARCHAR(50)     NOT NULL DEFAULT 'pcs',
    unit_cost        DECIMAL(10,2),
    expiry_date      DATE,

    photo_url        VARCHAR(500),
    notes            TEXT,
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,

    created_at       TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consumables_category ON consumables(category_id);
CREATE INDEX idx_consumables_location ON consumables(location_id);
CREATE INDEX idx_consumables_quantity ON consumables(quantity);
CREATE INDEX idx_consumables_fts      ON consumables
    USING GIN (to_tsvector('english', name || ' ' || sku));

-- ─────────────────────────────────────────────
-- 7. ASSIGNMENTS  (checkout / check-in)
-- ─────────────────────────────────────────────
CREATE TABLE assignments (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id           UUID        NOT NULL REFERENCES assets(id)  ON DELETE RESTRICT,
    user_id            UUID        NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,

    status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','approved','rejected','returned','overdue')),

    requested_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    approved_at        TIMESTAMP,
    rejected_at        TIMESTAMP,
    checked_out_at     TIMESTAMP,
    expected_return    DATE,
    returned_at        TIMESTAMP,

    approved_by        UUID        REFERENCES users(id) ON DELETE SET NULL,

    request_reason     TEXT,
    rejection_reason   TEXT,
    return_notes       TEXT,
    return_condition   VARCHAR(20) CHECK (return_condition IN ('good','damaged','lost')),

    created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_asset    ON assignments(asset_id);
CREATE INDEX idx_assignments_user     ON assignments(user_id);
CREATE INDEX idx_assignments_status   ON assignments(status);
CREATE INDEX idx_assignments_expected ON assignments(expected_return);

-- ─────────────────────────────────────────────
-- 8. STOCK TRANSACTIONS  (append-only ledger)
-- ─────────────────────────────────────────────
CREATE TABLE stock_transactions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    consumable_id       UUID            NOT NULL REFERENCES consumables(id) ON DELETE RESTRICT,

    type                VARCHAR(20)     NOT NULL
                            CHECK (type IN ('add','issue','adjustment','return','disposal')),

    quantity            INTEGER         NOT NULL,
    quantity_before     INTEGER         NOT NULL,
    quantity_after      INTEGER         NOT NULL,

    transacted_by       UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recipient           VARCHAR(150),
    department          VARCHAR(100),

    invoice_number      VARCHAR(100),
    unit_cost_at_time   DECIMAL(10,2),
    supplier_id         UUID            REFERENCES suppliers(id) ON DELETE SET NULL,

    notes               TEXT,
    transacted_at       TIMESTAMP       NOT NULL DEFAULT NOW()
    -- No updated_at: append-only
);

CREATE INDEX idx_stock_txn_consumable ON stock_transactions(consumable_id);
CREATE INDEX idx_stock_txn_type       ON stock_transactions(type);
CREATE INDEX idx_stock_txn_date       ON stock_transactions(transacted_at);
CREATE INDEX idx_stock_txn_by         ON stock_transactions(transacted_by);

-- ─────────────────────────────────────────────
-- 9. MAINTENANCE LOGS
-- ─────────────────────────────────────────────
CREATE TABLE maintenance_logs (
    id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id              UUID            NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,

    type                  VARCHAR(20)     NOT NULL DEFAULT 'repair'
                              CHECK (type IN ('repair','preventive','inspection','upgrade','calibration')),
    status                VARCHAR(20)     NOT NULL DEFAULT 'scheduled'
                              CHECK (status IN ('scheduled','in_progress','completed','cancelled')),

    scheduled_date        DATE,
    completed_date        DATE,

    performed_by          VARCHAR(150),
    vendor_id             UUID            REFERENCES suppliers(id) ON DELETE SET NULL,

    description           TEXT,
    findings              TEXT,
    cost                  DECIMAL(10,2),
    invoice_number        VARCHAR(100),
    next_maintenance_date DATE,

    logged_by             UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    created_at            TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_asset  ON maintenance_logs(asset_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX idx_maintenance_sched  ON maintenance_logs(scheduled_date);

-- ─────────────────────────────────────────────
-- 10. AUDIT LOGS  (append-only)
-- ─────────────────────────────────────────────
CREATE TABLE audit_logs (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
    user_email    VARCHAR(150),   -- snapshot
    user_role     VARCHAR(50),

    action        VARCHAR(40) NOT NULL
                      CHECK (action IN (
                        'CREATE','UPDATE','DELETE','RETIRE','ASSIGN','UNASSIGN',
                        'CHECKOUT_REQUEST','CHECKOUT_APPROVE','CHECKOUT_REJECT','CHECKIN',
                        'STOCK_ADD','STOCK_ISSUE','STOCK_ADJUST',
                        'LOGIN','LOGOUT','LOGIN_FAILED',
                        'EXPORT','SETTINGS_CHANGE'
                      )),

    entity_type   VARCHAR(50) NOT NULL,
    entity_id     UUID,

    before_value  JSONB,
    after_value   JSONB,

    ip_address    VARCHAR(45),
    user_agent    TEXT,
    notes         TEXT,

    created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
    -- No updated_at: append-only
);

CREATE INDEX idx_audit_user       ON audit_logs(user_id);
CREATE INDEX idx_audit_action     ON audit_logs(action);
CREATE INDEX idx_audit_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- ─────────────────────────────────────────────
-- 11. NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,

    type         VARCHAR(30) NOT NULL
                     CHECK (type IN (
                       'low_stock','warranty_expiry','maintenance_due','overdue_return',
                       'checkout_request','checkout_approved','checkout_rejected','system'
                     )),

    title        VARCHAR(200) NOT NULL,
    message      TEXT         NOT NULL,

    entity_type  VARCHAR(50),
    entity_id    UUID,

    is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at      TIMESTAMP,

    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user    ON notifications(user_id);
CREATE INDEX idx_notif_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- ─────────────────────────────────────────────
-- 12. ASSET ATTACHMENTS
-- ─────────────────────────────────────────────
CREATE TABLE asset_attachments (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id         UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    file_name        VARCHAR(255) NOT NULL,
    file_url         VARCHAR(500) NOT NULL,
    file_type        VARCHAR(100),
    file_size_bytes  INTEGER,
    attachment_type  VARCHAR(20)  NOT NULL DEFAULT 'other'
                         CHECK (attachment_type IN ('photo','invoice','warranty_card','manual','other')),
    uploaded_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 13. SOFTWARE LICENSES
-- ─────────────────────────────────────────────
CREATE TABLE software_licenses (
    id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    software_name    VARCHAR(150)    NOT NULL,
    version          VARCHAR(50),
    license_key      VARCHAR(500),
    license_type     VARCHAR(20)     NOT NULL DEFAULT 'subscription'
                         CHECK (license_type IN ('perpetual','subscription','oem','open_source','trial')),
    total_seats      INTEGER,
    used_seats       INTEGER         NOT NULL DEFAULT 0,
    supplier_id      UUID            REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_date    DATE,
    expiry_date      DATE,
    cost             DECIMAL(10,2),
    invoice_number   VARCHAR(100),
    status           VARCHAR(20)     NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','expired','cancelled')),
    notes            TEXT,
    created_at       TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_expiry ON software_licenses(expiry_date);
CREATE INDEX idx_licenses_status ON software_licenses(status);

-- ─────────────────────────────────────────────
-- 14. SYSTEM SETTINGS
-- ─────────────────────────────────────────────
CREATE TABLE system_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT,
    type        VARCHAR(20)  NOT NULL DEFAULT 'string',
    description TEXT,
    is_secret   BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at  TIMESTAMP    DEFAULT NOW(),
    updated_by  UUID         REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- 15. REFRESH TOKENS
-- ─────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP    NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_user    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);

-- ============================================================
--  BOOTSTRAP SEED DATA
-- ============================================================

-- Default categories (assets)
INSERT INTO categories (name, type) VALUES
  ('Computers & Laptops',    'asset'),
  ('Monitors & Displays',    'asset'),
  ('Peripherals',            'asset'),
  ('Networking Equipment',   'asset'),
  ('Furniture',              'asset'),
  ('Office Equipment',       'asset'),
  ('Vehicles',               'asset'),
  ('Other',                  'asset')
ON CONFLICT (name, type) DO NOTHING;

-- Default categories (consumables)
INSERT INTO categories (name, type) VALUES
  ('Stationery',             'consumable'),
  ('Printer Supplies',       'consumable'),
  ('Pantry & Beverages',     'consumable'),
  ('Cleaning Supplies',      'consumable'),
  ('Electrical & Batteries', 'consumable'),
  ('Packaging',              'consumable'),
  ('Other',                  'consumable')
ON CONFLICT (name, type) DO NOTHING;

-- Default locations
INSERT INTO locations (building, room) VALUES
  ('Main Office', 'IT Storage Room'),
  ('Main Office', 'Conference Room A'),
  ('Main Office', 'Reception'),
  ('Main Office', 'Pantry'),
  ('Main Office', 'General Floor'),
  ('Branch Office', 'General Floor')
ON CONFLICT (building, room) DO NOTHING;

-- System settings defaults
INSERT INTO system_settings (key, value, type, description, is_secret) VALUES
  ('company_name',              'My Office',             'string',  'Displayed in header and reports', false),
  ('low_stock_email_enabled',   'false',                 'boolean', 'Send email on low stock alerts',  false),
  ('warranty_alert_days',       '30',                    'number',  'Days before warranty expiry to alert', false),
  ('maintenance_alert_days',    '7',                     'number',  'Days before maintenance due to alert', false),
  ('session_timeout_minutes',   '60',                    'number',  'Idle session timeout',            false),
  ('smtp_host',                 '',                      'string',  'SMTP relay hostname',             true),
  ('smtp_port',                 '587',                   'number',  'SMTP port',                       true),
  ('smtp_user',                 '',                      'string',  'SMTP username',                   true),
  ('smtp_pass',                 '',                      'string',  'SMTP password',                   true),
  ('smtp_from',                 'inventory@office.local','string',  'Sender email address',            false),
  ('notification_recipients',   'admin@office.local',    'string',  'Comma-separated alert recipients', false)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
--  END OF SCHEMA
-- ============================================================
