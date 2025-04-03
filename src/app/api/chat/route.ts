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
  console.log("API route /api/chat called");
  try {
    const body = await req.json();
    let { messages, model, systemPrompt, agentId, agent } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid or empty messages array" },
        { status: 400 }
      );
    }
    
    // Default model if none provided (use a known Pollinations model)
    if (!model) {
      console.log("API Route: No model specified, defaulting to 'openai'");
      model = 'openai'; 
    }
    console.log(`API Route: Received request with model: ${model}`);
    
    // --- Agent and System Prompt Logic --- 
    let finalSystemPrompt = systemPrompt || "You are a helpful assistant.";
    let knowledgeBase = "";
    
    // Logic to fetch agent details and potentially override model/systemPrompt
    if (agent && (agent.systemPrompt || agent.system_prompt)) {
      console.log("API Route - Using direct agent object:", agent.name);
      const directSystemPrompt = agent.systemPrompt || agent.system_prompt;
      finalSystemPrompt = directSystemPrompt;
      if (agent.modelPreferences?.textModel) {
          console.log(`API Route - Overriding model with agent preference: ${agent.modelPreferences.textModel}`);
          model = agent.modelPreferences.textModel;
      }
    } else if (agentId) {
      try {
        console.log("API Route - Attempting to fetch agent by ID:", agentId);
        const serverClient = await getServerSupabaseClient();
        const { data, error } = await serverClient
          .from("agents")
          .select("system_prompt, knowledge_source_info, model_selection, name")
          .eq("id", agentId)
          .single();
        
        if (!error && data) {
          console.log(`API Route - Found agent in DB: ${data.name}`);
          if (data.model_selection) {
            console.log(`API Route - Overriding model with agent preference from DB: ${data.model_selection}`);
            model = data.model_selection;
          }
          if (data.system_prompt) {
            finalSystemPrompt = data.system_prompt;
          }
          // Extract knowledge base info
          if (data.knowledge_source_info) {
            if (data.knowledge_source_info.text) {
              knowledgeBase += data.knowledge_source_info.text + "\n\n";
            }
            if (data.knowledge_source_info.files && data.knowledge_source_info.files.length > 0) {
              const fileKnowledge = data.knowledge_source_info.files
                 .filter((file: any) => file.extractedText)
                 .map((file: any) => `--- Knowledge from ${file.name} ---\n${file.extractedText}\n`)
                .join("\n");
               if (fileKnowledge) knowledgeBase += fileKnowledge;
              }
          }
        } else {
          console.log("API Route - Error fetching agent from DB or no data:", error?.message || "No data returned");
        }
      } catch (error) {
        console.error("API Route - Error fetching agent system prompt:", error);
      }
    }
    
    // Combine system prompt and knowledge base
    if (knowledgeBase.trim()) {
      finalSystemPrompt = `${finalSystemPrompt}\n\nRelevant Knowledge:\n${knowledgeBase}`;
    }
    console.log("Final system prompt being used:", finalSystemPrompt.substring(0, 150) + "...");
    
    // Ensure the system prompt is the first message for OpenAI compatible endpoint
    const processedMessages = [
      { role: "system", content: finalSystemPrompt },
      // Add the rest of the user/assistant messages, ensuring content is string
      ...messages
        .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg: any) => ({
          role: msg.role,
          content: sanitizeMessage(msg.content)
        }))
    ];

    // --- Always use Pollinations POST endpoint --- 
    console.log(`API Route: Routing ALL models to Pollinations API (https://text.pollinations.ai/openai) with model: ${model}`);
    
    try {
      const pollinationsApiUrl = "https://text.pollinations.ai/openai";
      const payload = {
        model: model,
        messages: processedMessages,
        stream: false
      };

      console.log("Making request to Pollinations API with payload:", {
        model: payload.model,
        messageCount: payload.messages.length,
        firstMessagePreview: payload.messages[0].content.substring(0, 100) + "..."
      });

      const response = await fetch(pollinationsApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pollinations API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Received response from Pollinations API:", {
        success: true,
        messagePreview: data.choices?.[0]?.message?.content?.substring(0, 100) + "..."
      });

      // Parse the response and check for MCP directives
      const { message, mcpDirectives } = parseMCPResponse(data);

      return NextResponse.json({
        success: true,
        message,
        mcpDirectives
      });

    } catch (error) {
      console.error("Error calling Pollinations API:", error);
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "Failed to call Pollinations API" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}