'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';

// Dynamically import the AnythingLLM component to prevent server-side errors
const AnythingLLMChatDynamic = dynamic(
  () => import('@/components/ai-agent/anythingllm-chat').then(mod => ({ default: mod.default })),
  { 
    loading: () => <div className="p-8 text-center">Loading AnythingLLM interface...</div>,
    ssr: false
  }
);

export default function SafeAnythingLLM() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-500">AnythingLLM Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            There was an error loading the AnythingLLM component. This might be due to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>AnythingLLM desktop application not running</li>
            <li>API key not configured properly</li>
            <li>Connection issues to the AnythingLLM server</li>
          </ul>
          <Button onClick={() => setHasError(false)}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full">
      <React.Suspense fallback={<div className="p-8 text-center">Loading AnythingLLM interface...</div>}>
        <ErrorBoundary onError={() => setHasError(true)}>
          <AnythingLLMChatDynamic />
        </ErrorBoundary>
      </React.Suspense>
    </div>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: () => void;
}> {
  componentDidCatch(error: Error) {
    console.error('AnythingLLM component error:', error);
    this.props.onError();
  }

  render() {
    return this.props.children;
  }
} 