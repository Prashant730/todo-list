const express = require('express')
const { body } = require('express-validator')
const Settings = require('../models/Settings')
const auth = require('../middleware/auth')
const validate = require('../middleware/validate')

const router = express.Router()

// Get settings
router.get('/', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.userId })

    // Create default settings if not exists
    if (!settings) {
      settings = await Settings.create({ user: req.userId })
    }

    res.json({ success: true, data: settings })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update settings
router.put(
  '/',
  auth,
  [
    body('notificationEmail').optional().isBoolean(),
    body('notificationPush').optional().isBoolean(),
    body('reminderMinutes').optional().isInt({ min: 5, max: 1440 }),
    body('timezone').optional().trim(),
    body('language').optional().trim().isLength({ max: 10 }),
  ],
  validate,
  async (req, res) => {
    try {
      const settings = await Settings.findOneAndUpdate(
        { user: req.userId },
        req.body,
        { new: true, upsert: true, runValidators: true }
      )

      res.json({ success: true, data: settings })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

module.exports = router
