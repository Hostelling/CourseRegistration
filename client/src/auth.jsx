import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  // Check whether the browser already has a valid server session.
  const retry = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const data = await apiFetch('/api/me');
      setUser(data.user);
      setStatus('ready');
    } catch (err) {
      // A 401 means the visitor is logged out, not that the app failed.
      if (err.status === 401) {
        setUser(null);
        setStatus('ready');
        return;
      }

      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    retry();
  }, [retry]);

  // LoginPage calls login(email, password).
  async function login(email, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    setUser(data);
  }

  async function logout() {
    await apiFetch('/api/logout', { method: 'POST' });
    setUser(null);
  }

  const value = {
    user,
    status,
    error,
    retry,
    login,
    logout,
    sessionExpired: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}