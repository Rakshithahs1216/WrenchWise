const { rateLimit } = require('express-rate-limit');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/** Throttles login attempts per IP (20 per 15 minutes). Disabled under test. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'TOO_MANY_REQUESTS', 'Too many login attempts, please try again later'));
  },
});

module.exports = { loginLimiter };
