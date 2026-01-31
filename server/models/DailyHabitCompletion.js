const mongoose = require('mongoose');

const dailyHabitCompletionSchema = new mongoose.Schema(
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
    habitDefinitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyHabitDefinition',
      required: true,
      index: true,
    },
    completed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

dailyHabitCompletionSchema.index({ userId: 1, date: 1 });
dailyHabitCompletionSchema.index({ userId: 1, habitDefinitionId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyHabitCompletion', dailyHabitCompletionSchema);
