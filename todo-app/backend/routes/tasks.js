const express = require('express')
const { body, query, param } = require('express-validator')
const Task = require('../models/Task')
const auth = require('../middleware/auth')
const validate = require('../middleware/validate')

const router = express.Router()

// Get all tasks with filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, category, search, sortBy, sortOrder } = req.query

    const filter = { user: req.userId }

    // Status filter
    if (status === 'completed') filter.completed = true
    else if (status === 'active') filter.completed = false
    else if (status === 'overdue') {
      filter.completed = false
      filter.dueDate = { $lt: new Date() }
    } else if (status === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      filter.dueDate = { $gte: today, $lt: tomorrow }
    } else if (status === 'week') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + 7)
      filter.dueDate = { $gte: today, $lt: weekEnd }
    }

    // Priority filter
    if (priority && priority !== 'all') {
      filter.priority = priority
    }

    // Category filter
    if (category && category !== 'all') {
      filter.categories = category
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    // Build sort
    const sort = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1
    } else {
      sort.sortOrder = 1
      sort.createdAt = -1
    }

    const tasks = await Task.find(filter)
      .populate('categories', 'name icon color')
      .sort(sort)

    res.json({ success: true, data: tasks })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.userId,
    }).populate('categories', 'name icon color')

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create task
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('categories').optional().isArray({ max: 5 }),
    body('dueDate').optional().isISO8601(),
    body('estimatedTime').optional().trim(),
    body('scheduleType').optional().isIn(['daily', 'weekly', 'custom']),
  ],
  validate,
  async (req, res) => {
    try {
      const task = await Task.create({
        ...req.body,
        user: req.userId,
      })

      const populatedTask = await Task.findById(task._id).populate(
        'categories',
        'name icon color'
      )

      res.status(201).json({ success: true, data: populatedTask })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Bulk create tasks
router.post(
  '/bulk',
  auth,
  [
    body('tasks').isArray({ min: 1, max: 50 }),
    body('tasks.*.title').trim().notEmpty().isLength({ max: 200 }),
  ],
  validate,
  async (req, res) => {
    try {
      const tasks = req.body.tasks.map((task) => ({
        ...task,
        user: req.userId,
      }))

      const createdTasks = await Task.insertMany(tasks)

      const populatedTasks = await Task.find({
        _id: { $in: createdTasks.map((t) => t._id) },
      }).populate('categories', 'name icon color')

      res.status(201).json({ success: true, data: populatedTasks })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Update task
router.put(
  '/:id',
  auth,
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('categories').optional().isArray({ max: 5 }),
    body('dueDate').optional(),
  ],
  validate,
  async (req, res) => {
    try {
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.userId },
        req.body,
        { new: true, runValidators: true }
      ).populate('categories', 'name icon color')

      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: 'Task not found' })
      }

      res.json({ success: true, data: task })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Toggle task completion
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId })

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    task.completed = !task.completed
    task.completedAt = task.completed ? new Date() : null
    // Status sync is handled by pre-save middleware
    await task.save()

    const populatedTask = await Task.findById(task._id).populate(
      'categories',
      'name icon color'
    )

    res.json({ success: true, data: populatedTask })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Start task (marks as in_progress)
router.patch('/:id/start', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId })

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    if (task.status === 'completed') {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot start a completed task' })
    }

    task.status = 'in_progress'
    if (!task.startedAt) {
      task.startedAt = new Date()
    }
    await task.save()

    const populatedTask = await Task.findById(task._id).populate(
      'categories',
      'name icon color'
    )

    res.json({ success: true, data: populatedTask })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Postpone task (updates due date and increments postponeCount)
router.patch('/:id/postpone', auth, async (req, res) => {
  try {
    const { newDueDate } = req.body

    if (!newDueDate) {
      return res
        .status(400)
        .json({ success: false, message: 'New due date is required' })
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.userId })

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    // Track postpone history
    if (task.dueDate) {
      task.postponeHistory = task.postponeHistory || []
      task.postponeHistory.push({
        originalDate: task.dueDate,
        newDate: new Date(newDueDate),
        postponedAt: new Date(),
      })
    }

    task.dueDate = new Date(newDueDate)
    task.postponeCount = (task.postponeCount || 0) + 1
    await task.save()

    const populatedTask = await Task.findById(task._id).populate(
      'categories',
      'name icon color'
    )

    res.json({ success: true, data: populatedTask })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Link task to goal
router.patch('/:id/link-goal', auth, async (req, res) => {
  try {
    const { goalId } = req.body

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { goalId: goalId || null },
      { new: true }
    ).populate('categories', 'name icon color')

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    res.json({ success: true, data: task })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reorder tasks
router.put(
  '/reorder',
  auth,
  [
    body('tasks').isArray(),
    body('tasks.*.id').notEmpty(),
    body('tasks.*.sortOrder').isInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const bulkOps = req.body.tasks.map(({ id, sortOrder }) => ({
        updateOne: {
          filter: { _id: id, user: req.userId },
          update: { sortOrder },
        },
      }))

      await Task.bulkWrite(bulkOps)

      res.json({ success: true, message: 'Tasks reordered' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    })

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' })
    }

    res.json({ success: true, message: 'Task deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk delete tasks
router.delete(
  '/bulk',
  auth,
  [body('ids').isArray({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const result = await Task.deleteMany({
        _id: { $in: req.body.ids },
        user: req.userId,
      })

      res.json({
        success: true,
        message: `${result.deletedCount} tasks deleted`,
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Clear completed tasks
router.delete('/clear-completed', auth, async (req, res) => {
  try {
    const result = await Task.deleteMany({ user: req.userId, completed: true })
    res.json({
      success: true,
      message: `${result.deletedCount} completed tasks cleared`,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
