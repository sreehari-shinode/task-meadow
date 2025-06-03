const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  musclesHit: [{
    type: String,
    required: true
  }],
  duration: {
    type: Number,  // in minutes
    required: true
  },
  cardio: {
    activity: {
      type: String,
      required: false  // Changed to false since it's optional
    },
    duration: {
      type: Number,  // in minutes
      required: false  // Changed to false since it's optional
    },
    distance: {
      type: Number,  // in kilometers
      required: false
    },
    notes: String
  },
  personalRecords: [{
    exercise: String,
    weight: Number,
    reps: Number,
    notes: String
  }],
  additionalNotes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
workoutSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Workout', workoutSchema); 