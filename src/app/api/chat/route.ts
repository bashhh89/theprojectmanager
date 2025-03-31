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
function sanitizeMessage(message: string): string {
  try {
    // Check if the message is a JSON string and parse it if needed
    if (typeof message === 'string' && 
        (message.startsWith('[{') || message.startsWith('{"')) &&
        (message.includes('"type":"text"') || message.includes('"content":'))) {
      
      let parsed;
      try {
        parsed = JSON.parse(message);
      } catch (e) {
        // If parsing fails, return the original message
        return message;
      }

      // Handle various JSON structures
      if (Array.isArray(parsed)) {
        // Array of content items
        const textItems = parsed.filter(item => 
          item.type === "text" && typeof item.content === "string"
        );
        
        if (textItems.length > 0) {
          return textItems.map(item => item.content).join("\n");
        }
      } else if (parsed.content && typeof parsed.content === "string") {
        // Object with content property
        return parsed.content;
      }
    }
    
    return message;
  } catch (e) {
    console.error("Error sanitizing message:", e);
    return message;
  }
}

// Helper to check if a model is from Google
function isGoogleModel(model: string): boolean {
  return model.startsWith('google-');
}

// Helper to check if a model is from Pollinations
function isPollinationsModel(model: string): boolean {
  return model.startsWith('pollinations-');
}

// Helper to get the base model name without provider prefix
function getBaseModelName(model: string): string {
  if (model.startsWith('google-')) {
    return model.substring(7); // Remove 'google-' prefix
  } else if (model.startsWith('pollinations-')) {
    return model.substring(12); // Remove 'pollinations-' prefix
  }
  return model; // Return as is if no prefix
}

