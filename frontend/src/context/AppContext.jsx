import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:8001');
export const API = `${BACKEND_URL}/api`;

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('gu_token'));
  const [lang, setLang] = useState(() => localStorage.getItem('gu_lang') || 'en');
  const [booted, setBooted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [advisoryDraft, setAdvisoryDraft] = useState(null);

  useEffect(() => {
    localStorage.setItem('gu_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => setUser(r.data))
        .catch(() => {
          localStorage.removeItem('gu_token');
          setToken(null);
        })
        .finally(() => setBooted(true));
    } else {
      setBooted(true);
    }
  }, [token]);

  const login = async (email, password) => {
    const r = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('gu_token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
  };

  const register = async (name, email, password) => {
    const r = await axios.post(`${API}/auth/register`, { name, email, password });
    localStorage.setItem('gu_token', r.data.token);
    setToken(r.data.token);
    setUser(r.data.user);
  };

  const logout = () => {
    localStorage.removeItem('gu_token');
    setToken(null);
    setUser(null);
  };

  const setPoints = (points) => setUser((u) => (u ? { ...u, points } : u));

  const applyAdvisoryDraft = (draft) => {
    setAdvisoryDraft(draft);
  };

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AppContext.Provider value={{
      user, token, lang, setLang, login, register, logout, authHeaders, booted, setPoints,
      isChatOpen, setIsChatOpen, advisoryDraft, setAdvisoryDraft, applyAdvisoryDraft
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
