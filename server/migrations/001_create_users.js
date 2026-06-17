/**
 * MIGRATION 001 — users
 * Core user accounts for authentication and audit attribution.
 */
exports.up = (knex) =>
  knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.string('name', 100).notNullable();
    t.string('email', 150).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.enu('role', ['admin', 'staff', 'auditor']).notNullable().defaultTo('staff');
    t.string('phone', 20).nullable();
    t.string('department', 100).nullable();

    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('last_login_at').nullable();
    t.integer('failed_login_attempts').notNullable().defaultTo(0);
    t.timestamp('locked_until').nullable();  // for brute-force lockout

    t.timestamps(true, true); // created_at, updated_at
  });

exports.down = (knex) => knex.schema.dropTable('users');
