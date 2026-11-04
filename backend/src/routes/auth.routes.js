const { Router } = require('express');
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimit');
const { loginBody } = require('../validators/auth.validators');

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginBody }), controller.login);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

module.exports = router;
