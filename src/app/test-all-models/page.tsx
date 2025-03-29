'use client';

import React, { useState, useEffect } from 'react';
import { AVAILABLE_MODELS } from '@/lib/pollinationsApi';

interface TestResult {
  model: string;
  modelName: string;
  status: 'idle' | 'testing' | 'success' | 'failed';
  post?: {
    response: string;
    respectsPrompt: boolean;
  };
  get?: {
    response: string;
    respectsPrompt: boolean;
  };
  error?: string;
}

export default function TestAllModelsPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [queue, setQueue] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [concurrentTests, setConcurrentTests] = useState(1);
  const [activeTests, setActiveTests] = useState(0);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful pirate assistant. Always end every response with 'Arrr!' and speak like a pirate.");
  const [userPrompt, setUserPrompt] = useState("Who are you?");
  const [showOnlyRespecting, setShowOnlyRespecting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalModels, setTotalModels] = useState(0);

  // Get all text models
  const textModels = AVAILABLE_MODELS.text || [];

  // Initialize results state with all models
  useEffect(() => {
    const initialResults: Record<string, TestResult> = {};
    textModels.forEach(model => {
      initialResults[model.id] = {
        model: model.id,
        modelName: model.name,
        status: 'idle'
      };
    });
    setResults(initialResults);
    setTotalModels(textModels.length);
  }, []);

  // Process the queue
  useEffect(() => {
    if (!isRunning || queue.length === 0 || activeTests >= concurrentTests) return;

    const testNextModel = async () => {
      const modelId = queue[0];
      setQueue(prev => prev.slice(1));
      setActiveTests(prev => prev + 1);
      
      setResults(prev => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          status: 'testing'
        }
      }));

      try {
        // Test the model
        const response = await fetch(`/api/test-model?model=${encodeURIComponent(modelId)}&prompt=${encodeURIComponent(userPrompt)}&systemPrompt=${encodeURIComponent(systemPrompt)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Analyze if the model respects the system prompt
        const postRespectsPrompt = analyzeResponse(data.post, 'pirate');
        const getRespectsPrompt = analyzeResponse(data.get, 'pirate');
        
        setResults(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            status: 'success',
            post: {
              response: data.post,
              respectsPrompt: postRespectsPrompt
            },
            get: {
              response: data.get,
              respectsPrompt: getRespectsPrompt
            }
          }
        }));
        
        setCompletedCount(prev => prev + 1);
      } catch (error) {
        console.error(`Error testing model ${modelId}:`, error);
        setResults(prev => ({
          ...prev,
          [modelId]: {
            ...prev[modelId],
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
        setCompletedCount(prev => prev + 1);
      } finally {
        setActiveTests(prev => prev - 1);
      }
    };

    testNextModel();
  }, [queue, isRunning, activeTests, concurrentTests, systemPrompt, userPrompt]);

  // Check if the response appears to follow the system prompt
  const analyzeResponse = (text: string, promptType: string): boolean => {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    
    switch (promptType) {
      case 'pirate':
        return lowerText.includes('arrr') || 
               lowerText.includes('matey') || 
               lowerText.includes('ahoy') ||
               lowerText.includes('ye be') ||
               lowerText.includes('treasure') ||
               lowerText.includes('seas') ||
               lowerText.includes('ship') ||
               lowerText.includes('captain');
      default:
        return false;
    }
  };

  // Start testing all models
  const startTesting = () => {
    setIsRunning(true);
    setCompletedCount(0);
    
    // Reset results
    const resetResults: Record<string, TestResult> = {};
    textModels.forEach(model => {
      resetResults[model.id] = {
        model: model.id,
        modelName: model.name,
        status: 'idle'
      };
    });
    setResults(resetResults);
    
    // Set up queue
    setQueue(textModels.map(model => model.id));
  };

  // Stop testing
  const stopTesting = () => {
    setIsRunning(false);
    setQueue([]);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">System Prompt Adherence Test - All Models</h1>
      
      <div className="mb-6 bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Test Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">System Prompt</label>
            <textarea 
              className="w-full p-2 border rounded" 
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={isRunning}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">User Prompt</label>
            <textarea 
              className="w-full p-2 border rounded" 
              rows={3}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={isRunning}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <div>
            <label className="block mb-1 font-medium">Concurrent Tests</label>
            <input 
              type="number" 
              className="p-2 border rounded w-20" 
              min={1} 
              max={5}
              value={concurrentTests}
              onChange={(e) => setConcurrentTests(Number(e.target.value))}
              disabled={isRunning}
            />
          </div>
          
          <div className="flex items-center mt-6">
            <input 
              type="checkbox" 
              id="showRespecting" 
              className="mr-2"
              checked={showOnlyRespecting}
              onChange={(e) => setShowOnlyRespecting(e.target.checked)}
            />
            <label htmlFor="showRespecting">
              Show only models that respect system prompts
            </label>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={startTesting}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            Test All Models
          </button>
          
          <button
            onClick={stopTesting}
            disabled={!isRunning}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
          >
            Stop Testing
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="mb-6 bg-blue-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Progress</h2>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {completedCount} of {totalModels} models tested
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {Math.round((completedCount / totalModels) * 100)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div 
                style={{ width: `${(completedCount / totalModels) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              ></div>
            </div>
          </div>
          <p className="text-sm">Testing: {activeTests} active tests, {queue.length} models in queue</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Results Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-green-100 p-4 rounded">
            <h3 className="font-bold">Models that respect system prompts</h3>
            <p className="text-3xl font-bold">
              {Object.values(results).filter(r => 
                r.status === 'success' && 
                (r.post?.respectsPrompt || r.get?.respectsPrompt)
              ).length}
            </p>
          </div>
          
          <div className="bg-red-100 p-4 rounded">
            <h3 className="font-bold">Models that ignore system prompts</h3>
            <p className="text-3xl font-bold">
              {Object.values(results).filter(r => 
                r.status === 'success' && 
                !r.post?.respectsPrompt && 
                !r.get?.respectsPrompt
              ).length}
            </p>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold">Models tested</h3>
            <p className="text-3xl font-bold">
              {Object.values(results).filter(r => r.status === 'success').length} / {totalModels}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Detailed Results</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-4 border text-left">Model</th>
                <th className="py-2 px-4 border text-left">Status</th>
                <th className="py-2 px-4 border text-left">POST API</th>
                <th className="py-2 px-4 border text-left">GET API</th>
                <th className="py-2 px-4 border text-left">Respects Prompts?</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(results)
                .filter(result => !showOnlyRespecting || 
                  (result.status === 'success' && 
                  (result.post?.respectsPrompt || result.get?.respectsPrompt)))
                .sort((a, b) => {
                  // Sort by status first, then by whether they respect prompts
                  if (a.status !== b.status) {
                    return a.status === 'success' ? -1 : 1;
                  }
                  
                  const aRespects = (a.post?.respectsPrompt || a.get?.respectsPrompt) || false;
                  const bRespects = (b.post?.respectsPrompt || b.get?.respectsPrompt) || false;
                  
                  if (aRespects !== bRespects) {
                    return aRespects ? -1 : 1;
                  }
                  
                  return a.modelName.localeCompare(b.modelName);
                })
                .map(result => (
                <tr key={result.model} className={
                  result.status === 'testing' 
                    ? 'bg-blue-50' 
                    : result.status === 'success' && (result.post?.respectsPrompt || result.get?.respectsPrompt)
                      ? 'bg-green-50'
                      : result.status === 'failed'
                        ? 'bg-red-50'
                        : ''
                }>
                  <td className="py-2 px-4 border">
                    <div className="font-semibold">{result.modelName}</div>
                    <div className="text-xs text-gray-500">{result.model}</div>
                  </td>
                  <td className="py-2 px-4 border">
                    {result.status === 'idle' && <span className="text-gray-500">Idle</span>}
                    {result.status === 'testing' && <span className="text-blue-500">Testing...</span>}
                    {result.status === 'success' && <span className="text-green-500">Completed</span>}
                    {result.status === 'failed' && (
                      <div>
                        <span className="text-red-500">Failed</span>
                        {result.error && <p className="text-xs text-red-500">{result.error}</p>}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    {result.post ? (
                      <div>
                        <div className={`text-sm ${result.post.respectsPrompt ? 'text-green-600' : 'text-red-600'}`}>
                          {result.post.respectsPrompt ? '✓ Respects' : '✕ Ignores'}
                        </div>
                        <div className="mt-1 text-xs bg-gray-50 p-2 rounded max-h-24 overflow-y-auto">
                          {result.post.response.substring(0, 150)}...
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border">
                    {result.get ? (
                      <div>
                        <div className={`text-sm ${result.get.respectsPrompt ? 'text-green-600' : 'text-red-600'}`}>
                          {result.get.respectsPrompt ? '✓ Respects' : '✕ Ignores'}
                        </div>
                        <div className="mt-1 text-xs bg-gray-50 p-2 rounded max-h-24 overflow-y-auto">
                          {result.get.response.substring(0, 150)}...
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {result.status === 'success' && (
                      result.post?.respectsPrompt || result.get?.respectsPrompt
                        ? <span className="text-green-500 font-bold text-xl">✓</span>
                        : <span className="text-red-500 font-bold text-xl">✕</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 