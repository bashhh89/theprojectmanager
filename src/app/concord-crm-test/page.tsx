'use client';

import { useState } from 'react';

export default function ConcordCRMTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    baseUrl: '',
    apiToken: '',
    query: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Mock response for demo purposes
      // In a real implementation, you would connect to the Concord CRM API
      setTimeout(() => {
        setResult({
          success: true,
          response: `This is a test response for your query: "${formData.query}". 
          In a real implementation, this would fetch data from Concord CRM at ${formData.baseUrl} 
          using your API token and process it with AI.`
        });
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Concord CRM AI Test</h1>
      
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <div>
          <label className="block mb-1">
            CRM URL:
            <input
              type="text"
              name="baseUrl"
              value={formData.baseUrl}
              onChange={handleChange}
              placeholder="https://crm.example.com"
              className="w-full p-1 border"
              required
            />
          </label>
        </div>

        <div>
          <label className="block mb-1">
            API Token:
            <input
              type="password"
              name="apiToken"
              value={formData.apiToken}
              onChange={handleChange}
              className="w-full p-1 border"
              required
            />
          </label>
        </div>

        <div>
          <label className="block mb-1">
            Question:
            <textarea
              name="query"
              value={formData.query}
              onChange={handleChange}
              placeholder="What are my top deals?"
              className="w-full p-1 border"
              rows={2}
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-2 py-1 rounded"
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-2 mb-2">
          <p>Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 p-2">
          <h2 className="font-bold">Response:</h2>
          <p>{result.response}</p>
        </div>
      )}
    </div>
  );
} 