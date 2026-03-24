const express = require('express');
const Course = require('../models/Course');

const router = express.Router();

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch courses',
    });
  }
});

// POST /api/courses
router.post('/', async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, description and price are required',
      });
    }

    const course = await Course.create({ title, description, price });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course',
    });
  }
});

module.exports = router;
