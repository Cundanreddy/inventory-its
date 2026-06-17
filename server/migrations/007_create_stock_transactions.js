/**
 * MIGRATION 007 — stock_transactions
 * Immutable ledger of every stock movement for consumables.
 * Running total on the consumables table is derived from this.
 * Rows are NEVER updated or deleted — append-only.
 */
exports.up = (knex) =>
  knex.schema.createTable('stock_transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.uuid('consumable_id').notNullable()
      .references('id').inTable('consumables').onDelete('RESTRICT');

    t.enu('type', [
      'add',         // new stock received (purchase / delivery)
      'issue',       // stock given out to a person / department
      'adjustment',  // manual correction (stocktake discrepancy)
      'return',      // unused stock returned to inventory
      'disposal',    // expired / damaged stock written off
    ]).notNullable();

    t.integer('quantity').notNullable();       // positive for add/return, negative for issue/disposal
    t.integer('quantity_before').notNullable(); // snapshot of stock before this transaction
    t.integer('quantity_after').notNullable();  // snapshot of stock after this transaction

    // Who / where
    t.uuid('transacted_by').notNullable()     // user who logged this transaction
      .references('id').inTable('users').onDelete('RESTRICT');
    t.string('recipient', 150).nullable();    // person/dept who received issued stock
    t.string('department', 100).nullable();

    // Purchase details (for 'add' type)
    t.string('invoice_number', 100).nullable();
    t.decimal('unit_cost_at_time', 10, 2).nullable(); // price per unit at time of transaction
    t.uuid('supplier_id').nullable()
      .references('id').inTable('suppliers').onDelete('SET NULL');

    t.text('notes').nullable();
    t.timestamp('transacted_at').notNullable().defaultTo(knex.fn.now());

    // No updated_at — this table is append-only
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_stock_txn_consumable  ON stock_transactions(consumable_id);
    CREATE INDEX idx_stock_txn_type        ON stock_transactions(type);
    CREATE INDEX idx_stock_txn_date        ON stock_transactions(transacted_at);
    CREATE INDEX idx_stock_txn_by          ON stock_transactions(transacted_by);
  `));

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_stock_txn_consumable;
    DROP INDEX IF EXISTS idx_stock_txn_type;
    DROP INDEX IF EXISTS idx_stock_txn_date;
    DROP INDEX IF EXISTS idx_stock_txn_by;
  `);
  await knex.schema.dropTable('stock_transactions');
};
