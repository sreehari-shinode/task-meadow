const mongoose = require('mongoose');

const weeklyHabitCompletionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    monthKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },
    weekIndex: { type: Number, required: true, min: 1, index: true },
    habitDefinitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WeeklyHabitDefinition',
      required: true,
      index: true,
    },
    completed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

weeklyHabitCompletionSchema.index({ userId: 1, monthKey: 1, weekIndex: 1 });
weeklyHabitCompletionSchema.index(
  { userId: 1, habitDefinitionId: 1, monthKey: 1, weekIndex: 1 },
  { unique: true }
);

module.exports = mongoose.model('WeeklyHabitCompletion', weeklyHabitCompletionSchema);
