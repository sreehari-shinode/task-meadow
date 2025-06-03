import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Profile from './Profile';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { generateDietPlan } from '../utils/dietPlanAPI';
import WorkoutDetails from './WorkoutDetails';
import gsap from 'gsap';
import WorkoutSummary from './WorkoutSummary';

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

const GymDetails = ({ show, onClose }) => {
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
  const [showMotivation, setShowMotivation] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [workoutDates, setWorkoutDates] = useState({});

  useEffect(() => {
    if (show && textRef.current) {
      const text = "YEAH BUDDY LIGHTWEIGHT";
      const words = text.split(' ');
      
      // Clear any existing content
      textRef.current.innerHTML = '';
      
      // Create spans for each word with proper spacing
      words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.marginRight = '40px'; // Add space between words
        
        // Add each character of the word
        word.split('').forEach((char, charIndex) => {
          const charSpan = document.createElement('span');
          charSpan.textContent = char;
          charSpan.style.opacity = '0';
          charSpan.style.display = 'inline-block';
          charSpan.style.transform = 'translateY(20px)';
          wordSpan.appendChild(charSpan);
        });
        
        textRef.current.appendChild(wordSpan);
      });

      // Add initial delay before starting animations
      setTimeout(() => {
        // Initial animation - fade in and move up
        gsap.to(textRef.current.querySelectorAll('span span'), {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.01,
          ease: "power2.out",
          onComplete: () => {
            // Color change animation
            gsap.to(textRef.current.querySelectorAll('span span'), {
              color: "#d62e49",
              duration: 0.5,
              stagger: 0.04,
              ease: "power2.inOut",
              onComplete: () => {
                // Fade out animation
                gsap.to(textRef.current.querySelectorAll('span span'), {
                  opacity: 0,
                  y: -20,
                  duration: 0.8,
                  stagger: 0.04,
                  ease: "power2.in",
                  onComplete: () => {
                    setShowMotivation(false);
                    // Show username immediately after motivation text
                    setTimeout(() => {
                      // Show summary after username
                      setTimeout(() => {
                        setShowSummary(true);
                        // Show calendar after summary
                        setTimeout(() => {
                          setShowCalendar(true);
                          // Show diet plan last
                          setTimeout(() => {
                            setShowDietPlan(true);
                          }, 1000);
                        }, 1000);
                      }, 1000);
                    }, 500);
                  }
                });
              }
            });
          }
        });
      }, 300);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      fetchUserProfile();
    }
  }, [show]);

  const fetchWorkoutDates = async (date = new Date()) => {
    try {
      const selectedDate = new Date(date);
      // Format the date as YYYY-MM-01 for the period parameter (still UTC, as backend expects)
      const period = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-01`;
      console.log('Fetching workout dates for period:', period);
      const response = await fetch(`http://localhost:5001/api/workouts/summary?period=${period}`, {
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
    if (show) {
      fetchWorkoutDates(selectedDate);
    }
  }, [show]);

  // Fetch when selected date changes
  useEffect(() => {
    if (show) {
      fetchWorkoutDates(selectedDate);
    }
  }, [selectedDate, show]);

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

      const response = await fetch('http://localhost:5001/api/profile', {
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
    // Use UTC date string for key, matching backend
    const dateStr = date.toISOString().split('T')[0];
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
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[10000] flex flex-col items-start justify-start overflow-y-auto"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={overlayVariants}
          style={{ background: blue }}
        >
          {/* Motivation Text Animation */}
          <AnimatePresence>
            {showMotivation && (
              <motion.div
                className="fixed inset-0 flex flex-col items-center justify-center ml-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 
                  ref={textRef}
                  className="text-[110px] font-bold text-white tracking-wider"
                  style={{
                    textShadow: '0 0 2px #d62e49'
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Hello Username - Only show after motivation text disappears */}
          <AnimatePresence>
            {!showMotivation && (
              <motion.div
                className="w-full flex flex-col items-start px-24 mt-24"
                variants={dropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <h1 className="text-5xl font-bold text-white mb-2">
                  Hello, {userProfile?.username || user?.username || 'User'}
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSummary && (
              <motion.div
                className="w-full px-24 mt-12 mb-12"
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
                className="w-full px-24 flex"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <WorkoutDetails date={selectedDate} />

                <div className="w-1/3 ml-16">
                  <div className="">
                    <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      className="custom-calendar"
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

              </motion.div>
            )}
          </AnimatePresence>

          {/* Diet Plan Section */}
          <AnimatePresence>
            {showDietPlan && (
              <motion.div
                className="w-full px-24 mt-12 mb-24"
                variants={sectionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <h2 className="text-3xl font-semibold text-white mb-6">Your Personalized Diet Plan</h2>
                <div className="bg-[#11113a] p-6 rounded-2xl shadow-lg">
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
          </AnimatePresence>

          {/* Profile Modal */}
          <Profile 
            isOpen={showProfile} 
            onClose={() => setShowProfile(false)}
            triggerPosition={profileTriggerPosition}
            onProfileUpdate={handleProfileUpdate}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GymDetails; 