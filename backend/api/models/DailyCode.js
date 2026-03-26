const mongoose = require('mongoose');

const dailyCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    dateKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

dailyCodeSchema.index({ dateKey: 1 }, { unique: true });

module.exports = mongoose.model('DailyCode', dailyCodeSchema);
