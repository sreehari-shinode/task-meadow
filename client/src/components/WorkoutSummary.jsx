import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, Select, FormControl, Chip, Tooltip as MuiTooltip } from '@mui/material';
import { IoMdClock } from "react-icons/io";
import TimeRuler from '../utils/TimeRuler';
import { IoCalendar } from "react-icons/io5";
import { FaDumbbell } from "react-icons/fa6";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Cell as PieCell } from 'recharts';
import Tooltip2 from '@mui/material/Tooltip';
import { FaHeartbeat } from "react-icons/fa";
import CircularProgressBar from '../utils/CircularProgressBar';
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";

// Add font styles
const fontStyles = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif',
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
};

const WeeklyAnalysis = ({ weeklyBreakdown }) => {
  const [selectedWeek, setSelectedWeek] = useState(null);

  if (!weeklyBreakdown || weeklyBreakdown.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-16 relative"
        style={fontStyles}
      >
        <h2 className="text-3xl font-semibold text-white mb-8 tracking-tight">Weekly Progress</h2>
        <div className="flex justify-between border border-white/10 rounded-xl p-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <CircularProgressBar
                value={0}
                label={`W${index + 1}`}
                days={0}
              />
              <span className="mt-2 text-sm text-white/40">0 days</span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const getProgressColor = (days) => {
    if (days >= 5) return '#22c55e';
    if (days >= 3) return '#f59e0b';
    return '#d62e49';
  };
  const formatMinutes = (min) => {
    const hr = Math.floor(min / 60);
    const mins = min % 60;
    if (hr > 0 && mins > 0) return `${hr} hr ${mins} min`;
    if (hr > 0) return `${hr} hr`;
    return `${mins} min`;
  };

  const handleSelect = (index) => {
    setSelectedWeek(selectedWeek === index ? null : index);
  };

  const WeekButton = ({ week, index, isSelected }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedWeek(selectedWeek === index ? null : index)}
      className={`relative group ${isSelected ? 'z-10' : ''}`}
    >
      <div className="relative">
        <CircularProgressBar
          variant="determinate"
          value={(week.activeDays / 7) * 100}
          size={80}
          thickness={4}
          sx={{
            color: week.activeDays === 0 ? 'rgba(255, 255, 255, 0.1)' : getProgressColor(week.activeDays),
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
            '& .MuiCircularProgress-track': {
              stroke: 'rgba(255, 255, 255, 0.1)',
              strokeWidth: week.activeDays === 0 ? 1 : 4,
            },
            '&:hover': {
              color: week.activeDays === 0 ? 'rgba(255, 255, 255, 0.2)' : '#d62e49',
            },
          }}
          className="group-hover:opacity-80 transition-colors duration-200"
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <span className={`text-xl font-semibold ${week.activeDays === 0 ? 'text-white/40' : 'text-white'} group-hover:text-[#d62e49] transition-colors duration-200`}>
            W{index + 1}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className={`text-sm font-medium ${week.activeDays === 0 ? 'text-white/40' : 'text-white/60'} group-hover:text-white transition-colors duration-200`}>
          {week.activeDays} days
        </span>
      </div>
    </motion.button>
  );

  const WeekDetails = ({ week, index, onClose }) => {
    const muscleGroups = ['Chest', 'Back', 'Biceps', 'Triceps', 'Legs', 'Core', 'Shoulder'];
    
    const getHitMuscles = (musclesHit) => {
      if (!musclesHit) return [];
      return musclesHit.map(muscle => muscle.toLowerCase());
    };

    const hitMuscles = getHitMuscles(week.musclesHit);
    const missedMuscles = muscleGroups.filter(muscle => !hitMuscles.includes(muscle.toLowerCase()));

    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: "auto",
          opacity: 1,
          transition: {
            height: {
              type: "spring",
              stiffness: 200,
              damping: 25
            },
            opacity: { duration: 0.2 }
          }
        }}
        exit={{ 
          height: 0,
          opacity: 0,
          transition: {
            height: { duration: 0.2 },
            opacity: { duration: 0.1 }
          }
        }}
        className="w-full bg-white rounded-xl overflow-hidden shadow-lg mt-8"
      >
        <div className="px-8 py-6">

          <div className="flex items-center justify-between">
            {/* Left Section - Time */}
            <div className="flex items-center gap-16">
              <div>
                <div className="text-gray-500 text-sm mb-1">Total Time</div>
                <div className="text-4xl font-semibold text-gray-800">{formatMinutes(week.totalTime)}</div>
              </div>

              {/* Sessions */}
              <div>
                <div className="text-gray-500 text-sm mb-1">Sessions</div>
                <div className="text-4xl font-semibold text-gray-800">{week.sessions}</div>
              </div>

              {/* Cardio Time */}
              <div>
                <div className="text-gray-500 text-sm mb-1">Cardio Time</div>
                <div className="text-4xl font-semibold text-gray-800">{formatMinutes(week.cardioTime)}</div>
              </div>
            </div>

            {/* Right Section - Muscle Groups */}
            <div className="flex flex-col items-end">
              <div className="text-gray-500 text-sm mb-3">Muscle Groups</div>
              <div className="flex gap-2">
                {muscleGroups.map((muscle) => {
                  const isHit = hitMuscles.includes(muscle.toLowerCase());
                  return (
                    <Chip
                      key={muscle}
                      label={muscle}
                      icon={isHit ? <IoCheckmarkCircle className="w-4 h-4" /> : <IoCloseCircle className="w-4 h-4" />}
                      sx={{
                        backgroundColor: isHit ? 'rgba(34, 197, 94, 0.1)' : 'rgba(214, 46, 73, 0.1)',
                        color: isHit ? '#22c55e' : '#d62e49',
                        border: `1px solid ${isHit ? 'rgba(34, 197, 94, 0.2)' : 'rgba(214, 46, 73, 0.2)'}`,
                        '& .MuiChip-icon': {
                          color: 'inherit',
                          marginLeft: '8px',
                          marginRight: '-4px'
                        },
                        '& .MuiChip-label': {
                          paddingLeft: '8px',
                          paddingRight: '12px',
                          fontSize: '0.875rem',
                          fontWeight: 500
                        },
                        height: '32px',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: isHit ? 'rgba(34, 197, 94, 0.15)' : 'rgba(214, 46, 73, 0.15)',
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 relative"
      style={fontStyles}
    >      
      <div className="flex justify-between w-full mb-8">
        {weeklyBreakdown.map((week, index) => (
          <div key={index} className="flex flex-col items-center">
            <div onClick={() => setSelectedWeek(selectedWeek === index ? null : index)} className="cursor-pointer">
              <CircularProgressBar
                value={(week.activeDays / 7) * 100}
                label={`W${index + 1}`}
                isSelected={selectedWeek === index}
                days={week.activeDays}
              />
              <div className="mt-2 text-center">
                <span className={`text-sm font-medium ${week.activeDays === 0 ? 'text-white/40' : 'text-white/60'} group-hover:text-white transition-colors duration-200`}>
                  {week.activeDays} days
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedWeek !== null && (
          <WeekDetails 
            week={weeklyBreakdown[selectedWeek]} 
            index={selectedWeek}
            onClose={() => setSelectedWeek(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const WorkoutSummary = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const getMonthOptions = () => {
    const months = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      months.push({
        value: formattedDate,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  };

    // Helper to format minutes as 'X hr Y min'
    const formatMinutes = (min) => {
      const hr = Math.floor(min / 60);
      const mins = min % 60;
      if (hr > 0 && mins > 0) return `${hr} hr ${mins} min`;
      if (hr > 0) return `${hr} hr`;
      return `${mins} min`;
  };

  // Set default selected month to current month
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Format date as YYYY-MM-DD with proper padding
    const formattedDate = `${firstDayOfMonth.getFullYear()}-${String(firstDayOfMonth.getMonth() + 1).padStart(2, '0')}-01`;
    console.log('📅 Setting default month:', formattedDate);
    setSelectedMonth(formattedDate);
  }, []);

  useEffect(() => {
    const fetchSummaryData = async () => {
      if (!selectedMonth) {
        console.log('❌ No month selected, skipping fetch');
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        console.log('=== Fetching Summary Data ===');
        console.log('📅 Selected month:', selectedMonth);
        
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.error('❌ No auth token found');
          setError('Authentication required. Please log in again.');
          return;
        }
        
        const url = `http://localhost:5001/api/workouts/summary?period=${selectedMonth}`;
        console.log('🌐 Request URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'x-auth-token': token
          }
        });
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        console.log('📊 Weekly Stats:', data.data?.weeklyBreakdown);
        
        if (response.ok && data.success) {
          console.log('✅ Successfully fetched summary data');
          // Calculate strengthDays and cardioDays
          let strengthDays = 0;
          let cardioDays = 0;
          if (data.data && data.data.weeklyBreakdown) {
            const daySet = new Set();
            const cardioSet = new Set();
            data.data.weeklyBreakdown.forEach(week => {
              week.dailyBreakdown.forEach(day => {
                if (day.totalTime > 0) daySet.add(day.date);
                if (day.cardio && day.cardio.activity && day.cardio.duration > 0) cardioSet.add(day.date);
              });
            });
            strengthDays = daySet.size;
            cardioDays = cardioSet.size;
          }
          setSummaryData({ ...data.data, strengthDays, cardioDays });
          setError(null);
        } else {
          console.error('❌ Failed to fetch summary data:', data.message);
          if (response.status === 401) {
            setError('Session expired. Please log in again.');
          } else {
            setError(data.message || 'Failed to fetch summary data');
          }
          setSummaryData(null);
        }
      } catch (error) {
        console.error('❌ Error fetching summary:', error);
        setError('Failed to fetch summary data. Please try again.');
        setSummaryData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [selectedMonth]);



  const getDaysInMonth = (monthString) => {
    // monthString is in format 'YYYY-MM-01'
    const [year, month] = monthString.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  // Custom tooltip for muscle groups bar chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0].value > 0) {
      return (
        <div style={{
          background: '#18181b',
          border: '1px solid #d62e49',
          color: '#fff',
          fontSize: 12,
          padding: '4px 10px',
          borderRadius: 6
        }}>
          {payload[0].value} times
        </div>
      );
    }
    return null;
  };

  // Helper to get comma-separated muscle names with ellipsis if too many
  const getMuscleNames = (muscles, count = 2) => {
    if (!muscles || muscles.length === 0) return '-';
    const names = muscles.slice(0, count).map(m => m.name);
    return muscles.length > count ? names.join(', ') + ', ...' : names.join(', ');
  };
  const getLeastMuscleNames = (muscles, count = 2) => {
    if (!muscles || muscles.length === 0) return '-';
    const names = muscles.slice(-count).map(m => m.name);
    return muscles.length > count ? names.join(', ') + ', ...' : names.join(', ');
  };

  // Get all most hit muscles (max count)
  const getMostHitMuscles = (muscles) => {
    if (!muscles || muscles.length === 0) return [];
    const maxCount = Math.max(...muscles.map(m => m.count));
    return muscles.filter(m => m.count === maxCount);
  };
  // Get all least hit muscles (min count)
  const getLeastHitMuscles = (muscles) => {
    if (!muscles || muscles.length === 0) return [];
    const minCount = Math.min(...muscles.map(m => m.count));
    return muscles.filter(m => m.count === minCount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
      style={fontStyles}
    >
      <div className="flex items-center items-center mb-8">
        <h2 className="text-5xl font-semibold text-white tracking-tight">Workout Summary</h2>
        <div className=" mt-[6px]">
        <FormControl fullWidth variant="standard">
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disableUnderline
            IconComponent={() => null}
            sx={{
              ...fontStyles,
              fontSize: '2.85rem',
              fontWeight: 600,
              color: 'white',
              backgroundColor: 'transparent',
              borderRadius: '0.75rem',
              padding: '12px',
              cursor: 'pointer',
              '&:hover': {
                color: '#d62e49',
                '& .MuiSelect-icon': {
                  opacity: 1,
                }
              },
              '& .MuiSelect-icon': {
                opacity: 0,
                transition: 'opacity 0.2s ease-in-out',
              },
              '& .MuiPaper-root': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(4px)',
                borderRadius: '0.75rem',
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  ...fontStyles,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '0.75rem',
                  '& .MuiMenuItem-root': {
                    fontSize: '1.25rem',
                    padding: '12px 16px',
                    fontFamily: 'inherit',
                  }
                }
              }
            }}
          >
            {getMonthOptions().map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d62e49]"></div>
        </div>
      ) : error ? (
        <div className="text-center text-[#d62e49] p-4 bg-white/5 rounded-xl">
          <p className="text-lg font-semibold mb-2">Error Loading Summary</p>
          <p>{error}</p>
          <button 
            onClick={() => setSelectedMonth(selectedMonth)}
            className="mt-4 px-4 py-2 bg-[#d62e49] text-white rounded-lg hover:bg-[#b8253d] transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      ) : summaryData && summaryData.monthlyStats ? (
        <>
        <div className="flex w-full gap-12">
          <div className="flex flex-col min-h-[220px] flex-1">
            <IoMdClock className="w-12 h-12 text-[#d62e49]" />
            <div className="flex items-center justify-between text-lg text-gray-200 mb-1 mt-8">
                <p className='text-[16px] text-white/70'>total time<p className=" text-xl font-bold text-white">{formatMinutes(summaryData.monthlyStats.totalTime)}</p></p>
                <p className='mr-12 text-[16px] text-white/70'>avg. time/day <p className="text-xl font-bold text-white">{formatMinutes(summaryData.monthlyStats.averageTimePerSession)}</p></p>
            </div>
            <div className="mt-2 flex items-center">
              <TimeRuler averageMinutes={summaryData.monthlyStats.averageTimePerSession} />
            </div>
          </div>
          <div className="mx-12 flex items-center">
            <div className="w-2 h-32 bg-white/10 rounded-full"></div>
          </div>

          <div className="flex flex-col h-[220px] justify-between flex-1">
            <div>
              <IoCalendar className="w-12 h-12 text-[#d62e49]" />
              <div className="flex items-center justify-between text-lg text-gray-200 mb-1 mt-8">
                  <p className='text-[16px] text-white/70'>
                    strength sessions{' '}
                    <p className="font-bold text-xl text-white">{summaryData.strengthDays ?? '-'} days</p>
                  </p>
                  <p className='mr-8 text-[16px] text-white/70'>
                    cardio sessions{' '}
                    <p className="font-bold text-xl text-white">{summaryData.cardioDays ?? '-'} days</p>
                  </p>
                </div>
              </div>
              <div className="relative mt-[60px] w-full max-w-md">
                {/* Label above the bar, alignment depends on total days */}
                {summaryData.monthlyStats.totalActiveDays < 15 ? (
                  <div className="absolute -top-6 right-0 text-xs text-white/60 font-semibold select-none" style={{zIndex:2}}>
                    total days
                  </div>
                ) : (
                  <div className="absolute -top-6 left-0 text-xs text-white/60 font-semibold select-none" style={{zIndex:2}}>
                    total days
            </div>
                )}
              <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-4 bg-green-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${(summaryData.monthlyStats.totalActiveDays / getDaysInMonth(selectedMonth)) * 100}%`,
                  }}
                ></div>
                <div className="flex items-center !justify-end">
                  <div className="absolute top-1/2 left-0 w-full flex justify-between transform -translate-y-1/2 px-[2px]">
                    {[...Array(Math.ceil(getDaysInMonth(selectedMonth) / 2))].map((_, i, arr) => {
                      const dayCount = (i + 1) * 2;
                      const isFilled = dayCount <= summaryData.monthlyStats.totalActiveDays;
                      const isLastFilled =
                        dayCount - 2 < summaryData.monthlyStats.totalActiveDays &&
                        dayCount >= summaryData.monthlyStats.totalActiveDays;
                      const isLastDot = isLastFilled || (i === arr.length - 1 && isFilled);
                        if (isLastDot) {
                          return (
                            <div key={i} className="relative flex items-center justify-center" style={{zIndex:3}}>
                              <MuiTooltip
                                title={`${summaryData.monthlyStats.totalActiveDays} days`}
                                placement="top"
                                arrow
                              >
                                <div
                                  className="w-3 h-3 rounded-full border-2 bg-white border-white shadow-[0_0_6px_2px_rgba(255,255,255,0.6)] cursor-pointer"
                                ></div>
                              </MuiTooltip>
                            </div>
                          );
                        }
                      return (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full border-2 ${
                              isFilled
                              ? 'bg-green-500 border-green-500'
                              : 'bg-gray-700 border-gray-700'
                            }`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-12 flex items-center">
            <div className="w-2 h-32 bg-white/10 rounded-full"></div>
          </div>
          <div className="flex flex-col min-h-[220px] flex-1">
            <FaDumbbell className="w-12 h-12 text-[#d62e49]" />
              <div className="flex items-center justify-between text-lg text-gray-200 mb-1 mt-8">
              {(() => {
                const mostHit = getMostHitMuscles(summaryData.monthlyStats.mostFrequentMuscles);
                const leastHit = getLeastHitMuscles(summaryData.monthlyStats.mostFrequentMuscles);
                const mostHitNames = mostHit.map(m => m.name).join(', ');
                const leastHitNames = leastHit.map(m => m.name).join(', ');
                return (
                  <>
                    <Tooltip2 title={mostHitNames} arrow>
                        <p className=" text-[16px] text-white/70 cursor-pointer max-w-[140px] truncate overflow-hidden whitespace-nowrap block">
                          most hit <p className="font-bold text-xl text-white max-w-[140px] truncate overflow-hidden whitespace-nowrap">{mostHitNames || 'NA'}</p>
                      </p>
                    </Tooltip2>
                    <Tooltip2 title={leastHitNames} arrow>
                        <p className=" text-[16px] text-white/70 cursor-pointer mr-8 max-w-[140px] truncate overflow-hidden whitespace-nowrap block">
                          least hit  <p className="font-bold text-xl text-white max-w-[140px]  truncate overflow-hidden whitespace-nowrap">{leastHitNames || 'NA'}</p>
                      </p>
                    </Tooltip2>
                  </>
                );
              })()}
            </div>
              <div className="w-full h-28 mt-2 flex items-start" style={{ marginLeft: '-4px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    {
                      name: summaryData.monthlyStats.mostFrequentMuscles[0]?.name || 'Most',
                      value: summaryData.monthlyStats.mostFrequentMuscles[0]?.count || 0,
                      type: 'Most'
                    },
                    {
                      name: summaryData.monthlyStats.mostFrequentMuscles.slice(-1)[0]?.name || 'Least',
                      value: summaryData.monthlyStats.mostFrequentMuscles.slice(-1)[0]?.count || 0,
                      type: 'Least'
                    }
                  ]}
                  margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
                  barCategoryGap={40}
                >
                  <XAxis
                    type="number"
                    domain={[0, 'dataMax + 2']}
                    tick={{ fill: '#fff', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fill: '#fff', fontWeight: 700, fontSize: 16 }}
                    width={60}
                    tickFormatter={t => t === 'Most' ? 'Most' : 'Least'}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomBarTooltip />}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" barSize={12} radius={[0, 16, 16, 0]}>
                    <Cell fill="#22c55e" /> {/* Most: green */}
                    <Cell fill="#d62e49" /> {/* Least: red */}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
                   
          {summaryData.weeklyBreakdown && summaryData.weeklyBreakdown.length > 0 ? (
            <WeeklyAnalysis weeklyBreakdown={summaryData.weeklyBreakdown} />
          ) : (
            <div className="mt-16 text-center text-white/60">
              No weekly data available for this month
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-white/60 py-12">
          No workout data available for this month
        </div>
      )}
    </motion.div>
  );
};

export default WorkoutSummary; 