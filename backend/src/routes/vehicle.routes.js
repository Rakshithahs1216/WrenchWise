const { Router } = require('express');
const controller = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');
const {
  createVehicleBody,
  updateVehicleBody,
  assignVehicleBody,
  listVehiclesQuery,
} = require('../validators/vehicle.validators');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', validate({ query: listVehiclesQuery }), controller.list);
router.post('/', validate({ body: createVehicleBody }), controller.create);
router.get('/:id', validate({ params: idParams }), controller.get);
router.patch('/:id', validate({ params: idParams, body: updateVehicleBody }), controller.update);
router.delete('/:id', validate({ params: idParams }), controller.remove);
router.patch('/:id/assign', validate({ params: idParams, body: assignVehicleBody }), controller.assign);

module.exports = router;
