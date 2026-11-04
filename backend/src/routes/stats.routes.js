const { Router } = require('express');
const controller = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');

const router = Router();

router.use(authenticate);

router.get('/summary', controller.summary);
router.get('/vehicles/:id/timeline', validate({ params: idParams }), controller.vehicleTimeline);

module.exports = router;
