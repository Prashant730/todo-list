const express = require('express')
const { body } = require('express-validator')
const Category = require('../models/Category')
const Task = require('../models/Task')
const auth = require('../middleware/auth')
const validate = require('../middleware/validate')

const router = express.Router()

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.userId }).sort('name')
    res.json({ success: true, data: categories })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create category
router.post(
  '/',
  auth,
  [
    body('name').trim().notEmpty().isLength({ max: 100 }),
    body('icon').optional().trim().isLength({ max: 10 }),
    body('color').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      // Check for duplicate
      const existing = await Category.findOne({
        user: req.userId,
        name: req.body.name,
      })
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: 'Category already exists' })
      }

      const category = await Category.create({
        ...req.body,
        user: req.userId,
      })

      res.status(201).json({ success: true, data: category })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Update category
router.put(
  '/:id',
  auth,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('icon').optional().trim().isLength({ max: 10 }),
    body('color').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const category = await Category.findOneAndUpdate(
        { _id: req.params.id, user: req.userId },
        req.body,
        { new: true, runValidators: true }
      )

      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: 'Category not found' })
      }

      res.json({ success: true, data: category })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.userId,
    })

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: 'Category not found' })
    }

    // Don't allow deleting default categories
    if (category.isDefault) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot delete default category' })
    }

    // Remove category from all tasks
    await Task.updateMany(
      { user: req.userId, categories: req.params.id },
      { $pull: { categories: req.params.id } }
    )

    await category.deleteOne()

    res.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
