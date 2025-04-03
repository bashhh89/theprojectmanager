'use client';

import React from 'react';
import { toast } from './use-toast';

// Standardized toast function that provides consistent behavior across the app
export const showToast = ({ 
  title,
  description, 
  variant = "default",
  duration = 5000
}: { 
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}) => {
  return toast({
    title,
    description,
    variant,
    duration
  });
};

// Create a toasts object with convenience methods
export const toasts = {
  success: (message: string, description?: string) => 
    showToast({ title: message, description, variant: "default", duration: 5000 }),
    
  error: (message: string, description?: string) =>
    showToast({ title: message, description, variant: "destructive", duration: 5000 })
};

// Export the original toast function as well for backward compatibility
export { toast } from './use-toast'; 