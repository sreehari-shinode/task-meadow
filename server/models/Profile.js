const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Personal Info
  age: {
    type: Number,
    min: 0,
    max: 120
  },
  height: {
    type: Number,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  // Fitness Journey
  fitnessGoal: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Endurance', 'Strength']
  },
  activityLevel: {
    type: String,
    enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active']
  },
  workoutSplit: {
    type: String,
    enum: ['Full Body', 'Upper-Lower', 'Push-Pull-Legs', 'Bro Split', 'Custom Split']
  },
  targetWeight: {
    type: Number,
    min: 0
  },
  targetHeight: {
    type: Number,
    min: 0
  },
  bodyFatPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  // Nutritional Preferences
  calorieGoal: {
    type: Number,
    min: 0
  },
  dietType: {
    type: String,
    enum: ['Balanced', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean', 'Custom']
  },
  mealFrequency: {
    type: Number,
    min: 1,
    max: 10
  },
  profileImage: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema); 