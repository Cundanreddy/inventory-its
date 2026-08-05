const router = require('express').Router();

const ctrl = require('../controllers/locationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);

module.exports = router;
