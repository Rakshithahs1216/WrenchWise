const { Router } = require('express');
const controller = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');
const { createUserBody, updateUserBody, listUsersQuery } = require('../validators/user.validators');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', validate({ query: listUsersQuery }), controller.list);
router.post('/', validate({ body: createUserBody }), controller.create);
router.get('/:id', validate({ params: idParams }), controller.get);
router.patch('/:id', validate({ params: idParams, body: updateUserBody }), controller.update);
router.delete('/:id', validate({ params: idParams }), controller.remove);

module.exports = router;
