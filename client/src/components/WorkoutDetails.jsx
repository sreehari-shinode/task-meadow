import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiSave, FiArrowLeft, FiPlus, FiMinus } from 'react-icons/fi';
import { Chip, TextField, IconButton, Box, Paper } from '@mui/material';
import { BASE_API_URL } from '../context/AuthContext';

const WorkoutDetails = ({ date, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    musclesHit: [],
    duration: '',
    cardio: { activity: '', duration: '', distance: '' },
    personalRecords: [],
    additionalNotes: ''
  });

  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core'
  ];

  useEffect(() => {
    fetchWorkout();
  }, [date]);

  const fetchWorkout = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_API_URL}/api/workouts/${date.toISOString()}`, {
        headers: {
          'x-auth-token': sessionStorage.getItem('token')
        }
      });

      if (response.status === 404) {
        setWorkout(null);
        setFormData({
          musclesHit: [],
          duration: '',
          cardio: { activity: '', duration: '', distance: '' },
          personalRecords: [],
          additionalNotes: ''
        });
      } else if (response.ok) {
        const data = await response.json();
        setWorkout(data);
        setFormData({
          musclesHit: data.musclesHit || [],
          duration: data.duration || '',
          cardio: data.cardio || { activity: '', duration: '', distance: '' },
          personalRecords: data.personalRecords || [],
          additionalNotes: data.additionalNotes || ''
        });
      }
    } catch (err) {
      setError('Failed to fetch workout data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const cardioData = (formData.cardio.activity || formData.cardio.duration) ? formData.cardio : null;
      
      const workoutData = {
        date: formattedDate,
        musclesHit: formData.musclesHit,
        duration: formData.duration,
        cardio: cardioData,
        personalRecords: formData.personalRecords,
        additionalNotes: formData.additionalNotes
      };

      console.log('Saving workout for date:', formattedDate);
      console.log('Cardio data:', cardioData);

      const response = await fetch(`${BASE_API_URL}/api/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': sessionStorage.getItem('token')
        },
        body: JSON.stringify(workoutData)
      });

      if (response.ok) {
        const savedWorkout = await response.json();
        console.log('Workout saved successfully:', savedWorkout);
        setWorkout(savedWorkout);
        setIsEditing(false);
      } else {
        const error = await response.json();
        console.error('Failed to save workout:', error);
        setError('Failed to save workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      setError('Failed to save workout');
    }
  };

  const handleMuscleToggle = (muscle) => {
    setFormData(prev => ({
      ...prev,
      musclesHit: prev.musclesHit.includes(muscle)
        ? prev.musclesHit.filter(m => m !== muscle)
        : [...prev.musclesHit, muscle]
    }));
  };

  const handlePRAdd = () => {
    setFormData(prev => ({
      ...prev,
      personalRecords: [...prev.personalRecords, { exercise: '', weight: '', reps: '', notes: '' }]
    }));
  };

  const handlePRChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      personalRecords: prev.personalRecords.map((pr, i) => 
        i === index ? { ...pr, [field]: value } : pr
      )
    }));
  };

  const handlePRRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      personalRecords: prev.personalRecords.filter((_, i) => i !== index)
    }));
  };

  const handleCardioChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      cardio: {
        ...prev.cardio,
        [field]: value
      }
    }));
  };

  // Add SF Pro font stack
  const sfFont = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  function formatMinutesToHours(min) {
    if (!min || isNaN(min)) return '-';
    const hr = Math.floor(min / 60);
    const mins = min % 60;
    if (hr > 0 && mins > 0) return `${hr} hr ${mins} min`;
    if (hr > 0) return `${hr} hr`;
    return `${mins} min`;
  }

  if (loading) {
    return (
      <div className="flex !justify-center items-center w-full h-full">
        <div className="animate-spin rounded-full h-12 w-12 !text-[#d62e49] border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!workout && !isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className=" p-6 rounded-2xl w-2/3 ml-8 flex flex-col items-center justify-center"
      >
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          <FiPlus size={16} />
          <span>Add</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-2/3 ml-8"
      style={sfFont}
    >
      <div className="flex justify-between items-center mb-1">
        {/* <h2 className="text-2xl font-semibold text-white" style={sfFont}>
          Workout Details - {date.toLocaleDateString()}
        </h2> */}
        {isEditing && (
          <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-white" style={sfFont}>Edit Workout Details</div>
              <div className="text-white/60 text-lg" style={sfFont}>{date.toLocaleDateString()}</div>
            </div>
        )}
        <div></div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              style={sfFont}
            >
              <FiEdit2 size={20} />
            </button>
          ) : (
            <>
              <button
                onClick={handleSubmit}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                style={sfFont}
              >
                <FiSave size={20} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                style={sfFont}
              >
                <FiArrowLeft size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4" style={sfFont}>{error}</div>
      )}

      {/* VIEW MODE: Modern, split layout */}
      {!isEditing && (
        <div className="flex gap-8 w-full" style={sfFont}>
          {/* Strength Training Section */}
          <div className="flex-1 flex flex-col" style={sfFont}>
            <div className="text-2xl font-bold text-white mb-2 tracking-tight" style={sfFont}>Strength Training</div>
            {/* Muscles Hit and Duration on the same line, below heading */}
            <div className="flex items-center gap-6 mb-4">
              <div>
                <div className="text-sm text-white/40  mb-1" style={sfFont}>Muscles Hit</div>
                <div className="text-2xl text-white font-semibold" style={sfFont}>
                  {workout?.musclesHit && workout.musclesHit.length > 0 ? workout.musclesHit.join(', ') : <span className="text-white/30">-</span>}
                </div>
              </div>
              <div className="flex flex-col items-start justify-end ml-8">
                <div className="text-sm text-white/40 mb-1" style={sfFont}>Duration</div>
                <div className="text-2xl text-white font-bold" style={sfFont}>{workout?.duration ? formatMinutesToHours(workout.duration) : '-'}</div>
              </div>
            </div>
            {/* PRs */}
            {workout?.personalRecords.length > 0 && (
              <div className="mt-2">
                <div className="text-sm text-white/40 mb-2 " style={sfFont}>Personal Records</div>
                <div className="flex flex-row flex-wrap gap-4">
                  {workout.personalRecords.map((pr, idx) => (
                    <div key={idx} className="border border-white/10 bg-white/5 rounded-xl px-4 py-1 text-center items-center flex flex-col items-start shadow-sm hover:shadow-lg transition-shadow duration-200 min-w-[140px] max-w-xs" style={sfFont}>
                      <div className="text-lg font-bold text-white mb-1" style={sfFont}>{pr.exercise}</div>
                      <div className="text-white/80 text-sm font-medium mb-1" style={sfFont}>{pr.weight} kg × {pr.reps} reps</div>
                      {pr.notes && <div className="text-white/60 text-sm mt-1" style={sfFont}>{pr.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cardio Section: Only show if there is cardio data */}
          {workout?.cardio && (workout.cardio.activity || workout.cardio.duration || workout.cardio.distance) && (
            <div className="flex-1 flex flex-col" style={sfFont}>
              <div className="text-2xl font-bold text-white mb-2 tracking-tight" style={sfFont}>Cardio</div>
              <div className="flex items-center justify-between gap-4 mb-6">
                {workout.cardio.activity && (
                  <div className="flex flex-col">
                    <p className="text-sm text-white/60 font-medium" style={sfFont}>Activity</p>
                    <p className="text-2xl text-white font-bold" style={sfFont}>{workout.cardio.activity}</p>
                  </div>
                )}
                {workout.cardio.duration && (
                  <div className="flex flex-col">
                    <p className="text-sm text-white/60 font-medium" style={sfFont}>Duration</p>
                    <p className="text-2xl text-white font-bold" style={sfFont}>{formatMinutesToHours(workout.cardio.duration)}</p>
                  </div>
                )}
                {workout.cardio.distance && (
                  <div className="flex flex-col">
                    <p className="text-sm text-white/60 font-medium" style={sfFont}>Distance</p>
                    <p className="text-2xl text-white font-bold" style={sfFont}>{workout.cardio.distance} km</p>
                  </div>
                )}
              </div>
              {/* Notes below cardio, right column only */}
              {workout?.additionalNotes && (
                <div className="mt-4">
                  <div className="bg-white/10 rounded-xl px-4 py-2 text-white/80 text-lg font-medium shadow-md" style={sfFont}>
                    <span className="text-white/40 text-base font-semibold mb-2 block" style={sfFont}>Notes</span>
                    {workout.additionalNotes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EDIT MODE: Redesigned form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="space-y-2 mt-8" style={sfFont}>
          <div className="text-xl font-bold text-white " style={sfFont}>Strength Training</div>
          <div className='flex items-center justify-between gap-4'>
            <div>
            <span className='text-sm text-white/60 mb-1' style={sfFont}>Muscles Hit</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {muscleGroups.map(muscle => (
                <Chip
                  key={muscle}
                  label={muscle}
                  onClick={() => handleMuscleToggle(muscle)}
                  color={formData.musclesHit.includes(muscle) ? "success" : "default"}
                  sx={{
                    backgroundColor: formData.musclesHit.includes(muscle) 
                      ? 'rgba(34, 197, 94, 0.2)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    color: formData.musclesHit.includes(muscle) 
                      ? '#22c55e' 
                      : 'rgba(255, 255, 255, 0.7)',
                    border: formData.musclesHit.includes(muscle)
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: formData.musclesHit.includes(muscle)
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(255, 255, 255, 0.15)',
                    },
                    height: '32px',
                    transition: 'all 0.2s ease-in-out',
                  }}
                />
              ))}
            </div>
            </div>
            <div className="flex flex-col w-32">
                <span className="text-sm text-white/60 mb-1" style={sfFont}>Duration (minutes)</span>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="bg-transparent border-0 border-b border-white/30 focus:border-blue-500 outline-none text-white text-xl py-1 transition-colors duration-200 appearance-none w-full"
                  min="0"
                  step="1"
                  style={{ fontFamily: sfFont.fontFamily }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
          </div>

          {/* Personal Records Section */}
          <div className='mb-4'>
            <div className="flex items-center mb-2">
              <div className="text-xl font-bold text-white mr-2" style={sfFont}>Personal Records</div>
              <button type="button" onClick={handlePRAdd} className="text-green-400 hover:text-green-500 text-2xl ml-2 transition-colors">+</button>
            </div>
            <div className="flex flex-wrap gap-4">
              {formData.personalRecords.map((pr, idx) => (
                <div key={idx} className="relative flex flex-col border border-white/10 bg-white/5 rounded-xl px-3 py-2 min-w-[140px] max-w-[180px]" style={sfFont}>
                  <button type="button" onClick={() => handlePRRemove(idx)} className="absolute top-1 right-2 text-white/50 hover:text-red-400 text-base p-0 m-0 bg-transparent border-none cursor-pointer">×</button>
                  <span className="text-xs text-white/60 mb-1">Exercise</span>
                  <input
                    type="text"
                    value={pr.exercise}
                    onChange={e => handlePRChange(idx, 'exercise', e.target.value)}
                    className="bg-transparent border-0 border-b border-white/30 focus:border-blue-500 outline-none text-white text-base py-1 mb-2 transition-colors duration-200 appearance-none"
                    style={{ fontFamily: sfFont.fontFamily }}
                  />
                  <div className="flex gap-2 w-full">
                    <div className="flex flex-col flex-1 min-w-[50px] max-w-[60px]">
                      <span className="text-xs text-white/60 mb-1">Weight</span>
                      <input
                        type="text"
                        value={pr.weight}
                        onChange={e => handlePRChange(idx, 'weight', e.target.value)}
                        className="bg-transparent border-0 border-b border-white/30 focus:border-blue-500 outline-none text-white text-base py-1 transition-colors duration-200 appearance-none"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{ fontFamily: sfFont.fontFamily }}
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-[40px] max-w-[50px]">
                      <span className="text-xs text-white/60 mb-1">Reps</span>
                      <input
                        type="text"
                        value={pr.reps}
                        onChange={e => handlePRChange(idx, 'reps', e.target.value)}
                        className="bg-transparent border-0 border-b border-white/30 focus:border-blue-500 outline-none text-white text-base py-1 transition-colors duration-200 appearance-none"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{ fontFamily: sfFont.fontFamily }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cardio Section */}
          <div className='mt-4'>
            <div className="text-xl font-bold text-white mb-2" style={sfFont}>Cardio</div>
            <div className="flex gap-8 mb-4">
              <div className="flex flex-col flex-1">
                <span className="text-sm text-white/60 mb-1" style={sfFont}>Activity</span>
                <input
                  type="text"
                  value={formData.cardio.activity}
                  onChange={e => handleCardioChange('activity', e.target.value)}
                  className="bg-transparent border-0 border-b border-white/30 focus:border-blue-500 outline-none text-white text-xl py-1 transition-colors duration-200 appearance-none"
                  style={{ fontFamily: sfFont.fontFamily }}
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm text-white/60 mb-1" style={sfFont}>Duration (minutes)</span>
                <input
                  type="text"
                  value={formData.cardio.duration}
                  onChange={e => handleCardioChange('duration', e.target.value)}
                  className="bg-transparent border-0 border-b border-white/30 focus:border-blue-500 outline-none text-white text-xl py-1 transition-colors duration-200 appearance-none"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  style={{ fontFamily: sfFont.fontFamily }}
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm text-white/60 mb-1" style={sfFont}>Distance (km)</span>
                <input
                  type="text"
                  value={formData.cardio.distance}
                  onChange={e => handleCardioChange('distance', e.target.value)}
                  className="bg-transparent border-0 border-b border-white/30 focus:border-blue-500 outline-none text-white text-xl py-1 transition-colors duration-200 appearance-none"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  style={{ fontFamily: sfFont.fontFamily }}
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <span className="text-sm text-white/60 mb-1 block" style={sfFont}>Notes</span>
            <TextField
              value={formData.additionalNotes}
              onChange={e => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Add any additional notes about your workout..."
              multiline
              rows={2}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#22c55e',
                  },
                  maxHeight: '80px',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                },
              }}
            />
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default WorkoutDetails; 