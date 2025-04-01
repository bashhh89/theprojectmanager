import { NextRequest, NextResponse } from 'next/server';
import { generateImageUrl } from '../../../lib/pollinationsApi';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }

    // Format the prompt specifically for logo generation if desired
    // Example: add style keywords
    const formattedPrompt = `Create a professional logo for a business with these requirements: ${prompt}. Style: simple, modern, vector, clean background.`;

    // Generate the Pollinations image URL using the updated function
    // No model parameter needed now; using default dimensions (256x256)
    const imageUrl = generateImageUrl(formattedPrompt);

    if (!imageUrl) {
      // This check might be redundant if generateImageUrl always returns a string,
      // but good practice.
      throw new Error('Could not generate Pollinations image URL');
    }

    // Return the URL in the format the frontend expects
    const logos = [imageUrl];

    return NextResponse.json({ logos }, { status: 200 });

  } catch (error) {
    console.error('Pollinations Logo Generation error:', error);
    // Send back a generic error message
    const errorMessage = error instanceof Error ? error.message : 'Pollinations logo generation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 