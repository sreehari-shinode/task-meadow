const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Exercise = require('../models/Exercise');

// Get all exercises
router.get('/', auth, async (req, res) => {
  try {
    const exercises = await Exercise.find().sort({ name: 1 });
    res.json(exercises);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get exercise by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Create new exercise
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      muscleGroup,
      description,
      equipment,
      difficulty,
      instructions,
      imageUrl,
      videoUrl
    } = req.body;

    const exercise = new Exercise({
      name,
      muscleGroup,
      description,
      equipment,
      difficulty,
      instructions,
      imageUrl,
      videoUrl
    });

    await exercise.save();
    res.json(exercise);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Exercise with this name already exists' });
    }
    res.status(500).send('Server Error');
  }
});

// Update exercise
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      muscleGroup,
      description,
      equipment,
      difficulty,
      instructions,
      imageUrl,
      videoUrl
    } = req.body;

    let exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ msg: 'Exercise not found' });
    }

    exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      {
        name,
        muscleGroup,
        description,
        equipment,
        difficulty,
        instructions,
        imageUrl,
        videoUrl
      },
      { new: true }
    );

    res.json(exercise);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Delete exercise
router.delete('/:id', auth, async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.json({ msg: 'Exercise removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Exercise not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 