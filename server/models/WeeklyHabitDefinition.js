const mongoose = require('mongoose');

const weeklyHabitDefinitionSchema = new mongoose.Schema(
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
    name: { type: String, required: true, trim: true },
    goal: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

weeklyHabitDefinitionSchema.index({ userId: 1, monthKey: 1 });

module.exports = mongoose.model('WeeklyHabitDefinition', weeklyHabitDefinitionSchema);
