const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');

// Get workout summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { period } = req.query;
    const userId = req.user.id;

    console.log('=== Summary Request Details ===');
    console.log('Period:', period);
    console.log('User ID:', userId);

    // Validate and parse the date
    if (!period || !period.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log('❌ Invalid date format:', period);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD' 
      });
    }

    // Parse the date components
    const [year, month] = period.split('-').map(Number);
    console.log('📅 Parsed date components:', { year, month });

    // Validate month range
    if (month < 1 || month > 12) {
      console.log('❌ Invalid month:', month);
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Must be between 1 and 12'
      });
    }

    // Use UTC so we match workouts stored with UTC dates
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    console.log('📅 Date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Get all workouts within the date range
    const workouts = await Workout.find({
      userId: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 }); // Sort by date ascending

    console.log('💪 Found workouts:', workouts.length);

    // Group workouts by day
    const dailyWorkouts = {};
    workouts.forEach(workout => {
      const dateKey = workout.date.toISOString().split('T')[0];
      if (!dailyWorkouts[dateKey]) {
        dailyWorkouts[dateKey] = {
          totalTime: 0,
          cardioTime: 0,
          exercises: [],
          cardio: null,
          musclesHit: new Set()
        };
      }
      
      dailyWorkouts[dateKey].totalTime += workout.duration || 0;
      
      // Add cardio activity
      if (workout.cardio && workout.cardio.activity) {
        dailyWorkouts[dateKey].cardioTime += workout.cardio.duration || 0;
        dailyWorkouts[dateKey].cardio = {
          activity: workout.cardio.activity,
          duration: workout.cardio.duration,
          distance: workout.cardio.distance,
          notes: workout.cardio.notes
        };
      }
      
      // Add personal records as exercises
      if (workout.personalRecords && workout.personalRecords.length > 0) {
        workout.personalRecords.forEach(pr => {
          dailyWorkouts[dateKey].exercises.push({
            name: pr.exercise,
            weight: pr.weight,
            reps: pr.reps,
            notes: pr.notes
          });
        });
      }
      
      // Add muscles hit
      workout.musclesHit.forEach(muscle => {
        dailyWorkouts[dateKey].musclesHit.add(muscle);
      });
    });

    // Calculate weekly breakdown
    const weeklyBreakdown = [];
    
    // Helper function to get the first Sunday of the month
    const getFirstSunday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() + (7 - day); // Get to next Sunday
      return new Date(d.setDate(diff));
    };

    // Helper function to get next Monday
    const getNextMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() + (day === 0 ? 1 : 8 - day); // If Sunday, add 1, else add days until next Monday
      return new Date(d.setDate(diff));
    };

    // Start with first day of month
    let currentWeekStart = new Date(startDate);
    let isFirstWeek = true;

    while (currentWeekStart <= endDate) {
      let weekEnd;
      
      if (isFirstWeek) {
        // For first week, end on Sunday
        weekEnd = getFirstSunday(currentWeekStart);
        isFirstWeek = false;
      } else {
        // For subsequent weeks, end on Sunday (7 days from Monday)
        weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
      }
      
      // Ensure we don't go beyond month end
      if (weekEnd > endDate) {
        weekEnd = new Date(endDate);
      }

      const weekStats = {
        weekNumber: weeklyBreakdown.length + 1,
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        totalTime: 0,
        cardioTime: 0,
        sessions: 0,
        activeDays: 0,
        exercises: new Set(),
        cardio: new Set(),
        musclesHit: new Set(),
        dailyBreakdown: []
      };

      // Process each day in the week
      let currentDay = new Date(currentWeekStart);
      while (currentDay <= weekEnd && currentDay <= endDate) {
        const dateKey = currentDay.toISOString().split('T')[0];
        const dayWorkout = dailyWorkouts[dateKey];

        if (dayWorkout) {
          weekStats.totalTime += dayWorkout.totalTime;
          weekStats.cardioTime += dayWorkout.cardioTime;
          weekStats.sessions += 1;
          weekStats.activeDays += 1;
          
          dayWorkout.exercises.forEach(ex => {
            weekStats.exercises.add(ex.name);
          });
          
          if (dayWorkout.cardio && dayWorkout.cardio.activity) {
            weekStats.cardio.add(dayWorkout.cardio.activity);
          }
          
          dayWorkout.musclesHit.forEach(muscle => {
            weekStats.musclesHit.add(muscle);
          });

          weekStats.dailyBreakdown.push({
            date: dateKey,
            totalTime: dayWorkout.totalTime,
            cardioTime: dayWorkout.cardioTime,
            exercises: dayWorkout.exercises,
            cardio: dayWorkout.cardio,
            musclesHit: Array.from(dayWorkout.musclesHit)
          });
        } else {
          weekStats.dailyBreakdown.push({
            date: dateKey,
            totalTime: 0,
            cardioTime: 0,
            exercises: [],
            cardio: null,
            musclesHit: []
          });
        }

        currentDay.setDate(currentDay.getDate() + 1);
      }

      weeklyBreakdown.push({
        ...weekStats,
        uniqueExercises: weekStats.exercises.size,
        uniqueCardio: weekStats.cardio.size,
        musclesHit: Array.from(weekStats.musclesHit)
      });

      // Move to next Monday for subsequent weeks
      currentWeekStart = getNextMonday(currentWeekStart);
    }

    // Calculate monthly totals
    const monthlyStats = {
      totalTime: weeklyBreakdown.reduce((sum, week) => sum + week.totalTime, 0),
      totalCardioTime: weeklyBreakdown.reduce((sum, week) => sum + week.cardioTime, 0),
      totalSessions: weeklyBreakdown.reduce((sum, week) => sum + week.sessions, 0),
      totalActiveDays: weeklyBreakdown.reduce((sum, week) => sum + week.activeDays, 0),
      averageTimePerSession: 0,
      mostFrequentMuscles: [],
      mostFrequentExercises: [],
      mostFrequentCardio: []
    };

    if (monthlyStats.totalSessions > 0) {
      monthlyStats.averageTimePerSession = Math.round(monthlyStats.totalTime / monthlyStats.totalSessions);
    }

    // Calculate most frequent muscles, exercises, and cardio activities
    const muscleFrequency = {};
    const exerciseFrequency = {};
    const cardioFrequency = {};

    weeklyBreakdown.forEach(week => {
      week.musclesHit.forEach(muscle => {
        muscleFrequency[muscle] = (muscleFrequency[muscle] || 0) + 1;
      });

      week.dailyBreakdown.forEach(day => {
        day.exercises.forEach(ex => {
          exerciseFrequency[ex.name] = (exerciseFrequency[ex.name] || 0) + 1;
        });
        
        if (day.cardio && day.cardio.activity) {
          cardioFrequency[day.cardio.activity] = (cardioFrequency[day.cardio.activity] || 0) + 1;
        }
      });
    });

    monthlyStats.mostFrequentMuscles = Object.entries(muscleFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    monthlyStats.mostFrequentExercises = Object.entries(exerciseFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    monthlyStats.mostFrequentCardio = Object.entries(cardioFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const response = {
      success: true,
      data: {
        monthlyStats,
        weeklyBreakdown
      }
    };

    console.log('✅ Sending formatted response');
    return res.json(response);

  } catch (error) {
    console.error('❌ Error in summary endpoint:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error occurred',
      error: error.message
    });
  }
});

