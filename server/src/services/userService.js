const bcrypt      = require('bcryptjs');
const db          = require('../models/db');
const { paginate } = require('../utils/paginate');
const { AppError } = require('../middleware/errorHandler');

const BCRYPT_ROUNDS = 12;

// Strip password_hash before sending to client
const sanitize = (user) => {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
};

// ── getAll ───────────────────────────────────────────────────
const getAll = async (req) => {
  const { search, role, is_active, department,
          sort = 'created_at', order = 'desc' } = req.query;

  let q = db('users').select(
    'id','name','email','role','phone','department',
    'is_active','last_login_at','created_at','updated_at'
  );

  if (search) {
    q = q.where((b) =>
      b.whereILike('name', `%${search}%`)
       .orWhereILike('email', `%${search}%`)
       .orWhereILike('department', `%${search}%`)
    );
  }

  if (role)       q = q.where({ role });
  if (department) q = q.whereILike('department', `%${department}%`);

  if (is_active !== undefined) {
    q = q.where('is_active', is_active === 'true' || is_active === true);
  }

  const ALLOWED_SORT = ['name','email','role','created_at','last_login_at'];
  const safeSort  = ALLOWED_SORT.includes(sort) ? sort : 'created_at';
  const safeOrder = order === 'asc' ? 'asc' : 'desc';
  q = q.orderBy(safeSort, safeOrder);

  const result = await paginate(q, req);
  return result; // password_hash not selected so no need to strip
};

// ── getById ──────────────────────────────────────────────────
const getById = async (id) => {
  const user = await db('users')
    .select('id','name','email','role','phone','department',
            'is_active','last_login_at','failed_login_attempts','created_at','updated_at')
    .where({ id })
    .first();

  if (!user) throw new AppError('User not found.', 404);
  return user;
};

// ── getByEmail (internal — includes hash) ────────────────────
const getByEmail = async (email) =>
  db('users').where({ email }).first();

// ── create ───────────────────────────────────────────────────
const create = async ({ name, email, password, role, phone, department }) => {
  // Check duplicate email
  const existing = await db('users').where({ email }).first();
  if (existing) throw new AppError('A user with this email already exists.', 409);

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [user] = await db('users').insert({
    name, email, password_hash, role: role || 'engineer',
    phone:      phone      || null,
    department: department || null,
    is_active:  true,
    created_at: new Date(),
    updated_at: new Date(),
  }).returning([
    'id','name','email','role','phone','department','is_active','created_at'
  ]);

  return user;
};

// ── update ───────────────────────────────────────────────────
const update = async (id, data) => {
  const existing = await db('users').where({ id }).first();
  if (!existing) throw new AppError('User not found.', 404);

  const [updated] = await db('users')
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning(['id','name','email','role','phone','department','is_active','updated_at']);

  return updated;
};

// ── changePassword ───────────────────────────────────────────
const changePassword = async (id, currentPassword, newPassword) => {
  const user = await db('users').where({ id }).first();
  if (!user) throw new AppError('User not found.', 404);

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new AppError('Current password is incorrect.', 401);

  if (currentPassword === newPassword) {
    throw new AppError('New password must differ from the current password.', 400);
  }

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db('users').where({ id }).update({ password_hash, updated_at: new Date() });
};

// ── adminResetPassword ───────────────────────────────────────
// Admin sets a new password for any user (no current password needed)
const adminResetPassword = async (id, newPassword) => {
  const user = await db('users').where({ id }).first();
  if (!user) throw new AppError('User not found.', 404);

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db('users').where({ id }).update({
    password_hash,
    failed_login_attempts: 0,
    locked_until: null,
    updated_at: new Date(),
  });
};

// ── toggleActive ─────────────────────────────────────────────
const toggleActive = async (id, requestingUserId) => {
  if (id === requestingUserId) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }

  const user = await db('users').where({ id }).first();
  if (!user) throw new AppError('User not found.', 404);

  // Prevent disabling the last admin
  if (user.role === 'admin' && user.is_active) {
    const [{ count }] = await db('users').where({ role: 'admin', is_active: true }).count('* as count');
    if (parseInt(count, 10) <= 1) {
      throw new AppError('Cannot deactivate the last active administrator.', 400);
    }
  }

  const [updated] = await db('users')
    .where({ id })
    .update({ is_active: !user.is_active, updated_at: new Date() })
    .returning(['id','name','email','role','is_active']);

  return updated;
};

// ── getAssignedAssets ────────────────────────────────────────
// Assets currently assigned to a given user
const getAssignedAssets = async (userId) => {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new AppError('User not found.', 404);

  return db('assets as a')
    .leftJoin('categories as c', 'a.category_id', 'c.id')
    .leftJoin('locations as l',  'a.location_id',  'l.id')
    .where({ 'a.assigned_to': userId, 'a.status': 'assigned', 'a.is_active': true })
    .select(
      'a.id','a.name','a.asset_tag','a.serial_number',
      'a.brand','a.model','a.assigned_since','a.warranty_expiry',
      'c.name as category_name',
      db.raw("CONCAT(l.building, ' / ', l.room) as location_label")
    )
    .orderBy('a.assigned_since', 'desc');
};

// ── recordLogin ──────────────────────────────────────────────
// Called by auth controller on successful login
const recordLogin = (id) =>
  db('users').where({ id }).update({
    last_login_at:          new Date(),
    failed_login_attempts:  0,
    locked_until:           null,
  });

// ── recordFailedLogin ────────────────────────────────────────
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_MINUTES  = 15;

const recordFailedLogin = async (email) => {
  const user = await db('users').where({ email }).first();
  if (!user) return; // don't reveal if user exists

  const attempts = (user.failed_login_attempts || 0) + 1;
  const update   = { failed_login_attempts: attempts };

  if (attempts >= LOCKOUT_ATTEMPTS) {
    const lockUntil  = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_MINUTES);
    update.locked_until = lockUntil;
  }

  await db('users').where({ email }).update(update);
};

module.exports = {
  getAll, getById, getByEmail, create, update,
  changePassword, adminResetPassword,
  toggleActive, getAssignedAssets,
  recordLogin, recordFailedLogin, sanitize,
};
