import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/users/profile`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [API_URL, logout]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Optionally fetch user profile
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const signup = async (userData) => {
    try {
      console.log('Signup attempt:', { API_URL, userData });
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      console.log('Signup response:', response.data);
      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      console.error('Signup error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => 
          `${err.param}: ${err.msg || err.message}`
        ).join(', ');
        return {
          success: false,
          error: errorMessages || 'Validation failed'
        };
      }
      
      // Handle network/connection errors
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('CONNECTION_REFUSED')) {
        return {
          success: false,
          error: 'Cannot connect to server. Please ensure the backend server is running on http://localhost:5000'
        };
      }
      
      // Handle other errors
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Signup failed'
      };
    }
  };


  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    fetchUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

