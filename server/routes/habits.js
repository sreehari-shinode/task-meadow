const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DailyHabitDefinition = require('../models/DailyHabitDefinition');
const DailyHabitCompletion = require('../models/DailyHabitCompletion');
const WeeklyHabitDefinition = require('../models/WeeklyHabitDefinition');
const WeeklyHabitCompletion = require('../models/WeeklyHabitCompletion');

function dateAtUtcMidnight(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}
function parseYmd(ymd) {
  if (!ymd || !ymd.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const date = dateAtUtcMidnight(y, m, d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function monthKeyFromYmd(ymd) {
  if (!ymd || !ymd.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
  const [y, m] = ymd.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}`;
}

function parseMonthKey(key) {
  if (!key || !key.match(/^\d{4}-\d{2}$/)) return null;
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m };
}

// ---------- Daily habits ----------

// GET /api/habits/daily?month=YYYY-MM — list definitions + completions for month
router.get('/daily', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.query.month;
    const mk = parseMonthKey(month);
    if (!mk) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Expected YYYY-MM',
      });
    }
    const startDate = dateAtUtcMidnight(mk.year, mk.month, 1);
    const endDate = new Date(Date.UTC(mk.year, mk.month, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(mk.year, mk.month, 0).getDate();

    const definitions = await DailyHabitDefinition.find({
      userId,
      monthKey: month,
    }).sort({ order: 1, createdAt: 1 });

    const completions = await DailyHabitCompletion.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      habitDefinitionId: { $in: definitions.map((d) => d._id) },
    });

    const completionByDefAndDay = {};
    completions.forEach((c) => {
      const defId = c.habitDefinitionId.toString();
      const day = c.date.getUTCDate();
      if (!completionByDefAndDay[defId]) completionByDefAndDay[defId] = {};
      completionByDefAndDay[defId][day] = c.completed;
    });

    const habits = definitions.map((d, idx) => {
      const checks = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return completionByDefAndDay[d._id.toString()]?.[day] ?? false;
      });
      return {
        id: d._id,
        name: d.name,
        goal: d.goal,
        order: d.order ?? idx,
        checks,
      };
    });

    return res.json({
      success: true,
      data: {
        monthKey: month,
        daysInMonth,
        habits,
      },
    });
  } catch (error) {
    console.error('Error fetching daily habits:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/habits/daily — create/update definitions and bulk completions for a month
router.post('/daily', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { monthKey, habits: habitsPayload } = req.body;
    const mk = parseMonthKey(monthKey);
    if (!mk) {
      return res.status(400).json({
        success: false,
        message: 'Invalid monthKey. Expected YYYY-MM',
      });
    }
    const startDate = dateAtUtcMidnight(mk.year, mk.month, 1);
    const endDate = new Date(Date.UTC(mk.year, mk.month, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(mk.year, mk.month, 0).getDate();

    const existingDefs = await DailyHabitDefinition.find({
      userId,
      monthKey,
    });
    const existingIds = new Set(existingDefs.map((d) => d._id.toString()));

    const toCreate = [];
    const toUpdate = [];
    const payloadIds = new Set();

    (habitsPayload || []).forEach((h, idx) => {
      const name = (h.name || '').trim();
      if (!name) return;
      const goal = Math.max(0, parseInt(h.goal, 10) || 0);
      const checks = Array.isArray(h.checks) ? h.checks : [];
      if (h.id && existingIds.has(h.id.toString())) {
        toUpdate.push({
          id: h.id,
          name,
          goal,
          order: idx,
          checks: checks.slice(0, daysInMonth),
        });
        payloadIds.add(h.id.toString());
      } else {
        toCreate.push({ name, goal, order: idx, checks: checks.slice(0, daysInMonth) });
      }
    });

    for (const u of toUpdate) {
      await DailyHabitDefinition.updateOne(
        { _id: u.id, userId },
        { $set: { name: u.name, goal: u.goal, order: u.order } }
      );
      const defId = u.id;
      for (let day = 1; day <= u.checks.length && day <= daysInMonth; day++) {
        const date = dateAtUtcMidnight(mk.year, mk.month, day);
        await DailyHabitCompletion.findOneAndUpdate(
          { userId, habitDefinitionId: defId, date },
          { $set: { completed: !!u.checks[day - 1] } },
          { upsert: true, new: true }
        );
      }
    }

    for (const c of toCreate) {
      const doc = await DailyHabitDefinition.create({
        userId,
        monthKey,
        name: c.name,
        goal: c.goal,
        order: c.order,
      });
      for (let day = 1; day <= c.checks.length && day <= daysInMonth; day++) {
        const date = dateAtUtcMidnight(mk.year, mk.month, day);
        if (c.checks[day - 1]) {
          await DailyHabitCompletion.create({
            userId,
            habitDefinitionId: doc._id,
            date,
            completed: true,
          });
        }
      }
    }

    const toDelete = existingDefs.filter((d) => !payloadIds.has(d._id.toString()));
    for (const d of toDelete) {
      await DailyHabitCompletion.deleteMany({ userId, habitDefinitionId: d._id });
      await DailyHabitDefinition.deleteOne({ _id: d._id, userId });
    }

    const definitions = await DailyHabitDefinition.find({
      userId,
      monthKey,
    }).sort({ order: 1, createdAt: 1 });
    const completions = await DailyHabitCompletion.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      habitDefinitionId: { $in: definitions.map((d) => d._id) },
    });
    const completionByDefAndDay = {};
    completions.forEach((c) => {
      const defId = c.habitDefinitionId.toString();
      const day = c.date.getUTCDate();
      if (!completionByDefAndDay[defId]) completionByDefAndDay[defId] = {};
      completionByDefAndDay[defId][day] = c.completed;
    });
    const habits = definitions.map((d, idx) => {
      const checks = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return completionByDefAndDay[d._id.toString()]?.[day] ?? false;
      });
      return {
        id: d._id,
        name: d.name,
        goal: d.goal,
        order: d.order ?? idx,
        checks,
      };
    });

    return res.json({
      success: true,
      data: { monthKey, daysInMonth, habits },
    });
  } catch (error) {
    console.error('Error saving daily habits:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/habits/daily/completion — toggle single day completion
router.put('/daily/completion', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { habitDefinitionId, date: dateStr, completed } = req.body;
    const date = parseYmd(dateStr);
    if (!date || !habitDefinitionId) {
      return res.status(400).json({
        success: false,
        message: 'habitDefinitionId and date (YYYY-MM-DD) required',
      });
    }
    const def = await DailyHabitDefinition.findOne({
      _id: habitDefinitionId,
      userId,
    });
    if (!def) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    const doc = await DailyHabitCompletion.findOneAndUpdate(
      { userId, habitDefinitionId, date },
      { $set: { completed: completed !== false } },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error updating daily completion:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/habits/daily/:id — delete daily habit definition and its completions
router.delete('/daily/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await DailyHabitCompletion.deleteMany({ userId, habitDefinitionId: id });
    const deleted = await DailyHabitDefinition.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting daily habit:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---------- Weekly habits ----------

// GET /api/habits/weekly?month=YYYY-MM
router.get('/weekly', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.query.month;
    const mk = parseMonthKey(month);
    if (!mk) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Expected YYYY-MM',
      });
    }
    const firstDay = new Date(mk.year, mk.month - 1, 1);
    const daysInMonth = new Date(mk.year, mk.month, 0).getDate();
    const firstWeekday = firstDay.getDay();
    const weeksInMonth = Math.ceil((firstWeekday + daysInMonth) / 7) || 1;
    const WEEK_SLOTS = Array.from({ length: weeksInMonth }, (_, i) => i + 1);

    const definitions = await WeeklyHabitDefinition.find({
      userId,
      monthKey: month,
    }).sort({ order: 1, createdAt: 1 });

    const completions = await WeeklyHabitCompletion.find({
      userId,
      monthKey: month,
      habitDefinitionId: { $in: definitions.map((d) => d._id) },
    });

    const completionByDefAndWeek = {};
    completions.forEach((c) => {
      const defId = c.habitDefinitionId.toString();
      if (!completionByDefAndWeek[defId]) completionByDefAndWeek[defId] = {};
      completionByDefAndWeek[defId][c.weekIndex] = c.completed;
    });

    const habits = definitions.map((d, idx) => {
      const checks = WEEK_SLOTS.map(
        (w) => completionByDefAndWeek[d._id.toString()]?.[w] ?? false
      );
      return {
        id: d._id,
        name: d.name,
        goal: d.goal,
        order: d.order ?? idx,
        checks,
      };
    });

    return res.json({
      success: true,
      data: {
        monthKey: month,
        weeksInMonth,
        habits,
      },
    });
  } catch (error) {
    console.error('Error fetching weekly habits:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/habits/weekly — save weekly definitions + completions
router.post('/weekly', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { monthKey, habits: habitsPayload } = req.body;
    const mk = parseMonthKey(monthKey);
    if (!mk) {
      return res.status(400).json({
        success: false,
        message: 'Invalid monthKey. Expected YYYY-MM',
      });
    }
    const firstDay = new Date(mk.year, mk.month - 1, 1);
    const daysInMonth = new Date(mk.year, mk.month, 0).getDate();
    const weeksInMonth = Math.ceil((firstDay.getDay() + daysInMonth) / 7) || 1;
    const WEEK_SLOTS = Array.from({ length: weeksInMonth }, (_, i) => i + 1);

    const existingDefs = await WeeklyHabitDefinition.find({
      userId,
      monthKey,
    });
    const existingIds = new Set(existingDefs.map((d) => d._id.toString()));

    const toCreate = [];
    const toUpdate = [];
    const payloadIds = new Set();

    (habitsPayload || []).forEach((h, idx) => {
      const name = (h.name || '').trim();
      if (!name) return;
      const goal = Math.max(0, parseInt(h.goal, 10) || 0);
      const checks = Array.isArray(h.checks) ? h.checks : [];
      if (h.id && existingIds.has(h.id.toString())) {
        toUpdate.push({
          id: h.id,
          name,
          goal,
          order: idx,
          checks: checks.slice(0, WEEK_SLOTS.length),
        });
        payloadIds.add(h.id.toString());
      } else {
        toCreate.push({
          name,
          goal,
          order: idx,
          checks: checks.slice(0, WEEK_SLOTS.length),
        });
      }
    });

    for (const u of toUpdate) {
      await WeeklyHabitDefinition.updateOne(
        { _id: u.id, userId },
        { $set: { name: u.name, goal: u.goal, order: u.order } }
      );
      for (let w = 0; w < u.checks.length; w++) {
        const weekIndex = w + 1;
        await WeeklyHabitCompletion.findOneAndUpdate(
          { userId, habitDefinitionId: u.id, monthKey, weekIndex },
          { $set: { completed: !!u.checks[w] } },
          { upsert: true, new: true }
        );
      }
    }

    for (const c of toCreate) {
      const doc = await WeeklyHabitDefinition.create({
        userId,
        monthKey,
        name: c.name,
        goal: c.goal,
        order: c.order,
      });
      for (let w = 0; w < c.checks.length; w++) {
        if (c.checks[w]) {
          await WeeklyHabitCompletion.create({
            userId,
            habitDefinitionId: doc._id,
            monthKey,
            weekIndex: w + 1,
            completed: true,
          });
        }
      }
    }

    const toDelete = existingDefs.filter((d) => !payloadIds.has(d._id.toString()));
    for (const d of toDelete) {
      await WeeklyHabitCompletion.deleteMany({ userId, habitDefinitionId: d._id });
      await WeeklyHabitDefinition.deleteOne({ _id: d._id, userId });
    }

    const definitions = await WeeklyHabitDefinition.find({
      userId,
      monthKey,
    }).sort({ order: 1, createdAt: 1 });
    const completions = await WeeklyHabitCompletion.find({
      userId,
      monthKey,
      habitDefinitionId: { $in: definitions.map((d) => d._id) },
    });
    const completionByDefAndWeek = {};
    completions.forEach((c) => {
      const defId = c.habitDefinitionId.toString();
      if (!completionByDefAndWeek[defId]) completionByDefAndWeek[defId] = {};
      completionByDefAndWeek[defId][c.weekIndex] = c.completed;
    });
    const habits = definitions.map((d, idx) => {
      const checks = WEEK_SLOTS.map(
        (w) => completionByDefAndWeek[d._id.toString()]?.[w] ?? false
      );
      return {
        id: d._id,
        name: d.name,
        goal: d.goal,
        order: d.order ?? idx,
        checks,
      };
    });

    return res.json({
      success: true,
      data: { monthKey, weeksInMonth, habits },
    });
  } catch (error) {
    console.error('Error saving weekly habits:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/habits/weekly/completion
router.put('/weekly/completion', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { habitDefinitionId, monthKey, weekIndex, completed } = req.body;
    if (!parseMonthKey(monthKey) || !habitDefinitionId || !weekIndex) {
      return res.status(400).json({
        success: false,
        message: 'habitDefinitionId, monthKey (YYYY-MM), and weekIndex required',
      });
    }
    const def = await WeeklyHabitDefinition.findOne({
      _id: habitDefinitionId,
      userId,
    });
    if (!def) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    const doc = await WeeklyHabitCompletion.findOneAndUpdate(
      { userId, habitDefinitionId, monthKey, weekIndex: Number(weekIndex) },
      { $set: { completed: completed !== false } },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error updating weekly completion:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/habits/weekly/:id
router.delete('/weekly/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await WeeklyHabitCompletion.deleteMany({ userId, habitDefinitionId: id });
    const deleted = await WeeklyHabitDefinition.findOneAndDelete({
      _id: id,
      userId,
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting weekly habit:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
