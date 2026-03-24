const express = require('express');
const User = require('../models/User');
const Contact = require('../models/Contact');

const router = express.Router();

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users,
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
