# QanDu AI Web Search Integration

This document outlines the integration of real-time web search capabilities into the QanDu AI platform using Serper.dev's API.

## Overview

The search integration allows QanDu to access up-to-date information from the web, enhancing AI responses and providing users with current data for research, content creation, and decision-making.

## Setup Instructions

### 1. Register for Serper.dev API

1. Go to [Serper.dev](https://serper.dev) and create an account
2. After signing up, navigate to your dashboard to get your API key
3. The free tier includes 100 searches per month

### 2. Configure Environment Variables

Add your Serper.dev API key to your `.env.local` file:

```
SERPER_API_KEY=your_api_key_here
```

### 3. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/test-tools/search-test`
3. Try searching for something to verify the integration works

## Implementation Details

### Key Components

1. **Search Service** (`/src/lib/search/searchService.ts`):
   - Core service for handling search requests
   - In-memory caching to reduce API calls
   - Error handling and response formatting

2. **Search API Endpoint** (`/src/app/api/search/route.ts`):
   - Next.js API route that processes search requests
   - Input validation and error handling
   - Forwards requests to Serper.dev

3. **Search UI Components**:
   - `SearchBar`: Reusable component for search input
   - `SearchResults`: Display component for search results

### Integration Points

#### Chat Module Integration

The search functionality can be integrated with the Chat module by:

1. Adding a `/search` command to the chat input
2. Using search results to enhance AI responses with current information
3. Implementing a sidebar search panel for research while chatting

Example implementation:

```typescript
// Add to chat input handler
if (userInput.startsWith('/search ')) {
  const query = userInput.replace('/search ', '');
  handleSearchCommand(query);
  return;
}

// Function to handle search commands
const handleSearchCommand = async (query: string) => {
  try {
    // Call the search API
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    // Format results for chat
    const formattedResults = data.results.map(r => 
      `[${r.title}](${r.url})\n${r.snippet}`
    ).join('\n\n');
    
    // Add search results to conversation
    const searchMessage = {
      role: 'system',
      content: `Search results for "${query}":\n\n${formattedResults}\n\nUse these search results to inform your response.`
    };
    
    // Your existing code to add the message and generate AI response
    // ...
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

#### Projects Module Integration

Add a research panel to the Projects module:

1. Create a new tab or sidebar for project research
2. Allow saving search results to project notes
3. Implement project-context-aware search suggestions

#### Products Module Integration

Enhance the Products module with:

1. Competitive analysis through web search
2. Market research capabilities
3. Feature comparison with similar products

## Cost Considerations

- Serper.dev Free Tier: 100 searches/month
- Serper.dev Basic Plan: $49/month for 5,000 searches
- Implement aggressive caching to minimize API calls
- Consider batch-searching for frequently needed data

## Future Enhancements

### Short Term

1. Implement a more robust caching system (Redis or similar)
2. Add search result filtering options
3. Improve search result presentation with snippets and metadata

### Medium Term

1. Implement search result summarization using AI
2. Add image search capabilities
3. Create specialized search modes (news, academic, etc.)

### Long Term

1. Evaluate building a custom search crawler for specific domains
2. Consider alternative search providers like Brave Search API
3. Implement a federated search across multiple sources

## Troubleshooting

### Common Issues

1. **Search API Not Responding**:
   - Check that `SERPER_API_KEY` is properly set in your environment
   - Verify you have remaining quota on your Serper.dev account

2. **Rate Limiting**:
   - Implement exponential backoff for retry logic
   - Monitor usage and adjust caching strategy

3. **Search Results Not Relevant**:
   - Improve query construction with AI assistance
   - Add domain-specific filters to target relevant sources

## Conclusion

This search integration provides QanDu with real-time access to web information, significantly enhancing the platform's capabilities across all modules. The implementation is designed to be cost-effective, with built-in caching and a focus on efficiency. 