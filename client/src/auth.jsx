import { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
      const response = await fetch('/api/me', {
        credentials: 'include',
      });

      if (response.status === 401) {
        setUser(null);
      } else if (!response.ok) {
        throw new Error('Could not check your login session.');
      } else {
        const data = await response.json();
        setUser(data.user);
      }

      setStatus('ready');
    } catch (err) {
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
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    setUser(data); // Your current server returns { id, name, email } directly.
  }

  async function logout() {
    // Call the server's logout endpoint here once it is implemented.
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