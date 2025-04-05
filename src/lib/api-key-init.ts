/**
 * API Key Initialization
 * 
 * This script ensures the AnythingLLM API key is properly set
 */

import { setApiKey } from '@/services/anythingLlmService';

export async function initializeApiKey() {
  try {
    // Try to get the API key from env vars
    const apiKey = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;
    
    // If available, set it
    if (apiKey) {
      setApiKey(apiKey);
      console.log('AnythingLLM API key successfully loaded from environment');
      return true;
    } else {
      console.warn('No AnythingLLM API key found in environment variables');
      
      // If not available from env, try localStorage
      if (typeof window !== 'undefined') {
        const savedApiKey = localStorage.getItem('anythingllm_api_key');
        
        if (savedApiKey) {
          setApiKey(savedApiKey);
          console.log('AnythingLLM API key loaded from localStorage');
          return true;
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error initializing AnythingLLM API key:', error);
    return false;
  }
}

// Initialize API key on module load if in browser environment
if (typeof window !== 'undefined') {
  initializeApiKey();
} 