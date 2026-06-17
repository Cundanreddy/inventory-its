/**
 * MIGRATION 004 — assets
 * Individual trackable items with unique serial numbers.
 * Each row is one physical item (laptop, chair, monitor, etc.)
 */
exports.up = (knex) =>
  knex.schema.createTable('assets', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    // Identity
    t.string('name', 150).notNullable();        // e.g. "Dell Latitude 5540"
    t.string('asset_tag', 50).nullable().unique(); // internal barcode / label (e.g. "IT-0042")
    t.string('serial_number', 100).nullable().unique();
    t.string('brand', 100).nullable();
    t.string('model', 100).nullable();

    // Classification
    t.uuid('category_id').notNullable()
      .references('id').inTable('categories').onDelete('RESTRICT');
    t.uuid('location_id').nullable()
      .references('id').inTable('locations').onDelete('SET NULL');

    // Purchase & financials
    t.uuid('supplier_id').nullable()
      .references('id').inTable('suppliers').onDelete('SET NULL');
    t.date('purchase_date').nullable();
    t.decimal('purchase_price', 12, 2).nullable();
    t.string('invoice_number', 100).nullable();
    t.date('warranty_expiry').nullable();

    // Lifecycle status
    t.enu('status', [
      'available',    // in stock, unassigned
      'assigned',     // currently with a user
      'maintenance',  // in for repair / servicing
      'retired',      // end-of-life, soft-deleted
      'lost',         // cannot be located
      'disposed',     // physically discarded
    ]).notNullable().defaultTo('available');

    // Assignment (denormalised for fast lookup — source of truth is assignments table)
    t.uuid('assigned_to').nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    t.date('assigned_since').nullable();

    // Maintenance scheduling
    t.date('next_maintenance_date').nullable();
    t.integer('maintenance_interval_days').nullable(); // e.g. 180 = every 6 months

    // Media & notes
    t.string('photo_url', 500).nullable();
    t.text('notes').nullable();
    t.boolean('is_active').notNullable().defaultTo(true); // false = soft-deleted

    t.timestamps(true, true);

    // Indexes for common queries
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_assets_status       ON assets(status);
    CREATE INDEX idx_assets_category     ON assets(category_id);
    CREATE INDEX idx_assets_location     ON assets(location_id);
    CREATE INDEX idx_assets_assigned_to  ON assets(assigned_to);
    CREATE INDEX idx_assets_warranty     ON assets(warranty_expiry);
    CREATE INDEX idx_assets_maintenance  ON assets(next_maintenance_date);
    CREATE INDEX idx_assets_fts ON assets
      USING GIN (to_tsvector('english', name || ' ' || COALESCE(serial_number,'') || ' ' || COALESCE(asset_tag,'')));
  `));

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_assets_fts;
    DROP INDEX IF EXISTS idx_assets_status;
    DROP INDEX IF EXISTS idx_assets_category;
    DROP INDEX IF EXISTS idx_assets_location;
    DROP INDEX IF EXISTS idx_assets_assigned_to;
    DROP INDEX IF EXISTS idx_assets_warranty;
    DROP INDEX IF EXISTS idx_assets_maintenance;
  `);
  await knex.schema.dropTable('assets');
};
