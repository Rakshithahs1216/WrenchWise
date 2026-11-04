const { z } = require('zod');
const { objectId, nonEmpty } = require('./common');
const { VEHICLE_STATUSES } = require('../constants');

const maxYear = new Date().getFullYear() + 1;

const vehicleFields = {
  registrationNumber: z
    .string()
    .transform((value) => value.replace(/\s+/g, '').toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9-]{4,15}$/, 'Registration number must be 4-15 letters, digits or dashes')),
  make: z.string().trim().min(1, 'Make is required').max(50),
  model: z.string().trim().min(1, 'Model is required').max(50),
  year: z.coerce.number().int().min(1980).max(maxYear),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .max(17)
    .transform((value) => value || null)
    .nullable(),
  mileage: z.coerce.number().int().min(0),
  status: z.enum(VEHICLE_STATUSES),
  assignedUser: objectId.nullable(),
};

const createVehicleBody = z.object({
  ...vehicleFields,
  vin: vehicleFields.vin.optional(),
  mileage: vehicleFields.mileage.optional(),
  status: vehicleFields.status.optional(),
  assignedUser: vehicleFields.assignedUser.optional(),
});

const updateVehicleBody = nonEmpty(z.object(vehicleFields).partial());

const assignVehicleBody = z.object({
  userId: objectId.nullable(),
});

const listVehiclesQuery = z.object({
  status: z.enum(VEHICLE_STATUSES).optional(),
  assignedUser: objectId.optional(),
  q: z.string().trim().max(100).optional(),
});

module.exports = { createVehicleBody, updateVehicleBody, assignVehicleBody, listVehiclesQuery };
