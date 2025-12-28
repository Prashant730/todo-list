const mongoose = require('mongoose')

/**
 * GOAL MODEL - For Goal Alignment Analysis
 *
 * Goals represent weekly/monthly objectives that tasks can be linked to.
 * This enables measuring task-to-goal alignment ratio and goal completion rates.
 */

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
      default: 'weekly',
    },
    // Goal period
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Target metrics
    targetTaskCount: {
      type: Number,
      default: 0, // 0 means no specific target
    },
    // Status tracking
    status: {
      type: String,
      enum: ['active', 'completed', 'failed', 'abandoned'],
      default: 'active',
    },
    completedAt: Date,
    // Computed at query time, but cached for performance
    linkedTaskCount: {
      type: Number,
      default: 0,
    },
    completedTaskCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
goalSchema.index({ user: 1, status: 1 })
goalSchema.index({ user: 1, type: 1 })
goalSchema.index({ user: 1, startDate: 1, endDate: 1 })

// Virtual for completion rate
goalSchema.virtual('completionRate').get(function () {
  if (this.linkedTaskCount === 0) return 0
  return (this.completedTaskCount / this.linkedTaskCount) * 100
})

// Virtual for progress percentage
goalSchema.virtual('progress').get(function () {
  if (this.targetTaskCount === 0) {
    return this.linkedTaskCount > 0
      ? (this.completedTaskCount / this.linkedTaskCount) * 100
      : 0
  }
  return Math.min((this.completedTaskCount / this.targetTaskCount) * 100, 100)
})

module.exports = mongoose.model('Goal', goalSchema)
