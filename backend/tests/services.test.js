const { useTestDb } = require('./helpers/db');
const { api, bearer, createUser, createVehicle, createService } = require('./helpers/factory');

useTestDb();

const DAY = 24 * 3600 * 1000;

/** Admin, two technicians, two users each owning one vehicle with one service. */
async function seedFleet() {
  const admin = await createUser('admin');
  const tech1 = await createUser('technician');
  const tech2 = await createUser('technician');
  const owner1 = await createUser('user');
  const owner2 = await createUser('user');
  const vehicle1 = await createVehicle({ assignedUser: owner1.user._id });
  const vehicle2 = await createVehicle({ assignedUser: owner2.user._id });
  const service1 = await createService({ vehicle: vehicle1._id, technician: tech1.user._id });
  const service2 = await createService({ vehicle: vehicle2._id, technician: tech2.user._id });
  return { admin, tech1, tech2, owner1, owner2, vehicle1, vehicle2, service1, service2 };
}

describe('POST /api/services', () => {
  it('creates a pending service with populated refs', async () => {
    const { admin, tech1, vehicle1 } = await seedFleet();
    const res = await api()
      .post('/api/services')
      .set(bearer(admin.token))
      .send({
        vehicle: vehicle1.id,
        technician: tech1.user.id,
        serviceType: 'brake-inspection',
        scheduledDate: '2026-12-01',
        description: 'Front pads squeal',
      });

    expect(res.status).toBe(201);
    expect(res.body.service).toMatchObject({
      serviceType: 'brake-inspection',
      status: 'pending',
      description: 'Front pads squeal',
      scheduledDate: '2026-12-01T00:00:00.000Z',
      vehicle: { id: vehicle1.id, registrationNumber: vehicle1.registrationNumber, make: 'Tata', model: 'Ace EV' },
      technician: { id: tech1.user.id, name: tech1.user.name, email: tech1.user.email },
      notes: [],
      startedAt: null,
      completedAt: null,
    });
  });

  it.each(['user', 'admin'])('rejects a technician id whose role is %s with 400', async (role) => {
    const { admin, vehicle1 } = await seedFleet();
    const other = await createUser(role);
    const res = await api()
      .post('/api/services')
      .set(bearer(admin.token))
      .send({ vehicle: vehicle1.id, technician: other.user.id, serviceType: 'oil-change', scheduledDate: '2026-12-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('technician');
  });

  it('rejects an unknown vehicle and invalid fields with 400', async () => {
    const { admin, tech1 } = await seedFleet();
    const missing = await api().post('/api/services').set(bearer(admin.token)).send({
      vehicle: '0123456789abcdef01234567',
      technician: tech1.user.id,
      serviceType: 'oil-change',
      scheduledDate: '2026-12-01',
    });
    expect(missing.status).toBe(400);

    const invalid = await api()
      .post('/api/services')
      .set(bearer(admin.token))
      .send({ vehicle: 'x', technician: tech1.user.id, serviceType: 'wash', scheduledDate: 'soon' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.map((d) => d.path)).toEqual(
      expect.arrayContaining(['vehicle', 'serviceType', 'scheduledDate']),
    );
  });
});

describe('admin PATCH / DELETE /api/services/:id', () => {
  it('updates scheduling fields and deletes', async () => {
    const { admin, tech2, service1 } = await seedFleet();
    const res = await api()
      .patch(`/api/services/${service1.id}`)
      .set(bearer(admin.token))
      .send({ technician: tech2.user.id, serviceType: 'tire-rotation' });
    expect(res.status).toBe(200);
    expect(res.body.service).toMatchObject({ serviceType: 'tire-rotation', technician: { id: tech2.user.id } });

    await api().delete(`/api/services/${service1.id}`).set(bearer(admin.token)).expect(204);
    await api().get(`/api/services/${service1.id}`).set(bearer(admin.token)).expect(404);
  });

  it('rejects editing a completed service with 400 INVALID_TRANSITION', async () => {
    const { admin, service1 } = await seedFleet();
    service1.status = 'completed';
    await service1.save();
    const res = await api().patch(`/api/services/${service1.id}`).set(bearer(admin.token)).send({ description: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('is forbidden for technicians and users', async () => {
    const { tech1, owner1, service1 } = await seedFleet();
    for (const { token } of [tech1, owner1]) {
      await api().patch(`/api/services/${service1.id}`).set(bearer(token)).send({ description: 'x' }).expect(403);
      await api().delete(`/api/services/${service1.id}`).set(bearer(token)).expect(403);
    }
  });
});

describe('PATCH /api/services/:id/status', () => {
  const setStatus = (token, id, status) =>
    api().patch(`/api/services/${id}/status`).set(bearer(token)).send({ status });

  it('walks the workflow and maintains timestamps', async () => {
    const { tech1, service1 } = await seedFleet();

    const started = await setStatus(tech1.token, service1.id, 'in-progress');
    expect(started.status).toBe(200);
    expect(started.body.service.status).toBe('in-progress');
    expect(started.body.service.startedAt).not.toBeNull();

    const reverted = await setStatus(tech1.token, service1.id, 'pending');
    expect(reverted.status).toBe(200);
    expect(reverted.body.service).toMatchObject({ status: 'pending', startedAt: null, completedAt: null });

    await setStatus(tech1.token, service1.id, 'in-progress').expect(200);
    const done = await setStatus(tech1.token, service1.id, 'completed');
    expect(done.status).toBe(200);
    expect(done.body.service.status).toBe('completed');
    expect(done.body.service.completedAt).not.toBeNull();
  });

  it("returns 403 for another technician's service", async () => {
    const { tech1, service2 } = await seedFleet();
    const res = await setStatus(tech1.token, service2.id, 'in-progress');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 INVALID_TRANSITION for pending → completed', async () => {
    const { tech1, service1 } = await seedFleet();
    const res = await setStatus(tech1.token, service1.id, 'completed');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('locks completed services', async () => {
    const { tech1, service1 } = await seedFleet();
    await setStatus(tech1.token, service1.id, 'in-progress').expect(200);
    await setStatus(tech1.token, service1.id, 'completed').expect(200);
    for (const status of ['pending', 'in-progress', 'completed']) {
      const res = await setStatus(tech1.token, service1.id, status);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('is technician-only and validates the status value', async () => {
    const { admin, owner1, tech1, service1 } = await seedFleet();
    await setStatus(admin.token, service1.id, 'in-progress').expect(403);
    await setStatus(owner1.token, service1.id, 'in-progress').expect(403);
    await setStatus(tech1.token, service1.id, 'done').expect(400);
    await setStatus(tech1.token, '0123456789abcdef01234567', 'in-progress').expect(404);
  });
});

describe('POST /api/services/:id/notes', () => {
  const addNote = (token, id, text) => api().post(`/api/services/${id}/notes`).set(bearer(token)).send({ text });

  it('lets the assigned technician and admins add notes', async () => {
    const { admin, tech1, service1 } = await seedFleet();

    const first = await addNote(tech1.token, service1.id, 'Replaced oil filter');
    expect(first.status).toBe(201);
    expect(first.body.service.notes).toHaveLength(1);
    expect(first.body.service.notes[0]).toMatchObject({
      text: 'Replaced oil filter',
      author: { id: tech1.user.id, name: tech1.user.name },
    });
    expect(first.body.service.notes[0].id).toBeDefined();
    expect(first.body.service.notes[0].createdAt).toBeDefined();

    const second = await addNote(admin.token, service1.id, 'Customer informed');
    expect(second.status).toBe(201);
    expect(second.body.service.notes).toHaveLength(2);
  });

  it('forbids other technicians and users', async () => {
    const { tech2, owner1, service1 } = await seedFleet();
    await addNote(tech2.token, service1.id, 'hi').expect(403);
    await addNote(owner1.token, service1.id, 'hi').expect(403);
  });

  it('validates the text length', async () => {
    const { tech1, service1 } = await seedFleet();
    await addNote(tech1.token, service1.id, '   ').expect(400);
    await addNote(tech1.token, service1.id, 'x'.repeat(1001)).expect(400);
  });
});

describe('GET /api/services scoping', () => {
  it('admin sees every service', async () => {
    const { admin } = await seedFleet();
    const res = await api().get('/api/services').set(bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.services).toHaveLength(2);
  });

  it('technician sees only services assigned to them', async () => {
    const { tech1, service1, service2 } = await seedFleet();
    const res = await api().get('/api/services').set(bearer(tech1.token));
    expect(res.body.services.map((s) => s.id)).toEqual([service1.id]);
    await api().get(`/api/services/${service1.id}`).set(bearer(tech1.token)).expect(200);
    await api().get(`/api/services/${service2.id}`).set(bearer(tech1.token)).expect(404);
  });

  it("user sees only their vehicles' services; another's service is 404", async () => {
    const { owner1, service1, service2 } = await seedFleet();
    const res = await api().get('/api/services').set(bearer(owner1.token));
    expect(res.body.services.map((s) => s.id)).toEqual([service1.id]);

    await api().get(`/api/services/${service1.id}`).set(bearer(owner1.token)).expect(200);
    const other = await api().get(`/api/services/${service2.id}`).set(bearer(owner1.token));
    expect(other.status).toBe(404);
    expect(other.body.error.code).toBe('NOT_FOUND');
  });

  it("query filters cannot widen a user's scope", async () => {
    const { owner1, vehicle2 } = await seedFleet();
    const res = await api().get(`/api/services?vehicle=${vehicle2.id}`).set(bearer(owner1.token));
    expect(res.body.services).toHaveLength(0);
  });

  it('filters by status, date range and sorts', async () => {
    const { admin, tech1, vehicle1 } = await seedFleet();
    const base = Date.now();
    await createService({ vehicle: vehicle1._id, technician: tech1.user._id, scheduledDate: new Date(base - 30 * DAY), status: 'completed' });
    await createService({ vehicle: vehicle1._id, technician: tech1.user._id, scheduledDate: new Date(base + 60 * DAY) });

    const completed = await api().get('/api/services?status=completed').set(bearer(admin.token));
    expect(completed.body.services).toHaveLength(1);

    const from = new Date(base).toISOString();
    const to = new Date(base + 10 * DAY).toISOString();
    const ranged = await api().get('/api/services').query({ from, to }).set(bearer(admin.token));
    expect(ranged.body.services).toHaveLength(2);

    const desc = await api().get('/api/services?sort=-scheduledDate').set(bearer(admin.token));
    const dates = desc.body.services.map((s) => s.scheduledDate);
    expect(dates).toEqual([...dates].sort().reverse());

    await api().get('/api/services?sort=name').set(bearer(admin.token)).expect(400);
  });
});
