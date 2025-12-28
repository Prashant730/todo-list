const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    icon: {
      type: String,
      maxlength: 10,
    },
    color: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure unique category names per user
categorySchema.index({ user: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('Category', categorySchema)
