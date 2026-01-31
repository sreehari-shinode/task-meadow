const mongoose = require('mongoose');

const weightTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
weightTrackingSchema.index({ userId: 1, date: 1 });
weightTrackingSchema.index({ userId: 1, weekStart: 1 });

module.exports = mongoose.model('WeightTracking', weightTrackingSchema);
