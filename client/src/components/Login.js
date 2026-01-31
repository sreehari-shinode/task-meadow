import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  // Clear form when navigating from registration
  useEffect(() => {
    if (location.state?.fromRegistration) {
      setFormData({
        email: '',
        password: ''
      });
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      setMessage(result.message);
      // Navigate to home after successful login
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } else {
      setMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1d2145' }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#d62e49] placeholder-gray-400 text-white bg-[#23275a] rounded-t-md focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:border-[#d62e49] focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#1d2145] placeholder-gray-400 text-white bg-[#23275a] rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#d62e49] focus:border-[#d62e49] focus:z-10 sm:text-sm transition-colors duration-200"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {message && (
            <div className={`text-sm ${message.includes('successful') ? 'text-green-400' : 'text-[#d62e49]'}`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#d62e49] hover:bg-[#b71c3b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d62e49] transition-colors duration-200"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 