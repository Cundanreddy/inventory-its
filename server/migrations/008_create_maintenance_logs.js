/**
 * MIGRATION 008 — maintenance_logs
 * Service history for assets (repairs, AMC servicing, inspections).
 * Each row is one completed or scheduled maintenance event.
 */
exports.up = (knex) =>
  knex.schema.createTable('maintenance_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.uuid('asset_id').notNullable()
      .references('id').inTable('assets').onDelete('RESTRICT');

    t.enu('type', [
      'repair',       // breakdown fix
      'preventive',   // scheduled service
      'inspection',   // annual / compliance check
      'upgrade',      // hardware upgrade
      'calibration',  // for measurement equipment
    ]).notNullable().defaultTo('repair');

    t.enu('status', [
      'scheduled',    // upcoming maintenance
      'in_progress',  // currently being serviced
      'completed',    // done
      'cancelled',    // cancelled before completion
    ]).notNullable().defaultTo('scheduled');

    t.date('scheduled_date').nullable();
    t.date('completed_date').nullable();

    t.string('performed_by', 150).nullable();  // technician name or vendor
    t.uuid('vendor_id').nullable()             // links to suppliers table if external vendor
      .references('id').inTable('suppliers').onDelete('SET NULL');

    t.text('description').nullable();          // what was done / to be done
    t.text('findings').nullable();             // diagnosis / findings
    t.decimal('cost', 10, 2).nullable();
    t.string('invoice_number', 100).nullable();
    t.date('next_maintenance_date').nullable(); // auto-fills asset.next_maintenance_date on complete

    t.uuid('logged_by').notNullable()
      .references('id').inTable('users').onDelete('RESTRICT');

    t.timestamps(true, true);
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_maintenance_asset   ON maintenance_logs(asset_id);
    CREATE INDEX idx_maintenance_status  ON maintenance_logs(status);
    CREATE INDEX idx_maintenance_sched   ON maintenance_logs(scheduled_date);
  `));

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_maintenance_asset;
    DROP INDEX IF EXISTS idx_maintenance_status;
    DROP INDEX IF EXISTS idx_maintenance_sched;
  `);
  await knex.schema.dropTable('maintenance_logs');
};
