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
    t.boolean('is_active').notNullable().defaultTo(true);

    t.timestamps(true, true);

    t.unique(['name']); // no duplicate category names within a type
  });

  // ── locations ────────────────────────────────────────────────
  await knex.schema.createTable('locations', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    t.string('region', 100).notNullable();  // e.g. "Banglore" , "Pune"
   
    t.boolean('is_active').notNullable().defaultTo(true);

    t.timestamps(true, true);

    t.unique(['region']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable('locations');
  await knex.schema.dropTable('categories');
};
