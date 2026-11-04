const { User, Vehicle, Service } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES, SERVICE_STATUS, SERVICE_TRANSITIONS } = require('../constants');

/** Populates the references every Service response exposes. */
function withRefs(query) {
  return query
    .populate('vehicle', 'registrationNumber make model')
    .populate('technician', 'name email')
    .populate('notes.author', 'name');
}

/**
 * Mongo filter limiting services to what `user` may see:
 * admin → all, technician → assigned to them, user → on vehicles assigned to them.
 */
async function buildScopeFilter(user) {
  switch (user.role) {
    case ROLES.ADMIN:
      return {};
    case ROLES.TECHNICIAN:
      return { technician: user._id };
    case ROLES.USER: {
      const vehicleIds = await Vehicle.find({ assignedUser: user._id }).distinct('_id');
      return { vehicle: { $in: vehicleIds } };
    }
    default:
      throw ApiError.forbidden();
  }
}

/** Translates validated list query params into a Mongo filter. */
function buildQueryFilter({ status, vehicle, technician, from, to }) {
  const filter = {};
  if (status) filter.status = status;
  if (vehicle) filter.vehicle = vehicle;
  if (technician) filter.technician = technician;
  if (from || to) {
    filter.scheduledDate = {};
    if (from) filter.scheduledDate.$gte = from;
    if (to) filter.scheduledDate.$lte = to;
  }
  return filter;
}

async function listServices(user, query) {
  const scope = await buildScopeFilter(user);
  const filter = { $and: [scope, buildQueryFilter(query)] };
  const direction = query.sort.startsWith('-') ? -1 : 1;
  return withRefs(Service.find(filter).sort({ scheduledDate: direction, _id: direction }));
}

const MY_SERVICES_SCOPES = {
  upcoming: { filter: { status: { $ne: SERVICE_STATUS.COMPLETED } }, sort: { scheduledDate: 1 } },
  history: { filter: { status: SERVICE_STATUS.COMPLETED }, sort: { completedAt: -1 } },
  all: { filter: {}, sort: { scheduledDate: -1 } },
};

/** Services in the caller's scope, split into `upcoming`, `history` or `all`. */
async function listMyServices(user, scopeName) {
  const { filter, sort } = MY_SERVICES_SCOPES[scopeName];
  const scope = await buildScopeFilter(user);
  return withRefs(Service.find({ $and: [scope, filter] }).sort(sort));
}

/** Returns a service visible to `user`; out-of-scope services are reported as 404. */
async function getServiceForUser(user, id) {
  const scope = await buildScopeFilter(user);
  const service = await withRefs(Service.findOne({ $and: [{ _id: id }, scope] }));
  if (!service) throw ApiError.notFound('Service not found');
  return service;
}

async function findServiceOrFail(id) {
  const service = await Service.findById(id);
  if (!service) throw ApiError.notFound('Service not found');
  return service;
}

/** Ensures the referenced vehicle exists and the technician has role `technician`. */
async function assertReferences({ vehicle, technician }) {
  if (vehicle !== undefined && !(await Vehicle.exists({ _id: vehicle }))) {
    throw ApiError.badRequest('Vehicle does not exist', [{ path: 'vehicle', message: 'Vehicle not found' }]);
  }
  if (technician !== undefined) {
    const tech = await User.findById(technician);
    if (!tech || tech.role !== ROLES.TECHNICIAN) {
      throw ApiError.badRequest('Services can only be assigned to users with role "technician"', [
        { path: 'technician', message: 'Must reference an existing user with role "technician"' },
      ]);
    }
  }
}

/** Technicians may only act on services assigned to them; admins on any. */
function assertCanActOn(user, service) {
  if (user.role === ROLES.ADMIN) return;
  if (!service.technician.equals(user._id)) {
    throw ApiError.forbidden('This service is not assigned to you');
  }
}

async function createService(data) {
  await assertReferences(data);
  const service = await Service.create(data);
  return withRefs(Service.findById(service._id));
}

/** Admin edit of scheduling fields. Completed services are locked. */
async function updateService(id, data) {
  const service = await findServiceOrFail(id);
  if (service.status === SERVICE_STATUS.COMPLETED) {
    throw ApiError.invalidTransition('Completed services are locked and cannot be edited');
  }
  await assertReferences({ technician: data.technician });
  service.set(data);
  await service.save();
  return withRefs(Service.findById(service._id));
}

async function deleteService(id) {
  const service = await Service.findByIdAndDelete(id);
  if (!service) throw ApiError.notFound('Service not found');
}

/** Timestamp changes that accompany a status transition. */
function timestampsFor(nextStatus, now) {
  switch (nextStatus) {
    case SERVICE_STATUS.IN_PROGRESS:
      return { startedAt: now };
    case SERVICE_STATUS.COMPLETED:
      return { completedAt: now };
    case SERVICE_STATUS.PENDING:
      return { startedAt: null, completedAt: null };
    default:
      return {};
  }
}

/**
 * Moves a service through its status workflow on behalf of its technician.
 * The update is guarded on the current status so concurrent changes cannot
 * skip the transition rules.
 */
async function updateStatus(user, id, nextStatus) {
  const service = await findServiceOrFail(id);
  assertCanActOn(user, service);

  const current = service.status;
  if (current === SERVICE_STATUS.COMPLETED) {
    throw ApiError.invalidTransition('Completed services are locked');
  }
  if (!SERVICE_TRANSITIONS[current].includes(nextStatus)) {
    throw ApiError.invalidTransition(`Cannot change status from "${current}" to "${nextStatus}"`);
  }

  const updated = await withRefs(
    Service.findOneAndUpdate(
      { _id: service._id, status: current },
      { status: nextStatus, ...timestampsFor(nextStatus, new Date()) },
      { returnDocument: 'after' },
    ),
  );
  if (!updated) throw ApiError.conflict('Service status changed concurrently; reload and retry');
  return updated;
}

/** Appends a note authored by `user` (the assigned technician or an admin). */
async function addNote(user, id, text) {
  const service = await findServiceOrFail(id);
  assertCanActOn(user, service);
  service.notes.push({ text, author: user._id });
  await service.save();
  return withRefs(Service.findById(service._id));
}

module.exports = {
  buildScopeFilter,
  listServices,
  listMyServices,
  getServiceForUser,
  createService,
  updateService,
  deleteService,
  updateStatus,
  addNote,
  withRefs,
};
