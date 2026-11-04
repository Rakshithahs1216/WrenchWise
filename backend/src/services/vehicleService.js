const { User, Vehicle, Service } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants');

const ASSIGNED_USER_FIELDS = 'name email';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Ensures `userId` (if not null) refers to an existing account with role `user`. */
async function assertAssignable(userId) {
  if (userId === null || userId === undefined) return;
  const user = await User.findById(userId);
  if (!user || user.role !== ROLES.USER) {
    throw ApiError.badRequest('Vehicles can only be assigned to users with role "user"', [
      { path: 'assignedUser', message: 'Must reference an existing user with role "user"' },
    ]);
  }
}

function listVehicles({ status, assignedUser, q }) {
  const filter = {};
  if (status) filter.status = status;
  if (assignedUser) filter.assignedUser = assignedUser;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ registrationNumber: pattern }, { make: pattern }, { model: pattern }];
  }
  return Vehicle.find(filter).populate('assignedUser', ASSIGNED_USER_FIELDS).sort({ registrationNumber: 1 });
}

/** Vehicles assigned to the given user. */
function listVehiclesForUser(userId) {
  return Vehicle.find({ assignedUser: userId })
    .populate('assignedUser', ASSIGNED_USER_FIELDS)
    .sort({ registrationNumber: 1 });
}

async function getVehicleById(id) {
  const vehicle = await Vehicle.findById(id).populate('assignedUser', ASSIGNED_USER_FIELDS);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return vehicle;
}

async function createVehicle(data) {
  await assertAssignable(data.assignedUser);
  const vehicle = await Vehicle.create(data);
  return vehicle.populate('assignedUser', ASSIGNED_USER_FIELDS);
}

async function updateVehicle(id, data) {
  const vehicle = await getVehicleById(id);
  await assertAssignable(data.assignedUser);
  vehicle.set(data);
  await vehicle.save();
  return vehicle.populate('assignedUser', ASSIGNED_USER_FIELDS);
}

/** Assigns the vehicle to a `user`-role account, or unassigns it when `userId` is null. */
function assignVehicle(id, userId) {
  return updateVehicle(id, { assignedUser: userId });
}

/** Deletes the vehicle together with all of its services. */
async function deleteVehicle(id) {
  const vehicle = await Vehicle.findByIdAndDelete(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  await Service.deleteMany({ vehicle: vehicle._id });
}

module.exports = {
  listVehicles,
  listVehiclesForUser,
  getVehicleById,
  createVehicle,
  updateVehicle,
  assignVehicle,
  deleteVehicle,
};
