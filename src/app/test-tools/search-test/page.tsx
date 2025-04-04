'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchBar } from '@/components/ui/search-bar';
import { SearchResults } from '@/components/ui/search-results';
import type { SearchResult } from '@/lib/search/searchService';

export default function SearchTestPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedResults, setSavedResults] = useState<SearchResult[]>([]);
  const [selectedTab, setSelectedTab] = useState('search');

  const handleSaveResult = (result: SearchResult) => {
    if (!savedResults.some(r => r.url === result.url)) {
      setSavedResults([...savedResults, result]);
    }
  };

  const handleRemoveSaved = (url: string) => {
    setSavedResults(savedResults.filter(r => r.url !== url));
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Integration Test</CardTitle>
          <CardDescription>
            Test the Serper.dev search integration. Search for anything and see the results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchBar 
            onResultsReceived={setSearchResults} 
            placeholder="Search the web..." 
            autoFocus
          />
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Results ({searchResults.length})</TabsTrigger>
          <TabsTrigger value="saved">Saved Results ({savedResults.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <SearchResults 
            results={searchResults} 
            onUseResult={handleSaveResult}
            actionLabel="Save"
          />
        </TabsContent>
        
        <TabsContent value="saved">
          {savedResults.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No saved results yet. Search and save some results.
            </div>
          ) : (
            <SearchResults 
              results={savedResults} 
              onUseResult={(result) => handleRemoveSaved(result.url)}
              actionLabel="Remove"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 