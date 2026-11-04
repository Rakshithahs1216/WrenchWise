const ApiError = require('../utils/ApiError');

/** Converts zod issues into the API's `details` array. */
function formatIssues(issues) {
  return issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

/**
 * Validates and replaces `req.body`, `req.query` and/or `req.params` with the
 * parsed output of the given zod schemas. Fails with 400 VALIDATION_ERROR.
 *
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 */
function validate(schemas) {
  return (req, _res, next) => {
    const details = [];
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        details.push(...formatIssues(result.error.issues));
        continue;
      }
      // Express 5 exposes req.query as a getter, so redefine it on the request.
      Object.defineProperty(req, part, { value: result.data, writable: true, enumerable: true });
    }
    if (details.length > 0) throw ApiError.badRequest('Validation failed', details);
    next();
  };
}

module.exports = { validate, formatIssues };
