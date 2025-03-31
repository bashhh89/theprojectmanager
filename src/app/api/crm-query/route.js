import { NextResponse } from 'next/server';
import { processCRMQuery } from '@/lib/concordCRM';

/**
 * API route for processing CRM queries
 * 
 * This endpoint takes a natural language query about the CRM
 * and returns a structured response with the requested information.
 * 
 * @param {Request} request - The request object containing the query details
 * @returns {NextResponse} - The response with CRM data
 */
export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { query, baseUrl, apiToken } = body;
    
    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'CRM base URL is required' },
        { status: 400 }
      );
    }
    
    if (!apiToken) {
      return NextResponse.json(
        { error: 'API token is required' },
        { status: 400 }
      );
    }
    
    // Process the CRM query
    const result = await processCRMQuery(query, baseUrl, apiToken);
    
    // Return the response
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing CRM query:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process CRM query',
        message: error.message
      },
      { status: 500 }
    );
  }
} 