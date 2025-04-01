'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettingsStore } from '@/store/settingsStore';
import { Bot, FlaskConical, Globe, BarChart4, Hammer, Braces, Image as ImageIcon, Mic } from 'lucide-react';

export default function TestToolsDashboard() {
  const router = useRouter();
  const { darkMode, setDarkMode } = useSettingsStore();
  
  // Ensure dark mode is applied
  useEffect(() => {
    if (!darkMode) {
      setDarkMode(true);
    }
    
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, [darkMode, setDarkMode]);

  const tools = [
    {
      id: 'test-playground',
      name: 'Prompt Testing Playground',
      description: 'Test how different models handle system prompts. Identify which models respect your agent personas.',
      icon: <FlaskConical className="h-6 w-6 text-primary" />,
      path: '/test-playground',
      primary: true
    },
    {
      id: 'test-all-models',
      name: 'Model Comparison Tool',
      description: 'Run tests across all available models to compare response quality and capabilities.',
      icon: <BarChart4 className="h-6 w-6 text-primary" />,
      path: '/test-all-models'
    },
    {
      id: 'test-pollinations',
      name: 'Pollinations API Tester',
      description: 'Direct testing of the Pollinations API endpoints and response handling.',
      icon: <Globe className="h-6 w-6 text-primary" />,
      path: '/test-pollinations'
    },
    {
      id: 'image-generator',
      name: 'Image Generator',
      description: 'Test image generation capabilities across different models and prompts.',
      icon: <ImageIcon className="h-6 w-6 text-primary" />,
      path: '/image-generator',
      new: true
    },
    {
      id: 'audio-tts',
      name: 'Audio TTS Tool',
      description: 'Convert text to speech using various voices and test audio generation quality.',
      icon: <Mic className="h-6 w-6 text-primary" />,
      path: '/audio-tts',
      new: true
    },
    {
      id: 'agents',
      name: 'Agent Builder',
      description: 'Create and manage AI agents with customizable personas and knowledge.',
      icon: <Bot className="h-6 w-6 text-primary" />,
      path: '/agents'
    },
    {
      id: 'documentation',
      name: 'API Documentation',
      description: 'View comprehensive documentation for all API endpoints and testing tools.',
      icon: <Braces className="h-6 w-6 text-primary" />,
      path: '/documentation',
      disabled: true
    },
    {
      id: 'custom-tool',
      name: 'Utilities & Tools',
      description: 'Additional utilities for debugging and managing your AI systems.',
      icon: <Hammer className="h-6 w-6 text-primary" />,
      path: '/utilities',
      disabled: true
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl bg-background text-foreground dark:bg-gray-900 dark:text-gray-100">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Agent Testing Toolkit</h1>
        <p className="text-gray-600 dark:text-gray-300">
          A collection of tools for testing and optimizing your AI agents and models
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map(tool => (
          <Card 
            key={tool.id} 
            className={`hover:shadow-md transition-shadow ${tool.primary ? 'border-primary/20' : ''} ${tool.disabled ? 'opacity-60' : ''} ${tool.new ? 'border-green-500/50 dark:border-green-500/30' : ''} dark:border-gray-700 dark:bg-gray-800`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {tool.icon}
                <CardTitle className="text-gray-900 dark:text-white">
                  {tool.name}
                  {tool.new && (
                    <span className="ml-2 text-xs font-medium bg-green-500/20 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5">
                      NEW
                    </span>
                  )}
                </CardTitle>
              </div>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
              <Button
                onClick={() => router.push(tool.path)}
                className="w-full"
                variant={tool.primary ? "default" : "outline"}
                disabled={tool.disabled}
              >
                {tool.disabled ? 'Coming Soon' : 'Open Tool'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="mt-10 dark:border-gray-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">About This Toolkit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300">
            The Agent Testing Toolkit provides a comprehensive suite of tools for testing, debugging, and optimizing your AI assistants.
            Test your system prompts across different models, analyze response patterns, and identify which models best respect agent personas.
            All test results are documented and can be used to improve your agent configurations.
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Need to go back to the main application?
        </p>
        <Button variant="secondary" onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </div>
    </div>
  );
} 