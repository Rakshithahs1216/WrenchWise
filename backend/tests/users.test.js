const { useTestDb } = require('./helpers/db');
const { api, bearer, createUser, createVehicle, createService } = require('./helpers/factory');
const { User, Vehicle } = require('../src/models');

useTestDb();

describe('admin-only routes', () => {
  const adminRoutes = [
    ['get', '/api/users'],
    ['post', '/api/users'],
    ['get', '/api/vehicles'],
    ['post', '/api/vehicles'],
    ['post', '/api/services'],
  ];

  it.each(['technician', 'user'])('return 403 FORBIDDEN for role %s', async (role) => {
    const { token } = await createUser(role);
    for (const [method, path] of adminRoutes) {
      const res = await api()[method](path).set(bearer(token)).send({});
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    }
  });

  it('return 401 without a token', async () => {
    for (const [method, path] of adminRoutes) {
      const res = await api()[method](path).send({});
      expect(res.status).toBe(401);
    }
  });
});

describe('/api/users', () => {
  let admin;
  beforeEach(async () => {
    admin = await createUser('admin');
  });

  it('creates a user (201) with a bcrypt cost-12 hash and never returns it', async () => {
    const res = await api()
      .post('/api/users')
      .set(bearer(admin.token))
      .send({ name: 'Asha Rao', email: 'Asha@WrenchWise.dev', password: 'Secret@123', role: 'technician' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Asha Rao', email: 'asha@wrenchwise.dev', role: 'technician' });
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('__v');

    const stored = await User.findById(res.body.user.id).select('+passwordHash');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('rejects a duplicate email with 409', async () => {
    const body = { name: 'Dup', email: 'dup@test.dev', password: 'Secret@123', role: 'user' };
    await api().post('/api/users').set(bearer(admin.token)).send(body).expect(201);
    const res = await api().post('/api/users').set(bearer(admin.token)).send(body);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates the body (short password, bad role)', async () => {
    const res = await api()
      .post('/api/users')
      .set(bearer(admin.token))
      .send({ name: 'X', email: 'x@test.dev', password: 'short', role: 'superuser' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(['password', 'role']));
  });

  it('lists users with an optional role filter', async () => {
    await createUser('technician');
    await createUser('user');

    const all = await api().get('/api/users').set(bearer(admin.token));
    expect(all.status).toBe(200);
    expect(all.body.users).toHaveLength(3);

    const techs = await api().get('/api/users?role=technician').set(bearer(admin.token));
    expect(techs.body.users).toHaveLength(1);
    expect(techs.body.users[0].role).toBe('technician');

    const bad = await api().get('/api/users?role=nope').set(bearer(admin.token));
    expect(bad.status).toBe(400);
  });

  it('gets, updates and deletes a user', async () => {
    const { user } = await createUser('user');

    const got = await api().get(`/api/users/${user.id}`).set(bearer(admin.token));
    expect(got.status).toBe(200);
    expect(got.body.user.email).toBe(user.email);

    const patched = await api().patch(`/api/users/${user.id}`).set(bearer(admin.token)).send({ name: 'Renamed' });
    expect(patched.status).toBe(200);
    expect(patched.body.user.name).toBe('Renamed');

    await api().delete(`/api/users/${user.id}`).set(bearer(admin.token)).expect(204);
    await api().get(`/api/users/${user.id}`).set(bearer(admin.token)).expect(404);
  });

  it('updates the password so the user can log in with it', async () => {
    const { user } = await createUser('user');
    await api().patch(`/api/users/${user.id}`).set(bearer(admin.token)).send({ password: 'BrandNew@99' }).expect(200);
    const res = await api().post('/api/auth/login').send({ email: user.email, password: 'BrandNew@99' });
    expect(res.status).toBe(200);
  });

  it('returns 409 when changing to an existing email', async () => {
    const { user } = await createUser('user');
    const res = await api().patch(`/api/users/${user.id}`).set(bearer(admin.token)).send({ email: admin.user.email });
    expect(res.status).toBe(409);
  });

  it('rejects an empty PATCH body and malformed ids with 400', async () => {
    const { user } = await createUser('user');
    await api().patch(`/api/users/${user.id}`).set(bearer(admin.token)).send({}).expect(400);
    const res = await api().get('/api/users/not-an-id').set(bearer(admin.token));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for a missing user', async () => {
    const res = await api().get('/api/users/0123456789abcdef01234567').set(bearer(admin.token));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('refuses to delete yourself with 409', async () => {
    const res = await api().delete(`/api/users/${admin.user.id}`).set(bearer(admin.token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('refuses to change your own role with 409', async () => {
    const res = await api().patch(`/api/users/${admin.user.id}`).set(bearer(admin.token)).send({ role: 'user' });
    expect(res.status).toBe(409);
  });

  it('unassigns vehicles when deleting their user', async () => {
    const { user } = await createUser('user');
    const vehicle = await createVehicle({ assignedUser: user._id });
    await api().delete(`/api/users/${user.id}`).set(bearer(admin.token)).expect(204);
    expect((await Vehicle.findById(vehicle._id)).assignedUser).toBeNull();
  });

  it('refuses to delete a technician with open services (409) but allows it once completed', async () => {
    const tech = await createUser('technician');
    const vehicle = await createVehicle();
    const service = await createService({ vehicle: vehicle._id, technician: tech.user._id });

    const res = await api().delete(`/api/users/${tech.user.id}`).set(bearer(admin.token));
    expect(res.status).toBe(409);

    service.status = 'completed';
    await service.save();
    await api().delete(`/api/users/${tech.user.id}`).set(bearer(admin.token)).expect(204);
  });
});
