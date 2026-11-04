const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');
const { SERVICE_TYPES, SERVICE_STATUS_VALUES, SERVICE_STATUS } = require('../constants');

const { ObjectId } = mongoose.Schema.Types;

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  author: { type: ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});
noteSchema.plugin(toJSON);

const serviceSchema = new mongoose.Schema(
  {
    vehicle: { type: ObjectId, ref: 'Vehicle', required: true, index: true },
    serviceType: { type: String, enum: SERVICE_TYPES, required: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    scheduledDate: { type: Date, required: true, index: true },
    status: { type: String, enum: SERVICE_STATUS_VALUES, default: SERVICE_STATUS.PENDING },
    technician: { type: ObjectId, ref: 'User', required: true, index: true },
    notes: { type: [noteSchema], default: [] },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

serviceSchema.plugin(toJSON);

module.exports = mongoose.model('Service', serviceSchema);
