import React from 'react';

export const Toaster = () => null;

export const toast = {
  success: (msg) => console.log('✅ Toast:', msg),
  error: (msg) => console.error('❌ Toast:', msg),
  info: (msg) => console.log('ℹ️ Toast:', msg),
};
