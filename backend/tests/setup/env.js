// Runs before each test file (jest `setupFiles`), ahead of any app module.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-wrenchwise';
process.env.JWT_EXPIRES_IN = '1h';
// Replaced with the in-memory server's URI by tests/helpers/db.js.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/wrenchwise-test-unused';
