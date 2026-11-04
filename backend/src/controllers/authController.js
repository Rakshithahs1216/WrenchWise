const env = require('../config/env');
const authService = require('../services/authService');
const { AUTH_COOKIE } = require('../constants');

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.isProduction,
  path: '/',
};

async function login(req, res) {
  const { user, token } = await authService.login(req.body.email, req.body.password);
  res.cookie(AUTH_COOKIE, token, { ...baseCookieOptions, maxAge: authService.tokenLifetimeMs(token) });
  res.json({ token, user });
}

function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE, baseCookieOptions);
  res.status(204).end();
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, logout, me };
