const express = require('express');
const User = require('../models/User');
const Contact = require('../models/Contact');
const StudentProfile = require('../models/StudentProfile');

const router = express.Router();

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const userIds = users.map((u) => String(u._id));
    const profiles = await StudentProfile.find({ user: { $in: userIds } })
      .select('user mobile')
      .lean();

    const mobileByUserId = profiles.reduce((acc, profile) => {
      acc[String(profile.user)] = profile.mobile || '';
      return acc;
    }, {});

    const usersWithMobile = users.map((u) => {
      const plain = u.toObject();
      plain.mobile = plain.mobile || mobileByUserId[String(u._id)] || '';
      return plain;
    });

    res.status(200).json({
      success: true,
      data: usersWithMobile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
    });
  }
});

// GET /api/admin/requests
router.get('/requests', async (req, res) => {
  try {
    const requests = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch contact requests',
    });
  }
});

module.exports = router;
