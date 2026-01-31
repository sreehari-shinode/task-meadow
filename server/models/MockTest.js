const mongoose = require('mongoose');

const mockTestSchema = new mongoose.Schema(
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
      enum: ['VARC', 'LRDI', 'QA', 'FULL'],
      index: true,
    },
    attempted: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    wrong: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    totalMarks: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Helpful index for month queries
mockTestSchema.index({ userId: 1, date: 1, type: 1 });

module.exports = mongoose.model('MockTest', mockTestSchema);

