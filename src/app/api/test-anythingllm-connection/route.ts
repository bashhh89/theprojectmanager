import { NextRequest, NextResponse } from 'next/server';
import { isAnythingLLMAvailable } from '@/lib/anythingllm-service';

/**
 * API route to test the AnythingLLM connection
 * GET /api/test-anythingllm-connection
 */
export async function GET(req: NextRequest) {
  try {
    const isAvailable = await isAnythingLLMAvailable();
    
    return NextResponse.json({
      status: isAvailable ? 'connected' : 'disconnected',
      message: isAvailable 
        ? 'Successfully connected to AnythingLLM' 
        : 'Failed to connect to AnythingLLM. Check your configuration.'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: `Error testing connection: ${error.message}`,
    }, { status: 500 });
  }
} 