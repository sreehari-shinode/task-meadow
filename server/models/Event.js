const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      default: 'general',
    },
    value: { type: mongoose.Schema.Types.Mixed },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

eventSchema.index({ userId: 1, date: 1 });
eventSchema.index({ userId: 1, type: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);
