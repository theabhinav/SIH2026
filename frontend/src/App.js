import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';

import NavBar from '@/components/NavBar';
import Landing from '@/pages/Landing';
import AuthPage from '@/pages/AuthPage';
import Advisory from '@/pages/Advisory';
import Reports from '@/pages/Reports';

function Shell() {
  const { booted } = useApp();
  if (!booted) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  return (
    <div className="App min-h-screen">
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/advisory" element={<Advisory />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
