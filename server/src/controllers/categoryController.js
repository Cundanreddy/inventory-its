const categoryService = require('../services/categoryService');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/categories
const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAll(req);
  res.json(categories);
});

module.exports = { list };
