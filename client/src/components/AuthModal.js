import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
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
        setFormData({
          username: '',
          email: '',
          password: ''
        });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#1d2145' }}>
      {/* Blurred gradient circles */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-pink-500 to-red-400 opacity-70 blur-3xl pointer-events-none" style={{ zIndex: 1, transform: 'translate(40%,-40%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gradient-to-br from-purple-500 to-blue-400 opacity-70 blur-3xl pointer-events-none" style={{ zIndex: 1, transform: 'translate(-40%,40%)', filter: 'blur(80px)' }} />
      {/* Glassmorphism card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center justify-center w-full max-w-md p-10 rounded-2xl shadow-xl border border-white/20"
        style={{
          background: 'rgba(35, 39, 90, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
      >
        <h2 className="text-3xl font-bold mb-8 text-white text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        {error && (
          <div className="bg-[#d62e49]/30 border border-[#d62e49] text-[#d62e49] px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg bg-[#23275a] border ${
                  errors.username ? 'border-[#d62e49]' : 'border-[#1d2145]'
                } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:border-transparent transition-all`}
                placeholder="Enter your username"
                required
              />
              {errors.username && (
                <p className="mt-2 text-sm" style={{ color: '#d62e49' }}>{errors.username}</p>
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
              className={`w-full px-4 py-3 rounded-lg bg-[#23275a] border ${
                errors.email ? 'border-[#d62e49]' : 'border-[#1d2145]'
              } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:border-transparent transition-all`}
              placeholder="Enter your email"
              required
            />
            {errors.email && (
              <p className="mt-2 text-sm" style={{ color: '#d62e49' }}>{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg bg-[#23275a] border ${
                errors.password ? 'border-[#d62e49]' : 'border-[#1d2145]'
              } text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:border-transparent transition-all`}
              placeholder="Enter your password"
              required
            />
            {errors.password && (
              <p className="mt-2 text-sm" style={{ color: '#d62e49' }}>{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full text-white py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:ring-offset-2 transition-all transform hover:scale-[1.02]"
            style={{ background: '#d62e49', border: 'none' }}
            onMouseOver={e => e.currentTarget.style.background = '#b71c3b'}
            onMouseOut={e => e.currentTarget.style.background = '#d62e49'}
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({ username: '', email: '', password: '' });
              setError('');
              setSuccessMessage('');
            }}
            className="text-white hover:text-[#d62e49] transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal; 