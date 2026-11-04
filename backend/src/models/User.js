const mongoose = require('mongoose');
const toJSON = require('./plugins/toJSON');
const { ROLE_VALUES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_VALUES, required: true },
    // Tokens issued before this moment are rejected, so a password reset ends old sessions.
    passwordChangedAt: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.plugin(toJSON, { hidden: ['passwordHash', 'passwordChangedAt'] });

module.exports = mongoose.model('User', userSchema);
