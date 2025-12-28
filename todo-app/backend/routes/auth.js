const express = require('express')
const jwt = require('jsonwebtoken')
const { body } = require('express-validator')
const User = require('../models/User')
const Category = require('../models/Category')
const Settings = require('../models/Settings')
const auth = require('../middleware/auth')
const validate = require('../middleware/validate')

const router = express.Router()

// Default categories for new users
const defaultCategories = [
  { name: '📚 Assignments', icon: '📚', isDefault: true },
  { name: '📖 Study', icon: '📖', isDefault: true },
  { name: '🧪 Exams', icon: '🧪', isDefault: true },
  { name: '📝 Projects', icon: '📝', isDefault: true },
  { name: '🎯 Personal', icon: '🎯', isDefault: true },
  { name: '💼 Career', icon: '💼', isDefault: true },
  { name: '🏃 Health', icon: '🏃', isDefault: true },
  { name: '🛒 Shopping', icon: '🛒', isDefault: true },
]

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// Register
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('name').optional().trim().isLength({ max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, name } = req.body

      // Check if user exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: 'Email already registered' })
      }

      // Create user
      const user = await User.create({ email, password, name })

      // Create default categories for user
      await Category.insertMany(
        defaultCategories.map((cat) => ({ ...cat, user: user._id }))
      )

      // Create default settings
      await Settings.create({ user: user._id })

      const token = generateToken(user._id)

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            theme: user.theme,
            viewMode: user.viewMode,
          },
        },
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body

      const user = await User.findOne({ email }).select('+password')
      if (!user || !(await user.comparePassword(password))) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid email or password' })
      }

      // Update last login
      user.lastLoginAt = new Date()
      await user.save()

      const token = generateToken(user._id)

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            theme: user.theme,
            viewMode: user.viewMode,
          },
        },
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      theme: req.user.theme,
      viewMode: req.user.viewMode,
      createdAt: req.user.createdAt,
    },
  })
})

// Update profile
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().isLength({ max: 100 }),
    body('theme').optional().isIn(['light', 'dark']),
    body('viewMode').optional().isIn(['list', 'calendar']),
  ],
  validate,
  async (req, res) => {
    try {
      const updates = {}
      ;['name', 'theme', 'viewMode'].forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field]
      })

      const user = await User.findByIdAndUpdate(req.userId, updates, {
        new: true,
      })

      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: user.name,
          theme: user.theme,
          viewMode: user.viewMode,
        },
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Change password
router.put(
  '/password',
  auth,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.userId).select('+password')

      if (!(await user.comparePassword(req.body.currentPassword))) {
        return res
          .status(400)
          .json({ success: false, message: 'Current password is incorrect' })
      }

      user.password = req.body.newPassword
      await user.save()

      res.json({ success: true, message: 'Password updated successfully' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

module.exports = router
