const mongoose = require('mongoose');
const { ZodError } = require('zod');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { formatIssues } = require('./validate');

/** 404 for any route that did not match. */
function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/** Maps known library errors onto ApiError; returns null for unexpected ones. */
function toApiError(err) {
  if (err instanceof ApiError) return err;
  if (err instanceof ZodError) return ApiError.badRequest('Validation failed', formatIssues(err.issues));
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`, [
      { path: err.path, message: `Invalid ${err.kind}` },
    ]);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', details);
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? err.keyPattern ?? {})[0] ?? 'field';
    return ApiError.conflict(`A record with this ${field} already exists`);
  }
  if (err?.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body');
  // Other body-parser client errors (413 too large, 415 bad charset, ...) carry a safe status.
  if (err?.expose && err.status >= 400 && err.status < 500) {
    return new ApiError(err.status, 'BAD_REQUEST', err.message);
  }
  return null;
}

/**
 * Central error handler: formats every error as `{ error: { message, code, details? } }`.
 * Express identifies error handlers by their four-argument signature.
 */
function errorHandler(err, _req, res, _next) {
  const apiError = toApiError(err);
  if (!apiError) {
    if (!env.isTest) console.error(err);
    return res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } });
  }

  const body = { message: apiError.message, code: apiError.code };
  if (apiError.details) body.details = apiError.details;
  return res.status(apiError.status).json({ error: body });
}

module.exports = { notFound, errorHandler };
