const mongoose = require('mongoose')

const templateTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  estimatedTime: String,
  sortOrder: {
    type: Number,
    default: 0,
  },
})

const templateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Template name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    category: String,
    tags: [String],
    tasks: [templateTaskSchema],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Template', templateSchema)
