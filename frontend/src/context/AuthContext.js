import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveUser = (userData) => {
    setUser(userData);
    localStorage.setItem('koffi_user', JSON.stringify(userData));
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('koffi_user');
    setUser(null);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('koffi_user');
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); } catch (_) { localStorage.removeItem('koffi_user'); }
    }
    if (token) {
      try {
        const response = await authAPI.getMe();
        saveUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        if ([401, 403].includes(error.response?.status)) clearSession();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.data.access_token);
      saveUser(response.data.user);
      toast.success('Connexion réussie !');
      return response.data.user;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.detail || 'Échec de la connexion');
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      localStorage.setItem('token', response.data.access_token);
      setUser(response.data.user);
      toast.success('Inscription réussie !');
      return response.data.user;
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.response?.data?.detail || "Échec de l'inscription");
      throw error;
    }
  };

  const logout = () => {
    clearSession();
    toast.success('Déconnexion réussie');
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
