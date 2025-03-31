/**
 * AnythingLLM Configuration
 * 
 * This file contains configuration for the AnythingLLM integration.
 */

// Get the AnythingLLM configuration from environment variables
export const ANYTHINGLLM_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_ANYTHINGLLM_BASE_URL || '',
  apiKey: process.env.ANYTHINGLLM_API_KEY || '',
  isEnabled: Boolean(
    process.env.NEXT_PUBLIC_ANYTHINGLLM_BASE_URL && 
    process.env.ANYTHINGLLM_API_KEY
  ),
  similarity: {
    threshold: parseFloat(process.env.ANYTHINGLLM_SIMILARITY_THRESHOLD || '0.7'),
    maxResults: parseInt(process.env.ANYTHINGLLM_MAX_RESULTS || '5', 10)
  },
  history: {
    messageCount: parseInt(process.env.ANYTHINGLLM_HISTORY_MESSAGE_COUNT || '20', 10)
  },
  supportedDocumentTypes: ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv']
};

// Helper to validate a file type is supported
export function isDocumentTypeSupported(fileName: string): boolean {
  if (!fileName) return false;
  
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return ANYTHINGLLM_CONFIG.supportedDocumentTypes.includes(extension);
} 