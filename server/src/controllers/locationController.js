const locationService = require('../services/locationService');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/locations
const list = asyncHandler(async (_req, res) => {
  const locations = await locationService.getAll();
  res.json(locations);
});

module.exports = { list };
