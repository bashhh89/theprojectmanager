'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import type { SearchResult } from '@/lib/search/searchService';

interface SearchBarProps {
  onResultsReceived?: (results: SearchResult[]) => void;
  placeholder?: string;
  buttonText?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({ 
  onResultsReceived, 
  placeholder = "Search the web...",
  buttonText = "Search",
  autoFocus = false,
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit: 10 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Search failed');
      }
      
      const data = await response.json();
      
      if (onResultsReceived) {
        onResultsReceived(data.results);
      }
    } catch (error: any) {
      console.error('Search failed:', error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className={`flex w-full items-center space-x-2 ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        disabled={isSearching}
        autoFocus={autoFocus}
        className="flex-1"
      />
      <Button 
        onClick={handleSearch}
        disabled={isSearching || !query.trim()}
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Search className="h-4 w-4 mr-2" />
        )}
        {buttonText}
      </Button>
    </div>
  );
} 