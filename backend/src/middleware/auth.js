const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const env = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { AUTH_COOKIE } = require('../constants');

/** Returns the JWT from the `Authorization: Bearer` header, falling back to the auth cookie. */
function extractToken(req) {
  const header = req.get('authorization');
  if (header) {
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) return token;
  }
  return req.cookies?.[AUTH_COOKIE] || null;
}

/**
 * Verifies the JWT and loads the current user from the database, so deleted
 * users are rejected and role changes take effect immediately. Sets `req.user`.
 */
async function authenticate(req, _res, next) {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthenticated();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    throw ApiError.unauthenticated(message);
  }

  if (!mongoose.isValidObjectId(payload.sub)) throw ApiError.unauthenticated('Invalid token');
  const user = await User.findById(payload.sub).select('+passwordChangedAt');
  if (!user) throw ApiError.unauthenticated('User no longer exists');
  // iat has second precision, so compare in whole seconds.
  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw ApiError.unauthenticated('Session expired, please log in again');
  }

  req.user = user;
  next();
}

/** Allows the request through only when `req.user.role` is one of `roles`. */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthenticated();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}

module.exports = { authenticate, authorize };
