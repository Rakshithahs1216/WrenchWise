const { Router } = require('express');
const controller = require('../controllers/meController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { myServicesQuery } = require('../validators/service.validators');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

router.get('/vehicles', authorize(ROLES.USER), controller.vehicles);
router.get(
  '/services',
  authorize(ROLES.USER, ROLES.TECHNICIAN),
  validate({ query: myServicesQuery }),
  controller.services,
);

module.exports = router;
