import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BASE_API_URL } from '../context/AuthContext';
import { FiPlus,  FiCircle, FiCalendar, FiTrash2, FiEdit2, FiArrowLeft, FiSave,} from 'react-icons/fi';
import { IoCheckmarkCircle } from 'react-icons/io5';
import CircularProgressBar from '../utils/CircularProgressBar';

const TodoList = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // null means no filter
  const savingTasksRef = React.useRef(new Set());
  const autoSaveTimeoutRef = React.useRef(null);

  // Generate 7 days including today
  const dateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date,
        dateString: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  }, []);

  useEffect(() => {
    if (user) {
      fetchLists();
    }
  }, [user]);

  useEffect(() => {
    if (selectedList) {
      fetchTasks(selectedList._id);
    }
  }, [selectedList]);

  const fetchLists = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/api/todo-lists`, {
        headers: {
          'x-auth-token': token
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  }, []);

  const fetchTasks = useCallback(async (listId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/api/todo-lists/${listId}/tasks`, {
        headers: {
          'x-auth-token': token
        }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedTasks = data.map(task => ({
          ...task,
          completionDate: task.completionDate 
            ? new Date(task.completionDate).toISOString().split('T')[0]
            : null
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  const handleAddList = async () => {
    if (!newListName.trim()) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_API_URL}/api/todo-lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ name: newListName.trim() })
      });

      if (response.ok) {
        const newList = await response.json();
        setLists([...lists, newList]);
        setNewListName('');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleOpenList = useCallback((list) => {
    setSelectedList(list);
    setFilter('all');
    setSelectedDate(null);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedList(null);
    setTasks([]);
    setFilter('all');
    setSelectedDate(null);
  }, []);

  const handleAddTask = useCallback(() => {
    const newTask = {
      name: '',
      completed: false,
      started: false,
      completionDate: null,
      priority: 'medium',
      _id: `temp-${Date.now()}`
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const handleTaskChange = useCallback((taskId, field, value) => {
    setTasks(prev => prev.map(task => 
      task._id === taskId 
        ? { ...task, [field]: value }
        : task
    ));
    autoSave();
  }, []);

  const handleDeleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(task => task._id !== taskId));
    autoSave();
  }, []);

 

  const handleSave = useCallback(async (silent = false) => {
    if (!selectedList) return;
    
    try {
      if (!silent) setSaving(true);
      const token = sessionStorage.getItem('token');
      
      const currentTasks = [...tasks];
      
      const existingTaskIds = currentTasks
        .filter(t => !t._id.startsWith('temp-'))
        .map(t => t._id);
      
      const currentResponse = await fetch(`${BASE_API_URL}/api/todo-lists/${selectedList._id}/tasks`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (currentResponse.ok) {
        const serverTasks = await currentResponse.json();
        const tasksToDelete = serverTasks
          .filter(t => !existingTaskIds.includes(t._id))
          .map(t => t._id);
        
        for (const taskId of tasksToDelete) {
          await fetch(`${BASE_API_URL}/api/todo-lists/${selectedList._id}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
              'x-auth-token': token
            }
          });
        }
      }

      const tempToRealIdMap = new Map();
      
      for (const task of currentTasks) {
        // Skip saving new tasks with empty names (unless they're completed or started - then save them)
        if (task._id.startsWith('temp-') && !task.name?.trim() && !task.completed && !task.started) {
          continue;
        }

        const completionDate = task.completionDate 
          ? new Date(task.completionDate + 'T00:00:00').toISOString()
          : null;

        if (task._id.startsWith('temp-')) {
          if (savingTasksRef.current.has(task._id)) {
            continue;
          }
          
          savingTasksRef.current.add(task._id);
          
          try {
            const response = await fetch(`${BASE_API_URL}/api/todo-lists/${selectedList._id}/tasks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
              },
              body: JSON.stringify({
                name: task.name?.trim() || '',
                completed: task.completed || false,
                started: task.started || false,
                completionDate: completionDate,
                priority: task.priority || 'medium'
              })
            });
            
            if (response.ok) {
              const savedTask = await response.json();
              tempToRealIdMap.set(task._id, savedTask._id);
            }
          } finally {
            setTimeout(() => {
              savingTasksRef.current.delete(task._id);
            }, 1000);
          }
        } else {
          // Update existing task - save even if name is empty (user might have deleted it)
          await fetch(`${BASE_API_URL}/api/todo-lists/${selectedList._id}/tasks/${task._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({
              name: task.name?.trim() || '',
              completed: task.completed || false,
              started: task.started || false,
              completionDate: completionDate,
              priority: task.priority || 'medium'
            })
          });
        }
      }

      if (!silent) {
        await fetchTasks(selectedList._id);
        savingTasksRef.current.clear();
      } else if (tempToRealIdMap.size > 0) {
        setTasks(prevTasks => {
          const realIds = new Set(Array.from(tempToRealIdMap.values()));
          
          const filtered = prevTasks.filter(task => {
            if (!task._id.startsWith('temp-') && realIds.has(task._id)) {
              const hasTempVersion = prevTasks.some(t => 
                t._id.startsWith('temp-') && tempToRealIdMap.get(t._id) === task._id
              );
              return !hasTempVersion;
            }
            return true;
          });
          
          return filtered.map(task => {
            if (task._id.startsWith('temp-') && tempToRealIdMap.has(task._id)) {
              const realId = tempToRealIdMap.get(task._id);
              savingTasksRef.current.delete(task._id);
              return { ...task, _id: realId };
            }
            return task;
          });
        });
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
    } finally {
      if (!silent) setSaving(false);
    }
  }, [tasks, selectedList, fetchTasks]);

  const autoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave(true);
    }, 2000);
  }, [handleSave]);

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list? All tasks will be deleted.')) return;
    
    try {
      const token = sessionStorage.getItem('token');
      await fetch(`${BASE_API_URL}/api/todo-lists/${listId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });
      setLists(lists.filter(l => l._id !== listId));
      if (selectedList && selectedList._id === listId) {
        handleBack();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const started = tasks.filter(t => t.started && !t.completed).length;
    const notStarted = tasks.filter(t => !t.started && !t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const startedPercentage = total > 0 ? Math.round((started / total) * 100) : 0;
    const notStartedPercentage = total > 0 ? Math.round((notStarted / total) * 100) : 0;
    
    return { total, completed, started, notStarted, percentage, startedPercentage, notStartedPercentage };
  }, [tasks]);

  // Filter tasks by date and status
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(t => t.completionDate === selectedDate);
    }

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(t => !t.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    return filtered;
  }, [tasks, filter, selectedDate]);

  // Calculate list view analytics
  const listAnalytics = useMemo(() => {
    // This would ideally fetch task counts for each list, but for now we'll use placeholder
    const totalLists = lists.length;
    const totalTasks = 0; // Would need to fetch this
    const completedTasks = 0;
    const activeTasks = 0;
    const thisMonth = 0;
    
    return { totalLists, totalTasks, completedTasks, activeTasks, thisMonth };
  }, [lists]);

  return (
    <div className="w-full min-h-screen text-white">
      {!selectedList ? (
        // List view
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full px-6 md:px-10"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-semibold text-white tracking-tight mb-2">To-do Lists</h2>
              <p className="text-gray-400">Organize your tasks and stay productive</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-[#d62e49] text-white rounded-xl hover:bg-[#b8253d] transition-colors duration-200 flex items-center gap-2 shadow-lg shadow-[#d62e49]/20"
            >
              <FiPlus className="h-5 w-5" />
              <span className="font-medium">New List</span>
            </motion.button>
          </div>

          {/* Lists Grid */}
          {lists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {lists.map((list, index) => (
                <motion.div
                  key={list._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOpenList(list)}
                  className="bg-gradient-to-br from-[#11113a] via-[#1a1a40] to-[#11113a] p-4 rounded-2xl cursor-pointer border-2 border-white/10 hover:border-[#d62e49]/50 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d62e49]/0 to-[#d62e49]/0 group-hover:from-[#d62e49]/10 group-hover:to-[#d62e49]/5 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white group-hover:text-[#d62e49] transition-colors">{list.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg"
                      >
                        <FiTrash2 className="h-5 w-5 text-red-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FiCalendar className="h-4 w-4" />
                      <span>{new Date(list.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#11113a] flex items-center justify-center border border-white/10">
                <FiEdit2 className="h-12 w-12 text-gray-500" />
              </div>
              <p className="text-xl text-gray-400 mb-2">No lists yet</p>
              <p className="text-gray-500 mb-6">Create your first list to get started!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-[#d62e49] text-white rounded-xl hover:bg-[#b8253d] transition-colors duration-200"
              >
                Create Your First List
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        // Task view
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full px-6 md:px-10"
        >
          {/* Header */}
          <div className="flex items-center gap-28 mb-6">
          {/* Back button + List name */}
          <div className="flex items-center gap-4 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="p-2 bg-[#11113a] text-white rounded-lg hover:bg-[#1a1a40] transition-colors duration-200 border border-white/10"
            >
              <FiArrowLeft className="h-5 w-5" />
            </motion.button>

            <h2 className="text-3xl font-semibold text-white tracking-tight whitespace-nowrap">
              {selectedList.name}
            </h2>
          </div>

          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-[#11113a]  px-4 py-2 rounded-xl "
          >
            <div className="flex items-center justify-center gap-16">
              {/* Completed */}
              <div className="flex items-center gap-4">
                <CircularProgressBar
                  value={taskStats.percentage}
                  label={`${taskStats.percentage}%`}
                  days={
                    taskStats.completed >= 5
                      ? 5
                      : taskStats.completed >= 3
                      ? 3
                      : taskStats.completed > 0
                      ? 1
                      : 0
                  }
                  size={32}
                  strokeWidth={5}
                />
                <div className="flex flex-col leading-tight">
                  <p className="text-gray-400 text-xs font-medium">Completed</p>
                  <p className="text-white font-semibold text-sm">
                    {taskStats.completed}
                  </p>
                </div>
              </div>

              {/* In Progress */}
              <div className="flex items-center gap-4">
                <CircularProgressBar
                  value={taskStats.startedPercentage}
                  label={`${taskStats.startedPercentage}%`}
                  days={
                    taskStats.started >= 5
                      ? 5
                      : taskStats.started >= 3
                      ? 3
                      : taskStats.started > 0
                      ? 1
                      : 0
                  }
                  radius={32}
                  strokeWidth={5}
                />
                <div className="flex flex-col leading-tight">
                  <p className="text-gray-400 text-xs font-medium">In Progress</p>
                  <p className="text-yellow-400 font-semibold text-sm">
                    {taskStats.started}
                  </p>
                </div>
              </div>

              {/* Not Started */}
              <div className="flex items-center gap-4">
                <CircularProgressBar
                  value={taskStats.notStartedPercentage}
                  label={`${taskStats.notStartedPercentage}%`}
                  days={0}
                  size={30}
                  strokeWidth={5}
                />
                <div className="flex flex-col leading-tight">
                  <p className="text-gray-400 text-xs font-medium">Not Started</p>
                  <p className="text-gray-400 font-semibold text-sm">
                    {taskStats.notStarted}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Save button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-[#d62e49] text-lg text-white rounded-xl hover:bg-[#b8253d] transition-colors duration-200 flex items-center gap-2 shadow-lg shadow-[#d62e49]/20 disabled:opacity-50 shrink-0"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave className="h-5 w-5" />
                <span>Save</span>
              </>
            )}
          </motion.button>
        </div>


          {/* Date Filter and Active Filter in One Line */}
          <div className=" rounded-xl overflow-hidden">
          {/* TABLE HEADER */}
          <div className="bg-[#0d0d2b] flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs font-medium">Days</span>
                <div className="flex gap-2">
                  {dateOptions.map((dateOption) => (
                    <button
                      key={dateOption.dateString}
                      onClick={() =>
                        setSelectedDate(
                          selectedDate === dateOption.dateString
                            ? null
                            : dateOption.dateString
                        )
                      }
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        selectedDate === dateOption.dateString
                          ? 'bg-[#d62e49] text-white'
                          : 'bg-[#1a1a40] text-gray-400 hover:text-white'
                      }`}
                    >
                      {dateOption.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {['all', 'active', 'completed'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${
                        filter === f
                          ? 'bg-[#d62e49] text-white'
                          : 'bg-[#1a1a40] text-gray-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
            </div>
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddTask}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d62e49] text-white text-xs font-medium rounded-md hover:bg-[#b8253d]"
                >
                  <FiPlus className="h-4 w-4" />
                  Add
                </motion.button>
              </div>{/* Right: Add Task */}
          
          </div>


          {/* TABLE ROWS */}
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={` bg-[#11113a] gap-4 grid grid-cols-[40px_1.5fr_110px_100px_140px_40px] items-center px-4 py-2 border-b border-white/5 hover:bg-white/5 ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                {/* Complete */}
                <button onClick={() => handleTaskChange(task._id, 'completed', !task.completed)}>
                  {task.completed ? (
                    <IoCheckmarkCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <FiCircle className="h-5 w-5 text-gray-400 hover:text-[#d62e49]" />
                  )}
                </button>

                {/* Task name */}
                <input
                  type="text"
                  value={task.name || ''}
                  onChange={(e) => handleTaskChange(task._id, 'name', e.target.value)}
                  className={`bg-transparent border-none text-sm text-white outline-none ${
                    task.completed ? 'line-through text-gray-400' : ''
                  }`}
                  placeholder="Task name"
                />

                {/* Started */}
                <button
                  onClick={() => handleTaskChange(task._id, 'started', !task.started)}
                  className={`px-2 py-1 rounded-md text-xs font-medium ${
                    task.started
                      ? 'bg-yellow-400/20 text-yellow-400'
                      : 'bg-gray-400/10 text-gray-400'
                  }`}
                >
                  {task.started ? 'Started' : 'Idle'}
                </button>

                {/* Priority */}
                <select
                  value={task.priority || 'medium'}
                  onChange={(e) => handleTaskChange(task._id, 'priority', e.target.value)}
                  className={`bg-transparent text-xs text-center rounded-md px-2 py-1 border ${
                    task.priority === 'high'
                      ? 'text-red-400 border-red-400/30'
                      : task.priority === 'medium'
                      ? 'text-yellow-400 border-yellow-400/30'
                      : 'text-green-400 border-green-400/30'
                  }`}
                >
                  <option value="low" className="bg-[#0d0d2b]">Low</option>
                  <option value="medium" className="bg-[#0d0d2b]">Medium</option>
                  <option value="high" className="bg-[#0d0d2b]">High</option>
                </select>

                {/* Date */}
                <input
                  type="date"
                  value={task.completionDate || ''}
                  onChange={(e) => handleTaskChange(task._id, 'completionDate', e.target.value)}
                  className="bg-[#1a1a40] text-xs text-white px-2 py-1 rounded-md border border-white/10"
                />

                {/* Delete */}
                <button onClick={() => handleDeleteTask(task._id)}>
                  <FiTrash2 className="h-5 w-5 text-red-500 hover:text-red-600" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* EMPTY STATE */}
          {filteredTasks.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-400">
              No tasks found
            </div>
          )}
        </div>

        </motion.div>
      )}

      {/* Add List Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#11113a] to-[#1a1a40] rounded-2xl p-8 w-full max-w-md mx-4 border border-white/10 shadow-2xl"
            >
              <h3 className="text-2xl font-semibold text-white mb-2">Create New List</h3>
              <p className="text-gray-400 text-sm mb-6">Give your list a name to get started</p>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddList()}
                placeholder="Enter list name..."
                className="w-full px-4 py-3 bg-[#1a1a40] text-white rounded-xl border border-white/20 focus:border-[#d62e49] outline-none mb-6"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowAddModal(false);
                    setNewListName('');
                  }}
                  className="px-6 py-2.5 bg-[#1a1a40] text-white rounded-xl hover:bg-[#252550] transition-colors border border-white/10"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddList}
                  className="px-6 py-2.5 bg-[#d62e49] text-white rounded-xl hover:bg-[#b8253d] transition-colors"
                >
                  Create List
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TodoList;
