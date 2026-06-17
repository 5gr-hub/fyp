import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setLoading(false); } };

    const token = localStorage.getItem('drcp_token');
    const fallback = setTimeout(() => {
      localStorage.removeItem('drcp_token');
      finish();
    }, 6000);

    if (token) {
      api.get('/auth/me', { timeout: 5000 })
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('drcp_token'))
        .finally(() => { clearTimeout(fallback); finish(); });
    } else {
      clearTimeout(fallback);
      finish();
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('drcp_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('drcp_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
