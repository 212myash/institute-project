const express = require('express');
const Contact = require('../models/Contact');

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'name, email and message are required',
      });
    }

    const contact = await Contact.create({ name, email, message });

    res.status(201).json({
      success: true,
      message: 'Contact request saved',
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save contact request',
    });
  }
});

module.exports = router;
