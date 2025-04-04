import { NextRequest, NextResponse } from 'next/server';
import { searchWeb } from '@/lib/search/searchService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, limit = 5 } = body;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (!process.env.SERPER_API_KEY) {
      return NextResponse.json({ 
        error: 'Search API key not configured',
        details: 'Please add SERPER_API_KEY to your environment variables'
      }, { status: 500 });
    }

    const results = await searchWeb(query, { 
      limit,
      cacheResults: true
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      error: 'Search failed', 
      details: error.message 
    }, { status: 500 });
  }
} 