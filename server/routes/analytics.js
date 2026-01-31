/**
 * Analytics routes for day-level correlation.
 * Use GET /api/analytics/day?date=YYYY-MM-DD to get all data for a single day:
 * workouts, mocks (CAT), daily habit completions, weekly habit context, and events.
 * Events (e.g. sleep hours, mood) are stored via /api/events and correlated by date
 * for analytics like "days with less sleep vs mock scores".
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');
const MockTest = require('../models/MockTest');
const DailyHabitDefinition = require('../models/DailyHabitDefinition');
const DailyHabitCompletion = require('../models/DailyHabitCompletion');
const WeeklyHabitDefinition = require('../models/WeeklyHabitDefinition');
const WeeklyHabitCompletion = require('../models/WeeklyHabitCompletion');
const Event = require('../models/Event');

function parseYmd(ymd) {
  if (!ymd || !ymd.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * GET /api/analytics/day?date=YYYY-MM-DD
 * Returns all data for a single day for correlation/analytics:
 * - workouts
 * - mocks (CAT)
 * - daily habit completions (with habit names)
 * - events (e.g. sleep, mood)
 * - week context: weekIndex in month for that day, and weekly habit completions for that week
 */
router.get('/day', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const date = parseYmd(req.query.date);
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date. Expected YYYY-MM-DD',
      });
    }
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [workouts, mocks, events, dailyCompletions] = await Promise.all([
      Workout.find({
        userId,
        date: { $gte: date, $lte: endOfDay },
      }).sort({ date: 1 }),
      MockTest.find({
        userId,
        date: { $gte: date, $lte: endOfDay },
      }).sort({ createdAt: 1 }),
      Event.find({
        userId,
        date: { $gte: date, $lte: endOfDay },
      }).sort({ type: 1 }),
      DailyHabitCompletion.find({
        userId,
        date: { $gte: date, $lte: endOfDay },
      }).populate('habitDefinitionId', 'name goal monthKey'),
    ]);

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstWeekday = firstDay.getDay();
    const weeksInMonth = Math.ceil((firstWeekday + daysInMonth) / 7) || 1;
    const dayOfMonth = date.getDate();
    const dayIndex = dayOfMonth - 1;
    const weekIndex = Math.floor(dayIndex / 7) + 1;

    let weeklyHabits = [];
    if (weekIndex >= 1 && weekIndex <= weeksInMonth) {
      const weeklyDefs = await WeeklyHabitDefinition.find({
        userId,
        monthKey,
      }).sort({ order: 1 });
      const weeklyCompletions = await WeeklyHabitCompletion.find({
        userId,
        monthKey,
        weekIndex,
        habitDefinitionId: { $in: weeklyDefs.map((d) => d._id) },
      });
      const byDef = {};
      weeklyCompletions.forEach((c) => {
        byDef[c.habitDefinitionId.toString()] = c.completed;
      });
      weeklyDefs.forEach((d) => {
        weeklyHabits.push({
          id: d._id,
          name: d.name,
          goal: d.goal,
          completed: byDef[d._id.toString()] ?? false,
        });
      });
    }

    const dailyHabits = dailyCompletions.map((c) => ({
      habitId: c.habitDefinitionId?._id,
      name: c.habitDefinitionId?.name,
      goal: c.habitDefinitionId?.goal,
      completed: c.completed,
    }));

    return res.json({
      success: true,
      data: {
        date: req.query.date,
        workouts: workouts.map((w) => ({
          id: w._id,
          duration: w.duration,
          musclesHit: w.musclesHit,
          cardio: w.cardio,
          personalRecords: w.personalRecords,
          additionalNotes: w.additionalNotes,
        })),
        mocks: mocks.map((m) => ({
          id: m._id,
          type: m.type,
          attempted: m.attempted,
          correct: m.correct,
          wrong: m.wrong,
          totalQuestions: m.totalQuestions,
          totalMarks: m.totalMarks,
          percentage: m.percentage,
          notes: m.notes,
        })),
        dailyHabits,
        weeklyHabits,
        weekContext: {
          monthKey,
          weekIndex,
          weeksInMonth,
        },
        events: events.map((e) => ({
          id: e._id,
          type: e.type,
          value: e.value,
          notes: e.notes,
        })),
      },
    });
  } catch (error) {
    console.error('Error in analytics/day:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
