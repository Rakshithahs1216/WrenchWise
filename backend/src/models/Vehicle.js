const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');
const { VEHICLE_STATUSES } = require('../constants');

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    vin: { type: String, trim: true, uppercase: true, default: null },
    mileage: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: VEHICLE_STATUSES, default: 'active' },
    assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true },
);

vehicleSchema.plugin(toJSON);

module.exports = mongoose.model('Vehicle', vehicleSchema);
