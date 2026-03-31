const express = require('express');
const User = require('../models/User');
const Contact = require('../models/Contact');
const StudentProfile = require('../models/StudentProfile');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// SECURITY: All admin routes now require authentication + admin role
router.use(authenticate);
router.use(requireRole('admin'));

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

// PUT /api/admin/requests/:id/status
router.put('/requests/:id/status', async (req, res) => {
  try {
    const status = String(req.body && req.body.status ? req.body.status : '').trim().toLowerCase();
    if (!['new', 'pending', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be new, pending or resolved',
      });
    }

    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Contact request not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contact request status updated successfully',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update contact request status',
    });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const role = String(req.body && req.body.role ? req.body.role : '').trim().toLowerCase();
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be student or admin',
      });
    }

    const existing = await User.findById(req.params.id).select('role');
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const roleChanged = String(existing.role || '').toLowerCase() !== role;
    const updatePayload = { role };

    if (roleChanged) {
      updatePayload.isProfileCompleted = false;
      await StudentProfile.deleteOne({ user: req.params.id });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user role',
    });
  }
});

module.exports = router;
