const express = require('express');
const router = express.Router();
const WeightTracking = require('../models/WeightTracking');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

// Helper function to get week start (Monday)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper function to check if today is Monday
function isMonday(date = new Date()) {
  return date.getDay() === 1;
}

// Get weight tracking data
router.get('/', auth, async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const userId = req.user.id;
    
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
      
      switch (period) {
        case 'week':
          start = new Date();
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start = new Date();
          start.setMonth(start.getMonth() - 1);
          break;
        case 'year':
          start = new Date();
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start = new Date();
          start.setMonth(start.getMonth() - 1);
      }
    }
    
    start.setHours(0, 0, 0, 0);
    
    const weightData = await WeightTracking.find({
      userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    res.json({
      success: true,
      data: weightData,
      period,
      startDate: start,
      endDate: end
    });
  } catch (error) {
    console.error('Error fetching weight data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add or update weight entry
router.post('/entry', auth, async (req, res) => {
  try {
    const { weight, date, notes } = req.body;
    const userId = req.user.id;
    
    if (!weight || weight <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid weight value' });
    }
    
    const entryDate = date ? new Date(date) : new Date();
    const weekStart = getWeekStart(entryDate);
    
    // Check if entry already exists for this date
    const existingEntry = await WeightTracking.findOne({
      userId,
      date: {
        $gte: new Date(entryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(entryDate.setHours(23, 59, 59, 999))
      }
    });
    
    let weightEntry;
    if (existingEntry) {
      // Update existing entry
      weightEntry = await WeightTracking.findByIdAndUpdate(
        existingEntry._id,
        { weight, notes, weekStart },
        { new: true }
      );
    } else {
      // Create new entry
      weightEntry = new WeightTracking({
        userId,
        weight,
        date: entryDate,
        weekStart,
        notes: notes || ''
      });
      await weightEntry.save();
    }
    
    // Update profile weight with latest weight
    await Profile.findOneAndUpdate(
      { userId },
      { weight },
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      data: weightEntry,
      message: existingEntry ? 'Weight entry updated' : 'Weight entry added'
    });
  } catch (error) {
    console.error('Error adding weight entry:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get weight analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;
    
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    let start, end;
    end = new Date();
    end.setHours(23, 59, 59, 999);
    
    switch (period) {
      case 'week':
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date();
        start.setMonth(start.getMonth() - 1);
    }
    
    start.setHours(0, 0, 0, 0);
    
    const weightData = await WeightTracking.find({
      userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    if (weightData.length === 0) {
      return res.json({
        success: true,
        data: {
          currentWeight: profile.weight || null,
          targetWeight: profile.targetWeight || null,
          weightDifference: null,
          trend: null,
          entries: []
        }
      });
    }
    
    const currentWeight = weightData[weightData.length - 1].weight;
    const targetWeight = profile.targetWeight;
    const weightDifference = targetWeight ? currentWeight - targetWeight : null;
    
    // Calculate trend
    let trend = 'stable';
    if (weightData.length >= 2) {
      const recentWeight = weightData[weightData.length - 1].weight;
      const previousWeight = weightData[Math.max(0, weightData.length - 2)].weight;
      const change = recentWeight - previousWeight;
      
      if (Math.abs(change) < 0.1) {
        trend = 'stable';
      } else if (change > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }
    }
    
    res.json({
      success: true,
      data: {
        currentWeight,
        targetWeight,
        weightDifference,
        trend,
        entries: weightData,
        canEnterToday: isMonday()
      }
    });
  } catch (error) {
    console.error('Error fetching weight analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check if user can enter weight today (Monday check)
router.get('/can-enter', auth, async (req, res) => {
  try {
    const today = new Date();
    const canEnter = isMonday(today);
    
    res.json({
      success: true,
      data: {
        canEnter,
        isMonday: canEnter,
        nextMonday: getNextMonday()
      }
    });
  } catch (error) {
    console.error('Error checking weight entry permission:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to get next Monday
function getNextMonday() {
  const today = new Date();
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

module.exports = router;
