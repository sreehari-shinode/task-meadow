const mongoose = require('mongoose');

const todoTaskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  started: {
    type: Boolean,
    default: false
  },
  completionDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  todoList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TodoList',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

todoTaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TodoTask', todoTaskSchema);
