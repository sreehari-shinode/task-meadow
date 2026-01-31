import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Set your deployed backend URL here
const BASE_API_URL = 'https://task-meadow-backend.onrender.com'; // Replace with your actual Render backend URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Restore session from token (if present)
    const restoreSession = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          setUser(null);
          return;
        }

        const response = await fetch(`${BASE_API_URL}/api/auth/user`, {
          headers: { 'x-auth-token': token },
        });

        if (!response.ok) {
          sessionStorage.removeItem('token');
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser({ ...data, token });
      } catch (err) {
        console.error('Failed to restore session:', err);
        sessionStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [navigate]);

  // Allow other parts of the app (e.g. Profile) to update
  // the in-memory user object without requiring a re-login.
  const updateUser = (updatedData) => {
    setUser((prev) => ({
      ...(prev || {}),
      ...updatedData,
    }));
  };

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
      if (!response.ok || !data?.token) {
        return {
          success: false,
          message: data?.message || 'Login failed. Please check your credentials.',
        };
      }

      sessionStorage.setItem('token', data.token);
      setUser({ ...(data.user || {}), token: data.token });
      navigate('/');
      return {
        success: true,
        message: 'Login successful!',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('token');
    setUser(null);
    navigate('/');
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
          message: data?.message || 'Registration failed.',
        };
      }

      return {
        success: true,
        message: 'Registration successful! Please login to continue.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
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