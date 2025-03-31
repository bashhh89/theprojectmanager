'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModelRecommendation {
  id: string;
  name: string;
  score: number;
  reason: string;
}

interface RecommendationResponse {
  recommendations: ModelRecommendation[];
  prompt: string;
  detectedFeatures: string[];
}

interface RecommendationsProps {
  systemPrompt: string;
  onSelectModel: (modelId: string) => void;
  className?: string;
}

export default function ModelRecommendations({ 
  systemPrompt, 
  onSelectModel,
  className = '' 
}: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');

  // Fetch recommendations when the system prompt changes
  useEffect(() => {
    // Skip recommendations for empty prompt
    if (!systemPrompt || systemPrompt.trim().length < 10) {
      setRecommendations([]);
      setFeatures([]);
      return;
    }

    // Skip if this prompt was just analyzed (debounce)
    if (systemPrompt === lastPrompt) return;

    // Clear previous error
    setError(null);
    
    // If the prompt is short, add a small delay to wait for more typing
    const timerId = setTimeout(() => {
      fetchRecommendations(systemPrompt);
    }, 1000); // 1 second delay
    
    return () => clearTimeout(timerId);
  }, [systemPrompt]);

  // Fetch recommendations from the API
  const fetchRecommendations = async (prompt: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/model-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data: RecommendationResponse = await response.json();
      
      setRecommendations(data.recommendations);
      setFeatures(data.detectedFeatures);
      setLastPrompt(prompt);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to fetch recommendations');
      setRecommendations([]);
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  // Convert score to star rating
  const renderStars = (score: number) => {
    const fullStars = Math.floor(score * 5);
    const halfStar = score * 5 - fullStars > 0.25;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-sm ${
            i < fullStars 
              ? 'text-amber-500' 
              : (i === fullStars && halfStar) 
                ? 'text-amber-300' 
                : 'text-gray-300 dark:text-gray-600'
          }`}>
            ★
          </span>
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{(score * 100).toFixed(0)}%</span>
      </div>
    );
  };

  // If no content to show, return nothing
  if (!loading && recommendations.length === 0 && !error) {
    return null;
  }

  return (
    <div className={`mt-4 ${className}`}>
      <h3 className="font-medium mb-2 text-foreground">
        {loading ? 'Analyzing prompt...' : 'Recommended Models'}
      </h3>
      
      {/* Loading state */}
      {loading && (
        <div className="animate-pulse bg-muted h-24 rounded-md dark:bg-gray-800"></div>
      )}
      
      {/* Error state */}
      {error && (
        <Card className="bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </CardContent>
        </Card>
      )}
      
      {/* Recommendations list */}
      {!loading && recommendations.length > 0 && (
        <Card className="dark:border-gray-700">
          {/* Features detected */}
          {features.length > 0 && (
            <CardHeader className="p-2 bg-muted dark:bg-gray-800">
              <CardDescription className="text-xs">
                Detected: {features.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}
              </CardDescription>
            </CardHeader>
          )}
          
          {/* Model recommendations */}
          <CardContent className="p-0 divide-y dark:divide-gray-700">
            {recommendations.map(rec => (
              <div 
                key={rec.id} 
                className="p-3 flex justify-between items-start hover:bg-accent dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => onSelectModel(rec.id)}
              >
                <div>
                  <div className="font-medium">{rec.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{rec.reason}</div>
                  {renderStars(rec.score)}
                </div>
                <Button 
                  variant="secondary"
                  size="sm"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModel(rec.id);
                  }}
                >
                  Select
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 