// GET workout for specific date (accepts YYYY-MM-DD or ISO string)
router.get('/:date', auth, async (req, res) => {
  try {
    const param = req.params.date;
    let startOfDay;
    let endOfDay;
    if (param && param.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = param.split('-').map(Number);
      startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    } else {
      const date = new Date(param);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid date' });
      }
      const y = date.getUTCFullYear();
      const m = date.getUTCMonth();
      const d = date.getUTCDate();
      startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
      endOfDay = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
    }
    const workout = await Workout.findOne({
      userId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!workout) {
      return res.status(404).json({ msg: 'No workout found for this date' });
    }

    res.json(workout);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST create/update workout — use UTC date to match GET
router.post('/', auth, async (req, res) => {
  try {
    const { date, musclesHit, duration, intensity, cardio, personalRecords, additionalNotes } = req.body;

    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD' });
    }

    const [y, m, d] = date.split('-').map(Number);
    const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));

    const validIntensity = (intensity && ['Low', 'Medium', 'High'].includes(String(intensity).trim())) ? String(intensity).trim() : 'Medium';

    let workout = await Workout.findOne({
      userId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (workout) {
      workout.musclesHit = musclesHit;
      workout.duration = duration;
      workout.intensity = validIntensity;
      // Only update cardio if it has activity or duration
      if (cardio && (cardio.activity || cardio.duration)) {
        workout.cardio = cardio;
      } else {
        workout.cardio = null; // Clear cardio if no valid data
      }
      workout.personalRecords = personalRecords;
      workout.additionalNotes = additionalNotes;
      await workout.save();
      return res.json(workout);
    }

    workout = new Workout({
      userId: req.user.id,
      date: startOfDay,
      musclesHit,
      duration,
      intensity: validIntensity,
      cardio: (cardio && (cardio.activity || cardio.duration)) ? cardio : null,
      personalRecords,
      additionalNotes
    });

    await workout.save();
    res.json(workout);
  } catch (err) {
    console.error('Error saving workout:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// DELETE workout by date (accepts YYYY-MM-DD or ISO string)
router.delete('/:date', auth, async (req, res) => {
  try {
    const param = req.params.date;
    let startOfDay;
    let endOfDay;
    if (param && param.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = param.split('-').map(Number);
      startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    } else {
      const date = new Date(param);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid date' });
      }
      const y = date.getUTCFullYear();
      const m = date.getUTCMonth();
      const d = date.getUTCDate();
      startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
      endOfDay = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
    }
    const workout = await Workout.findOneAndDelete({
      userId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!workout) {
      return res.status(404).json({ msg: 'No workout found for this date' });
    }

    res.json({ msg: 'Workout removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
