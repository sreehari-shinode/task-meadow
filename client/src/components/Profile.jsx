import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BsArrowRight, BsPencil } from 'react-icons/bs';
import { BASE_API_URL } from '../context/AuthContext';

const Profile = ({ isOpen, onClose, triggerPosition, onProfileUpdate }) => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    age: '',
    height: '',
    weight: '',
    gender: '',
    // Fitness Journey
    fitnessGoal: '',
    activityLevel: '',
    workoutSplit: '',
    targetWeight: '',
    targetHeight: '',
    bodyFatPercentage: '',
    // Nutritional Preferences
    calorieGoal: '',
    dietType: '',
    mealFrequency: '',
    foodAllergies: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState(null);

  // Add style block for select elements
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      select {
        background-image: none !important;
      }
      select::-ms-expand {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch profile data when component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
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
          console.log('Fetched profile data:', data); // Debug log
          setProfileData(prev => ({
            ...prev,
            height: data.height || '',
            weight: data.weight || '',
            age: data.age || '',
            fitnessGoal: data.fitnessGoal || '',
            activityLevel: data.activityLevel || '',
            gender: data.gender || '',
            targetWeight: data.targetWeight || '',
            targetHeight: data.targetHeight || '',
            bodyFatPercentage: data.bodyFatPercentage || '',
            workoutSplit: data.workoutSplit || '',
            calorieGoal: data.calorieGoal || '',
            dietType: data.dietType || '',
            mealFrequency: data.mealFrequency || '',
            foodAllergies: data.foodAllergies || ''
          }));
          if (data.profileImage) {
            setProfileImage(`${BASE_API_URL}${data.profileImage}`);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const pageVariants = {
    initial: {
      clipPath: `circle(0% at ${triggerPosition?.x}px ${triggerPosition?.y}px)`,
      backgroundColor: 'white'
    },
    animate: {
      clipPath: 'circle(150% at 50% 50%)',
      backgroundColor: 'white',
      transition: {
        duration: 1.8,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      clipPath: `circle(0% at ${triggerPosition?.x}px ${triggerPosition?.y}px)`,
      backgroundColor: 'white',
      transition: {
        duration: 1.2,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a temporary URL for preview
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);
      setSelectedImage(file);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'username' && value !== user?.username) {
      try {
        const response = await fetch(`${BASE_API_URL}/api/profile/check-username?username=${value}`, {
          headers: {
            'x-auth-token': sessionStorage.getItem('token')
          }
        });
        const data = await response.json();
        console.log('username', data);
        setUsernameAvailable(data.available);
      } catch (error) {
        console.error('Error checking username:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // setError(null);

    try {
      const formData = new FormData();
      
      // Only include username if it has changed
      if (profileData.username !== user?.username) {
        formData.append('username', profileData.username);
      }
      
      // Add other fields
      Object.keys(profileData).forEach(key => {
        if (key !== 'username') { // Skip username as it's handled above
          formData.append(key, profileData[key]);
        }
      });

      // Add the selected image if there is one
      if (selectedImage) {
        formData.append('profileImage', selectedImage);
      }

      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${BASE_API_URL}/api/profile/update`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'x-auth-token': token
        },
        body: formData
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        if (updatedProfile.profileImage) {
          setProfileImage(`${BASE_API_URL}${updatedProfile.profileImage}`);
        }
        setSelectedImage(null);
        setIsEditing(false);
        setShowSuccessMessage(true);
        
        // Update the user context
        updateUser(updatedProfile);
        
        // Notify parent component about profile update
        onProfileUpdate?.(updatedProfile);
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // const data = await response.json();
        // setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      // setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (profileData.height && profileData.weight) {
      const heightInMeters = profileData.height / 100;
      const bmi = profileData.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return { status: 'Underweight', color: '#FF6B6B' };
    if (bmi < 25) return { status: 'Normal', color: '#4CAF50' };
    if (bmi < 30) return { status: 'Overweight', color: '#FFA726' };
    return { status: 'Obese', color: '#FF6B6B' };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 !bg-[#1d2145]"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          <h1 className="text-6xl font-bold text-white mt-8 ml-28 bg-[#1d2145] hover:text-[#d62e49] max-w-[220px]">PROFILE</h1>
          <div className="group fixed top-10 right-10 z-50">
            <motion.button
              onClick={onClose}
              className="fixed z-50 p-3 rounded-full bg-white text-[#d62e49] 
                        overflow-hidden relative group hover:shadow-xl transition-all duration-500 ease-out"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="absolute inset-0 bg-[#d62e49] transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-full"></div>
              <BsArrowRight className="text-[#d62e49] group-hover:text-white w-6 h-6 relative z-10 transition-colors duration-500" />
            </motion.button>
          </div>

          <div className="container mx-auto px-4 py-8 mt-4 bg-[#1d2145]">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d62e49]"></div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/3 flex justify-center ml-20">
                  <div className="relative border-2 border-[#d62e49] rounded-2xl p-6 px-8 bg-[#1d2145]">
                    <h1 className="text-5xl flex items-center font-bold text-white justify-center">{profileData.username}</h1>
                    <p className="text-lg text-gray-300 flex items-center justify-center mt-2">{profileData.email}</p>
                    <div className="w-[380px] h-[380px] rounded-full overflow-hidden shadow-lg border-[10px] border-[#d62e49] mt-6">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Error loading image:', e);
                            setProfileImage(null);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1d2145] flex items-center justify-center">
                          <span className="text-gray-400">No photo</span>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <label className="absolute bottom-[32px] right-14 bg-[#d62e49] text-white p-2 rounded-full cursor-pointer hover:bg-[#b8253d] transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <BsPencil />
                      </label>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-2/3 ml-8">
                  <div className={`border-2 border-[#d62e49] rounded-2xl ${isEditing ? "px-6 pt-6 pb-2" : "p-6"} mr-24 relative bg-[#1d2145]`}>
                    {!isEditing && (
                      <div className="absolute top-2 right-2">
                        <motion.button
                          onClick={() => setIsEditing(true)}
                          className="fixed z-50 p-2 rounded-full  text-[#d62e49] 
                                    overflow-hidden relative group hover:shadow-xl transition-all duration-500 ease-out"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div className="absolute inset-0 bg-[#d62e49] transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-full"></div>
                          <BsPencil className="text-white group-hover:text-white w-5 h-5 relative z-10 transition-colors duration-500" />
                        </motion.button>
                      </div>
                    )}

                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-4">Personal Info</h2>
                      <div className="grid grid-cols-5 gap-4 pl-12 font-sans">
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Username</label>
                          {isEditing ? (
                            <div>
                              <input
                                type="text"
                                name="username"
                                value={profileData.username}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] ${
                                  profileData.username !== user?.username && !usernameAvailable
                                    ? 'border-2 border-red-500'
                                    : ''
                                }`}
                              />
                              {profileData.username !== user?.username && (
                                <p className={`text-xs mt-1 ${
                                  usernameAvailable ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {usernameAvailable ? 'Username available' : 'Username not available'}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.username}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Age</label>
                          {isEditing ? (
                            <input
                              type="number"
                              name="age"
                              value={profileData.age}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                              min="0"
                            />
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.age || 'Not set'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Gender</label>
                          {isEditing ? (
                            <select
                              name="gender"
                              value={profileData.gender}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.gender || 'Not set'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Height (cm)</label>
                          {isEditing ? (
                            <input
                              type="number"
                              name="height"
                              value={profileData.height}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                              min="0"
                            />
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.height || 'Not set'} cm</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Weight (kg)</label>
                          {isEditing ? (
                            <input
                              type="number"
                              name="weight"
                              value={profileData.weight}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                              min="0"
                            />
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.weight || 'Not set'} kg</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Target Weight (kg)</label>
                          {isEditing ? (
                            <input
                              type="number"
                              name="targetWeight"
                              value={profileData.targetWeight}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                              min="0"
                            />
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.targetWeight || 'Not set'} kg</p>
                          )}
                        </div>
                      </div>

                      {/* BMI Display */}
                      {profileData.height && profileData.weight && (
                        <div className="mt-6 ml-24 font-sans">
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-white whitespace-nowrap">BMI Status:</h3>
                            <div className="flex-1 ml-3 max-w-[400px] h-4 bg-gradient-to-r from-[#FF4B4B] via-[#4CAF50] to-[#FF4B4B] rounded-full relative">
                              <div 
                                className="absolute top-0 h-4 w-2 bg-black transform -translate-x-1/2"
                                style={{ 
                                  left: `${Math.min(Math.max((calculateBMI() - 15) / 15 * 100, 0), 100)}%` 
                                }}
                              />
                            </div>
                            <div className="text-sm font-semibold whitespace-nowrap">
                              ( {calculateBMI()} - {getBMIStatus(calculateBMI()).status} )
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1 max-w-[400px] ml-[120px]">
                            <span>Underweight</span>
                            <span>Normal</span>
                            <span>Overweight</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fitness Journey Section */}
                    <div className={`mb-8 ${isEditing ? "mt-8" : "mt-14"}`}>
                      <h2 className="text-2xl font-bold text-white mb-4">Fitness Journey</h2>
                      <div className="grid grid-cols-4 gap-4 pl-12 font-sans">
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Fitness Goal</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="fitnessGoal"
                              value={profileData.fitnessGoal}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                            />
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.fitnessGoal || 'Not set'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Activity Level</label>
                          {isEditing ? (
                            <select
                              name="activityLevel"
                              value={profileData.activityLevel}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                            >
                              <option value="">Select Activity Level</option>
                              <option value="sedentary">Sedentary</option>
                              <option value="light">Lightly Active</option>
                              <option value="moderate">Moderately Active</option>
                              <option value="very">Very Active</option>
                              <option value="extra">Extra Active</option>
                            </select>
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.activityLevel || 'Not set'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Workout Split</label>
                          {isEditing ? (
                            <select
                              name="workoutSplit"
                              value={profileData.workoutSplit}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                            >
                              <option value="">Select Workout Split</option>
                              <option value="Full Body">Full Body</option>
                              <option value="Upper-Lower">Upper-Lower</option>
                              <option value="Push-Pull-Legs">Push-Pull-Legs</option>
                              <option value="Bro Split">Bro Split</option>
                              <option value="Custom Split">Custom Split</option>
                            </select>
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">
                              {profileData.workoutSplit ? profileData.workoutSplit : 'Not set'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Target Body Fat %</label>
                          {isEditing ? (
                            <input
                              type="number"
                              name="bodyFatPercentage"
                              value={profileData.bodyFatPercentage}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                              min="0"
                              max="100"
                            />
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.bodyFatPercentage || 'Not set'}%</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nutritional Preferences Section */}
                    <div className={`mb-8 ${isEditing ? "mt-0" : "mt-10"}`}>
                      <h2 className="text-2xl font-bold text-white mb-4">Nutritional Preferences</h2>
                      <div className="grid grid-cols-3 gap-4 pl-12 font-sans">
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Calorie Goal</label>
                          {isEditing ? (
                            <input
                              type="number"
                              name="calorieGoal"
                              value={profileData.calorieGoal}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                              min="0"
                            />
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.calorieGoal || 'Not set'} kcal</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Diet Type</label>
                          {isEditing ? (
                            <select
                              name="dietType"
                              value={profileData.dietType}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                            >
                              <option value="">Select Diet Type</option>
                              <option value="vegetarian">Vegetarian</option>
                              <option value="vegan">Vegan</option>
                              <option value="non-vegetarian">Non-Vegetarian</option>
                              <option value="pescatarian">Pescatarian</option>
                              <option value="keto">Keto</option>
                              <option value="paleo">Paleo</option>
                            </select>
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.dietType || 'Not set'}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Meal Frequency</label>
                          {isEditing ? (
                            <select
                              name="mealFrequency"
                              value={profileData.mealFrequency}
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-white rounded-lg px-3 py-2 border-0 focus:outline-none focus:ring-0 font-normal font-sans bg-[#2a2f5c] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-ms-expand]:hidden [appearance:none] [-moz-appearance:none] [-webkit-appearance:none] bg-no-repeat"
                            >
                              <option value="">Select Meal Frequency</option>
                              <option value="3">3 meals per day</option>
                              <option value="4">4 meals per day</option>
                              <option value="5">5 meals per day</option>
                              <option value="6">6 meals per day</option>
                            </select>
                          ) : (
                            <p className="text-lg text-white font-normal font-sans">{profileData.mealFrequency || 'Not set'} meals per day</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Save/Back Buttons */}
                    {isEditing && (
                      <div className="absolute top-2 right-6 flex items-center gap-4">
                        <button
                          onClick={handleSubmit}
                          className="px-4 py-1 bg-[#d62e49] text-white text-sm rounded-lg hover:bg-[#b8253d] transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Profile; 