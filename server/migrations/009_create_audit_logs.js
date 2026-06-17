/**
 * MIGRATION 009 — audit_logs
 * Immutable record of every data-modifying action in the system.
 * Never updated or deleted. Retained for 2+ years.
 * Enables full "who changed what and when" accountability.
 */
exports.up = (knex) =>
  knex.schema.createTable('audit_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    // Who did it
    t.uuid('user_id').nullable()   // nullable in case user is deleted
      .references('id').inTable('users').onDelete('SET NULL');
    t.string('user_email', 150).nullable();  // snapshot at time of action (survives user deletion)
    t.string('user_role', 50).nullable();

    // What was done
    t.enu('action', [
      'CREATE', 'UPDATE', 'DELETE', 'RETIRE', 'ASSIGN', 'UNASSIGN',
      'CHECKOUT_REQUEST', 'CHECKOUT_APPROVE', 'CHECKOUT_REJECT', 'CHECKIN',
      'STOCK_ADD', 'STOCK_ISSUE', 'STOCK_ADJUST',
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
      'EXPORT', 'SETTINGS_CHANGE',
    ]).notNullable();

    // What entity was affected
    t.string('entity_type', 50).notNullable();  // 'asset' | 'consumable' | 'user' | etc.
    t.uuid('entity_id').nullable();              // ID of the affected row

    // Diff — JSONB stores the before/after state
    t.jsonb('before_value').nullable();  // null for CREATE
    t.jsonb('after_value').nullable();   // null for DELETE

    // Context
    t.string('ip_address', 45).nullable();
    t.text('user_agent').nullable();
    t.text('notes').nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    // No updated_at — append only
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_audit_user        ON audit_logs(user_id);
    CREATE INDEX idx_audit_action      ON audit_logs(action);
    CREATE INDEX idx_audit_entity      ON audit_logs(entity_type, entity_id);
    CREATE INDEX idx_audit_created_at  ON audit_logs(created_at DESC);
  `));

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_audit_user;
    DROP INDEX IF EXISTS idx_audit_action;
    DROP INDEX IF EXISTS idx_audit_entity;
    DROP INDEX IF EXISTS idx_audit_created_at;
  `);
  await knex.schema.dropTable('audit_logs');
};
