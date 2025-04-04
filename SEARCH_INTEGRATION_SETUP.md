# QanDu AI Search Integration Setup Guide

This guide outlines how to set up and test the new search functionality added to QanDu AI.

## Setup Steps

### 1. Register for a Serper.dev API Key

1. Go to [Serper.dev](https://serper.dev/) and sign up for an account
2. After registration, navigate to your dashboard to get your API key
3. The free tier includes 100 searches per month, which is sufficient for testing

### 2. Configure Environment Variables

Add your Serper.dev API key to your `.env.local` file:

```
SERPER_API_KEY=your_api_key_here
```

### 3. Start Your Development Server

```bash
npm run dev
```

## Testing the Search Functionality

### Option 1: Using the Test Page

1. Navigate to: `http://localhost:3000/test-tools/search-test`
2. Try searching for various topics
3. Test saving and organizing search results

### Option 2: Using the Chat Interface

1. Navigate to: `http://localhost:3000/chat`
2. Use the `/search` command in the chat input:
   * Type: `/search artificial intelligence trends 2024`
   * Press Enter
3. You should see search results displayed in a nicely formatted card layout

## Implementation Details

We've implemented search functionality using Serper.dev's API, which provides access to Google search results:

1. **Search Service** (`src/lib/search/searchService.ts`):
   * Handles API requests to Serper.dev
   * Provides caching to minimize API calls
   * Transforms response data to a standard format

2. **Search API** (`src/app/api/search/route.ts`):
   * Next.js API route for handling search requests
   * Validates input and manages errors
   * Secures API key access

3. **UI Components**:
   * `SearchBar`: Reusable search input component
   * `SearchResults`: Display component for search results
   * `CommandResult`: Enhanced to handle search results in chat

4. **Chat Integration**:
   * Added `/search` command to the prompt system
   * Formatted search results for chat display
   * Customized result presentation

## How It Works

1. When a user enters a `/search` command in chat, it's captured by the command system
2. The search query is sent to our `/api/search` API endpoint
3. The endpoint calls Serper.dev with the query
4. Results are formatted and returned to the chat interface
5. Specialized UI components render the search results in a user-friendly format

## Limitations & Considerations

1. **API Usage Limits**:
   * The free tier of Serper.dev is limited to 100 searches per month
   * We've implemented caching to maximize efficiency

2. **Rate Limiting**:
   * Serper.dev may rate limit excessive requests
   * Our implementation includes error handling for this scenario

3. **Result Quality**:
   * Search quality depends on Serper.dev's capabilities
   * More specific search queries yield better results

## Future Enhancements

Once you're satisfied with the basic implementation, consider these enhancements:

1. **AI Search Summarization**:
   * Add an option to summarize search results using AI
   * Create a `/summarize-search` command

2. **Domain-Specific Searches**:
   * Add filters for news, academic, or specific websites
   * Create commands like `/news-search` or `/academic-search`

3. **Alternative Providers**:
   * Implement Brave Search API as an alternative (2,000 free searches/month)
   * Create a failover system between multiple providers

## Troubleshooting

### Common Issues

1. **"Search API key not configured" Error**:
   * Make sure you've added the SERPER_API_KEY to your .env.local file
   * Restart your development server after adding the key

2. **"Failed to fetch" Errors**:
   * Check your internet connection
   * Verify that your API key is valid
   * Ensure you haven't exceeded your API rate limits

3. **Empty Search Results**:
   * Try more general search terms
   * Check the API response in browser developer tools
   * Verify the API key has the proper permissions

## Conclusion

This search integration provides QanDu with real-time access to current information from the web, significantly enhancing the capabilities of the AI platform. The implementation is designed to be cost-effective while providing valuable functionality across all modules. 