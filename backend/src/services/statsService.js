const { Vehicle, Service } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES, SERVICE_STATUS } = require('../constants');
const { buildScopeFilter, withRefs } = require('./serviceService');

const MONTHS_BACK = 11; // plus the current month → last 12 months
const MONTHS_AHEAD = 3;

/** `YYYY-MM` key for a UTC date. */
function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

/** Ordered list of month keys from `MONTHS_BACK` months ago to `MONTHS_AHEAD` months ahead (UTC). */
function monthWindow(now) {
  const months = [];
  for (let offset = -MONTHS_BACK; offset <= MONTHS_AHEAD; offset += 1) {
    months.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1))));
  }
  return months;
}

/** Number of vehicles visible to `user`: all, assigned, or ones the technician has services on. */
async function countVisibleVehicles(user, scope) {
  if (user.role === ROLES.ADMIN) return Vehicle.countDocuments();
  if (user.role === ROLES.USER) return Vehicle.countDocuments({ assignedUser: user._id });
  const vehicleIds = await Service.distinct('vehicle', scope);
  return vehicleIds.length;
}

/** Counts per month bucket of `dateField` for services matching `match` inside [start, end). */
async function countByMonth(match, dateField, start, end) {
  const rows = await Service.aggregate([
    { $match: { $and: [match, { [dateField]: { $gte: start, $lt: end } }] } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } }, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id, row.count]));
}

/**
 * Dashboard summary scoped to the caller: totals, counts by type, a 15-month
 * scheduled-vs-completed series and upcoming-vs-completed.
 */
async function getSummary(user) {
  const scope = await buildScopeFilter(user);
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MONTHS_BACK, 1));
  const windowEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + MONTHS_AHEAD + 1, 1));
  const notCompleted = { $ne: SERVICE_STATUS.COMPLETED };

  const [vehicles, [facets], scheduledByMonth, completedByMonth] = await Promise.all([
    countVisibleVehicles(user, scope),
    Service.aggregate([
      { $match: scope },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byType: [
            { $group: { _id: '$serviceType', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          overdue: [{ $match: { status: notCompleted, scheduledDate: { $lt: now } } }, { $count: 'count' }],
        },
      },
    ]),
    countByMonth(scope, 'scheduledDate', windowStart, windowEnd),
    countByMonth({ $and: [scope, { status: SERVICE_STATUS.COMPLETED }] }, 'completedAt', windowStart, windowEnd),
  ]);

  const statusCount = Object.fromEntries(facets.byStatus.map((row) => [row._id, row.count]));
  const pending = statusCount[SERVICE_STATUS.PENDING] ?? 0;
  const inProgress = statusCount[SERVICE_STATUS.IN_PROGRESS] ?? 0;
  const completed = statusCount[SERVICE_STATUS.COMPLETED] ?? 0;

  return {
    totals: {
      vehicles,
      services: pending + inProgress + completed,
      pending,
      inProgress,
      completed,
      overdue: facets.overdue[0]?.count ?? 0,
    },
    byType: facets.byType.map((row) => ({ serviceType: row._id, count: row.count })),
    monthly: monthWindow(now).map((month) => ({
      month,
      scheduled: scheduledByMonth.get(month) ?? 0,
      completed: completedByMonth.get(month) ?? 0,
    })),
    // "Upcoming" matches /me/services?scope=upcoming: all outstanding work, overdue included.
    upcomingVsCompleted: { upcoming: pending + inProgress, completed },
  };
}

/**
 * Service history for one vehicle, ascending by scheduled date. Users must own
 * the vehicle and technicians must have at least one service on it, else 404.
 * Services are filtered with the same scope as `/services`.
 */
async function getVehicleTimeline(user, vehicleId) {
  const vehicle = await Vehicle.findById(vehicleId).populate('assignedUser', 'name email');
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const scope = await buildScopeFilter(user);
  const filter = { $and: [scope, { vehicle: vehicle._id }] };

  if (user.role === ROLES.USER && !vehicle.assignedUser?._id.equals(user._id)) {
    throw ApiError.notFound('Vehicle not found');
  }
  if (user.role === ROLES.TECHNICIAN && !(await Service.exists(filter))) {
    throw ApiError.notFound('Vehicle not found');
  }

  const services = await withRefs(Service.find(filter).sort({ scheduledDate: 1, _id: 1 }));
  return { vehicle, services };
}

module.exports = { getSummary, getVehicleTimeline };
