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
import Community from '@/pages/Community';
import ChatbotModal from '@/components/Chatbot/ChatbotModal';
import { Bot } from 'lucide-react';
import { t } from '@/i18n';

function Shell() {
  const { booted, isChatOpen, setIsChatOpen, lang } = useApp();
  if (!booted) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  return (
    <div className="App min-h-screen relative">
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/advisory" element={<Advisory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/community" element={<Community />} />
      </Routes>

      {/* Floating AI Sahayak Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border-2 border-primary-foreground/20 group animate-in fade-in zoom-in"
          title={t(lang, 'aiSahayak')}
          data-testid="floating-ai-sahayak-btn"
        >
          <Bot size={22} className="group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline font-bold text-xs">{t(lang, 'aiSahayak')}</span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Voice & Text Chatbot Modal */}
      <ChatbotModal />

      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
