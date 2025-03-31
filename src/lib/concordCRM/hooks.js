'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for managing Concord CRM configuration
 * @returns {Object} - CRM configuration state and handlers
 */
export function useCRMConfig() {
  const [config, setConfig] = useState({
    baseUrl: '',
    apiToken: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = () => {
      const savedConfig = localStorage.getItem('crm_config');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(parsedConfig);
          setIsConfigured(true);
        } catch (error) {
          console.error('Error loading CRM config:', error);
        }
      }
      setIsLoading(false);
    };

    loadConfig();
  }, []);

  // Save configuration
  const saveConfig = useCallback((newConfig) => {
    try {
      // Validate config
      if (!newConfig.baseUrl || !newConfig.apiToken) {
        throw new Error('CRM URL and API token are required');
      }

      // Save to local storage
      localStorage.setItem('crm_config', JSON.stringify(newConfig));
      
      // Update state
      setConfig(newConfig);
      setIsConfigured(true);
      
      return true;
    } catch (error) {
      console.error('Error saving CRM config:', error);
      return false;
    }
  }, []);

  // Clear configuration
  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem('crm_config');
      setConfig({ baseUrl: '', apiToken: '' });
      setIsConfigured(false);
      return true;
    } catch (error) {
      console.error('Error clearing CRM config:', error);
      return false;
    }
  }, []);

  return {
    config,
    isConfigured,
    isLoading,
    saveConfig,
    clearConfig,
    updateConfig: setConfig
  };
}

/**
 * Hook for executing CRM queries
 * @param {Object} config - The CRM configuration
 * @returns {Object} - Query state and execute function
 */
export function useCRMQuery(config) {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Execute query
  const executeQuery = useCallback(async (query) => {
    if (!config.baseUrl || !config.apiToken) {
      const errorMsg = 'CRM is not configured properly. Please provide both URL and API token.';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg
      };
    }

    if (!query) {
      const errorMsg = 'Query cannot be empty';
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg
      };
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Executing CRM query:', query);
      
      const response = await fetch('/api/crm-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          baseUrl: config.baseUrl,
          apiToken: config.apiToken
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Error executing CRM query';
      console.error('CRM query error:', errorMessage);
      setError(errorMessage);
      
      // Return a user-friendly error message
      const userErrorMessage = {
        success: false,
        message: `Sorry, there was an error processing your CRM request: ${errorMessage}`
      };
      setResult(userErrorMessage);
      return userErrorMessage;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  return {
    result,
    isLoading,
    error,
    executeQuery
  };
} 