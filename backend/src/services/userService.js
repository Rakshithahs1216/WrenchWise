const { User, Vehicle, Service } = require('../models');
const ApiError = require('../utils/ApiError');
const { hashPassword } = require('../utils/password');
const { ROLES, SERVICE_STATUS } = require('../constants');

function listUsers({ role }) {
  const filter = role ? { role } : {};
  return User.find(filter).sort({ name: 1 });
}

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

async function createUser({ password, ...fields }) {
  const passwordHash = await hashPassword(password);
  return User.create({ ...fields, passwordHash });
}

/** Rejects removing a technician role while they still own open (non-completed) services. */
async function assertNoOpenServices(technicianId, message) {
  const open = await Service.exists({ technician: technicianId, status: { $ne: SERVICE_STATUS.COMPLETED } });
  if (open) throw ApiError.conflict(message);
}

/**
 * Updates a user. Role changes keep related data consistent: a technician
 * with open services cannot be re-roled, and vehicles are unassigned when the
 * user stops being a `user`. Admins cannot change their own role.
 */
async function updateUser(actor, id, { password, ...fields }) {
  const user = await getUserById(id);

  const roleChanged = fields.role !== undefined && fields.role !== user.role;
  if (roleChanged) {
    if (user._id.equals(actor._id)) throw ApiError.conflict('You cannot change your own role');
    if (user.role === ROLES.TECHNICIAN) {
      await assertNoOpenServices(user._id, 'Technician still has open services; reassign them first');
    }
  }

  Object.assign(user, fields);
  if (password) {
    user.passwordHash = await hashPassword(password);
    user.passwordChangedAt = new Date();
  }
  await user.save();

  if (roleChanged && user.role !== ROLES.USER) {
    await Vehicle.updateMany({ assignedUser: user._id }, { assignedUser: null });
  }
  return user;
}

/** Deletes a user, unassigning their vehicles. Self-deletion and technicians with open services → 409. */
async function deleteUser(actor, id) {
  if (actor._id.equals(id)) throw ApiError.conflict('You cannot delete your own account');
  const user = await getUserById(id);

  if (user.role === ROLES.TECHNICIAN) {
    await assertNoOpenServices(user._id, 'Technician still has open services; reassign or complete them first');
  }

  await Vehicle.updateMany({ assignedUser: user._id }, { assignedUser: null });
  await user.deleteOne();
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
