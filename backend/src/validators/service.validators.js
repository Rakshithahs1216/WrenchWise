const { z } = require('zod');
const { objectId, dateInput, nonEmpty } = require('./common');
const { SERVICE_TYPES, SERVICE_STATUS_VALUES } = require('../constants');

const description = z.string().trim().max(1000);

const createServiceBody = z.object({
  vehicle: objectId,
  serviceType: z.enum(SERVICE_TYPES),
  scheduledDate: dateInput,
  technician: objectId,
  description: description.optional(),
});

const updateServiceBody = nonEmpty(
  z.object({
    serviceType: z.enum(SERVICE_TYPES),
    scheduledDate: dateInput,
    technician: objectId,
    description,
  }).partial(),
);

const updateStatusBody = z.object({
  status: z.enum(SERVICE_STATUS_VALUES),
});

const addNoteBody = z.object({
  text: z.string().trim().min(1, 'Note text is required').max(1000),
});

const listServicesQuery = z
  .object({
    status: z.enum(SERVICE_STATUS_VALUES).optional(),
    vehicle: objectId.optional(),
    technician: objectId.optional(),
    from: dateInput.optional(),
    to: dateInput.optional(),
    sort: z.enum(['scheduledDate', '-scheduledDate']).default('scheduledDate'),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: '`from` must be before `to`', path: ['from'] });

const myServicesQuery = z.object({
  scope: z.enum(['upcoming', 'history', 'all']).default('all'),
});

module.exports = {
  createServiceBody,
  updateServiceBody,
  updateStatusBody,
  addNoteBody,
  listServicesQuery,
  myServicesQuery,
};
