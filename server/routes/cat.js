const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MockTest = require('../models/MockTest');

function parseYmd(ymd) {
  if (!ymd || !ymd.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function clampNumber(n) {
  const v = Number(n);
  if (Number.isNaN(v) || v < 0) return 0;
  return v;
}

// Create a mock test entry (multiple per day allowed)
router.post('/mocks', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      date,
      type,
      attempted,
      correct,
      wrong,
      totalQuestions,
      totalMarks,
      percentage,
      notes,
    } = req.body;

    const dt = parseYmd(date);
    if (!dt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD',
      });
    }

    if (!type || !['VARC', 'LRDI', 'QA', 'FULL'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Expected VARC, LRDI, QA, FULL',
      });
    }

    const attemptedN = clampNumber(attempted);
    const correctN = clampNumber(correct);
    const wrongN = clampNumber(wrong);
    const totalQN = clampNumber(totalQuestions);
    const totalMarksN = clampNumber(totalMarks);

    let pct = percentage !== undefined && percentage !== null ? Number(percentage) : null;
    if (pct === null || Number.isNaN(pct)) {
      // Fallback: if total questions exists, compute accuracy-based percent
      pct = totalQN > 0 ? Math.round((correctN / totalQN) * 100) : 0;
    }
    pct = Math.max(0, Math.min(100, pct));

    const doc = await MockTest.create({
      userId,
      date: dt,
      type,
      attempted: attemptedN,
      correct: correctN,
      wrong: wrongN,
      totalQuestions: totalQN,
      totalMarks: totalMarksN,
      percentage: pct,
      notes: notes || '',
    });

    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error creating mock test:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List mocks for a specific date (YYYY-MM-DD)
router.get('/mocks', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const dt = parseYmd(req.query.date);
    if (!dt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD',
      });
    }
    const end = new Date(dt);
    end.setHours(23, 59, 59, 999);

    const mocks = await MockTest.find({
      userId,
      date: { $gte: dt, $lte: end },
    }).sort({ createdAt: 1 });

    return res.json({ success: true, data: mocks });
  } catch (error) {
    console.error('Error fetching mocks:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a mock test by id
router.delete('/mocks/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await MockTest.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Mock not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting mock:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Monthly summary (period = YYYY-MM-01) for analytics
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period;
    const start = parseYmd(period);
    if (!start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD',
      });
    }

    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const mocks = await MockTest.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1, createdAt: 1 });

    const typeList = ['VARC', 'LRDI', 'QA', 'FULL'];

    // Group by day
    const daily = {};
    mocks.forEach((m) => {
      const key = m.date.toISOString().split('T')[0];
      if (!daily[key]) daily[key] = [];
      daily[key].push(m);
    });

    // Date counts for calendar highlighting
    const dateCounts = {};
    Object.keys(daily).forEach((k) => {
      dateCounts[k] = daily[k].length;
    });

    // Week breakdown aligned to workouts logic (first week ends Sunday, then Monday-Sunday)
    const weeklyBreakdown = [];
    const getFirstSunday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() + (7 - day);
      return new Date(d.setDate(diff));
    };
    const getNextMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
      return new Date(d.setDate(diff));
    };

    let currentWeekStart = new Date(startDate);
    let isFirstWeek = true;
    while (currentWeekStart <= endDate) {
      let weekEnd;
      if (isFirstWeek) {
        weekEnd = getFirstSunday(currentWeekStart);
        isFirstWeek = false;
      } else {
        weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
      }
      if (weekEnd > endDate) weekEnd = new Date(endDate);

      const weekStats = {
        weekNumber: weeklyBreakdown.length + 1,
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        totalMocks: 0,
        byType: Object.fromEntries(typeList.map((t) => [t, 0])),
        avgPercent: 0,
        avgPercentByType: Object.fromEntries(typeList.map((t) => [t, 0])),
        mocks: [],
      };

      const pctByTypeSum = Object.fromEntries(typeList.map((t) => [t, 0]));
      const pctByTypeCount = Object.fromEntries(typeList.map((t) => [t, 0]));
      let pctSum = 0;

      let currentDay = new Date(currentWeekStart);
      while (currentDay <= weekEnd && currentDay <= endDate) {
        const key = currentDay.toISOString().split('T')[0];
        const dayMocks = daily[key] || [];
        dayMocks.forEach((m) => {
          weekStats.totalMocks += 1;
          weekStats.byType[m.type] = (weekStats.byType[m.type] || 0) + 1;
          pctSum += m.percentage || 0;
          pctByTypeSum[m.type] += m.percentage || 0;
          pctByTypeCount[m.type] += 1;
          weekStats.mocks.push({
            id: m._id,
            date: key,
            type: m.type,
            percentage: m.percentage,
            totalMarks: m.totalMarks,
          });
        });
        currentDay.setDate(currentDay.getDate() + 1);
      }

      weekStats.avgPercent = weekStats.totalMocks > 0 ? Math.round(pctSum / weekStats.totalMocks) : 0;
      typeList.forEach((t) => {
        weekStats.avgPercentByType[t] = pctByTypeCount[t] > 0 ? Math.round(pctByTypeSum[t] / pctByTypeCount[t]) : 0;
      });

      weeklyBreakdown.push(weekStats);
      currentWeekStart = getNextMonday(currentWeekStart);
    }

    // Monthly stats
    const monthlyStats = {
      totalMocks: mocks.length,
      byType: Object.fromEntries(typeList.map((t) => [t, 0])),
      avgPercent: 0,
      bestPercent: 0,
      worstPercent: 0,
    };

    if (mocks.length > 0) {
      const percents = mocks.map((m) => m.percentage || 0);
      monthlyStats.avgPercent = Math.round(percents.reduce((a, b) => a + b, 0) / mocks.length);
      monthlyStats.bestPercent = Math.max(...percents);
      monthlyStats.worstPercent = Math.min(...percents);
      mocks.forEach((m) => {
        monthlyStats.byType[m.type] = (monthlyStats.byType[m.type] || 0) + 1;
      });
    }

    // Time series for charts
    const seriesByType = Object.fromEntries(typeList.map((t) => [t, []]));
    mocks.forEach((m) => {
      seriesByType[m.type].push({
        date: m.date.toISOString().split('T')[0],
        percentage: m.percentage,
        totalMarks: m.totalMarks,
      });
    });

    return res.json({
      success: true,
      data: {
        monthlyStats,
        weeklyBreakdown,
        seriesByType,
        dateCounts,
      },
    });
  } catch (error) {
    console.error('Error in CAT summary:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

