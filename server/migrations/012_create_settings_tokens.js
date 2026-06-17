/**
 * MIGRATION 012 — system_settings & refresh_tokens
 *
 * system_settings: key-value store for all admin-configurable options.
 * refresh_tokens:  persistent token store for JWT refresh (optional but more secure
 *                  than purely stateless — allows individual token revocation).
 */
exports.up = async (knex) => {
  // ── system_settings ───────────────────────────────────────────
  await knex.schema.createTable('system_settings', (t) => {
    t.string('key', 100).primary();   // e.g. 'company_name', 'smtp_host'
    t.text('value').nullable();
    t.string('type', 20).notNullable().defaultTo('string'); // string | boolean | number | json
    t.text('description').nullable();
    t.boolean('is_secret').notNullable().defaultTo(false);  // mask in UI if true
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.uuid('updated_by').nullable()
      .references('id').inTable('users').onDelete('SET NULL');
  });

  // ── refresh_tokens ────────────────────────────────────────────
  await knex.schema.createTable('refresh_tokens', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.uuid('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    t.string('token_hash', 255).notNullable().unique(); // SHA-256 of the actual token
    t.timestamp('expires_at').notNullable();
    t.boolean('is_revoked').notNullable().defaultTo(false);
    t.string('ip_address', 45).nullable();
    t.text('user_agent').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_refresh_user    ON refresh_tokens(user_id);
    CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);
  `));
};

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_refresh_user;
    DROP INDEX IF EXISTS idx_refresh_expires;
  `);
  await knex.schema.dropTable('refresh_tokens');
  await knex.schema.dropTable('system_settings');
};
