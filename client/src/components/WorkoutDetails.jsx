import React, { useState, useEffect } from 'react';
import { FiEdit2, FiSave, FiArrowLeft, FiPlus } from 'react-icons/fi';
import { Chip,  } from '@mui/material';
import { BASE_API_URL } from '../context/AuthContext';

const WorkoutDetails = ({ date }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    musclesHit: [],
    duration: '',
    intensity: 'Medium',
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
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const response = await fetch(`${BASE_API_URL}/api/workouts/${dateStr}`, {
        headers: {
          'x-auth-token': sessionStorage.getItem('token')
        }
      });

      if (response.status === 404) {
        setWorkout(null);
        setFormData({
          musclesHit: [],
          duration: '',
          intensity: 'Medium',
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
          intensity: data.intensity || 'Medium',
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
        intensity: formData.intensity || 'Medium',
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

  function formatMinutesToHours(min) {
    if (!min || isNaN(min)) return '-';
    const hr = Math.floor(min / 60);
    const mins = min % 60;
    if (hr > 0 && mins > 0) return `${hr} hr ${mins} min`;
    if (hr > 0) return `${hr} hr`;
    return `${mins} min`;
  }

  if (!workout && !isEditing) {
    return (
      <div className="w-full h-full">
        <div className="bg-[#111338] border border-white/5 rounded-2xl overflow-hidden h-full">
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
            <div className="text-lg font-semibold text-white">Workout Details</div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiEdit2 size={16} />
              </button>
            </div>
          </div>
          <div className="p-4 flex items-center justify-center h-full">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <FiPlus size={16} />
              <span>Add Workout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return null;
  }

  return (
    <div className="w-full h-full">
      <div className="bg-[#111338] border border-white/5 rounded-2xl overflow-hidden h-full">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            {isEditing && (
              <>
                <div className="text-lg font-semibold text-white">Edit Workout</div>
                <div className="text-xs text-gray-400">{date.toLocaleDateString()}</div>
              </>
            )}
            {!isEditing && (
              <div className="text-lg font-semibold text-white">Workout Details</div>
            )}
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiEdit2 size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={handleSubmit}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiSave size={16} />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiArrowLeft size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 max-h-[500px] overflow-y-auto">
          {error && (
            <div className="text-red-500 mb-4 text-sm">{error}</div>
          )}

          {/* VIEW MODE: Modern, split layout */}
          {!isEditing && (
            <div className="space-y-4">
              {/* Strength Training Section */}
              <div>
                <div className="text-lg font-bold text-white mb-3">Strength Training</div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-white/40 mb-1">Muscles Hit</div>
                      <div className="text-sm text-white font-medium">
                        {workout?.musclesHit && workout.musclesHit.length > 0 ? workout.musclesHit.join(', ') : <span className="text-white/30">-</span>}
                      </div>
                    </div>
                    <div className="w-24">
                      <div className="text-xs text-white/40 mb-1">Duration</div>
                      <div className="text-sm text-white font-medium">{workout?.duration ? formatMinutesToHours(workout.duration) : '-'}</div>
                    </div>
                    <div className="w-24">
                      <div className="text-xs text-white/40 mb-1">Intensity</div>
                      <div className="text-sm text-white font-medium">{workout?.intensity || 'Medium'}</div>
                    </div>
                  </div>
                </div>
                
                {/* PRs */}
                {workout?.personalRecords.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-white/40 mb-2">Personal Records</div>
                    <div className="flex flex-wrap gap-2">
                      {workout.personalRecords.map((pr, idx) => (
                        <div key={idx} className="border border-white/10 bg-white/5 rounded-lg px-3 py-2 min-w-[120px]">
                          <div className="text-sm font-bold text-white">{pr.exercise}</div>
                          <div className="text-xs text-white/80">{pr.weight} kg × {pr.reps} reps</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cardio Section */}
              {workout?.cardio && (workout.cardio.activity || workout.cardio.duration || workout.cardio.distance) && (
                <div>
                  <div className="text-lg font-bold text-white mb-3">Cardio</div>
                  <div className="grid grid-cols-3 gap-3">
                    {workout.cardio.activity && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Activity</div>
                        <div className="text-sm text-white font-medium">{workout.cardio.activity}</div>
                      </div>
                    )}
                    {workout.cardio.duration && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Duration</div>
                        <div className="text-sm text-white font-medium">{formatMinutesToHours(workout.cardio.duration)}</div>
                      </div>
                    )}
                    {workout.cardio.distance && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Distance</div>
                        <div className="text-sm text-white font-medium">{workout.cardio.distance} km</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {workout?.additionalNotes && (
                <div>
                  <div className="text-xs text-white/40 mb-1">Notes</div>
                  <div className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/80">
                    {workout.additionalNotes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EDIT MODE: Compact form */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Strength Training */}
              <div>
                <div className="text-sm font-bold text-white mb-2">Strength Training</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-white/60 mb-2">Muscles Hit</div>
                    <div className="flex flex-wrap gap-1">
                      {muscleGroups.map(muscle => (
                        <Chip
                          key={muscle}
                          label={muscle}
                          onClick={() => handleMuscleToggle(muscle)}
                          size="small"
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
                            fontSize: '11px',
                            height: '24px',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-white/60 mb-1">Duration (min)</div>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded text-white text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#d62e49]"
                        min="0"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-white/60 mb-1">Intensity</div>
                      <select
                        value={formData.intensity || 'Medium'}
                        onChange={e => setFormData(prev => ({ ...prev, intensity: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded text-white text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#d62e49]"
                      >
                        <option value="Low" className="bg-[#1d2145]">Low</option>
                        <option value="Medium" className="bg-[#1d2145]">Medium</option>
                        <option value="High" className="bg-[#1d2145]">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Records */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-white">Personal Records</div>
                  <button type="button" onClick={handlePRAdd} className="text-green-400 hover:text-green-500 text-sm">+ Add</button>
                </div>
                <div className="space-y-2">
                  {formData.personalRecords.map((pr, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white/5 rounded-lg p-2">
                      <button type="button" onClick={() => handlePRRemove(idx)} className="text-white/50 hover:text-red-400 text-sm">×</button>
                      <input
                        type="text"
                        value={pr.exercise}
                        onChange={e => handlePRChange(idx, 'exercise', e.target.value)}
                        placeholder="Exercise"
                        className="flex-1 bg-transparent border-b border-white/20 text-white text-xs px-1 py-0.5 focus:outline-none focus:border-[#d62e49]"
                      />
                      <input
                        type="text"
                        value={pr.weight}
                        onChange={e => handlePRChange(idx, 'weight', e.target.value)}
                        placeholder="Weight"
                        className="w-16 bg-transparent border-b border-white/20 text-white text-xs px-1 py-0.5 focus:outline-none focus:border-[#d62e49]"
                      />
                      <input
                        type="text"
                        value={pr.reps}
                        onChange={e => handlePRChange(idx, 'reps', e.target.value)}
                        placeholder="Reps"
                        className="w-12 bg-transparent border-b border-white/20 text-white text-xs px-1 py-0.5 focus:outline-none focus:border-[#d62e49]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cardio */}
              <div>
                <div className="text-sm font-bold text-white mb-2">Cardio</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.cardio.activity}
                    onChange={e => handleCardioChange('activity', e.target.value)}
                    placeholder="Activity"
                    className="bg-white/5 border border-white/10 rounded text-white text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#d62e49]"
                  />
                  <input
                    type="text"
                    value={formData.cardio.duration}
                    onChange={e => handleCardioChange('duration', e.target.value)}
                    placeholder="Duration (min)"
                    className="bg-white/5 border border-white/10 rounded text-white text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#d62e49]"
                  />
                  <input
                    type="text"
                    value={formData.cardio.distance}
                    onChange={e => handleCardioChange('distance', e.target.value)}
                    placeholder="Distance (km)"
                    className="bg-white/5 border border-white/10 rounded text-white text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#d62e49]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="text-xs text-white/60 mb-1">Notes</div>
                <textarea
                  value={formData.additionalNotes}
                  onChange={e => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Add notes..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded text-white text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#d62e49] resize-none"
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
export default WorkoutDetails;