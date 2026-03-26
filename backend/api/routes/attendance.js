const express = require('express');
const Attendance = require('../models/Attendance');
const AttendanceCode = require('../models/AttendanceCode');
const User = require('../models/User');
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

router.use(authenticate);

async function generateAttendanceCodesHandler(req, res) {
  try {
    const students = await User.find({ role: 'student' }).select('_id name email').lean();
    if (!students.length) {
      return res.status(200).json({ success: true, message: 'No students found', data: [] });
    }

    const dateKey = getDateKey(new Date());
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const generatedInBatch = new Set();
    const savedCodes = [];

    for (const student of students) {
      let code = generateCode();
      let guard = 0;
      while (guard < 50) {
        const alreadyInBatch = generatedInBatch.has(code);
        const existingCode = await AttendanceCode.findOne({ code, dateKey }).select('_id').lean();
        if (!alreadyInBatch && !existingCode) break;
        code = generateCode();
        guard += 1;
      }

      generatedInBatch.add(code);

      const saved = await AttendanceCode.findOneAndUpdate(
        { studentId: student._id, dateKey },
        {
          studentId: student._id,
          code,
          dateKey,
          expiresAt,
          isUsed: false,
          usedAt: null,
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      ).lean();

      savedCodes.push({
        student_id: student._id,
        student_name: student.name,
        student_email: student.email,
        code: saved.code,
        date: dateKey,
        expires_at: saved.expiresAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attendance codes generated successfully',
      data: savedCodes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate attendance codes',
    });
  }
}

// POST /api/attendance/codes/generate
router.post('/codes/generate', requireRole('admin'), generateAttendanceCodesHandler);

// POST /api/attendance/generate-codes
router.post('/generate-codes', requireRole('admin'), generateAttendanceCodesHandler);

// GET /api/attendance/attendance-codes
router.get('/attendance-codes', requireRole('admin'), async (req, res) => {
  try {
    const dateKey = getDateKey(req.query.date || new Date());
    if (!dateKey) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const codes = await AttendanceCode.find({ dateKey })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name email')
      .lean();

    return res.status(200).json({
      success: true,
      data: codes.map((item) => ({
        id: item._id,
        student_id: item.studentId && item.studentId._id ? item.studentId._id : item.studentId,
        student_name: item.studentId && item.studentId.name ? item.studentId.name : 'Student',
        student_email: item.studentId && item.studentId.email ? item.studentId.email : '',
        code: item.code,
        date: item.dateKey,
        expires_at: item.expiresAt,
        is_used: Boolean(item.isUsed),
      })),
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

    const studentIds = students.map((s) => s._id);
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

    const countByStudent = {};
    aggregateRows.forEach((row) => {
      const sid = String(row._id.studentId);
      if (!countByStudent[sid]) {
        countByStudent[sid] = { present: 0, absent: 0 };
      }
      const key = String(row._id.status || '').toLowerCase() === 'present' ? 'present' : 'absent';
      countByStudent[sid][key] = row.count;
    });

    const data = students.map((student) => {
      const sid = String(student._id);
      const counts = countByStudent[sid] || { present: 0, absent: 0 };
      const total = counts.present + counts.absent;
      const percentage = total > 0 ? Math.round((counts.present / total) * 100) : 0;
      return {
        ...student,
        totalPresent: counts.present,
        totalAbsent: counts.absent,
        attendancePercentage: percentage,
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

// GET /api/attendance/student/:studentId
router.get('/student/:studentId', requireRole('admin'), getStudentAttendanceHistory);

// GET /api/attendance/attendance/:studentId
router.get('/attendance/:studentId', requireRole('admin'), getStudentAttendanceHistory);

// POST /api/attendance/submit-code
router.post('/submit-code', requireRole('student'), async (req, res) => {
  try {
    const code = String(req.body && req.body.code ? req.body.code : '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const now = new Date();
    const dateKey = getDateKey(now);
    const codeDoc = await AttendanceCode.findOne({ code, dateKey });

    if (!codeDoc) {
      return res.status(400).json({ success: false, message: 'Invalid Code' });
    }

    if (String(codeDoc.studentId) !== String(req.user.userId)) {
      return res.status(403).json({ success: false, message: 'Not Assigned to You' });
    }

    if (codeDoc.expiresAt && new Date(codeDoc.expiresAt).getTime() < now.getTime()) {
      return res.status(400).json({ success: false, message: 'Code Expired' });
    }

    if (codeDoc.isUsed) {
      return res.status(409).json({ success: false, message: 'Already Used' });
    }

    const existingAttendance = await Attendance.findOne({ studentId: req.user.userId, dateKey });
    if (existingAttendance) {
      return res.status(409).json({ success: false, message: 'Already Used' });
    }

    const attendance = await Attendance.create({
      studentId: req.user.userId,
      date: now,
      dateKey,
      status: 'present',
    });

    codeDoc.isUsed = true;
    codeDoc.usedAt = now;
    await codeDoc.save();

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
});

// POST /api/attendance
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

    const student = await User.findById(studentId).select('role');
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

    const attendance = await Attendance.findOneAndUpdate({
      studentId,
      dateKey,
    }, {
      studentId,
      date: targetDate,
      dateKey,
      status: String(status).toLowerCase(),
    }, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark attendance',
    });
  }
});

module.exports = router;
