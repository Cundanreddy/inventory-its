/**
 * MIGRATION 002 — categories & locations
 * Lookup tables shared by both assets and consumables.
 * Must run before assets and consumables (foreign key dependency).
 */
exports.up = async (knex) => {
  // ── categories ──────────────────────────────────────────────
  await knex.schema.createTable('categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.string('name', 100).notNullable();
    t.enu('type', ['asset', 'consumable']).notNullable(); // which module it applies to
    t.text('description').nullable();
    t.boolean('is_active').notNullable().defaultTo(true);

    t.timestamps(true, true);

    t.unique(['name', 'type']); // no duplicate category names within a type
  });

  // ── locations ────────────────────────────────────────────────
  await knex.schema.createTable('locations', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.string('building', 100).notNullable();  // e.g. "Main Office"
    t.string('room', 100).notNullable();       // e.g. "Server Room 2B"
    t.text('notes').nullable();
    t.boolean('is_active').notNullable().defaultTo(true);

    t.timestamps(true, true);

    t.unique(['building', 'room']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('locations');
  await knex.schema.dropTable('categories');
};
