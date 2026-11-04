const { useTestDb } = require('./helpers/db');
const { api, bearer, createUser, createVehicle, createService } = require('./helpers/factory');

useTestDb();

const DAY = 24 * 3600 * 1000;

async function seed() {
  const tech = await createUser('technician');
  const owner = await createUser('user');
  const stranger = await createUser('user');
  const vehicle = await createVehicle({ assignedUser: owner.user._id });
  await createVehicle({ assignedUser: stranger.user._id });

  const now = Date.now();
  const make = (offsetDays, extra = {}) =>
    createService({ vehicle: vehicle._id, technician: tech.user._id, scheduledDate: new Date(now + offsetDays * DAY), ...extra });

  const later = await make(20);
  const soon = await make(5, { status: 'in-progress', startedAt: new Date() });
  const olderDone = await make(-60, { status: 'completed', completedAt: new Date(now - 59 * DAY) });
  const recentDone = await make(-10, { status: 'completed', completedAt: new Date(now - 9 * DAY) });
  return { tech, owner, stranger, vehicle, later, soon, olderDone, recentDone };
}

describe('GET /api/me/vehicles', () => {
  it('returns only vehicles assigned to the user', async () => {
    const { owner, vehicle } = await seed();
    const res = await api().get('/api/me/vehicles').set(bearer(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.vehicles.map((v) => v.id)).toEqual([vehicle.id]);
  });

  it('is only for role user', async () => {
    const { tech } = await seed();
    const admin = await createUser('admin');
    await api().get('/api/me/vehicles').set(bearer(tech.token)).expect(403);
    await api().get('/api/me/vehicles').set(bearer(admin.token)).expect(403);
  });
});

describe('GET /api/me/services', () => {
  it('upcoming = not completed, ascending by scheduledDate', async () => {
    const { owner, tech, later, soon } = await seed();
    for (const { token } of [owner, tech]) {
      const res = await api().get('/api/me/services?scope=upcoming').set(bearer(token));
      expect(res.status).toBe(200);
      expect(res.body.services.map((s) => s.id)).toEqual([soon.id, later.id]);
    }
  });

  it('history = completed, descending by completedAt', async () => {
    const { owner, olderDone, recentDone } = await seed();
    const res = await api().get('/api/me/services?scope=history').set(bearer(owner.token));
    expect(res.body.services.map((s) => s.id)).toEqual([recentDone.id, olderDone.id]);
  });

  it('defaults to all and is scoped to the caller', async () => {
    const { owner, stranger } = await seed();
    const mine = await api().get('/api/me/services').set(bearer(owner.token));
    expect(mine.body.services).toHaveLength(4);
    const theirs = await api().get('/api/me/services').set(bearer(stranger.token));
    expect(theirs.body.services).toHaveLength(0);
  });

  it('rejects an unknown scope and admins', async () => {
    const { owner } = await seed();
    const admin = await createUser('admin');
    await api().get('/api/me/services?scope=past').set(bearer(owner.token)).expect(400);
    await api().get('/api/me/services').set(bearer(admin.token)).expect(403);
  });
});
