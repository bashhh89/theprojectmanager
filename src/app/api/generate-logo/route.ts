import { NextRequest, NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';

// Initialize the OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY as string,
});
const openai = new OpenAIApi(configuration);

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
    }
    
    // Format the prompt specifically for logo generation
    const formattedPrompt = `Create a professional logo for a business with these requirements: ${prompt}. 
    The logo should be simple, modern, and suitable for business use. 
    Create a high-quality vector-style logo with a clean background.`;
    
    // Generate images using DALL-E
    const response = await openai.createImage({
      prompt: formattedPrompt,
      n: 1,
      size: "1024x1024",
    });
    
    // Get the URLs from the response
    const imageUrl = response.data.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated');
    }
    
    // For demonstration, we'll return the same image multiple times
    // In a real implementation, you might want to generate multiple unique images
    // or store the generated image in your own storage and return local URLs
    const logos = [imageUrl];
    
    return NextResponse.json({ logos }, { status: 200 });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Logo generation failed' }, { status: 500 });
  }
} 