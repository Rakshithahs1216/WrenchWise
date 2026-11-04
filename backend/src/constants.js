/** Domain enums shared by models, validators and services. */

const ROLES = Object.freeze({ ADMIN: 'admin', TECHNICIAN: 'technician', USER: 'user' });
const ROLE_VALUES = Object.values(ROLES);

const VEHICLE_STATUSES = ['active', 'in-service', 'retired'];

const SERVICE_TYPES = [
  'oil-change',
  'tire-rotation',
  'brake-inspection',
  'battery-check',
  'engine-diagnostics',
  'transmission-service',
  'general-inspection',
  'other',
];

const SERVICE_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
});
const SERVICE_STATUS_VALUES = Object.values(SERVICE_STATUS);

/** Allowed status transitions: from → list of permitted targets. */
const SERVICE_TRANSITIONS = Object.freeze({
  [SERVICE_STATUS.PENDING]: [SERVICE_STATUS.IN_PROGRESS],
  [SERVICE_STATUS.IN_PROGRESS]: [SERVICE_STATUS.COMPLETED, SERVICE_STATUS.PENDING],
  [SERVICE_STATUS.COMPLETED]: [],
});

const AUTH_COOKIE = 'ww_token';

module.exports = {
  ROLES,
  ROLE_VALUES,
  VEHICLE_STATUSES,
  SERVICE_TYPES,
  SERVICE_STATUS,
  SERVICE_STATUS_VALUES,
  SERVICE_TRANSITIONS,
  AUTH_COOKIE,
};
