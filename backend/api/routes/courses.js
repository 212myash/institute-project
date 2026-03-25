const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Course = require('../models/Course');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function uploadCourseImage(req, res, next) {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Image size must be 10MB or less',
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Image upload failed',
    });
  });
}

function saveUploadedImage(req) {
  if (!req.file) return '';

  const ext = path.extname(req.file.originalname || '').toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
  const fileName = `course-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, req.file.buffer);

  return `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
}

function sanitizeCoursePayload(payload) {
  return {
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    instructor: String(payload.instructor || '').trim(),
    duration: String(payload.duration || '').trim(),
    image_url: String(payload.image_url || '').trim(),
    progress: Number(payload.progress ?? 0),
  };
}

function validateCourseInput(course) {
  if (!course.title || !course.description || !course.instructor || !course.duration) {
    return 'title, description, instructor and duration are required';
  }

  if (Number.isNaN(course.progress) || course.progress < 0 || course.progress > 100) {
    return 'progress must be a number between 0 and 100';
  }

  return null;
}

router.use(authenticate);

// GET /api/courses
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 9));
    const skip = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const duration = String(req.query.duration || '').trim();

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } },
      ];
    }
    if (duration) {
      query.duration = duration;
    }

    const [courses, total] = await Promise.all([
      Course.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Course.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch courses',
    });
  }
});

// POST /api/courses
router.post('/', requireRole('admin'), uploadCourseImage, async (req, res) => {
  try {
    const payload = sanitizeCoursePayload(req.body || {});
    const uploadedImageUrl = saveUploadedImage(req);
    if (uploadedImageUrl) {
      payload.image_url = uploadedImageUrl;
    }
    const validationError = validateCourseInput(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const course = await Course.create(payload);

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

// PUT /api/courses/:id
router.put('/:id', requireRole('admin'), uploadCourseImage, async (req, res) => {
  try {
    const payload = sanitizeCoursePayload(req.body || {});
    const uploadedImageUrl = saveUploadedImage(req);
    if (uploadedImageUrl) {
      payload.image_url = uploadedImageUrl;
    }
    const validationError = validateCourseInput(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update course',
    });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete course',
    });
  }
});

module.exports = router;
