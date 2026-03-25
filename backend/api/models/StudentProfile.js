const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    full_name: { type: String, required: true, trim: true },
    father_name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    marital_status: { type: String, required: true, trim: true },
    nationality: { type: String, required: true, trim: true },
    religion: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    education: {
      exam_passed: { type: String, required: true, trim: true },
      board_university: { type: String, required: true, trim: true },
      passing_year: { type: String, required: true, trim: true },
      marks: { type: String, required: true, trim: true },
      percentage: { type: String, required: true, trim: true },
    },
    course_selected: {
      type: String,
      enum: [
        'ADCA',
        'Computer Fundamentals',
        'English Typing',
        'Hindi Typing',
        'English & Hindi Typing',
        'Shorthand (Hindi)',
      ],
      required: true,
    },
    photo_url: { type: String, default: '' },
    signature_url: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
