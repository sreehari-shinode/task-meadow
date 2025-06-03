const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Profile = require('../models/Profile');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-images/');
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Check username availability
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    const existingUser = await User.findOne({ username });
    res.json({ available: !existingUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.post('/update', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const { 
      username,
      // Personal Info
      age,
      height,
      weight,
      gender,
      // Fitness Journey
      fitnessGoal,
      activityLevel,
      workoutSplit,
      targetWeight,
      targetHeight,
      bodyFatPercentage,
      // Nutritional Preferences
      calorieGoal,
      dietType,
      mealFrequency,
      foodAllergies
    } = req.body;
    
    // Only check and update username if it's provided and different from current
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      await User.findByIdAndUpdate(req.user.id, { username });
    }

    // Update or create profile
    const profileData = {
      // Personal Info
      age: age || null,
      height: height || null,
      weight: weight || null,
      gender: gender || null,
      // Fitness Journey
      fitnessGoal: fitnessGoal || null,
      activityLevel: activityLevel || null,
      workoutSplit: workoutSplit || null,
      targetWeight: targetWeight || null,
      targetHeight: targetHeight || null,
      bodyFatPercentage: bodyFatPercentage || null,
      // Nutritional Preferences
      calorieGoal: calorieGoal || null,
      dietType: dietType || null,
      mealFrequency: mealFrequency || null,
      foodAllergies: foodAllergies ? JSON.parse(foodAllergies) : []
    };

    if (req.file) {
      profileData.profileImage = `/uploads/profile-images/${req.file.filename}`;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      profileData,
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 