/**
 * MIGRATION 011 — asset_attachments & software_licenses
 *
 * asset_attachments: multiple files per asset (invoices, photos, manuals).
 * software_licenses: software license tracking with seat counts and expiry.
 */
exports.up = async (knex) => {
  // ── asset_attachments ─────────────────────────────────────────
  await knex.schema.createTable('asset_attachments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.uuid('asset_id').notNullable()
      .references('id').inTable('assets').onDelete('CASCADE');

    t.string('file_name', 255).notNullable();
    t.string('file_url', 500).notNullable();
    t.string('file_type', 100).nullable();  // MIME type
    t.integer('file_size_bytes').nullable();

    t.enu('attachment_type', [
      'photo', 'invoice', 'warranty_card', 'manual', 'other'
    ]).notNullable().defaultTo('other');

    t.uuid('uploaded_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL');

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // ── software_licenses ─────────────────────────────────────────
  await knex.schema.createTable('software_licenses', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.string('software_name', 150).notNullable();   // e.g. "Microsoft Office 365"
    t.string('version', 50).nullable();
    t.string('license_key', 500).nullable();         // encrypted in app layer
    t.enu('license_type', [
      'perpetual', 'subscription', 'oem', 'open_source', 'trial'
    ]).notNullable().defaultTo('subscription');

    t.integer('total_seats').nullable();             // null = unlimited
    t.integer('used_seats').notNullable().defaultTo(0);

    t.uuid('supplier_id').nullable()
      .references('id').inTable('suppliers').onDelete('SET NULL');

    t.date('purchase_date').nullable();
    t.date('expiry_date').nullable();
    t.decimal('cost', 10, 2).nullable();
    t.string('invoice_number', 100).nullable();

    t.enu('status', ['active', 'expired', 'cancelled']).notNullable().defaultTo('active');
    t.text('notes').nullable();

    t.timestamps(true, true);
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_licenses_expiry  ON software_licenses(expiry_date);
    CREATE INDEX idx_licenses_status  ON software_licenses(status);
  `));
};

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_licenses_expiry;
    DROP INDEX IF EXISTS idx_licenses_status;
  `);
  await knex.schema.dropTable('software_licenses');
  await knex.schema.dropTable('asset_attachments');
};
