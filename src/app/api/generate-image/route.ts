import { NextResponse, NextRequest } from 'next/server';

// Basic configuration - Adjust model and potentially add API key if needed
const POLLINATIONS_IMAGE_API = 'https://image.pollinations.ai/prompt';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const encodedPrompt = encodeURIComponent(prompt);
    
    // Use parameters confirmed to work
    const width = 1024; // Or adjust as needed for presentation context
    const height = 576; // 16:9 aspect ratio for 1024 width
    const nologo = true;

    // Construct the Pollinations API URL - **REMOVED model parameter**
    const imageUrl = `${POLLINATIONS_IMAGE_API}/${encodedPrompt}?width=${width}&height=${height}&nologo=${nologo}`;

    console.log(`Constructed image URL for frontend: ${imageUrl}`);

    // **Return the URL directly** instead of fetching it here
    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error('Error constructing image URL:', error);
    return NextResponse.json(
      { 
        error: 'Failed to construct image URL',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 