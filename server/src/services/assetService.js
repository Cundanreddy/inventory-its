const db          = require('../models/db');
const { paginate } = require('../utils/paginate');
const { AppError } = require('../middleware/errorHandler');

// ── Columns to select on list / get ─────────────────────────
const BASE_SELECT = [
  'a.id',
  'a.name',
  'a.asset_tag',
  'a.serial_number',
  'a.brand',
  'a.model',
  'a.status',
  'a.purchase_date',
  'a.purchase_price',
  'a.invoice_number',
  'a.warranty_expiry',
  'a.next_maintenance_date',
  'a.maintenance_interval_days',
  'a.photo_url',
  'a.notes',
  'a.is_active',
  'a.assigned_since',
  'a.created_at',
  'a.updated_at',
  // Joined fields
  'c.name   as category_name',
  'l.region',
  db.raw("CONCAT(l.region) as location_label"),
  'u.name   as assignee_name',
  'u.email  as assignee_email',
  's.name   as supplier_name',
  // FK ids
  'a.category_id',
  'a.location_id',
  'a.supplier_id',
  'a.assigned_to',
];

const baseQuery = () =>
  db('assets as a')
    .leftJoin('categories as c', 'a.category_id', 'c.id')
    .leftJoin('locations as l',  'a.location_id',  'l.id')
    .leftJoin('users as u',      'a.assigned_to',  'u.id')
    .leftJoin('suppliers as s',  'a.supplier_id',  's.id')
    .select(BASE_SELECT)
    .where('a.is_active', true);

// ── getAll ───────────────────────────────────────────────────
const getAll = async (req) => {
  const { search, status, category_id, location_id, supplier_id,
          warranty_expiring, maintenance_due, sort = 'a.created_at', order = 'desc' } = req.query;

  let q = baseQuery();

  // Full-text search across name, serial, asset_tag
  if (search) {
    q = q.whereRaw(
      `to_tsvector('english', a.name || ' ' || COALESCE(a.serial_number,'') || ' ' || COALESCE(a.asset_tag,''))
       @@ plainto_tsquery('english', ?)`,
      [search]
    );
  }

  if (status)      q = q.where('a.status', status);
  if (category_id) q = q.where('a.category_id', category_id);
  if (location_id) q = q.where('a.location_id', location_id);
  if (supplier_id) q = q.where('a.supplier_id', supplier_id);

  // Warranty expiring within N days (default 30)
  if (warranty_expiring) {
    const days = parseInt(warranty_expiring, 10) || 30;
    q = q.whereNotNull('a.warranty_expiry')
         .whereRaw('a.warranty_expiry <= NOW() + INTERVAL ? DAY', [days]);
  }

  // Maintenance due within N days (default 7)
  if (maintenance_due) {
    const days = parseInt(maintenance_due, 10) || 7;
    q = q.whereNotNull('a.next_maintenance_date')
         .whereRaw('a.next_maintenance_date <= NOW() + INTERVAL ? DAY', [days]);
  }

  // Sort — whitelist allowed columns to prevent SQL injection
  const ALLOWED_SORT = ['a.name','a.created_at','a.updated_at','a.status',
                        'a.warranty_expiry','a.purchase_date','c.name'];
  const safeSort  = ALLOWED_SORT.includes(sort) ? sort : 'a.created_at';
  const safeOrder = order === 'asc' ? 'asc' : 'desc';
  q = q.orderBy(safeSort, safeOrder);

  return paginate(q, req);
};

// ── getById ──────────────────────────────────────────────────
const getById = async (id) => {
  const asset = await baseQuery().where('a.id', id).first();
  if (!asset) throw new AppError('Asset not found.', 404);
  return asset;
};

