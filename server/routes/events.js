const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');

function parseYmd(ymd) {
  if (!ymd || !ymd.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

// GET /api/events?date=YYYY-MM-DD — list events for a day
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const date = parseYmd(req.query.date);
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date. Expected YYYY-MM-DD',
      });
    }
    const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
    const events = await Event.find({
      userId,
      date: { $gte: date, $lte: endOfDay },
    }).sort({ type: 1, createdAt: 1 });
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/range?start=YYYY-MM-DD&end=YYYY-MM-DD — for calendar/analytics
router.get('/range', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const start = parseYmd(req.query.start);
    const end = parseYmd(req.query.end);
    if (!start || !end || start > end) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start/end. Expected YYYY-MM-DD',
      });
    }
    const endOfRange = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999));
    const events = await Event.find({
      userId,
      date: { $gte: start, $lte: endOfRange },
    }).sort({ date: 1, type: 1 });
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events range:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/events — create event
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date: dateStr, type, value, notes } = req.body;
    const date = parseYmd(dateStr);
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date. Expected YYYY-MM-DD',
      });
    }
    const doc = await Event.create({
      userId,
      date,
      type: (type || 'general').trim(),
      value: value !== undefined ? value : null,
      notes: notes || '',
    });
    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/events/:id — update event
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date: dateStr, type, value, notes } = req.body;
    const update = {};
    if (dateStr) {
      const date = parseYmd(dateStr);
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date. Expected YYYY-MM-DD',
        });
      }
      update.date = date;
    }
    if (type !== undefined) update.type = type.trim();
    if (value !== undefined) update.value = value;
    if (notes !== undefined) update.notes = notes;
    const doc = await Event.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleted = await Event.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
