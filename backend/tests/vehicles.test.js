const { useTestDb } = require('./helpers/db');
const { api, bearer, createUser, createVehicle, createService } = require('./helpers/factory');
const { Service } = require('../src/models');

useTestDb();

describe('/api/vehicles', () => {
  let admin;
  beforeEach(async () => {
    admin = await createUser('admin');
  });

  const newVehicle = { registrationNumber: 'ka 05 mn 4321', make: 'Mahindra', model: 'Treo', year: 2024 };

  it('creates a vehicle with defaults and an upper-cased registration number', async () => {
    const res = await api().post('/api/vehicles').set(bearer(admin.token)).send(newVehicle);
    expect(res.status).toBe(201);
    expect(res.body.vehicle).toMatchObject({
      registrationNumber: 'KA05MN4321',
      make: 'Mahindra',
      status: 'active',
      mileage: 0,
      assignedUser: null,
    });
    expect(res.body.vehicle.id).toBeDefined();
  });

  it('rejects a duplicate registration number with 409', async () => {
    await api().post('/api/vehicles').set(bearer(admin.token)).send(newVehicle).expect(201);
    const res = await api()
      .post('/api/vehicles')
      .set(bearer(admin.token))
      .send({ ...newVehicle, registrationNumber: 'KA05MN4321' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates the body', async () => {
    const res = await api().post('/api/vehicles').set(bearer(admin.token)).send({ make: 'Tata', year: 1800 });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['registrationNumber', 'model', 'year']),
    );
  });

  it('lists with status, assignedUser and search filters', async () => {
    const { user } = await createUser('user');
    await createVehicle({ make: 'Tata', model: 'Ace EV', assignedUser: user._id });
    await createVehicle({ make: 'Ashok Leyland', model: 'Dost', status: 'retired' });

    const all = await api().get('/api/vehicles').set(bearer(admin.token));
    expect(all.body.vehicles).toHaveLength(2);

    const retired = await api().get('/api/vehicles?status=retired').set(bearer(admin.token));
    expect(retired.body.vehicles.map((v) => v.make)).toEqual(['Ashok Leyland']);

    const mine = await api().get(`/api/vehicles?assignedUser=${user.id}`).set(bearer(admin.token));
    expect(mine.body.vehicles).toHaveLength(1);
    expect(mine.body.vehicles[0].assignedUser).toEqual({ id: user.id, name: user.name, email: user.email });

    const search = await api().get('/api/vehicles?q=dost').set(bearer(admin.token));
    expect(search.body.vehicles).toHaveLength(1);
  });

  it('gets, updates and deletes a vehicle (deleting its services)', async () => {
    const tech = await createUser('technician');
    const vehicle = await createVehicle();
    await createService({ vehicle: vehicle._id, technician: tech.user._id });

    const got = await api().get(`/api/vehicles/${vehicle.id}`).set(bearer(admin.token));
    expect(got.status).toBe(200);

    const patched = await api()
      .patch(`/api/vehicles/${vehicle.id}`)
      .set(bearer(admin.token))
      .send({ mileage: 20500, status: 'in-service' });
    expect(patched.status).toBe(200);
    expect(patched.body.vehicle).toMatchObject({ mileage: 20500, status: 'in-service' });

    await api().delete(`/api/vehicles/${vehicle.id}`).set(bearer(admin.token)).expect(204);
    await api().get(`/api/vehicles/${vehicle.id}`).set(bearer(admin.token)).expect(404);
    expect(await Service.countDocuments({ vehicle: vehicle._id })).toBe(0);
  });

  it('returns 404 for a missing vehicle', async () => {
    await api().delete('/api/vehicles/0123456789abcdef01234567').set(bearer(admin.token)).expect(404);
  });
});

describe('PATCH /api/vehicles/:id/assign', () => {
  let admin;
  let vehicle;
  beforeEach(async () => {
    admin = await createUser('admin');
    vehicle = await createVehicle();
  });

  it('assigns to a user and unassigns with null', async () => {
    const { user } = await createUser('user');

    const assigned = await api()
      .patch(`/api/vehicles/${vehicle.id}/assign`)
      .set(bearer(admin.token))
      .send({ userId: user.id });
    expect(assigned.status).toBe(200);
    expect(assigned.body.vehicle.assignedUser).toEqual({ id: user.id, name: user.name, email: user.email });

    const cleared = await api()
      .patch(`/api/vehicles/${vehicle.id}/assign`)
      .set(bearer(admin.token))
      .send({ userId: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.vehicle.assignedUser).toBeNull();
  });

  it.each(['technician', 'admin'])('rejects assigning to a %s with 400', async (role) => {
    const { user } = await createUser(role);
    const res = await api()
      .patch(`/api/vehicles/${vehicle.id}/assign`)
      .set(bearer(admin.token))
      .send({ userId: user.id });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a non-existent user with 400 and a missing userId key with 400', async () => {
    await api()
      .patch(`/api/vehicles/${vehicle.id}/assign`)
      .set(bearer(admin.token))
      .send({ userId: '0123456789abcdef01234567' })
      .expect(400);
    await api().patch(`/api/vehicles/${vehicle.id}/assign`).set(bearer(admin.token)).send({}).expect(400);
  });

  it('applies the same rule when assignedUser is set on create', async () => {
    const tech = await createUser('technician');
    const res = await api()
      .post('/api/vehicles')
      .set(bearer(admin.token))
      .send({ registrationNumber: 'MH12XY0001', make: 'Eicher', model: 'Pro 2049', year: 2022, assignedUser: tech.user.id });
    expect(res.status).toBe(400);
  });
});
