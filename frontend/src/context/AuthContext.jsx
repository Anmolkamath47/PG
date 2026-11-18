import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pgmate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pgmate_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify and fetch current profile on load
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const freshUser = { ...res.data.user, ...res.data.details };
          setUser(freshUser);
          localStorage.setItem('pgmate_user', JSON.stringify(freshUser));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (identifier, password, role) => {
    const res = await api.post('/auth/login', { identifier, password, role });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('pgmate_token', newToken);
      localStorage.setItem('pgmate_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const registerOwner = async (data) => {
    const res = await api.post('/auth/register/owner', data);
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('pgmate_token', newToken);
      localStorage.setItem('pgmate_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Owner registration failed');
  };

  const registerTenant = async (data) => {
    const res = await api.post('/auth/register/tenant', data);
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('pgmate_token', newToken);
      localStorage.setItem('pgmate_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Tenant registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pgmate_token');
    localStorage.removeItem('pgmate_user');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('pgmate_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerOwner,
        registerTenant,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
        isOwner: user?.role === 'owner',
        isTenant: user?.role === 'tenant',
      }}
    >
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
