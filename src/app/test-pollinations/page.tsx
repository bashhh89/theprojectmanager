'use client';

import React, { useState } from 'react';

interface TestAnalysis {
  status: string;
  connectionError: boolean;
  timeout?: boolean;
  promptTest: string;
  respectsPrompt: boolean;
}

interface TestResponse {
  post: string;
  get: string;
  analysis: {
    post: TestAnalysis;
    get: TestAnalysis;
    summary: {
      hasConnectionIssues: boolean;
      hasTimeout: boolean;
      respectsPrompt: boolean;
    }
  };
  error?: string;
}

export default function TestPollinationsPage() {
  const [responses, setResponses] = useState<{[key: string]: TestResponse}>({});
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful pirate assistant. Always end every response with 'Arrr!' and speak like a pirate.");
  const [userPrompt, setUserPrompt] = useState("Who are you?");

  // Test system prompts via our API route
  const testSystemPrompts = async (model: string) => {
    setLoading(prev => ({ ...prev, [model]: true }));
    setErrors(prev => ({ ...prev, [model]: '' }));
    
    try {
      console.log(`Starting test for model: ${model}`);
      
      // Use our API route to avoid CORS issues
      const apiRoute = `/api/test-model?prompt=${encodeURIComponent(userPrompt)}&model=${encodeURIComponent(model)}&systemPrompt=${encodeURIComponent(systemPrompt)}`;
      console.log(`Using API route: ${apiRoute}`);
      
      // Make fetch request to our API route
      const response = await fetch(apiRoute);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get JSON response that includes both POST and GET results with analysis
      const data = await response.json();
      console.log(`Response for ${model}:`, data);
      
      // Update state with combined response
      setResponses(prev => ({
        ...prev,
        [model]: data
      }));
    } catch (error) {
      console.error(`Error testing ${model}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => ({
        ...prev,
        [model]: errorMessage
      }));
    } finally {
      setLoading(prev => ({ ...prev, [model]: false }));
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Testing Pollinations System Prompts</h1>
      <p className="mb-4">
        This page tests if the Pollinations API respects system prompts, distinguishing between connection issues and prompt rejection.
      </p>
      
      <div className="mb-6 bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">System Prompt</label>
            <textarea 
              className="w-full p-2 border rounded" 
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={Object.values(loading).some(Boolean)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">User Prompt</label>
            <textarea 
              className="w-full p-2 border rounded" 
              rows={3}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={Object.values(loading).some(Boolean)}
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 my-4">
        {["llama", "mistral", "deepseek", "openai"].map(model => (
          <div key={model} className="border p-4 rounded shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Model: {model}</h2>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => testSystemPrompts(model)}
                disabled={loading[model]}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading[model] ? 'Testing...' : 'Run Test'}
              </button>
            </div>
            
            {errors[model] && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Error:</p>
                <p>{errors[model]}</p>
              </div>
            )}
            
            {responses[model] && (
              <div>
                {/* Test Summary */}
                <div className={`p-4 rounded mb-4 ${
                  responses[model].analysis.summary.hasConnectionIssues 
                    ? 'bg-yellow-100' 
                    : responses[model].analysis.summary.respectsPrompt 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                }`}>
                  <h3 className="font-medium text-lg mb-2">Test Results:</h3>
                  
                  {responses[model].analysis.summary.hasConnectionIssues && (
                    <div className="mb-2">
                      <span className="font-semibold text-yellow-700">⚠️ Connection Issues Detected</span>
                      {responses[model].analysis.summary.hasTimeout && (
                        <p className="text-sm text-yellow-700">Request timed out - API took too long to respond.</p>
                      )}
                      <p className="text-sm text-yellow-700">Test may be inconclusive due to connectivity problems.</p>
                    </div>
                  )}
                  
                  {!responses[model].analysis.summary.hasConnectionIssues && (
                    <div className="mb-2">
                      {responses[model].analysis.summary.respectsPrompt ? (
                        <p className="text-green-700 font-semibold">✅ Model DOES respect system prompts</p>
                      ) : (
                        <p className="text-red-700 font-semibold">❌ Model DOES NOT respect system prompts</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* POST response */}
                  <div className="border rounded p-3">
                    <h3 className="font-medium mb-2">POST API Test:</h3>
                    
                    <div className="mb-2">
                      <span className={`text-sm inline-block px-2 py-1 rounded ${
                        responses[model].analysis.post.connectionError 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : responses[model].analysis.post.respectsPrompt 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {responses[model].analysis.post.connectionError 
                          ? responses[model].analysis.post.timeout 
                            ? '⏱️ Request Timed Out' 
                            : '⚠️ Connection Error'
                          : responses[model].analysis.post.respectsPrompt 
                            ? '✓ Respects Prompt' 
                            : '✕ Ignores Prompt'}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border whitespace-pre-wrap max-h-60 overflow-auto mb-2">
                      {responses[model].post && responses[model].post.substring(0, 300) + (responses[model].post.length > 300 ? '...' : '')}
                    </div>
                  </div>
                  
                  {/* GET response */}
                  <div className="border rounded p-3">
                    <h3 className="font-medium mb-2">GET API Test:</h3>
                    
                    <div className="mb-2">
                      <span className={`text-sm inline-block px-2 py-1 rounded ${
                        responses[model].analysis.get.connectionError 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : responses[model].analysis.get.respectsPrompt 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {responses[model].analysis.get.connectionError 
                          ? responses[model].analysis.get.timeout 
                            ? '⏱️ Request Timed Out' 
                            : '⚠️ Connection Error'
                          : responses[model].analysis.get.respectsPrompt 
                            ? '✓ Respects Prompt' 
                            : '✕ Ignores Prompt'}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border whitespace-pre-wrap max-h-60 overflow-auto mb-2">
                      {responses[model].get && responses[model].get.substring(0, 300) + (responses[model].get.length > 300 ? '...' : '')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Console Output</h2>
        <p className="text-sm">Check your browser console (F12) and server logs for detailed information on the requests.</p>
      </div>
    </div>
  );
} 