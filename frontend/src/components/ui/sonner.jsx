import React, { useState, useEffect } from 'react';

let toastListeners = [];

export const toast = {
  success: (msg) => toastListeners.forEach(fn => fn({ id: Date.now(), type: 'success', message: msg })),
  error: (msg) => toastListeners.forEach(fn => fn({ id: Date.now(), type: 'error', message: msg })),
  info: (msg) => toastListeners.forEach(fn => fn({ id: Date.now(), type: 'info', message: msg })),
};

export const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== t.id));
      }, 4000);
    };
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg text-sm font-medium text-white transition-all animate-in slide-in-from-top-2 ${
            t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-emerald-600' : 'bg-blue-600'
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="ml-3 text-white/80 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
