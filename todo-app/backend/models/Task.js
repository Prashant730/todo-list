const mongoose = require('mongoose')

/**
 * TASK MODEL - Deep Productivity Analysis
 *
 * Field Justifications:
 * - title: Core identifier for the task
 * - description: Additional context for complex tasks
 * - category: Enables focus/context-switching analysis
 * - priority: Enables priority vs reality analysis (do high-priority tasks get done faster?)
 * - status: Tracks task lifecycle (pending → in_progress → completed)
 * - createdAt: Baseline for all time-based analytics
 * - startedAt: Measures procrastination (time between creation and start)
 * - completedAt: Enables completion time analysis
 * - dueDate: Enables overdue analysis and deadline adherence tracking
 * - postponeCount: Tracks procrastination behavior (tasks pushed back repeatedly)
 * - reopenCount: Tracks tasks marked complete then reopened (indicates unclear completion criteria)
 * - goalId: Links tasks to weekly/monthly goals for alignment analysis
 * - lastCategorySwitch: Tracks when user switched to this task's category (focus analysis)
 * - focusSessions: Array of work sessions for uninterrupted focus duration analysis
 */

const focusSessionSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    durationMinutes: { type: Number, default: 0 },
  },
  { _id: false }
)

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    // Single category for cleaner analytics (can still have tags for flexibility)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    // Legacy support for multiple categories
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    // Task lifecycle status
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    // Timestamps for analytics
    startedAt: Date, // When user first started working on task
    completedAt: Date,
    dueDate: Date,

    // Behavioral tracking
    postponeCount: {
      type: Number,
      default: 0,
    },
    postponeHistory: [
      {
        originalDate: Date,
        newDate: Date,
        postponedAt: { type: Date, default: Date.now },
      },
    ],
    reopenCount: {
      type: Number,
      default: 0,
    },
    reopenHistory: [
      {
        reopenedAt: { type: Date, default: Date.now },
        reason: String,
      },
    ],

    // Goal alignment
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
    },

    // Focus tracking
    focusSessions: [focusSessionSchema],
    totalFocusMinutes: {
      type: Number,
      default: 0,
    },

    // Legacy fields for backward compatibility
    completed: {
      type: Boolean,
      default: false,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    estimatedTime: String,
    estimatedMinutes: Number, // Numeric version for analytics
    scheduleType: {
      type: String,
      enum: ['daily', 'weekly', 'custom', null],
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
)

// Indexes for efficient analytics queries
taskSchema.index({ user: 1, completed: 1 })
taskSchema.index({ user: 1, status: 1 })
taskSchema.index({ user: 1, dueDate: 1 })
taskSchema.index({ user: 1, priority: 1 })
taskSchema.index({ user: 1, createdAt: 1 })
taskSchema.index({ user: 1, completedAt: 1 })
taskSchema.index({ user: 1, category: 1 })
taskSchema.index({ user: 1, goalId: 1 })
taskSchema.index({ user: 1, postponeCount: 1 })

// Virtual for completion time in hours
taskSchema.virtual('completionTimeHours').get(function () {
  if (!this.completedAt || !this.createdAt) return null
  return (this.completedAt - this.createdAt) / (1000 * 60 * 60)
})

// Virtual for time to start (procrastination indicator)
taskSchema.virtual('timeToStartHours').get(function () {
  if (!this.startedAt || !this.createdAt) return null
  return (this.startedAt - this.createdAt) / (1000 * 60 * 60)
})

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.completed) return false
  return new Date() > this.dueDate
})

// Virtual for days overdue
taskSchema.virtual('daysOverdue').get(function () {
  if (!this.dueDate || this.completed) return 0
  const now = new Date()
  if (now <= this.dueDate) return 0
  return Math.floor((now - this.dueDate) / (1000 * 60 * 60 * 24))
})

// Pre-save middleware to sync status with completed flag
taskSchema.pre('save', function (next) {
  if (this.isModified('completed')) {
    if (this.completed && this.status !== 'completed') {
      this.status = 'completed'
      if (!this.completedAt) this.completedAt = new Date()
    } else if (!this.completed && this.status === 'completed') {
      this.status = this.startedAt ? 'in_progress' : 'pending'
      // Track reopen
      this.reopenCount = (this.reopenCount || 0) + 1
      this.reopenHistory = this.reopenHistory || []
      this.reopenHistory.push({ reopenedAt: new Date() })
    }
  }

  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completed) {
      this.completed = true
      if (!this.completedAt) this.completedAt = new Date()
    } else if (this.status === 'in_progress' && !this.startedAt) {
      this.startedAt = new Date()
    }
  }

  next()
})

module.exports = mongoose.model('Task', taskSchema)
