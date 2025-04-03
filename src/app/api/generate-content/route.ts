import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateText } from '@/lib/pollinationsApi';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Generate content using Pollinations API
    const generatedContent = await generateText({
      prompt: `Write a comprehensive article about: ${prompt}. Include an introduction, main points, and conclusion.`,
      model: 'gpt-4',
      max_tokens: 1000,
      temperature: 0.7,
      system_prompt: 'You are a professional content writer. Write engaging, well-structured content that is informative and easy to read.'
    });

    // Format the content with proper HTML structure
    const formattedContent = `
      <div class="article">
        <p class="introduction">${generatedContent.split('\n')[0]}</p>
        ${generatedContent.split('\n').slice(1).map((paragraph: string) => 
          paragraph.trim() ? `<p>${paragraph}</p>` : ''
        ).join('')}
      </div>
    `;

    return NextResponse.json({ content: formattedContent });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
} 