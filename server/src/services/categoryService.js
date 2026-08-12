const db = require('../models/db');

const getAll = async () => {
  return db('categories')
    .select('id', 'name', 'is_active')
    .where('is_active', true)
    .orderBy('name');
};

module.exports = { getAll };
