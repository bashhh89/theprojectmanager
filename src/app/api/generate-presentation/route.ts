import { NextResponse } from 'next/server';
import { generatePresentation, AIProvider, GenerateOptions } from '@/lib/presentationProviders';

export async function POST(req: Request) {
  try {
    const { topic, provider = 'gemini', model } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    console.log('Generating presentation for topic:', topic, 'using provider:', provider, 'model:', model);

    // Validate provider and model
    if (provider !== 'gemini' && provider !== 'pollinations') {
      return NextResponse.json(
        { error: `Invalid provider: ${provider}. Must be 'gemini' or 'pollinations'` },
        { status: 400 }
      );
    }

    // Create options with model
    const options: GenerateOptions = {};
    if (model) {
      options.model = model;
      console.log(`Using specific model: ${model}`);
    }

    try {
      const markdown = await generatePresentation(topic, provider as AIProvider, options);
      
      if (!markdown) {
        throw new Error('No presentation content generated');
      }

      console.log('Successfully generated presentation');

      return NextResponse.json({ 
        markdown,
        status: 'success'
      });
    } catch (generationError: any) {
      console.error('Error during presentation generation:', {
        message: generationError.message,
        stack: generationError.stack,
        details: generationError
      });

      return NextResponse.json(
        { 
          error: 'Failed to generate presentation content',
          details: generationError.message,
          provider,
          model
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API route error:', {
      message: error.message,
      stack: error.stack,
      details: error
    });

    return NextResponse.json(
      { 
        error: 'API error while processing request',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 