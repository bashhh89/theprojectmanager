"use client"

import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
        className: 'dark:bg-gray-800 dark:text-white border dark:border-gray-700',
      }}
    />
  );
}

// Helper functions to show toasts
import { toast } from 'sonner';

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
  });
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
  });
};

export const showInfo = (message: string) => {
  toast.info(message, {
    duration: 3000,
  });
};