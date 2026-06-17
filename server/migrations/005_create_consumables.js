/**
 * MIGRATION 005 — consumables
 * Stock items tracked by quantity, not individual serial numbers.
 * (stationery, cartridges, pantry items, cables, etc.)
 */
exports.up = (knex) =>
  knex.schema.createTable('consumables', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    // Identity
    t.string('sku', 80).notNullable().unique(); // internal Stock Keeping Unit code
    t.string('name', 150).notNullable();
    t.text('description').nullable();

    // Classification
    t.uuid('category_id').notNullable()
      .references('id').inTable('categories').onDelete('RESTRICT');
    t.uuid('location_id').nullable()
      .references('id').inTable('locations').onDelete('SET NULL');
    t.uuid('supplier_id').nullable()
      .references('id').inTable('suppliers').onDelete('SET NULL');

    // Stock levels
    t.integer('quantity').notNullable().defaultTo(0);          // current stock
    t.integer('min_threshold').notNullable().defaultTo(5);     // triggers low-stock alert
    t.integer('reorder_quantity').nullable();                  // suggested order qty
    t.string('unit', 50).notNullable().defaultTo('pcs');       // pcs, boxes, reams, litres…

    // Cost
    t.decimal('unit_cost', 10, 2).nullable();

    // Expiry (for perishables / dated items)
    t.date('expiry_date').nullable();

    t.string('photo_url', 500).nullable();
    t.text('notes').nullable();
    t.boolean('is_active').notNullable().defaultTo(true);

    t.timestamps(true, true);
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_consumables_category  ON consumables(category_id);
    CREATE INDEX idx_consumables_location  ON consumables(location_id);
    CREATE INDEX idx_consumables_quantity  ON consumables(quantity);
    CREATE INDEX idx_consumables_fts ON consumables
      USING GIN (to_tsvector('english', name || ' ' || sku));
  `));

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_consumables_category;
    DROP INDEX IF EXISTS idx_consumables_location;
    DROP INDEX IF EXISTS idx_consumables_quantity;
    DROP INDEX IF EXISTS idx_consumables_fts;
  `);
  await knex.schema.dropTable('consumables');
};
