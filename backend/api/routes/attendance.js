const express = require('express');
const Attendance = require('../models/Attendance');

const router = express.Router();

// POST /api/attendance
router.post('/', async (req, res) => {
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

    const attendance = await Attendance.create({
      studentId,
      date: date || new Date(),
      status,
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
