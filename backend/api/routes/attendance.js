const express = require('express');
const Attendance = require('../models/Attendance');
const DailyCode = require('../models/DailyCode');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function getDateKey(input) {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getAttendanceCountByStudent(studentIds) {
  const aggregateRows = await Attendance.aggregate([
    {
      $match: {
        studentId: { $in: studentIds },
      },
    },
    {
      $group: {
        _id: { studentId: '$studentId', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  return aggregateRows.reduce((acc, row) => {
    const sid = String(row._id.studentId);
    if (!acc[sid]) {
      acc[sid] = { present: 0, absent: 0 };
    }
    const key = String(row._id.status || '').toLowerCase() === 'present' ? 'present' : 'absent';
    acc[sid][key] = row.count;
    return acc;
  }, {});
}

router.use(authenticate);

async function generateDailyCodeHandler(req, res) {
  try {
    const dateKey = getDateKey(new Date());
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const saved = await DailyCode.findOneAndUpdate(
      { dateKey },
      {
        code: generateCode(),
        dateKey,
        expiresAt,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.status(200).json({
      success: true,
      message: 'Attendance code generated successfully',
      data: {
        id: saved._id,
        code: saved.code,
        date: saved.dateKey,
        expires_at: saved.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate attendance code',
    });
  }
}

// POST /api/attendance/generate-code
router.post('/generate-code', requireRole('admin'), generateDailyCodeHandler);

// Backward compatibility aliases
router.post('/generate-codes', requireRole('admin'), generateDailyCodeHandler);
router.post('/codes/generate', requireRole('admin'), generateDailyCodeHandler);

// GET /api/attendance/attendance-codes
router.get('/attendance-codes', requireRole('admin'), async (req, res) => {
  try {
    const dateKey = getDateKey(req.query.date || new Date());
    if (!dateKey) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const codeDoc = await DailyCode.findOne({ dateKey }).lean();

    return res.status(200).json({
      success: true,
      data: codeDoc
        ? [
            {
              id: codeDoc._id,
              code: codeDoc.code,
              date: codeDoc.dateKey,
              expires_at: codeDoc.expiresAt,
            },
          ]
        : [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance codes',
    });
  }
});

// GET /api/attendance/students
router.get('/students', requireRole('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email')
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = students.map((s) => s._id).filter(Boolean);

    const profiles = await StudentProfile.find({ user: { $in: studentIds } })
      .select('user father_name mobile photo_url full_name')
      .lean();

    const profileByUserId = profiles.reduce((acc, profile) => {
      acc[String(profile.user)] = profile;
      return acc;
    }, {});

    const countByStudent = await getAttendanceCountByStudent(studentIds);

    const data = students.map((student) => {
      const sid = String(student._id);
      const counts = countByStudent[sid] || { present: 0, absent: 0 };
      const total = counts.present + counts.absent;
      const percentage = total > 0 ? Math.round((counts.present / total) * 100) : 0;
      const profile = profileByUserId[sid] || {};

      return {
        ...student,
        totalPresent: counts.present,
        totalAbsent: counts.absent,
        attendancePercentage: percentage,
        father_name: profile.father_name || '',
        mobile: profile.mobile || '',
        photo_url: profile.photo_url || '',
        full_name: profile.full_name || student.name,
      };
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch students',
    });
  }
});

async function getStudentAttendanceHistory(req, res) {
  try {
    const records = await Attendance.find({ studentId: req.params.studentId })
      .sort({ date: -1 })
      .limit(365)
      .lean();

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance records',
    });
  }
}

// GET /api/attendance/attendance/:studentId
router.get('/attendance/:studentId', requireRole('admin'), getStudentAttendanceHistory);

// Backward compatibility alias
router.get('/student/:studentId', requireRole('admin'), getStudentAttendanceHistory);

// GET /api/attendance/rankings
router.get('/rankings', requireRole('admin'), async (req, res) => {
  try {
    const studentsRes = await User.find({ role: 'student' })
      .select('name email')
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = studentsRes.map((s) => s._id).filter(Boolean);
    const countByStudent = await getAttendanceCountByStudent(studentIds);

    const ranked = studentsRes
      .map((student) => {
        const sid = String(student._id);
        const counts = countByStudent[sid] || { present: 0, absent: 0 };
        const total = counts.present + counts.absent;
        const percentage = total > 0 ? (counts.present / total) * 100 : 0;
        return {
          student_id: sid,
          name: student.name,
          email: student.email,
          totalPresent: counts.present,
          totalAbsent: counts.absent,
          attendancePercentage: Number(percentage.toFixed(2)),
        };
      })
      .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return res.status(200).json({ success: true, data: ranked });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rankings',
    });
  }
});

async function verifyDailyCodeHandler(req, res) {
  try {
    const code = String(req.body && req.body.code ? req.body.code : '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const now = new Date();
    const dateKey = getDateKey(now);
    const codeDoc = await DailyCode.findOne({ dateKey }).lean();

    if (!codeDoc || String(codeDoc.code || '').toUpperCase() !== code) {
      return res.status(400).json({ success: false, message: 'Invalid Code' });
    }

    if (codeDoc.expiresAt && new Date(codeDoc.expiresAt).getTime() < now.getTime()) {
      return res.status(400).json({ success: false, message: 'Code Expired' });
    }

    const existingAttendance = await Attendance.findOne({ studentId: req.user.userId, dateKey }).lean();
    if (existingAttendance) {
      return res.status(409).json({ success: false, message: 'Already Used' });
    }

    const attendance = await Attendance.create({
      studentId: req.user.userId,
      date: now,
      dateKey,
      status: 'present',
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already Used' });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit attendance code',
    });
  }
}

// POST /api/attendance/verify-code
router.post('/verify-code', requireRole('student'), verifyDailyCodeHandler);

// Backward compatibility alias
router.post('/submit-code', requireRole('student'), verifyDailyCodeHandler);

// POST /api/attendance (manual admin override)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    if (!studentId || !status) {
      return res.status(400).json({
        success: false,
        message: 'studentId and status are required',
      });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be present or absent',
      });
    }

    const student = await User.findById(studentId).select('role').lean();
    if (!student || String(student.role || '').toLowerCase() !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId',
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const dateKey = getDateKey(targetDate);
    if (Number.isNaN(targetDate.getTime()) || !dateKey) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date',
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        studentId,
        dateKey,
      },
      {
        studentId,
        date: targetDate,
        dateKey,
        status: String(status).toLowerCase(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark attendance',
    });
  }
});

module.exports = router;
