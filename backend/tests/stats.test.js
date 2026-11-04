const { useTestDb } = require('./helpers/db');
const { api, bearer, createUser, createVehicle, createService } = require('./helpers/factory');

useTestDb();

const DAY = 24 * 3600 * 1000;

async function seed() {
  const admin = await createUser('admin');
  const tech1 = await createUser('technician');
  const tech2 = await createUser('technician');
  const owner = await createUser('user');
  const vehicle1 = await createVehicle({ assignedUser: owner.user._id });
  const vehicle2 = await createVehicle();
  await createVehicle(); // a vehicle with no services

  const now = Date.now();
  await createService({ vehicle: vehicle1._id, technician: tech1.user._id, serviceType: 'oil-change', scheduledDate: new Date(now - 40 * DAY), status: 'completed', startedAt: new Date(now - 40 * DAY), completedAt: new Date(now - 40 * DAY) });
  await createService({ vehicle: vehicle1._id, technician: tech1.user._id, serviceType: 'oil-change', scheduledDate: new Date(now - 3 * DAY) }); // overdue
  await createService({ vehicle: vehicle1._id, technician: tech2.user._id, serviceType: 'battery-check', scheduledDate: new Date(now + 10 * DAY), status: 'in-progress' });
  await createService({ vehicle: vehicle2._id, technician: tech2.user._id, serviceType: 'tire-rotation', scheduledDate: new Date(now + 20 * DAY) });

  return { admin, tech1, tech2, owner, vehicle1, vehicle2 };
}

describe('GET /api/stats/summary', () => {
  it('returns the documented shape for admins', async () => {
    const { admin } = await seed();
    const res = await api().get('/api/stats/summary').set(bearer(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({ vehicles: 3, services: 4, pending: 2, inProgress: 1, completed: 1, overdue: 1 });
    expect(res.body.byType).toEqual([
      { serviceType: 'oil-change', count: 2 },
      { serviceType: 'battery-check', count: 1 },
      { serviceType: 'tire-rotation', count: 1 },
    ]);
    expect(res.body.upcomingVsCompleted).toEqual({ upcoming: 3, completed: 1 });

    const { monthly } = res.body;
    expect(monthly).toHaveLength(15);
    const now = new Date();
    const current = now.toISOString().slice(0, 7);
    expect(monthly[11].month).toBe(current);
    for (const row of monthly) {
      expect(row).toEqual({ month: expect.stringMatching(/^\d{4}-\d{2}$/), scheduled: expect.any(Number), completed: expect.any(Number) });
    }
    expect(monthly.reduce((sum, m) => sum + m.scheduled, 0)).toBe(4);
    expect(monthly.reduce((sum, m) => sum + m.completed, 0)).toBe(1);
  });

  it('is scoped for technicians', async () => {
    const { tech1 } = await seed();
    const res = await api().get('/api/stats/summary').set(bearer(tech1.token));
    expect(res.body.totals).toEqual({ vehicles: 1, services: 2, pending: 1, inProgress: 0, completed: 1, overdue: 1 });
    expect(res.body.byType).toEqual([{ serviceType: 'oil-change', count: 2 }]);
  });

  it('is scoped for users', async () => {
    const { owner } = await seed();
    const res = await api().get('/api/stats/summary').set(bearer(owner.token));
    expect(res.body.totals).toEqual({ vehicles: 1, services: 3, pending: 1, inProgress: 1, completed: 1, overdue: 1 });
    expect(res.body.upcomingVsCompleted).toEqual({ upcoming: 2, completed: 1 });
  });

  it('requires authentication', async () => {
    await api().get('/api/stats/summary').expect(401);
  });
});

describe('GET /api/stats/vehicles/:id/timeline', () => {
  it('returns the vehicle and its services ascending for admins', async () => {
    const { admin, vehicle1 } = await seed();
    const res = await api().get(`/api/stats/vehicles/${vehicle1.id}/timeline`).set(bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.vehicle.id).toBe(vehicle1.id);
    expect(res.body.services).toHaveLength(3);
    const dates = res.body.services.map((s) => s.scheduledDate);
    expect(dates).toEqual([...dates].sort());
  });

  it('allows the owning user and 404s for other vehicles', async () => {
    const { owner, vehicle1, vehicle2 } = await seed();
    await api().get(`/api/stats/vehicles/${vehicle1.id}/timeline`).set(bearer(owner.token)).expect(200);
    const res = await api().get(`/api/stats/vehicles/${vehicle2.id}/timeline`).set(bearer(owner.token));
    expect(res.status).toBe(404);
  });

  it('allows a technician with a service on the vehicle, scoped to their services', async () => {
    const { tech1, vehicle1, vehicle2 } = await seed();
    const res = await api().get(`/api/stats/vehicles/${vehicle1.id}/timeline`).set(bearer(tech1.token));
    expect(res.status).toBe(200);
    expect(res.body.services).toHaveLength(2);
    await api().get(`/api/stats/vehicles/${vehicle2.id}/timeline`).set(bearer(tech1.token)).expect(404);
  });

  it('404s for a missing vehicle and 400s for a malformed id', async () => {
    const { admin } = await seed();
    await api().get('/api/stats/vehicles/0123456789abcdef01234567/timeline').set(bearer(admin.token)).expect(404);
    await api().get('/api/stats/vehicles/bad/timeline').set(bearer(admin.token)).expect(400);
  });
});
