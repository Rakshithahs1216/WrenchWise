const os = require('node:os');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const models = require('../../src/models');

/**
 * Registers jest hooks that run the file's tests against a fresh in-memory
 * MongoDB, with indexes built up front and collections emptied between tests.
 */
function useTestDb() {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    // The driver loads `os` via dynamic import(), which Jest's VM sandbox rejects; supply it directly.
    await mongoose.connect(mongod.getUri(), { runtimeAdapters: { os } });
    await Promise.all(Object.values(models).map((model) => model.init()));
  });

  afterEach(async () => {
    await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
}

module.exports = { useTestDb };
