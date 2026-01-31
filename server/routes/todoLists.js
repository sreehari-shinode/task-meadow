const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TodoList = require('../models/TodoList');
const TodoTask = require('../models/TodoTask');

// Get all todo lists for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const lists = await TodoList.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    console.error('Error fetching todo lists:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new todo list
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'List name is required' });
    }

    const todoList = new TodoList({
      name: name.trim(),
      user: req.user.id
    });

    await todoList.save();
    res.json(todoList);
  } catch (error) {
    console.error('Error creating todo list:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks for a specific todo list
router.get('/:listId/tasks', auth, async (req, res) => {
  try {
    const list = await TodoList.findById(req.params.listId);
    
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if the list belongs to the user
    if (list.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await TodoTask.find({ todoList: req.params.listId }).sort({ createdAt: 1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new task in a todo list
router.post('/:listId/tasks', auth, async (req, res) => {
  try {
    const list = await TodoList.findById(req.params.listId);
    
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if the list belongs to the user
    if (list.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, completed, started, completionDate, priority } = req.body;

    const task = new TodoTask({
      name: name || '',
      completed: completed || false,
      started: started || false,
      completionDate: completionDate || null,
      priority: priority || 'medium',
      todoList: req.params.listId
    });

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.put('/:listId/tasks/:taskId', auth, async (req, res) => {
  try {
    const list = await TodoList.findById(req.params.listId);
    
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if the list belongs to the user
    if (list.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = await TodoTask.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the task belongs to the list
    if (task.todoList.toString() !== req.params.listId) {
      return res.status(400).json({ message: 'Task does not belong to this list' });
    }

    const { name, completed, started, completionDate, priority } = req.body;

    if (name !== undefined) task.name = name;
    if (completed !== undefined) task.completed = completed;
    if (started !== undefined) task.started = started;
    if (completionDate !== undefined) task.completionDate = completionDate || null;
    if (priority !== undefined) task.priority = priority || 'medium';

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task
router.delete('/:listId/tasks/:taskId', auth, async (req, res) => {
  try {
    const list = await TodoList.findById(req.params.listId);
    
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if the list belongs to the user
    if (list.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = await TodoTask.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the task belongs to the list
    if (task.todoList.toString() !== req.params.listId) {
      return res.status(400).json({ message: 'Task does not belong to this list' });
    }

    await TodoTask.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a todo list
router.delete('/:listId', auth, async (req, res) => {
  try {
    const list = await TodoList.findById(req.params.listId);
    
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Check if the list belongs to the user
    if (list.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all tasks in the list
    await TodoTask.deleteMany({ todoList: req.params.listId });
    
    // Delete the list
    await TodoList.findByIdAndDelete(req.params.listId);
    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
