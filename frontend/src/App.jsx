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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:opacity-90"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Shell() {
  const { booted, isChatOpen, setIsChatOpen, lang } = useApp();
  if (!booted) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-semibold">Loading Grameen Udyog AI…</div>;
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
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppProvider>
          <Shell />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
