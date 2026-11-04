const { Router } = require('express');
const controller = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');
const {
  createServiceBody,
  updateServiceBody,
  updateStatusBody,
  addNoteBody,
  listServicesQuery,
} = require('../validators/service.validators');
const { ROLES } = require('../constants');

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

// Reads are open to every role; scoping happens in the service layer.
router.get('/', validate({ query: listServicesQuery }), controller.list);
router.get('/:id', validate({ params: idParams }), controller.get);

router.post('/', adminOnly, validate({ body: createServiceBody }), controller.create);
router.patch('/:id', adminOnly, validate({ params: idParams, body: updateServiceBody }), controller.update);
router.delete('/:id', adminOnly, validate({ params: idParams }), controller.remove);

router.patch(
  '/:id/status',
  authorize(ROLES.TECHNICIAN),
  validate({ params: idParams, body: updateStatusBody }),
  controller.updateStatus,
);
router.post(
  '/:id/notes',
  authorize(ROLES.TECHNICIAN, ROLES.ADMIN),
  validate({ params: idParams, body: addNoteBody }),
  controller.addNote,
);

module.exports = router;