// Make sure we're using the newer Next.js App Router handler signature
export async function POST(req: NextRequest) {
  console.log("API route /api/chat called");
  try {
    // Parse request body
    const body = await req.json();
    const { messages, model: initialModel, systemPrompt, agentId, agent } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: "Invalid messages array" },
        { status: 400 }
      );
    }
    
    // Create a mutable model variable that can be changed if needed
    let model = initialModel || 'google-gemini-pro'; // Default to Gemini Pro if not specified
    
    // Get only user messages to determine the lastUserMessage
    const userMessages = messages.filter(msg => msg.role === "user");
    if (userMessages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No user messages found" },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Determine the system prompt to use
    let finalSystemPrompt = systemPrompt || "You are a helpful assistant.";
    let knowledgeBase = "";
    
    // If we have the direct agent object, use it immediately
    if (agent && (agent.systemPrompt || agent.system_prompt)) {
      console.log("API Route - Using direct agent:", agent.name, agent.id);
      
      // Use either format of system prompt
      const directSystemPrompt = agent.systemPrompt || agent.system_prompt;
      console.log("API Route - Using agent's system prompt directly:", directSystemPrompt.substring(0, 100) + "...");
      finalSystemPrompt = directSystemPrompt;
      
      // For debugging purposes, log the agent's model preferences if available
      if (agent.modelPreferences) {
        console.log("API Route - Agent model preferences:", agent.modelPreferences);
      }
    }
    // If direct agent not available but we have agent ID, try to fetch from Supabase
    else if (agentId) {
      try {
        console.log("API Route - Attempting to use agent with ID:", agentId);
        
        // First check session storage (client-side only)
        let sessionPrompt = null;
        
        // Then try to get authenticated client if possible
        const serverClient = await getServerSupabaseClient();
        
        // Fetch the agent's system prompt and knowledge base info
        const { data, error } = await serverClient
          .from("agents")
          .select("system_prompt, knowledge_source_info, model_selection")
          .eq("id", agentId)
          .single();
        
        if (!error && data) {
          // Set model preference from agent if specified
          if (data.model_selection) {
            console.log("API Route - Using agent's preferred model:", data.model_selection);
            model = data.model_selection;
          }
          
          if (data.system_prompt) {
            console.log("API Route - Using agent system prompt from database:", data.system_prompt.substring(0, 100) + "...");
            finalSystemPrompt = data.system_prompt;
          } else {
            console.log("API Route - Agent found in database but no system_prompt");
          }
          
          // Extract knowledge from knowledge_source_info
          if (data.knowledge_source_info) {
            console.log("API Route - Knowledge base information found:", 
              JSON.stringify(data.knowledge_source_info).substring(0, 100) + "...");
            
            // Add text knowledge if available
            if (data.knowledge_source_info.text) {
              console.log("API Route - Adding text knowledge, length:", data.knowledge_source_info.text.length);
              knowledgeBase += data.knowledge_source_info.text + "\n\n";
            }
            
            // Add knowledge from files if available (especially PDFs)
            if (data.knowledge_source_info.files && data.knowledge_source_info.files.length > 0) {
              console.log("API Route - Knowledge files found:", data.knowledge_source_info.files.length);
              
              const fileKnowledge = data.knowledge_source_info.files
                .filter((file: any) => file.extractedText) // Only use files that have extracted text
                .map((file: any) => {
                  console.log(`API Route - Adding knowledge from file ${file.name}, text length: ${file.extractedText?.length || 0}`);
                  return `--- Knowledge from ${file.name} ---\n${file.extractedText}\n`;
                })
                .join("\n");
              
              if (fileKnowledge) {
                console.log("API Route - Total file knowledge length:", fileKnowledge.length);
                knowledgeBase += fileKnowledge;
              }
            }
          } else {
            console.log("API Route - No knowledge base information found for this agent");
          }
        } else {
          console.log("API Route - Error or no data from Supabase:", error?.message || "No data returned");
        }
      } catch (error) {
        console.error("API Route - Error fetching agent system prompt:", error);
        // Continue with provided or default system prompt
      }
    } else {
      console.log("API Route - No agent data provided, using default or provided system prompt");
    }
    
    // Enhance the system prompt with knowledge base if available
    if (knowledgeBase.trim()) {
      finalSystemPrompt = `${finalSystemPrompt}\n\nHere is some relevant knowledge to assist with your responses:\n\n${knowledgeBase}`;
    }
    
    // Log the final system prompt that will be used for transparency
    console.log("Final system prompt to be used:", finalSystemPrompt.substring(0, 200) + "...");
    
    // Debug log to show exactly what prompt is being sent to the API
    console.log("******** SYSTEM PROMPT BEING SENT TO API ********");
    console.log(finalSystemPrompt);
    console.log("************************************************");
    
    // Determine which API to use based on the model provider
    if (isGoogleModel(model)) {
      console.log("API Route: Using Google API with model:", model);
      
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        console.error('API Route: GOOGLE_API_KEY not configured in .env.local');
        return NextResponse.json(
          { success: false, error: 'Google API key not configured' }, 
          { status: 500 }
        );
      }

      try {
        // Dynamically import Google AI package only when needed
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        
        // Helper Function to Transform Messages for Gemini
        function transformMessagesForGemini(messages: any[]) {
          // Filter out system messages if they are passed separately to Gemini's systemInstruction
          const conversationHistory = messages
            .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
            .map((msg) => ({
              role: msg.role === 'assistant' ? 'model' : 'user', // Map role
              parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }], // Ensure content is string
            }));

          return conversationHistory;
        }

        const genAI = new GoogleGenerativeAI(googleApiKey);
        const baseModelName = getBaseModelName(model);
        
        // Map to actual Google model names
        let googleModelName;
        switch (baseModelName) {
          case 'gemini-pro':
            googleModelName = 'gemini-1.5-pro-latest';
            break;
          case 'gemini-pro-vision':
            googleModelName = 'gemini-1.5-pro-vision-latest';
            break;
          case 'palm':
            googleModelName = 'palm-2';
            break;
          case 'bison':
            googleModelName = 'chat-bison-001';
            break;
          default:
            googleModelName = 'gemini-1.5-pro-latest';
        }
        
        console.log("Using Google model:", googleModelName);
        
        const geminiModel = genAI.getGenerativeModel({ 
          model: googleModelName,
          systemInstruction: finalSystemPrompt 
        });

        const geminiMessages = transformMessagesForGemini(messages);
        const result = await geminiModel.generateContent({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        });

        const responseText = result.response.text();
        const { message, mcpDirectives } = parseMCPResponse(responseText);
        
        return NextResponse.json({
          success: true,
          message: message,
          mcpDirectives: mcpDirectives
        });
      } catch (error: any) {
        console.error("Error generating text with Google API:", error);
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to fetch response from Google: ${error.message || "Unknown error"}` 
          }, 
          { status: 500 }
        );
      }
    } else if (isPollinationsModel(model)) {
      console.log("API Route: Using Pollinations API with model:", model);
      
      try {
        const { processedMessages, contextString } = processConversationHistory(messages);
        const baseModelName = getBaseModelName(model);
        
        const request: TextGenerationRequest = {
          messages: processedMessages,
          model: baseModelName, // Remove the 'pollinations-' prefix
          system_prompt: finalSystemPrompt,
          temperature: 0.7,
          max_tokens: 1000
        };
        
        const response = await generateText(request);
        const { message, mcpDirectives } = parseMCPResponse(response.text);
        
        return NextResponse.json({
          success: true,
          message: message,
          mcpDirectives: mcpDirectives
        });
      } catch (error: any) {
        console.error("Error generating text with Pollinations API:", error);
        return NextResponse.json(
          { 
            success: false, 
            error: error.message || "Failed to generate response from Pollinations API" 
          }, 
          { status: 500 }
        );
      }
    } else {
      // If provider is not recognized, default to Google Gemini Pro
      console.log("API Route: Unknown model provider, defaulting to Google Gemini Pro");
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Unsupported model provider. Please select a model from Google or Pollinations." 
        }, 
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error in chat API route:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Unexpected error processing request" 
      }, 
      { status: 500 }
    );
  }
}