const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    notificationEmail: {
      type: Boolean,
      default: true,
    },
    notificationPush: {
      type: Boolean,
      default: true,
    },
    reminderMinutes: {
      type: Number,
      default: 30,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Settings', settingsSchema)
