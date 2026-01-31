import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Profile from './Profile';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { generateDietPlan } from '../utils/dietPlanAPI';
import WorkoutDetails from './WorkoutDetails';
import WorkoutSummary from './WorkoutSummary';
import SleepTracker from './SleepTracker';
import WeightTracker from './WeightTracker';
import { BASE_API_URL } from '../context/AuthContext';

const blue = '#1d2145';

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: 0.4 } }
};

const dropVariants = {
  initial: { y: -100, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { delay: 0.7, duration: 0.7, type: 'spring', stiffness: 60 } },
  exit: { y: -100, opacity: 0, transition: { duration: 0.4 } }
};

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: 50, transition: { duration: 0.4 } }
};

function formatDateIST(date) {
  // Convert to IST (UTC+5:30)
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (5.5 * 60 * 60000));
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const GymDetails = ({ show, onClose, inline = false }) => {
  const textRef = useRef(null);
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [profileTriggerPosition, setProfileTriggerPosition] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dietPlan, setDietPlan] = useState(null);
  const [isLoadingDiet, setIsLoadingDiet] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDietPlan, setShowDietPlan] = useState(false);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [workoutDates, setWorkoutDates] = useState({});

  // In both inline and overlay modes, show all content immediately
  // (we have removed the "YEAH BUDDY LIGHTWEIGHT" intro animation).
  useEffect(() => {
    setShowSummary(true);
    setShowCalendar(true);
    setShowDietPlan(true);
  }, []);

  const isActive = inline || show;

  useEffect(() => {
    if (isActive) {
      fetchUserProfile();
    }
  }, [isActive]);

  const fetchWorkoutDates = async (date = new Date()) => {
    try {
      const selectedDate = new Date(date);
      // Format the date as YYYY-MM-01 for the period parameter (still UTC, as backend expects)
      const period = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-01`;
      console.log('Fetching workout dates for period:', period);
      const response = await fetch(`${BASE_API_URL}/api/workouts/summary?period=${period}`, {
        headers: {
          'x-auth-token': sessionStorage.getItem('token')
        }
      });
      if (response.ok) {
        const data = await response.json();
        const dates = {};
        // Use backend's date string directly for all keys
        data.data.weeklyBreakdown.forEach(week => {
          week.dailyBreakdown.forEach(day => {
            if (day.totalTime > 0 || (day.cardio && day.cardio.activity && day.cardio.duration > 0)) {
              dates[day.date] = {
                hasWorkout: day.totalTime > 0,
                hasCardio: day.cardio && day.cardio.activity && day.cardio.duration > 0
              };
            }
          });
        });
        console.log('Processed workout dates (backend date keys):', dates);
        setWorkoutDates(dates);
      } else {
        console.error('Failed to fetch workout dates:', response.statusText);
        setWorkoutDates({});
      }
    } catch (error) {
      console.error('Error fetching workout dates:', error);
      setWorkoutDates({});
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    if (isActive) {
      fetchWorkoutDates(selectedDate);
    }
  }, [isActive]);

  // Fetch when selected date changes
  useEffect(() => {
    if (isActive) {
      fetchWorkoutDates(selectedDate);
    }
  }, [selectedDate, isActive]);

  const handleDateChange = (date) => {
    // Don't allow selecting future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate <= today) {
      setSelectedDate(date);
    }
  };

  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${BASE_API_URL}/api/profile`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched profile data:', data);
        setUserProfile(data);
        if (showDietPlan) {
          fetchDietPlan(data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleProfileClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProfileTriggerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    setShowProfile(true);
  };

  const fetchDietPlan = async (profile = userProfile) => {
    if (!profile) return;
    
    setIsLoadingDiet(true);
    setError(null);
    try {
      const plan = await generateDietPlan(profile);
      setDietPlan(plan);
    } catch (error) {
      console.error('Error fetching diet plan:', error);
      setError('Failed to generate diet plan. Please try again later.');
    }
    setIsLoadingDiet(false);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
    if (showDietPlan) {
      fetchDietPlan(updatedProfile);
    }
  };

  const tileClassName = ({ date }) => {
    // Use local date string so calendar tile matches the day the user sees (backend returns YYYY-MM-DD for logged day)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayData = workoutDates[dateStr];
    if (!dayData) return '';
    if (dayData.hasWorkout && dayData.hasCardio) {
      return 'react-calendar__tile--has-both';
    } else if (dayData.hasWorkout) {
      return 'react-calendar__tile--has-workout';
    } else if (dayData.hasCardio) {
      return 'react-calendar__tile--has-cardio';
    }
    return '';
  };

  const tileDisabled = ({ date, view }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If we're in month view, disable future dates
    if (view === 'month') {
      return date > today;
    }
    return false;
  };

  const handleActiveStartDateChange = ({ activeStartDate, view }) => {
    const today = new Date();
    const selectedMonth = new Date(activeStartDate);
    
    // Only allow navigation to current or past months
    if (selectedMonth > today) {
      return;
    }
  };

  return (
    <div>
      {isActive && (
        <div
          className={
            inline
              ? "w-full flex flex-col items-start justify-start"
              : "fixed inset-0 z-[10000] flex flex-col items-start justify-start overflow-y-auto"
          }
          initial="initial"
          animate="animate"
          exit="exit"
          variants={overlayVariants}
          style={inline ? undefined : { background: blue }}
        >

          <div className="fixed top-10 group right-10 z-50">
            <div 
              className="w-12 h-12 rounded-full shadow-lg flex items-center group-hover:scale-100 justify-center cursor-pointer group-hover:shadow-xl transition-all duration-500 relative overflow-hidden bg-white"
              onClick={handleProfileClick}
            >
              <div className="absolute inset-0 bg-[#d62e49] transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-full"></div>
              
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-[#d62e49] group-hover:text-white relative z-10 transition-colors duration-500"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
            </div>
          </div>

          <AnimatePresence>
            {showSummary && (
              <div
                className="w-full px-6 md:px-10 mb-8"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <WorkoutSummary />
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCalendar && (
              <div
                className="w-full px-6 md:px-10 flex flex-col lg:flex-row gap-6"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="flex flex-col gap-6 w-full">
                <div className="flex gap-6 w-full">
                  <div className="w-3/5">
                    <WorkoutDetails date={selectedDate} />
                  </div>
                  <div className="w-2/5">
                    <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      className="custom-calendar w-full"
                      tileClassName={tileClassName}
                      tileDisabled={tileDisabled}
                      onActiveStartDateChange={handleActiveStartDateChange}
                      formatShortWeekday={(locale, date) => date.toLocaleDateString('en-US', { weekday: 'short' })}
                      formatMonthYear={(locale, date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      next2Label={null}
                      prev2Label={null}
                      minDetail="month"
                      maxDetail="month"
                      showNeighboringMonth={true}
                    />
                  </div>
                </div>
                <div className="flex gap-6 w-full">
                  <div className="w-3/5 h-full">
                    <WeightTracker />
                  </div>
                  <div className="w-2/5 h-full">
                    <SleepTracker />
                  </div>
                </div>
              </div>

              </div>
            )}
          </AnimatePresence>

          {/* Diet Plan Section */}
          {/* <AnimatePresence>
            {showDietPlan && (
              <motion.div
                className="w-full px-6 md:px-10 mt-10 mb-16"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <h2 className="text-2xl font-semibold text-white mb-4">Your Personalized Diet Plan</h2>
                <div className="bg-[#11113a] p-5 rounded-2xl shadow-lg">
                  {isLoadingProfile ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d62e49]"></div>
                    </div>
                  ) : isLoadingDiet ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d62e49]"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center text-[#d62e49] p-4">
                      {error}
                      <button 
                        onClick={() => fetchDietPlan()}
                        className="mt-4 px-4 py-2 bg-[#d62e49] text-white rounded-lg hover:bg-[#b8253d] transition-colors duration-200"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : dietPlan ? (
                    <div className="space-y-6">
                      {dietPlan.meals.map((meal, index) => (
                        <div key={index} className="bg-[#1a1a40] p-4 rounded-xl">
                          <h3 className="text-xl font-semibold text-white mb-2">{meal.name}</h3>
                          <p className="text-gray-300">{meal.description}</p>
                          <div className="mt-2 text-sm text-gray-400">
                            Calories: {meal.calories} | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fat: {meal.fat}g
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      No diet plan available. Please update your profile preferences.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence> */}

          {/* Profile Modal */}
          <Profile 
            isOpen={showProfile} 
            onClose={() => setShowProfile(false)}
            triggerPosition={profileTriggerPosition}
            onProfileUpdate={handleProfileUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default GymDetails; 