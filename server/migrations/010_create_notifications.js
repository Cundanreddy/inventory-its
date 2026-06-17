/**
 * MIGRATION 010 — notifications
 * In-app notification inbox. Each row is one alert for one user.
 * Socket.IO delivers it in real-time; this table persists it for the bell icon.
 */
exports.up = (knex) =>
  knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.fn.uuid());

    // Who receives it (null = broadcast to all admins)
    t.uuid('user_id').nullable()
      .references('id').inTable('users').onDelete('CASCADE');

    t.enu('type', [
      'low_stock',
      'warranty_expiry',
      'maintenance_due',
      'overdue_return',
      'checkout_request',   // admin notified when staff requests
      'checkout_approved',  // staff notified on approval
      'checkout_rejected',  // staff notified on rejection
      'system',             // generic system message
    ]).notNullable();

    t.string('title', 200).notNullable();
    t.text('message').notNullable();

    // Deep link to the relevant entity
    t.string('entity_type', 50).nullable();   // 'asset' | 'consumable' | 'assignment'
    t.uuid('entity_id').nullable();

    t.boolean('is_read').notNullable().defaultTo(false);
    t.timestamp('read_at').nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  })
  .then(() => knex.schema.raw(`
    CREATE INDEX idx_notif_user     ON notifications(user_id);
    CREATE INDEX idx_notif_is_read  ON notifications(user_id, is_read);
    CREATE INDEX idx_notif_created  ON notifications(created_at DESC);
  `));

exports.down = async (knex) => {
  await knex.schema.raw(`
    DROP INDEX IF EXISTS idx_notif_user;
    DROP INDEX IF EXISTS idx_notif_is_read;
    DROP INDEX IF EXISTS idx_notif_created;
  `);
  await knex.schema.dropTable('notifications');
};
