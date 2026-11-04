const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { hashPassword, verifyPassword } = require('../utils/password');

let dummyHashPromise;

/**
 * A real bcrypt hash (same cost) that unknown emails are compared against, so
 * the response time does not reveal whether an account exists.
 */
function getDummyHash() {
  dummyHashPromise ??= hashPassword('wrenchwise-dummy-password');
  return dummyHashPromise;
}

/** Signs a JWT with payload `{ sub: userId, role }`. */
function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });
}

/** Lifetime of a signed token in milliseconds (used for the cookie maxAge). */
function tokenLifetimeMs(token) {
  const { iat, exp } = jwt.decode(token);
  return (exp - iat) * 1000;
}

/**
 * Checks credentials and returns `{ user, token }`.
 * Fails with 401 without revealing which part was wrong.
 */
async function login(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const hash = user ? user.passwordHash : await getDummyHash();
  const valid = await verifyPassword(password, hash);
  if (!user || !valid) throw ApiError.unauthenticated('Invalid email or password');
  return { user, token: signToken(user) };
}

module.exports = { login, signToken, tokenLifetimeMs };
