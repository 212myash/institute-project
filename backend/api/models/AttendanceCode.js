const mongoose = require('mongoose');

const attendanceCodeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

attendanceCodeSchema.index({ studentId: 1, dateKey: 1 }, { unique: true });
attendanceCodeSchema.index({ code: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceCode', attendanceCodeSchema);
