'use client';

import { useState, useEffect } from 'react';

/**
 * Component for integrating CRM queries into chat
 */
export default function CRMQueryComponent({ onResult }) {
  const [crmConfig, setCrmConfig] = useState({
    baseUrl: '',
    apiToken: ''
  });
  const [configured, setConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testQuery, setTestQuery] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('crm_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setCrmConfig(config);
        setConfigured(true);
      } catch (error) {
        console.error('Error loading saved CRM configuration:', error);
      }
    }
  }, []);

  const handleSaveConfig = async () => {
    if (!crmConfig.baseUrl || !crmConfig.apiToken) {
      alert('Please provide both CRM URL and API token.');
      return;
    }

    setIsSaving(true);
    try {
      // Save to local storage
      localStorage.setItem('crm_config', JSON.stringify(crmConfig));
      setConfigured(true);
      alert('CRM configuration saved successfully!');
    } catch (error) {
      console.error('Error saving CRM configuration:', error);
      alert(`Error saving configuration: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestQuery = async () => {
    if (!testQuery) {
      alert('Please enter a test query.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/crm-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testQuery,
          ...crmConfig
        }),
      });

      const result = await response.json();
      setTestResult(result);
      
      // Pass result to parent component if callback exists
      if (onResult && typeof onResult === 'function') {
        onResult(result);
      }
    } catch (error) {
      console.error('Error testing CRM query:', error);
      setTestResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 mb-4">
      <h2 className="text-lg font-semibold mb-3">Concord CRM Integration</h2>
      
      {!configured ? (
        <div className="space-y-3">
          <div>
            <label className="block mb-1 text-sm">
              CRM URL:
              <input
                type="text"
                value={crmConfig.baseUrl}
                onChange={(e) => setCrmConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://crm.example.com"
                className="w-full p-2 border rounded"
              />
            </label>
          </div>
          
          <div>
            <label className="block mb-1 text-sm">
              API Token:
              <input
                type="password"
                value={crmConfig.apiToken}
                onChange={(e) => setCrmConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                className="w-full p-2 border rounded"
              />
            </label>
          </div>
          
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Connected to:</span>
              <div className="font-medium">{crmConfig.baseUrl}</div>
            </div>
            <button
              onClick={() => setConfigured(false)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Change
            </button>
          </div>
          
          <div>
            <label className="block mb-1 text-sm">
              Test a CRM query:
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="e.g., Show me my contacts"
                className="w-full p-2 border rounded"
              />
            </label>
          </div>
          
          <button
            onClick={handleTestQuery}
            disabled={isTesting}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
          >
            {isTesting ? 'Processing...' : 'Test Query'}
          </button>
          
          {testResult && (
            <div className={`mt-3 p-3 rounded ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <div className="font-medium mb-1">
                {testResult.success ? 'Success' : 'Error'}
              </div>
              <div className="whitespace-pre-line">
                {testResult.message}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 