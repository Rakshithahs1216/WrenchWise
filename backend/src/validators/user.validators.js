const { z } = require('zod');
const { email, nonEmpty } = require('./common');
const { ROLE_VALUES } = require('../constants');

// bcrypt only uses the first 72 bytes of a password.
const password = z.string().min(8, 'Password must be at least 8 characters').max(72);

const createUserBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email,
  password,
  role: z.enum(ROLE_VALUES),
});

const updateUserBody = nonEmpty(createUserBody.partial());

const listUsersQuery = z.object({
  role: z.enum(ROLE_VALUES).optional(),
});

module.exports = { createUserBody, updateUserBody, listUsersQuery };
