import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
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
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password)
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    if (!validateForm()) {
      setMessage('Please fix the errors in the form before submitting.');
      return;
    }

    const result = await register(formData.username, formData.email, formData.password);
    
    if (result.success) {
      setMessage('Registration successful! Please login to continue.');
      setIsSuccess(true);
      // Clear form
      setFormData({
        username: '',
        email: '',
        password: ''
      });
      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setMessage(result.message);
      setIsSuccess(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1d2145' }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
        </div>

        {message && (
          <div className={`p-4 mb-4 rounded-md ${
            isSuccess
              ? 'bg-green-900/50 text-green-200 border border-green-500'
              : 'bg-[#d62e49]/30 text-[#d62e49] border border-[#d62e49]'
          }`}>
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.username ? 'border-[#d62e49]' : 'border-[#1d2145]'
                } rounded-md shadow-sm placeholder-gray-400 text-white bg-[#23275a] focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:border-[#d62e49] sm:text-sm transition-colors duration-200`}
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="mt-2 text-sm" style={{ color: '#d62e49' }}>{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.email ? 'border-[#d62e49]' : 'border-[#1d2145]'
                } rounded-md shadow-sm placeholder-gray-400 text-white bg-[#23275a] focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:border-[#d62e49] sm:text-sm transition-colors duration-200`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-2 text-sm" style={{ color: '#d62e49' }}>{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.password ? 'border-[#d62e49]' : 'border-[#1d2145]'
                } rounded-md shadow-sm placeholder-gray-400 text-white bg-[#23275a] focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:border-[#d62e49] sm:text-sm transition-colors duration-200`}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-2 text-sm" style={{ color: '#d62e49' }}>{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
              style={{ background: '#d62e49' }}
              onMouseOver={e => e.currentTarget.style.background = '#b71c3b'}
              onMouseOut={e => e.currentTarget.style.background = '#d62e49'}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;