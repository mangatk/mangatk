'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-left"
      toastOptions={{
        // Define default options
        className: '',
        duration: 4000,
        style: {
          background: '#1e293b', // Tailwind slate-800
          color: '#f8fafc', // Tailwind slate-50
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
          borderRadius: '0.75rem', // Tailwind rounded-xl
          padding: '12px 16px',
          fontFamily: 'inherit',
          direction: 'rtl',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#3b82f6', // Tailwind blue-500
            secondary: '#1e293b',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444', // Tailwind red-500
            secondary: '#1e293b',
          },
        },
      }}
    />
  );
}
