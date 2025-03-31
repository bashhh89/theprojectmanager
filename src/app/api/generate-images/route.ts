import { NextRequest, NextResponse } from 'next/server';

const POLLINATIONS_IMAGE_API_URL = 'https://image.pollinations.ai/prompt/';

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024, model = 'turbo' } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Build the URL with parameters
    let imageUrl = `${POLLINATIONS_IMAGE_API_URL}${encodedPrompt}`;
    imageUrl += `?width=${width}&height=${height}&model=${model}`;
    imageUrl += '&nologo=true&safety=off'; // Always add these parameters

    console.log('Generated image URL:', imageUrl);

    return NextResponse.json({ 
      success: true,
      imageUrl 
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate image' 
      },
      { status: 500 }
    );
  }
} 