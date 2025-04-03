import { NextRequest, NextResponse } from "next/server";
import { 
  generateText, 
  processConversationHistory, 
  TextGenerationRequest,
  AVAILABLE_MODELS 
} from "@/lib/pollinationsApi";
import { createMCPSystemPrompt, parseMCPResponse } from "@/lib/mcpHelper";
import { supabase } from "@/lib/supabaseClient";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper to get authenticated Supabase client
async function getServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name, value, options) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name, options) {
          const cookieStore = await cookies();
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

// Helper function to ensure text messages are properly formatted
function sanitizeMessage(message: any): string {
  try {
    // If message is already a string, return it
    if (typeof message === 'string') return message;
    
    // If message is an array of content objects
    if (Array.isArray(message)) {
      return message
        .filter((item: { type: string; content: string }) => item.type === 'text')
        .map((item: { type: string; content: string }) => item.content)
        .join('\n');
    }
    
    // If message is a single content object
    if (message.type === 'text') {
      return message.content;
    }
    
    // If message is an object with content property
    if (message.content) {
      if (Array.isArray(message.content)) {
        return message.content
          .filter((item: { type: string; content: string }) => item.type === 'text')
          .map((item: { type: string; content: string }) => item.content)
          .join('\n');
      }
      return String(message.content);
    }
    
    // Fallback: convert to string
    return String(message);
  } catch (e) {
    console.error("Error sanitizing message:", e);
    return String(message);
  }
}

// Make sure we're using the newer Next.js App Router handler signature
export async function POST(req: NextRequest) {
  try {
    const { messages, model, systemPrompt, agent } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Set default model if none provided
    const activeModel = model || 'openai';
    console.log('API Route: Received request with model:', activeModel);

    // Get agent details
    let agentDetails = agent;
    if (!agentDetails) {
      console.log('API Route - Using direct agent object: Default Assistant');
      agentDetails = {
        name: 'Default Assistant',
        systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
        modelPreference: 'openai'
      };
    }

    // Override model with agent preference if available
    const finalModel = agentDetails.modelPreference || activeModel;
    console.log('API Route - Overriding model with agent preference:', finalModel);

    // Combine system prompt with knowledge base
    const finalSystemPrompt = agentDetails.systemPrompt || systemPrompt || 'You are a helpful AI assistant.';
    console.log('Final system prompt being used:', finalSystemPrompt);

    // Format messages for API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: Array.isArray(msg.content) 
        ? msg.content.map(c => typeof c === 'string' ? c : c.content).join(' ')
        : msg.content
    }));

    // Add system prompt as first message
    formattedMessages.unshift({
      role: 'system',
      content: finalSystemPrompt
    });

    // Try Pollinations API with retries
    let attempts = 0;
    const maxAttempts = 3;
    let lastError;

    while (attempts < maxAttempts) {
      try {
        console.log(`Making request to Pollinations API (attempt ${attempts + 1}) with payload:`, {
          model: finalModel,
          messageCount: formattedMessages.length,
          firstMessagePreview: formattedMessages[0].content.substring(0, 50) + '...'
        });

        const response = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: finalModel,
            messages: formattedMessages
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Pollinations API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Received response from Pollinations API:', {
          success: true,
          messagePreview: data.choices[0].message.content.substring(0, 50) + '...'
        });

        return NextResponse.json({
          success: true,
          message: data.choices[0].message.content
        });

      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
        lastError = error;
        attempts++;
        
        // If we've tried all attempts, throw the last error
        if (attempts === maxAttempts) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    throw lastError;

  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}