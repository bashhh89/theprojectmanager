import { NextRequest, NextResponse } from 'next/server';
import { generateText, TextGenerationRequest } from '@/lib/pollinationsApi';

export async function POST(req: NextRequest) {
  try {
    const { prompt, messages, model = 'gemini-1.5-pro-latest', temperature = 0.7, max_tokens = 4000, system_prompt } = await req.json();

    // Create request payload
    const request: TextGenerationRequest = {
      messages: messages || [
        ...(system_prompt ? [{ role: 'system', content: system_prompt }] : []),
        ...(prompt ? [{ role: 'user', content: prompt }] : [])
      ],
      model,
      temperature,
      max_tokens
    };

    // Validate that we have at least one message
    if (!request.messages || request.messages.length === 0) {
      return NextResponse.json(
        { error: 'Either prompt or messages is required' },
        { status: 400 }
      );
    }

    console.log('Generating text with model:', model, {
      messageCount: request.messages.length,
      firstMessageLength: request.messages[0]?.content?.length || 0
    });

    // Call the text generation service
    const response = await generateText(request);

    if (!response || !response.text) {
      throw new Error('Invalid response from text generation service');
    }

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: `Failed to generate: ${error.message}` },
      { status: 500 }
    );
  }
} 