const { z } = require('zod');
const { email } = require('./common');

const loginBody = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});

module.exports = { loginBody };
