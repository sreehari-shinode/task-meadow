import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useAuth } from '../context/AuthContext';
import Profile from './Profile';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
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

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: 50, transition: { duration: 0.4 } }
};

const GymDetails = ({ show, onClose, inline = false }) => {
  // const textRef = useRef(null);
  // const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [profileTriggerPosition, setProfileTriggerPosition] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [workoutDates, setWorkoutDates] = useState({});

  // In both inline and overlay modes, show all content immediately
  useEffect(() => {
    setShowSummary(true);
    setShowCalendar(true);
  }, []);

  const isActive = inline || show;

  useEffect(() => {
    if (isActive) {
      fetchUserProfile();
    }
  }, [isActive]);

  const fetchWorkoutDates = useCallback(async (date = new Date()) => {
  try {
    const selectedDate = new Date(date);
    const period = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, '0')}-01`;

    const response = await fetch(
      `${BASE_API_URL}/api/workouts/summary?period=${period}`,
      {
        headers: {
          'x-auth-token': sessionStorage.getItem('token'),
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const dates = {};

      data.data.weeklyBreakdown.forEach(week => {
        week.dailyBreakdown.forEach(day => {
          if (
            day.totalTime > 0 ||
            (day.cardio?.activity && day.cardio?.duration > 0)
          ) {
            dates[day.date] = {
              hasWorkout: day.totalTime > 0,
              hasCardio: !!(
                day.cardio?.activity && day.cardio?.duration > 0
              ),
            };
          }
        });
      });

      setWorkoutDates(dates);
    } else {
      setWorkoutDates({});
    }
  } catch (error) {
    setWorkoutDates({});
  }
}, []);


  // Initial fetch when component mounts
  useEffect(() => {
  if (isActive) {
    fetchWorkoutDates(selectedDate);
  }
}, [isActive, selectedDate, fetchWorkoutDates]);


  // Fetch when selected date changes
  useEffect(() => {
    if (isActive) {
      fetchWorkoutDates(selectedDate);
    }
  }, [selectedDate, isActive, fetchWorkoutDates]);

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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
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
              <motion.div
                className="w-full px-6 md:px-10 mb-8"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <WorkoutSummary />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showCalendar && (
              <motion.div
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Modal */}
          { userProfile && isLoadingProfile === false && (
               <Profile 
            isOpen={showProfile} 
            onClose={() => setShowProfile(false)}
            triggerPosition={profileTriggerPosition}
            onProfileUpdate={handleProfileUpdate}
          />
            )}
         
        </div>
      )}
    </div>
  );
};

export default GymDetails;