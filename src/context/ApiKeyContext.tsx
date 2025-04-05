'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface ApiKeyContextType {
  apiKey: string | null;
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
  updateApiKey: (newKey: string) => Promise<boolean>;
}

const ApiKeyContext = createContext<ApiKeyContextType | null>(null);

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to validate API key
  const validateApiKey = async (key: string): Promise<boolean> => {
    try {
      if (!key || key.length < 8) {
        return false;
      }
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
      let key: string | undefined = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || undefined;

      // If not in env vars, try localStorage
      if (!key && typeof window !== 'undefined') {
        const storedKey = localStorage.getItem('anythingllm_api_key');
        key = storedKey || undefined;
      }

      if (key) {
        const valid = await validateApiKey(key);
        setApiKey(key);
        setIsValid(valid);
        if (!valid) {
          setError('Invalid API key');
          toast({
            title: "API Connection Error",
            description: "Invalid AnythingLLM API key",
            variant: "destructive"
          });
        } else {
          toast({
            title: "API Connected",
            description: "Successfully connected to AnythingLLM API",
          });
        }
      } else {
        setApiKey(null);
        setIsValid(false);
        setError('No API key found');
        toast({
          title: "API Connection Error",
          description: "No API key found",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error loading API key:', err);
      setApiKey(null);
      setIsValid(false);
      setError('Error initializing API key');
      toast({
        title: "API Connection Error",
        description: "Failed to initialize API key",
        variant: "destructive"
      });
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
        toast({
          title: "API Key Updated",
          description: "Successfully updated AnythingLLM API key",
        });
        return true;
      } else {
        setError('Invalid API key');
        toast({
          title: "API Connection Error",
          description: "Invalid API key format",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      console.error('Error updating API key:', err);
      setError('Failed to update API key');
      toast({
        title: "API Connection Error",
        description: "Failed to update API key",
        variant: "destructive"
      });
      return false;
    }
  };

  // Load API key on mount
  useEffect(() => {
    loadApiKey();
  }, []);

  return (
    <ApiKeyContext.Provider value={{
      apiKey,
      isLoading,
      isValid,
      error,
      updateApiKey
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
} 