// ── create ───────────────────────────────────────────────────
const create = async (data, photoPath = null) => {
  const payload = {
    ...data,
    photo_url:  photoPath ? `/uploads/assets/${require('path').basename(photoPath)}` : null,
    status:     data.status || 'available',
    is_active:  true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const [asset] = await db('assets').insert(payload).returning('*');
  return asset;
};

// ── update ───────────────────────────────────────────────────
const update = async (id, data, photoPath = null) => {
  // Verify exists first
  const existing = await db('assets').where({ id, is_active: true }).first();
  if (!existing) throw new AppError('Asset not found.', 404);

  // Prevent updating a retired asset
  if (existing.status === 'retired' || existing.status === 'disposed') {
    throw new AppError('Cannot update a retired or disposed asset.', 400);
  }

  const payload = {
    ...data,
    updated_at: new Date(),
  };

  if (photoPath) {
    payload.photo_url = `/uploads/assets/${require('path').basename(photoPath)}`;
  }

  const [updated] = await db('assets').where({ id }).update(payload).returning('*');
  return updated;
};

// ── updateStatus ─────────────────────────────────────────────
const updateStatus = async (id, status, notes = null) => {
  const existing = await db('assets').where({ id, is_active: true }).first();
  if (!existing) throw new AppError('Asset not found.', 404);

  // Business rule: cannot move directly from retired/disposed
  if (['retired','disposed'].includes(existing.status)) {
    throw new AppError(`Asset is already ${existing.status} and cannot be reassigned.`, 400);
  }

  // Business rule: cannot mark 'available' if currently assigned
  if (status === 'available' && existing.status === 'assigned') {
    throw new AppError('Use the check-in workflow to return an assigned asset.', 400);
  }

  const payload = { status, updated_at: new Date() };
  if (notes) payload.notes = notes;

  // Clear assignment if retiring/disposing/losing
  if (['retired','disposed','lost'].includes(status)) {
    payload.assigned_to   = null;
    payload.assigned_since = null;
  }

  const [updated] = await db('assets').where({ id }).update(payload).returning('*');
  return updated;
};

// ── retire (soft delete) ─────────────────────────────────────
const retire = async (id) => {
  const existing = await db('assets').where({ id, is_active: true }).first();
  if (!existing) throw new AppError('Asset not found.', 404);

  if (existing.status === 'assigned') {
    throw new AppError('Cannot retire an assigned asset. Check it in first.', 400);
  }

  const [retired] = await db('assets').where({ id }).update({
    status:       'retired',
    is_active:    false,
    assigned_to:  null,
    updated_at:   new Date(),
  }).returning('*');

  return retired;
};

// ── getHistory ───────────────────────────────────────────────
// Returns all assignment events for a given asset (full checkout history)
const getHistory = async (assetId) => {
  // Verify asset exists
  const asset = await db('assets').where({ id: assetId }).first();
  if (!asset) throw new AppError('Asset not found.', 404);

  return db('assignments as ag')
    .join('users as u',  'ag.user_id',    'u.id')
    .leftJoin('users as ab', 'ag.approved_by', 'ab.id')
    .where('ag.asset_id', assetId)
    .select(
      'ag.id',
      'ag.status',
      'ag.requested_at',
      'ag.checked_out_at',
      'ag.expected_return',
      'ag.returned_at',
      'ag.return_condition',
      'ag.request_reason',
      'ag.rejection_reason',
      'ag.return_notes',
      'u.name  as borrower_name',
      'u.email as borrower_email',
      'ab.name as approved_by_name',
    )
    .orderBy('ag.requested_at', 'desc');
};

// ── getStats ─────────────────────────────────────────────────
// Dashboard summary counts
const getStats = async () => {
  const [totals] = await db('assets')
    .where('is_active', true)
    .select(
      db.raw("COUNT(*) as total"),
      db.raw("COUNT(*) FILTER (WHERE status = 'available')   as available"),
      db.raw("COUNT(*) FILTER (WHERE status = 'assigned')    as assigned"),
      db.raw("COUNT(*) FILTER (WHERE status = 'maintenance') as in_maintenance"),
      db.raw("COUNT(*) FILTER (WHERE status = 'retired')     as retired"),
    );

  const [{ warranty_expiring }] = await db('assets')
    .where('is_active', true)
    .whereNotNull('warranty_expiry')
    .whereRaw("warranty_expiry <= NOW() + INTERVAL '30 days'")
    .count('* as warranty_expiring');

  const [{ maintenance_due }] = await db('assets')
    .where('is_active', true)
    .whereNotNull('next_maintenance_date')
    .whereRaw("next_maintenance_date <= NOW() + INTERVAL '7 days'")
    .count('* as maintenance_due');

  return {
    total:             parseInt(totals.total, 10),
    available:         parseInt(totals.available, 10),
    assigned:          parseInt(totals.assigned, 10),
    in_maintenance:    parseInt(totals.in_maintenance, 10),
    retired:           parseInt(totals.retired, 10),
    warranty_expiring: parseInt(warranty_expiring, 10),
    maintenance_due:   parseInt(maintenance_due, 10),
  };
};

module.exports = { getAll, getById, create, update, updateStatus, retire, getHistory, getStats };
