/**
 * MIGRATION 003 — suppliers
 * Supplier/vendor directory. Referenced by assets (purchase source)
 * and consumables (restocking source).
 */
exports.up = (knex) =>
  knex.schema.createTable('suppliers', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());
    t.string('name', 150).notNullable().unique();
    t.string('company_name', 100).nullable();
    t.string('email', 150).nullable();
    t.string('phone', 30).nullable();
    t.text('address').nullable();
    t.string('website', 255).nullable();
    t.text('remark').nullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.boolean('is_client').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

exports.down = (knex) => knex.schema.dropTable('suppliers');
