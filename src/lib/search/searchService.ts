/**
 * Search service using Serper.dev API
 * 
 * This service provides web search functionality with caching
 * to minimize API calls and reduce costs.
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  position?: number;
}

interface SearchOptions {
  limit?: number;
  cacheResults?: boolean;
}

const defaultOptions: SearchOptions = {
  limit: 5,
  cacheResults: true
};

// Simple in-memory cache
const searchCache = new Map<string, {results: SearchResult[], timestamp: number}>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Search the web using Serper.dev API
 */
export const searchWeb = async (
  query: string, 
  options: SearchOptions = defaultOptions
): Promise<SearchResult[]> => {
  const cacheKey = `${query}-${options.limit}`;
  
  // Check cache first if enabled
  if (options.cacheResults) {
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`Using cached results for: ${query}`);
      return cached.results;
    }
  }
  
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: options.limit
      })
    });
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.organic || !Array.isArray(data.organic)) {
      console.error('Unexpected response format from Serper.dev:', data);
      return [];
    }
    
    const results = data.organic.map((item: any, index: number) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      source: 'google',
      position: index + 1
    }));
    
    // Cache results if enabled
    if (options.cacheResults) {
      searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
    }
    
    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

// Helper for React Server Components
export const cachedSearchWeb = cache(searchWeb);

// Import cache for React Server Components
import { cache } from 'react'; 