/**
 * MIGRATION 006 — assignments
 * Full checkout / check-in lifecycle per asset.
 * One row = one borrow event (request → approve/reject → return).
 * History is permanent; rows are never deleted.
 */
exports.up = (knex) =>
  knex.schema.createTable('assignments', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.uuid('asset_id').notNullable()
      .references('id').inTable('assets').onDelete('RESTRICT');
    t.uuid('user_id').notNullable()          // who is borrowing
      .references('id').inTable('users').onDelete('RESTRICT');

    // Workflow state
    t.enu('status', [
      'pending',   // staff submitted, awaiting admin approval
      'approved',  // admin approved, asset is checked out
      'rejected',  // admin rejected the request
      'returned',  // asset returned, assignment complete
      'overdue',   // approved but past expected return date
    ]).notNullable().defaultTo('pending');

    // Timestamps for each lifecycle event
    t.timestamp('requested_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('approved_at').nullable();
    t.timestamp('rejected_at').nullable();
    t.timestamp('checked_out_at').nullable();
    t.date('expected_return').nullable();
    t.timestamp('returned_at').nullable();

    // Who actioned it
    t.uuid('approved_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL');

    // Notes
    t.text('request_reason').nullable();  // why the staff needs it
    t.text('rejection_reason').nullable();
    t.text('return_notes').nullable();    // condition on return
    t.enu('return_condition', ['good', 'damaged', 'lost']).nullable();

    t.timestamps(true, true);
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_assignments_asset      ON assignments(asset_id);
    CREATE INDEX idx_assignments_user       ON assignments(user_id);
    CREATE INDEX idx_assignments_status     ON assignments(status);
    CREATE INDEX idx_assignments_expected   ON assignments(expected_return);
  `));

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_assignments_asset;
    DROP INDEX IF EXISTS idx_assignments_user;
    DROP INDEX IF EXISTS idx_assignments_status;
    DROP INDEX IF EXISTS idx_assignments_expected;
  `);
  await knex.schema.dropTable('assignments');
};
