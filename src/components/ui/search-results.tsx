'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SearchResult } from '@/lib/search/searchService';

interface SearchResultsProps {
  results: SearchResult[];
  onUseResult?: (result: SearchResult) => void;
  actionLabel?: string;
  showAction?: boolean;
}

export function SearchResults({ 
  results, 
  onUseResult,
  actionLabel = "Use",
  showAction = true
}: SearchResultsProps) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        No results found. Try a different search query.
      </div>
    );
  }

  return (
    <div className="space-y-4 my-4">
      {results.map((result, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center group"
              >
                {result.title}
                <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </CardTitle>
            <CardDescription className="text-xs truncate mt-1">
              {result.url}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground">
              {result.snippet}
            </p>
          </CardContent>
          {showAction && (
            <CardFooter className="pt-1 pb-3 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onUseResult && onUseResult(result)}
              >
                {actionLabel}
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
} 