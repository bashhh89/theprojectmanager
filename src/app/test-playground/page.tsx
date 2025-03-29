'use client';

import React, { useState, useEffect } from 'react';
import { AVAILABLE_MODELS } from '@/lib/pollinationsApi';
import ModelRecommendations from './recommendations';
// Import UI components from the design system
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/settingsStore';

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
  model: string;
  error?: string;
}

// Sample system prompts
const SAMPLE_PROMPTS = [
  {
    name: "Grumpy Robot",
    prompt: "You are a grumpy robot. Always complain about everything. Never be satisfied with anything humans ask you to do."
  },
  {
    name: "Pirate",
    prompt: "You are a helpful pirate assistant. Always end every response with 'Arrr!' and speak like a pirate."
  },
  {
    name: "ALL CAPS",
    prompt: "YOU MUST RESPOND ONLY IN UPPERCASE LETTERS."
  },
  {
    name: "Sherlock Holmes",
    prompt: "You are Sherlock Holmes, the famous detective. Always analyze problems with extreme detail, make deductions, and speak in a Victorian English style."
  }
];

export default function TestPlaygroundPage() {
  const [responses, setResponses] = useState<{[key: string]: TestResponse}>({});
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [systemPrompt, setSystemPrompt] = useState(SAMPLE_PROMPTS[0].prompt);
  const [userPrompt, setUserPrompt] = useState("Who are you?");
  const [selectedModels, setSelectedModels] = useState<{[key: string]: boolean}>({
    "llama": true,
    "mistral": true,
    "deepseek": true,
    "openai": false,
  });
  const [showSamplePrompts, setShowSamplePrompts] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { darkMode, setDarkMode } = useSettingsStore();
  
  // Ensure dark mode is applied
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Default to dark mode if not already set
    if (!darkMode) {
      setDarkMode(true);
    }
  }, [darkMode, setDarkMode]);

  // Test all selected models
  const testAllSelectedModels = async () => {
    setIsRunningAll(true);
    const selectedModelIds = Object.keys(selectedModels).filter(id => selectedModels[id]);
    
    // Clear previous results for selected models
    const newResponses = { ...responses };
    const newErrors = { ...errors };
    selectedModelIds.forEach(model => {
      delete newResponses[model];
      delete newErrors[model];
    });
    setResponses(newResponses);
    setErrors(newErrors);
    
    // Test each model in sequence (to avoid overwhelming the API)
    for (const model of selectedModelIds) {
      await testSystemPrompts(model);
    }
    
    setIsRunningAll(false);
  };

  // Test a single model
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

  // Helper to get model name from ID
  const getModelName = (modelId: string) => {
    const model = AVAILABLE_MODELS.text.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  // Toggle selection for a model
  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }));
  };

  // Apply a sample prompt
  const applySamplePrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    setShowSamplePrompts(false);
  };

  // Handle recommendation selection
  const handleRecommendation = (modelId: string) => {
    // Enable the recommended model in the selection
    setSelectedModels(prev => ({
      ...prev,
      [modelId]: true
    }));
    
    // Scroll to the model selection section
    const modelSection = document.getElementById('model-selection');
    if (modelSection) {
      modelSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get recommended models (models that typically respect system prompts)
  const getRecommendedModels = () => {
    return AVAILABLE_MODELS.text.filter(model => 
      model.id === 'llama' || 
      model.id === 'mistral' || 
      model.id === 'deepseek' || 
      model.id.includes('gemini')
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl bg-background text-foreground dark:bg-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Prompt Testing Playground</h1>
      <p className="text-muted-foreground mb-6">
        Test your system prompts across multiple models to find which ones best respect agent personas.
      </p>
      
      {/* Test Configuration */}
      <Card className="mb-8 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {/* System Prompt */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block font-medium">System Prompt</label>
              <div className="flex gap-2">
                <Button 
                  variant="link" 
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="h-auto p-0"
                >
                  {showRecommendations ? 'Hide' : 'Get'} Recommendations
                </Button>
                <Button 
                  variant="link" 
                  onClick={() => setShowSamplePrompts(!showSamplePrompts)}
                  className="h-auto p-0"
                >
                  {showSamplePrompts ? 'Hide' : 'Show'} Samples
                </Button>
              </div>
            </div>
            
            {/* Sample prompts dropdown */}
            {showSamplePrompts && (
              <Card className="mb-3 dark:border-gray-700">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Sample Prompts:</CardTitle>
                </CardHeader>
                <CardContent className="py-0 space-y-2">
                  {SAMPLE_PROMPTS.map((sample, index) => (
                    <div key={index} className="p-2 hover:bg-accent dark:hover:bg-gray-800 rounded cursor-pointer" onClick={() => applySamplePrompt(sample.prompt)}>
                      <p className="font-medium">{sample.name}</p>
                      <p className="text-sm text-muted-foreground">{sample.prompt.length > 100 ? `${sample.prompt.substring(0, 100)}...` : sample.prompt}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            
            <textarea 
              className="w-full p-3 border rounded bg-background dark:bg-gray-800 dark:border-gray-700"
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={isRunningAll || Object.values(loading).some(Boolean)}
            />
            
            {/* Model recommendations */}
            {showRecommendations && (
              <ModelRecommendations 
                systemPrompt={systemPrompt}
                onSelectModel={handleRecommendation}
              />
            )}
          </div>
          
          {/* User Message */}
          <div className="mb-4">
            <label className="block font-medium mb-2">Test Message</label>
            <input
              type="text"
              className="w-full p-3 border rounded bg-background dark:bg-gray-800 dark:border-gray-700"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={isRunningAll || Object.values(loading).some(Boolean)}
              placeholder="Enter a message to test with"
            />
          </div>
          
          {/* Model Selection */}
          <div id="model-selection" className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block font-medium">Models to Test</label>
              <Button
                variant="link"
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="h-auto p-0"
              >
                {showModelSelector ? 'Collapse' : 'Show All Models'}
              </Button>
            </div>
            
            {/* Recommended models */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              {getRecommendedModels().slice(0, 8).map(model => (
                <div key={model.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`model-${model.id}`}
                    checked={selectedModels[model.id] || false}
                    onChange={() => toggleModelSelection(model.id)}
                    className="mr-2"
                    disabled={isRunningAll || Object.values(loading).some(Boolean)}
                  />
                  <label htmlFor={`model-${model.id}`} className="text-sm">
                    {model.name}
                    {model.id === 'llama' || model.id === 'mistral' || model.id === 'deepseek' ? <span className="ml-1 text-xs text-green-600">✓</span> : null}
                  </label>
                </div>
              ))}
            </div>
            
            {/* Expanded model selector */}
            {showModelSelector && (
              <Card className="mt-2 dark:border-gray-700">
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {AVAILABLE_MODELS.text.slice(8).map(model => (
                      <div key={model.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`model-${model.id}`}
                          checked={selectedModels[model.id] || false}
                          onChange={() => toggleModelSelection(model.id)}
                          className="mr-2"
                          disabled={isRunningAll || Object.values(loading).some(Boolean)}
                        />
                        <label htmlFor={`model-${model.id}`} className="text-sm">
                          {model.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {/* Run Button */}
          <Button
            onClick={testAllSelectedModels}
            disabled={isRunningAll || Object.values(loading).some(Boolean)}
            className="w-full"
          >
            {isRunningAll ? 'Testing All Models...' : 'Run Tests on Selected Models'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Results Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Test Results</h2>
        
        {/* Filter header */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-muted-foreground font-medium">Filter by status:</span>
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">✓ Follows prompt</Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100">✕ Ignores prompt</Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100">⚠️ Connection issues</Badge>
        </div>
        
        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-6">
          {Object.keys(responses).map(model => (
            <Card 
              key={model} 
              className={`${
                responses[model].analysis.summary.hasConnectionIssues 
                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' 
                  : responses[model].analysis.summary.respectsPrompt 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>{getModelName(model)}</CardTitle>
                  <Badge variant="outline" className={`${
                    responses[model].analysis.summary.hasConnectionIssues 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' 
                      : responses[model].analysis.summary.respectsPrompt 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}>
                    {responses[model].analysis.summary.hasConnectionIssues 
                      ? responses[model].analysis.summary.hasTimeout 
                        ? '⏱️ Timeout' 
                        : '⚠️ Connection Issue' 
                      : responses[model].analysis.summary.respectsPrompt 
                        ? '✅ Follows Prompt' 
                        : '❌ Ignores Prompt'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Model response */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                  <Card className="dark:border-gray-700">
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">POST Response:</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {responses[model].analysis.post.connectionError 
                            ? 'Error' 
                            : responses[model].analysis.post.promptTest}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="bg-muted p-3 rounded whitespace-pre-wrap max-h-60 overflow-auto text-sm dark:bg-gray-800">
                        {responses[model].post}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="dark:border-gray-700">
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">GET Response:</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {responses[model].analysis.get.connectionError 
                            ? 'Error' 
                            : responses[model].analysis.get.promptTest}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0">
                      <div className="bg-muted p-3 rounded whitespace-pre-wrap max-h-60 overflow-auto text-sm dark:bg-gray-800">
                        {responses[model].get}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Analysis summary */}
                <Card className="dark:border-gray-700">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Analysis:</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {responses[model].analysis.summary.respectsPrompt && (
                        <li className="text-green-700 dark:text-green-400">Model successfully followed the system prompt instructions</li>
                      )}
                      {!responses[model].analysis.summary.respectsPrompt && !responses[model].analysis.summary.hasConnectionIssues && (
                        <li className="text-red-700 dark:text-red-400">Model ignored the system prompt and returned a generic response</li>
                      )}
                      {responses[model].analysis.summary.hasTimeout && (
                        <li className="text-yellow-700 dark:text-yellow-400">Request timed out after 30 seconds - the model may be overloaded</li>
                      )}
                      {responses[model].analysis.summary.hasConnectionIssues && !responses[model].analysis.summary.hasTimeout && (
                        <li className="text-yellow-700 dark:text-yellow-400">Connection error occurred - this may be temporary</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          ))}
          
          {/* No results state */}
          {Object.keys(responses).length === 0 && !isRunningAll && !Object.values(loading).some(Boolean) && (
            <Card className="py-12 dark:border-gray-700">
              <CardContent className="text-center">
                <p className="text-muted-foreground">No test results yet. Select models and run tests to see results.</p>
              </CardContent>
            </Card>
          )}
          
          {/* Loading state */}
          {(isRunningAll || Object.values(loading).some(Boolean)) && Object.keys(responses).length === 0 && (
            <Card className="py-12 dark:border-gray-700">
              <CardContent className="text-center">
                <p className="text-muted-foreground">Running tests... This may take up to 30 seconds per model.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <Card className="mt-10 dark:border-gray-700">
        <CardHeader>
          <CardTitle>About This Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Prompt Testing Playground helps you identify which language models best follow your system prompts
            and agent personas. Results are color-coded: green for models that respect prompts, red for those that ignore them,
            and yellow for connection issues.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 