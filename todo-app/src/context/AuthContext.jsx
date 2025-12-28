import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const response = await api.getMe();
          setUser(response.data);
        } catch (err) {
          console.error('Auth check failed:', err);
          api.logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const register = async (email, password, name) => {
    setError(null);
    try {
      const response = await api.register(email, password, name);
      setUser(response.data.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.login(email, password);
      setUser(response.data.user);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const updateProfile = async (updates) => {
    try {
      const response = await api.updateProfile(updates);
      setUser(response.data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isAuthenticated: !!user,
      register,
      login,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
