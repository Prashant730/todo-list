const express = require('express')
const { body } = require('express-validator')
const Template = require('../models/Template')
const Task = require('../models/Task')
const auth = require('../middleware/auth')
const validate = require('../middleware/validate')

const router = express.Router()

// Get all templates (user + system)
router.get('/', auth, async (req, res) => {
  try {
    const templates = await Template.find({
      $or: [{ user: req.userId }, { isSystem: true }],
    }).sort('-createdAt')

    res.json({ success: true, data: templates })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create template
router.post(
  '/',
  auth,
  [
    body('name').trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim(),
    body('category').optional().trim(),
    body('tags').optional().isArray(),
    body('tasks').isArray({ min: 1 }),
    body('tasks.*.title').trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const template = await Template.create({
        ...req.body,
        user: req.userId,
      })

      res.status(201).json({ success: true, data: template })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Update template
router.put(
  '/:id',
  auth,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().trim(),
    body('tasks').optional().isArray({ min: 1 }),
  ],
  validate,
  async (req, res) => {
    try {
      const template = await Template.findOneAndUpdate(
        { _id: req.params.id, user: req.userId, isSystem: false },
        req.body,
        { new: true, runValidators: true }
      )

      if (!template) {
        return res
          .status(404)
          .json({
            success: false,
            message: 'Template not found or cannot be edited',
          })
      }

      res.json({ success: true, data: template })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Delete template
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
      isSystem: false,
    })

    if (!template) {
      return res
        .status(404)
        .json({
          success: false,
          message: 'Template not found or cannot be deleted',
        })
    }

    res.json({ success: true, message: 'Template deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Use template - create tasks from template
router.post('/:id/use', auth, async (req, res) => {
  try {
    const template = await Template.findOne({
      $or: [
        { _id: req.params.id, user: req.userId },
        { _id: req.params.id, isSystem: true },
      ],
    })

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: 'Template not found' })
    }

    const baseDueDate = new Date()
    baseDueDate.setHours(baseDueDate.getHours() + 2)

    const tasks = template.tasks.map((task, index) => ({
      title: task.title,
      description: task.description || `From template: ${template.name}`,
      priority: task.priority || 'medium',
      estimatedTime: task.estimatedTime,
      user: req.userId,
      dueDate: new Date(baseDueDate.getTime() + index * 60 * 60 * 1000),
    }))

    const createdTasks = await Task.insertMany(tasks)

    res.status(201).json({
      success: true,
      message: `${createdTasks.length} tasks created from template`,
      data: createdTasks,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
