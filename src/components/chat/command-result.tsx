'use client';

import React from 'react';
import { PromptExecutionResult, SearchResult } from '@/types/prompts';
import { Markdown } from '@/components/ui/markdown';
import { cn } from '@/lib/utils';
import { ExternalLink } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface CommandResultProps {
  result: PromptExecutionResult;
  className?: string;
}

export function CommandResult({ result, className }: CommandResultProps) {
  if (!result.success) {
    return (
      <div className={cn('text-destructive text-sm', className)}>
        {result.error || 'Command failed'}
      </div>
    );
  }

  // Handle image generation results
  if (result.metadata?.type === 'image') {
    return (
      <div className={cn('space-y-2', className)}>
        {result.content && (
          <p className="text-sm text-muted-foreground">{result.content}</p>
        )}
        <div className="relative aspect-square w-full max-w-[300px] rounded-lg border bg-muted">
          {result.metadata.imageUrl ? (
            <img
              src={result.metadata.imageUrl}
              alt={result.content || 'Generated image'}
              className="absolute inset-0 h-full w-full object-cover rounded-lg"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Image placeholder</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle code generation results
  if (result.metadata?.type === 'code') {
    return (
      <div className={cn('space-y-2', className)}>
        {result.content && (
          <Markdown
            content={`\`\`\`${result.metadata.language || ''}\n${result.content}\n\`\`\``}
          />
        )}
      </div>
    );
  }

  // Handle summary generation results
  if (result.metadata?.type === 'summary') {
    return (
      <div className={cn('space-y-2', className)}>
        {result.metadata.title && (
          <h3 className="text-lg font-semibold">{result.metadata.title}</h3>
        )}
        {result.content && <Markdown content={result.content} />}
        {result.metadata.keyPoints && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Key Points:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {result.metadata.keyPoints.map((point: string, index: number) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Handle search results specially
  if (result.isSearchResult && result.searchResults) {
    return (
      <div className="mt-2 mb-4">
        <h3 className="text-lg font-semibold mb-3">Search results for: "{result.searchQuery}"</h3>
        <div className="space-y-3">
          {result.searchResults.slice(0, 5).map((item: SearchResult, index: number) => (
            <Card key={index} className="overflow-hidden bg-muted/50 border-muted">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm font-medium">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center group"
                  >
                    {item.title}
                    <ExternalLink className="h-3 w-3 ml-1 opacity-70 group-hover:opacity-100" />
                  </a>
                </CardTitle>
                <CardDescription className="text-xs truncate mt-0.5">
                  {item.url}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  {item.snippet}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {result.searchResults.length > 5 && (
          <div className="text-xs text-muted-foreground mt-2">
            Showing top 5 of {result.searchResults.length} results
          </div>
        )}
      </div>
    );
  }

  // Default rendering for text content
  return (
    <div className={className}>
      <Markdown content={result.content} />
    </div>
  );
} 