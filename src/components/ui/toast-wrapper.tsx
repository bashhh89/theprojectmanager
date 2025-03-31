'use client';

import React from 'react';
import toast, { Toaster as HotToaster } from 'react-hot-toast';

// Wrapper component to provide Toaster in client components
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
      }}
    />
  );
}

// Type-safe toast functions that fix the props issues
export const toasts = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
  custom: (message: string) => toast(message),
  dismiss: (toastId?: string) => toast.dismiss(toastId),
};

export default toast; 