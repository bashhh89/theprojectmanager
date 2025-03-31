'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCRMConfig, useCRMQuery } from '@/lib/concordCRM/hooks';

/**
 * Enhances the chat interface with CRM capabilities
 */
export default function CRMChatEnhancer({ onMessageSend, messageHistory = [] }) {
  const { config, isConfigured, saveConfig, updateConfig } = useCRMConfig();
  const { executeQuery, isLoading, result } = useCRMQuery(config);
  const [showConfig, setShowConfig] = useState(!isConfigured);
  const [inputMessage, setInputMessage] = useState('');
  const [isCRMCommand, setIsCRMCommand] = useState(false);
  
  // Check if message looks like a CRM command
  useEffect(() => {
    const crmKeywords = [
      'contact', 'deal', 'activity', 
      'show', 'find', 'get', 'list',
      'create', 'add', 'update', 'delete',
      'crm'
    ];
    
    const lowerInput = inputMessage.toLowerCase();
    const containsCRMKeyword = crmKeywords.some(keyword => 
      lowerInput.includes(keyword)
    );
    
    setIsCRMCommand(containsCRMKeyword);
  }, [inputMessage]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // If it looks like a CRM command and we're configured, process it
    if (isCRMCommand && isConfigured) {
      const crmResult = await executeQuery(inputMessage);
      
      // Only pass to chat if we have a result to show
      if (crmResult) {
        // Call the parent's onMessageSend with the CRM result included
        onMessageSend(inputMessage, {
          type: 'crm_result',
          data: crmResult
        });
      }
    } else {
      // Regular chat message
      onMessageSend(inputMessage);
    }
    
    // Clear input
    setInputMessage('');
  }, [inputMessage, isCRMCommand, isConfigured, executeQuery, onMessageSend]);
  
  // Handle configuration save
  const handleSaveConfig = useCallback(() => {
    if (saveConfig(config)) {
      setShowConfig(false);
    } else {
      alert('Failed to save configuration. Please ensure all fields are filled out correctly.');
    }
  }, [config, saveConfig]);
  
  return (
    <div className="mt-4">
      {showConfig && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-2">Configure Concord CRM</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">
                CRM URL:
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => updateConfig({ ...config, baseUrl: e.target.value })}
                  placeholder="https://crm.example.com"
                  className="w-full p-2 border rounded"
                />
              </label>
            </div>
            
            <div>
              <label className="block text-sm mb-1">
                API Token:
                <input
                  type="password"
                  value={config.apiToken}
                  onChange={(e) => updateConfig({ ...config, apiToken: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSaveConfig}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              >
                Save
              </button>
              
              {isConfigured && (
                <button
                  onClick={() => setShowConfig(false)}
                  className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {isConfigured && !showConfig && (
        <div className="flex items-center mb-2">
          <div className="flex-1">
            <span className="text-xs text-green-600 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              Connected to Concord CRM
            </span>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="text-xs text-blue-500 hover:underline"
          >
            Configure
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={isConfigured ? "Type a message or CRM command..." : "Type a message..."}
          className={`flex-1 p-2 border rounded-l ${isCRMCommand && isConfigured ? 'bg-blue-50' : ''}`}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
      
      {isCRMCommand && isConfigured && (
        <div className="mt-1 text-xs text-blue-600">
          This looks like a CRM command. It will be processed by Concord CRM.
        </div>
      )}
      
      {!isConfigured && !showConfig && (
        <div className="mt-2">
          <button
            onClick={() => setShowConfig(true)}
            className="text-sm text-blue-500 hover:underline"
          >
            Connect to Concord CRM to enable CRM commands
          </button>
        </div>
      )}
    </div>
  );
} 