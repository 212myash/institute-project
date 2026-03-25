const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function parseDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function sanitizePayload(body) {
  return {
    full_name: String(body.full_name || '').trim(),
    father_name: String(body.father_name || '').trim(),
    dob: String(body.dob || '').trim(),
    gender: String(body.gender || '').trim(),
    marital_status: String(body.marital_status || '').trim(),
    nationality: String(body.nationality || '').trim(),
    religion: String(body.religion || '').trim(),
    address: String(body.address || '').trim(),
    mobile: String(body.mobile || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    education: {
      exam_passed: String(body.exam_passed || '').trim(),
      board_university: String(body.board_university || '').trim(),
      passing_year: String(body.passing_year || '').trim(),
      marks: String(body.marks || '').trim(),
      percentage: String(body.percentage || '').trim(),
    },
    course_selected: String(body.course_selected || '').trim(),
  };
}

function validatePayload(payload) {
  const required = [
    payload.full_name,
    payload.father_name,
    payload.dob,
    payload.gender,
    payload.marital_status,
    payload.nationality,
    payload.religion,
    payload.address,
    payload.mobile,
    payload.email,
    payload.education.exam_passed,
    payload.education.board_university,
    payload.education.passing_year,
    payload.education.marks,
    payload.education.percentage,
    payload.course_selected,
  ];

  if (required.some((item) => !item)) {
    return 'Please fill all mandatory fields';
  }

  if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
    return 'Please provide a valid email';
  }

  if (!/^\d{10,15}$/.test(payload.mobile)) {
    return 'Mobile number should be between 10 and 15 digits';
  }

  if (!parseDate(payload.dob)) {
    return 'Please provide a valid date of birth';
  }

  return null;
}

function makeDataUrl(file, fallbackType) {
  if (!file) return '';
  const type = file.mimetype || fallbackType;
  return `data:${type};base64,${file.buffer.toString('base64')}`;
}

function saveFileLocally(file, prefix) {
  if (!file) return '';

  const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
  const fileName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`;
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, file.buffer);
  return fileName;
}

function getPublicUrl(req, file, prefix, fallbackType) {
  if (!file) return '';

  if (process.env.VERCEL) {
    return makeDataUrl(file, fallbackType);
  }

  const fileName = saveFileLocally(file, prefix);
  return `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
}

function uploadStudentFiles(req, res, next) {
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File size must be 10MB or less' });
    }

    return res.status(400).json({ success: false, message: error.message || 'File upload failed' });
  });
}

router.use(authenticate);

router.get('/profile', requireRole('student'), async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to fetch profile' });
  }
});

router.post('/profile', requireRole('student'), uploadStudentFiles, async (req, res) => {
  try {
    const userId = req.user.userId;

    const existing = await StudentProfile.findOne({ user: userId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Profile already submitted' });
    }

    const payload = sanitizePayload(req.body || {});
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const photoFile = req.files && req.files.photo ? req.files.photo[0] : null;
    const signatureFile = req.files && req.files.signature ? req.files.signature[0] : null;

    const profile = await StudentProfile.create({
      user: userId,
      ...payload,
      dob: parseDate(payload.dob),
      photo_url: getPublicUrl(req, photoFile, 'student-photo', 'image/jpeg'),
      signature_url: getPublicUrl(req, signatureFile, 'student-signature', 'image/png'),
    });

    await User.findByIdAndUpdate(userId, { isProfileCompleted: true }, { new: true });

    return res.status(201).json({
      success: true,
      message: 'Student profile submitted successfully',
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to submit profile',
    });
  }
});

router.put('/profile', requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const profile = await StudentProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const body = req.body || {};
    const editable = {
      gender: String(body.gender ?? profile.gender).trim(),
      marital_status: String(body.marital_status ?? profile.marital_status).trim(),
      nationality: String(body.nationality ?? profile.nationality).trim(),
      religion: String(body.religion ?? profile.religion).trim(),
      address: String(body.address ?? profile.address).trim(),
      email: String(body.email ?? profile.email).trim().toLowerCase(),
      course_selected: String(body.course_selected ?? profile.course_selected).trim(),
      education: {
        exam_passed: String((body.education && body.education.exam_passed) ?? profile.education.exam_passed).trim(),
        board_university: String((body.education && body.education.board_university) ?? profile.education.board_university).trim(),
        passing_year: String((body.education && body.education.passing_year) ?? profile.education.passing_year).trim(),
        marks: String((body.education && body.education.marks) ?? profile.education.marks).trim(),
        percentage: String((body.education && body.education.percentage) ?? profile.education.percentage).trim(),
      },
    };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editable.email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email' });
    }

    profile.gender = editable.gender;
    profile.marital_status = editable.marital_status;
    profile.nationality = editable.nationality;
    profile.religion = editable.religion;
    profile.address = editable.address;
    profile.email = editable.email;
    profile.course_selected = editable.course_selected;
    profile.education = editable.education;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to update profile',
    });
  }
});

module.exports = router;
