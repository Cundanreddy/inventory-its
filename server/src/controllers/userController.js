const userService       = require('../services/userService');
const { auditFromReq }  = require('../utils/audit');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// GET /api/users
const list = asyncHandler(async (req, res) => {
  const result = await userService.getAll(req);
  res.json(result);
});

// GET /api/users/:id
const get = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  res.json(user);
});

// GET /api/users/me  (current logged-in user's full profile)
const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user.id);
  res.json(user);
});

// POST /api/users  (admin creates a user)
const create = asyncHandler(async (req, res) => {
  const user = await userService.create(req.body);
  await auditFromReq(req, 'CREATE', 'user', user.id, null, user);
  res.status(201).json(user);
});

// PATCH /api/users/:id  (admin edits name/role/department)
const update = asyncHandler(async (req, res) => {
  // engineer can only edit their own profile (no role change)
  if (req.user.role !== 'admin') {
    if (req.params.id !== req.user.id) {
      throw new AppError('You can only edit your own profile.', 403);
    }
    // Strip role from body — engineer cannot self-promote
    delete req.body.role;
  }

  const before = await userService.getById(req.params.id);
  const user   = await userService.update(req.params.id, req.body);
  await auditFromReq(req, 'UPDATE', 'user', user.id, before, user);
  res.json(user);
});

// PATCH /api/users/me/password  (self-service password change)
const changeMyPassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  await userService.changePassword(req.user.id, current_password, new_password);
  await auditFromReq(req, 'UPDATE', 'user', req.user.id, null, { action: 'password_changed' });
  res.json({ message: 'Password changed successfully.' });
});

// PATCH /api/users/:id/reset-password  (admin only)
const adminResetPassword = asyncHandler(async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    throw new AppError('New password must be at least 8 characters.', 400);
  }
  await userService.adminResetPassword(req.params.id, new_password);
  await auditFromReq(req, 'UPDATE', 'user', req.params.id, null, { action: 'admin_password_reset' });
  res.json({ message: 'Password reset successfully.' });
});

// PATCH /api/users/:id/toggle-active  (admin only)
const toggleActive = asyncHandler(async (req, res) => {
  const user = await userService.toggleActive(req.params.id, req.user.id);
  await auditFromReq(req, 'UPDATE', 'user', user.id, null, { is_active: user.is_active });
  res.json(user);
});

// GET /api/users/:id/assets  (assets assigned to this user)
const assignedAssets = asyncHandler(async (req, res) => {
  // engineer can only view their own
  if (req.user.role === 'engineer' && req.params.id !== req.user.id) {
    throw new AppError('You can only view your own assigned assets.', 403);
  }
  const assets = await userService.getAssignedAssets(req.params.id);
  res.json(assets);
});

module.exports = {
  list, get, getMe, create, update,
  changeMyPassword, adminResetPassword,
  toggleActive, assignedAssets,
};
