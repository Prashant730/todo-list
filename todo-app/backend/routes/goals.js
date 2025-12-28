/**
 * GOALS ROUTES - Weekly/Monthly Goal Management
 */

const express = require('express')
const { body } = require('express-validator')
const Goal = require('../models/Goal')
const Task = require('../models/Task')
const auth = require('../middleware/auth')
const validate = require('../middleware/validate')

const router = express.Router()

// Get all goals
router.get('/', auth, async (req, res) => {
  try {
    const { status, type } = req.query
    const filter = { user: req.userId }

    if (status) filter.status = status
    if (type) filter.type = type

    const goals = await Goal.find(filter)
      .populate('category', 'name icon')
      .sort({ startDate: -1 })

    // Enrich with task counts
    const enrichedGoals = await Promise.all(
      goals.map(async (goal) => {
        const taskStats = await Task.aggregate([
          { $match: { goalId: goal._id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: { $sum: { $cond: ['$completed', 1, 0] } },
            },
          },
        ])

        const stats = taskStats[0] || { total: 0, completed: 0 }

        return {
          ...goal.toObject(),
          linkedTaskCount: stats.total,
          completedTaskCount: stats.completed,
          completionRate:
            stats.total > 0
              ? Math.round((stats.completed / stats.total) * 100)
              : 0,
        }
      })
    )

    res.json({ success: true, data: enrichedGoals })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create goal
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('type').isIn(['weekly', 'monthly', 'quarterly']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('targetTaskCount').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const goal = await Goal.create({
        ...req.body,
        user: req.userId,
      })

      res.status(201).json({ success: true, data: goal })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Update goal
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    )

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' })
    }

    res.json({ success: true, data: goal })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete goal
router.delete('/:id', auth, async (req, res) => {
  try {
    // Unlink tasks from this goal
    await Task.updateMany(
      { goalId: req.params.id, user: req.userId },
      { $unset: { goalId: 1 } }
    )

    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    })

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' })
    }

    res.json({ success: true, message: 'Goal deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get tasks linked to a goal
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      goalId: req.params.id,
      user: req.userId,
    }).populate('categories', 'name icon')

    res.json({ success: true, data: tasks })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
