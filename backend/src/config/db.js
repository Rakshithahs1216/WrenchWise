const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

/** Opens the shared Mongoose connection. */
async function connectDB(uri) {
  await mongoose.connect(uri);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
