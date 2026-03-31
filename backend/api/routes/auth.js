const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ─── Sign JWT with configurable expiry ───
function signAuthToken(user, rememberMe = false) {
  const expiry = rememberMe
    ? process.env.JWT_REMEMBER_EXPIRY || '30d'
    : process.env.JWT_EXPIRY || '1d';

  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: expiry }
  );
}

// ─── Password validation (min 6 chars, at least 1 number) ───
function validatePassword(password) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

// ─── Email format validation ───
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // SECURITY: Always enforce role='student' on registration.
    // Role from request body is intentionally ignored to prevent privilege escalation.
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'student',
    });

    const token = signAuthToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileCompleted: Boolean(user.isProfileCompleted),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Support "Remember me" — longer JWT expiry
    const token = signAuthToken(user, Boolean(rememberMe));

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileCompleted: Boolean(user.isProfileCompleted),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
});

// POST /api/auth/forgot-password (basic stub — logs reset token)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link.',
      });
    }

    // Generate a short-lived reset token (15 min)
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // TODO: Send resetToken via email in production
    // For now, log it in development only
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, you will receive a password reset link.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Password reset request failed',
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'token and newPassword are required',
      });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    if (!payload || payload.purpose !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(payload.userId, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Password reset failed',
    });
  }
});

module.exports = router;
