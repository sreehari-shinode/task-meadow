import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import bgImage from '../assets/bg.jpg';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login, register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Real-time validation
    let errorMessage = '';
    switch (name) {
      case 'username':
        errorMessage = validateUsername(value);
        break;
      case 'email':
        errorMessage = validateEmail(value);
        break;
      case 'password':
        errorMessage = validatePassword(value);
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };

  const validateForm = () => {
    const newErrors = {
      username: '',
      email: '',
      password: ''
    };

    if (!isLogin) {
      newErrors.username = validateUsername(formData.username);
    }
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) {
      setError('Please fix the errors in the form before submitting.');
      return;
    }

    const { email, password, username } = formData;
    let result;

    if (isLogin) {
      result = await login(email, password);
    } else {
      result = await register(username, email, password);
    }

    if (result.success) {
      if (isLogin) {
        onClose();
      } else {
        setSuccessMessage('Registration successful! Please login to continue.');
        // Clear form
        setFormData({
          username: '',
          email: '',
          password: ''
        });
        // Switch to login after 2 seconds
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
        }, 2000);
      }
    } else {
      setError(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Left side - Illustration */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-1/2 bg-gradient-to-br from-terracotta-dark to-terracotta p-12 flex items-center justify-center relative overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Welcome to Task Meadow</h1>
          <p className="text-white/80 text-lg max-w-md mx-auto">
            Your personal productivity companion. Track tasks, set goals, and achieve more every day.
          </p>
          <div className="mt-8">
            <img 
              src="/src/assets/auth-illustration.png" 
              alt="Task Meadow Illustration" 
              className="max-w-md mx-auto"
            />
          </div>
        </div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-1/2 bg-slate-800 p-12 flex items-center justify-center"
      >
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-8 text-terracotta">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-slate-700 border ${
                    errors.username ? 'border-red-500' : 'border-slate-600'
                  } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all`}
                  placeholder="Enter your username"
                  required
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-400">{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-slate-700 border ${
                  errors.email ? 'border-red-500' : 'border-slate-600'
                } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all`}
                placeholder="Enter your email"
                required
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-slate-700 border ${
                  errors.password ? 'border-red-500' : 'border-slate-600'
                } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all`}
                placeholder="Enter your password"
                required
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-terracotta text-white py-3 px-4 rounded-lg font-medium hover:bg-terracotta/90 focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 focus:ring-offset-slate-800 transition-all transform hover:scale-[1.02]"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                // Clear errors and messages when switching modes
                setErrors({
                  username: '',
                  email: '',
                  password: ''
                });
                setError('');
                setSuccessMessage('');
              }}
              className="text-slate-300 hover:text-terracotta transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal; 