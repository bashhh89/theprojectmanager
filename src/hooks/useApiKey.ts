'use client';

import { useState, useEffect } from 'react';

interface UseApiKeyReturn {
  apiKey: string | null;
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
  updateApiKey: (newKey: string) => Promise<boolean>;
}

export function useApiKey(): UseApiKeyReturn {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to validate API key
  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      // Simple validation - check if key exists and has reasonable length
      if (!key || key.length < 8) {
        return false;
      }
      
      // You can add more validation here if needed
      return true;
    } catch (err) {
      console.error('Error validating API key:', err);
      return false;
    }
  };

  // Function to load API key
  const loadApiKey = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First try to get from environment variables
      let key: string | undefined = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;

      // If not in env vars, try localStorage
      if (!key && typeof window !== 'undefined') {
        key = localStorage.getItem('anythingllm_api_key') || undefined;
      }

      if (key) {
        const valid = await validateApiKey(key);
        setApiKey(key);
        setIsValid(valid);
        if (!valid) {
          setError('Invalid API key');
        }
      } else {
        setApiKey(null);
        setIsValid(false);
        setError('No API key found');
      }
    } catch (err) {
      console.error('Error loading API key:', err);
      setApiKey(null);
      setIsValid(false);
      setError('Error initializing API key');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update API key
  const updateApiKey = async (newKey: string): Promise<boolean> => {
    try {
      const valid = await validateApiKey(newKey);
      
      if (valid) {
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('anythingllm_api_key', newKey);
        }
        
        setApiKey(newKey);
        setIsValid(true);
        setError(null);
        return true;
      } else {
        setError('Invalid API key');
        return false;
      }
    } catch (err) {
      console.error('Error updating API key:', err);
      setError('Failed to update API key');
      return false;
    }
  };

  // Load API key on mount
  useEffect(() => {
    loadApiKey();
  }, []);

  return {
    apiKey,
    isLoading,
    isValid,
    error,
    updateApiKey
  };
} 