/**
 * SEED 001 — Bootstrap data
 * Run once after migrations to get a working system on first deploy.
 * Safe to re-run (uses onConflict ignore).
 */
const bcrypt = require('bcryptjs');

exports.seed = async (knex) => {

  // ── 1. Default admin user ────────────────────────────────────
  const hash = await bcrypt.hash('Admin@1234', 12);
  await knex('users').insert([
    { id: knex.fn.uuid(), name: 'System Admin', email: 'admin@office.local',
      password_hash: hash, role: 'admin', department: 'IT' },
  ]).onConflict('email').ignore();

  // ── 2. Categories ────────────────────────────────────────────
  const assetCats = [
    'Computers & Laptops', 'Monitors & Displays', 'Peripherals',
    'Networking Equipment', 'Furniture', 'Office Equipment', 'Vehicles', 'Other'
  ];
  const consumableCats = [
    'Stationery', 'Printer Supplies', 'Pantry & Beverages',
    'Cleaning Supplies', 'Electrical & Batteries', 'Packaging', 'Other'
  ];

  for (const name of assetCats) {
    await knex('categories').insert({ id: knex.fn.uuid(), name, type: 'asset' })
      .onConflict(['name', 'type']).ignore();
  }
  for (const name of consumableCats) {
    await knex('categories').insert({ id: knex.fn.uuid(), name, type: 'consumable' })
      .onConflict(['name', 'type']).ignore();
  }

  // ── 3. Locations ─────────────────────────────────────────────
  const locations = [
    { building: 'Main Office', room: 'IT Storage Room' },
    { building: 'Main Office', room: 'Conference Room A' },
    { building: 'Main Office', room: 'Reception' },
    { building: 'Main Office', room: 'Pantry' },
    { building: 'Main Office', room: 'General Floor' },
    { building: 'Branch Office', room: 'General Floor' },
  ];
  for (const loc of locations) {
    await knex('locations').insert({ id: knex.fn.uuid(), ...loc })
      .onConflict(['building', 'room']).ignore();
  }

  // ── 4. System settings defaults ──────────────────────────────
  const settings = [
    { key: 'company_name',              value: 'My Office',          type: 'string' },
    { key: 'low_stock_email_enabled',   value: 'false',              type: 'boolean' },
    { key: 'warranty_alert_days',       value: '30',                 type: 'number' },
    { key: 'maintenance_alert_days',    value: '7',                  type: 'number' },
    { key: 'session_timeout_minutes',   value: '60',                 type: 'number' },
    { key: 'smtp_host',                 value: '',                   type: 'string', is_secret: true },
    { key: 'smtp_port',                 value: '587',                type: 'number', is_secret: true },
    { key: 'smtp_user',                 value: '',                   type: 'string', is_secret: true },
    { key: 'smtp_pass',                 value: '',                   type: 'string', is_secret: true },
    { key: 'smtp_from',                 value: 'inventory@office.local', type: 'string' },
    { key: 'notification_recipients',   value: 'admin@office.local', type: 'string' },
  ];
  for (const s of settings) {
    await knex('system_settings')
      .insert({ description: null, is_secret: false, ...s })
      .onConflict('key').ignore();
  }

  console.log('✅ Seed complete. Login: admin@office.local / Admin@1234');
};
