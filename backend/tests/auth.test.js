const jwt = require('jsonwebtoken');
const { useTestDb } = require('./helpers/db');
const { api, bearer, createUser, DEFAULT_PASSWORD } = require('./helpers/factory');

useTestDb();

describe('POST /api/auth/login', () => {
  it('returns a token and the user, and sets an httpOnly ww_token cookie', async () => {
    const { user } = await createUser('technician');

    const res = await api().post('/api/auth/login').send({ email: user.email, password: DEFAULT_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, email: user.email, role: 'technician' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('_id');

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ sub: user.id, role: 'technician' });

    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('ww_token='));
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Max-Age=3600/);
  });

  it('accepts the email case-insensitively', async () => {
    const { user } = await createUser('user');
    const res = await api().post('/api/auth/login').send({ email: user.email.toUpperCase(), password: DEFAULT_PASSWORD });
    expect(res.status).toBe(200);
  });

  it('rejects a wrong password with 401', async () => {
    const { user } = await createUser('user');
    const res = await api().post('/api/auth/login').send({ email: user.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('rejects an unknown email with the same 401', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@test.dev', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('validates the body', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(['email', 'password']));
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a Bearer token', async () => {
    const { user, token } = await createUser('admin');
    const res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  it('accepts the ww_token cookie', async () => {
    const { user, token } = await createUser('user');
    const res = await api().get('/api/auth/me').set('Cookie', `ww_token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  it('prefers the Bearer header over the cookie', async () => {
    const { user, token } = await createUser('admin');
    const { token: otherToken } = await createUser('user');
    const res = await api().get('/api/auth/me').set(bearer(token)).set('Cookie', `ww_token=${otherToken}`);
    expect(res.body.user.id).toBe(user.id);
  });

  it('returns 401 without a token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for a malformed or wrongly signed token', async () => {
    const { user } = await createUser('admin');
    const forged = jwt.sign({ sub: user.id, role: 'admin' }, 'some-other-secret');

    for (const token of ['garbage', forged]) {
      const res = await api().get('/api/auth/me').set(bearer(token));
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('returns 401 for an expired token', async () => {
    const { user } = await createUser('admin');
    const expired = jwt.sign(
      { sub: user.id, role: 'admin', iat: Math.floor(Date.now() / 1000) - 120 },
      process.env.JWT_SECRET,
      { expiresIn: 60 },
    );
    const res = await api().get('/api/auth/me').set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Token expired');
  });

  it('returns 401 when the user has been deleted', async () => {
    const { user, token } = await createUser('admin');
    await user.deleteOne();
    const res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(401);
  });

  it('returns 401 for tokens issued before a password change', async () => {
    const { user } = await createUser('user');
    const { token: adminToken } = await createUser('admin');
    const oldToken = jwt.sign({ sub: user.id, role: 'user', iat: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET);

    const reset = await api().patch(`/api/users/${user.id}`).set(bearer(adminToken)).send({ password: 'BrandNew@123' });
    expect(reset.status).toBe(200);
    expect(reset.body.user).not.toHaveProperty('passwordChangedAt');

    const res = await api().get('/api/auth/me').set(bearer(oldToken));
    expect(res.status).toBe(401);

    const login = await api().post('/api/auth/login').send({ email: user.email, password: 'BrandNew@123' });
    expect((await api().get('/api/auth/me').set(bearer(login.body.token))).status).toBe(200);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie and returns 204', async () => {
    const res = await api().post('/api/auth/logout');
    expect(res.status).toBe(204);
    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('ww_token='));
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe('misc', () => {
  it('GET /api/health is public', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown routes return 404 in the standard error shape', async () => {
    const res = await api().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('malformed JSON returns 400', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('an oversized body returns 413, not 500', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(200 * 1024) }));
    expect(res.status).toBe(413);
  });
});
