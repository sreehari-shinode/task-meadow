import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Set your deployed backend URL here
const BASE_API_URL = 'https://task-meadow.onrender.com'; // TODO: Replace with your actual Render backend URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = sessionStorage.getItem('token');
    if (token) {
      // Fetch user data
      fetch(`${BASE_API_URL}/api/auth/user`, {
        headers: {
          'x-auth-token': token
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data) {
            setUser({ ...data, token });
            navigate('/');
          }
        })
        .catch(err => {
          console.error('Error fetching user data:', err);
          sessionStorage.removeItem('token');
          navigate('/login');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || 'Login failed. Please check your credentials.'
        };
      }

      sessionStorage.setItem('token', data.token);
      setUser({ ...data.user, token: data.token });
      navigate('/');
      return { 
        success: true,
        message: 'Login successful!'
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Login failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        await fetch(`${BASE_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'x-auth-token': token
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      sessionStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || 'Registration failed.'
        };
      }

      return { 
        success: true,
        message: 'Registration successful! Please login to continue.'
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Registration failed. Please try again.'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { BASE_API_URL }; 