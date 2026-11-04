const bcrypt = require('bcrypt');
const request = require('supertest');
const { createApp } = require('../../src/app');
const { User, Vehicle, Service } = require('../../src/models');
const { signToken } = require('../../src/services/authService');

const app = createApp();
const DEFAULT_PASSWORD = 'Password@123';
// Low cost keeps fixtures fast; bcrypt.compare reads the cost from the hash.
const FIXTURE_HASH = bcrypt.hashSync(DEFAULT_PASSWORD, 4);

let counter = 0;
const nextId = () => {
  counter += 1;
  return counter;
};

/** Creates a user with the given role and returns `{ user, token }`. */
async function createUser(role = 'user', overrides = {}) {
  const n = nextId();
  const user = await User.create({
    name: `${role} ${n}`,
    email: `${role}${n}@test.dev`,
    passwordHash: FIXTURE_HASH,
    role,
    ...overrides,
  });
  return { user, token: signToken(user) };
}

async function createVehicle(overrides = {}) {
  const n = nextId();
  return Vehicle.create({
    registrationNumber: `KA01AB${String(n).padStart(4, '0')}`,
    make: 'Tata',
    model: 'Ace EV',
    year: 2023,
    ...overrides,
  });
}

/** Creates a service; `vehicle` and `technician` are required overrides. */
function createService(overrides) {
  return Service.create({
    serviceType: 'oil-change',
    scheduledDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    ...overrides,
  });
}

/** `Authorization` header object for supertest's `.set()`. */
const bearer = (token) => ({ Authorization: `Bearer ${token}` });

/** Supertest agent bound to the shared app. */
const api = () => request(app);

module.exports = { api, bearer, createUser, createVehicle, createService, DEFAULT_PASSWORD };
