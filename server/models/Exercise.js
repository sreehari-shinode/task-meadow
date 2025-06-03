const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  muscleGroup: {
    type: String,
    required: true,
    enum: [
      'Chest',
      'Back',
      'Shoulders',
      'Biceps',
      'Triceps',
      'Legs',
      'Core',
      'Full Body'
    ]
  },
  description: {
    type: String,
    required: true
  },
  equipment: {
    type: String,
    required: true,
    enum: [
      'Barbell',
      'Dumbbell',
      'Machine',
      'Cable',
      'Bodyweight',
      'Kettlebell',
      'Resistance Band',
      'Other'
    ]
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  instructions: {
    type: [String],
    required: true
  },
  imageUrl: {
    type: String
  },
  videoUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exercise', ExerciseSchema); 