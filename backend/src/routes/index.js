const { Router } = require('express');

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/vehicles', require('./vehicle.routes'));
router.use('/services', require('./service.routes'));
router.use('/me', require('./me.routes'));
router.use('/stats', require('./stats.routes'));

module.exports = router;
