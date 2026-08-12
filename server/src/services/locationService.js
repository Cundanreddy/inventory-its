const db = require('../models/db');

const getAll = async () => {
  return db('locations')
    .select(
      'id',
      'region',
      'is_active',
      db.raw('region as location_label')
    )
    .where('is_active', true)
    .orderBy('region');
};

module.exports = { getAll };
