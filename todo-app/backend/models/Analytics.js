const mongoose = require('mongoose')

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    tasksCreated: {
      type: Number,
      default: 0,
    },
    tasksOverdue: {
      type: Number,
      default: 0,
    },
    productivityScore: Number,
    completionRate: Number,
    avgCompletionTimeHours: Number,
    byPriority: {
      high: { completed: Number, total: Number },
      medium: { completed: Number, total: Number },
      low: { completed: Number, total: Number },
    },
    byCategory: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
)

// Unique constraint for user + date
analyticsSchema.index({ user: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('Analytics', analyticsSchema)
