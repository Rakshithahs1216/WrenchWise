const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const idParams = z.object({ id: objectId });

/** Accepts any string `Date.parse` understands (ISO date or date-time) and yields a Date. */
const dateInput = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date')
  .transform((value) => new Date(value));

const email = z.string().trim().toLowerCase().pipe(z.email('Invalid email'));

/** Rejects PATCH bodies that contain no recognised fields. */
const nonEmpty = (schema) =>
  schema.refine((data) => Object.keys(data).length > 0, 'At least one field must be provided');

module.exports = { objectId, idParams, dateInput, email, nonEmpty };
