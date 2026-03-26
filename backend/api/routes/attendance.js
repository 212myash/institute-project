const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/attendance/students
router.get('/students', requireRole('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch students',
    });
  }
});

// GET /api/attendance/student/:studentId
router.get('/student/:studentId', requireRole('admin'), async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.params.studentId })
      .sort({ date: -1 })
      .limit(60);

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
    if (Number.isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date',
      });
    }

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOneAndUpdate({
      studentId,
      date: { $gte: start, $lte: end },
    }, {
      studentId,
      date: targetDate,
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
