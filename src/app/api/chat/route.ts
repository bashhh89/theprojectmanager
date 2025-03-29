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
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from '@google/generative-ai';

// --- Helper Function to Transform Messages for Gemini ---
// OpenAI format: { role: "user" | "assistant" | "system", content: string | [...] }
// Gemini format: { role: "user" | "model", parts: [{ text: string }] }
function transformMessagesForGemini(messages: any[]): Content[] {
  // Filter out system messages if they are passed separately to Gemini's systemInstruction
  // Keep only the last N messages if context window is a concern (optional)
  const conversationHistory = messages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user', // Map role
      parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }], // Ensure content is string
    }));

  // Simple turn alternation check - ensure conversation starts with 'user' if possible
  return conversationHistory;
}

// Helper to get authenticated Supabase client
async function getServerSupabaseClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
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

// Helper to check if a model is supported by Google Gemini
function isGeminiModel(model: string): boolean {
  // Only models starting with 'gemini' or in the explicit list are valid for Gemini API
  return model.includes('gemini') || 
         model === 'claude-3' || 
         model === 'chat-bison-001' || 
         model === 'direct-gemini-pro' || 
         model === 'direct-gemini-flash';
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
    let model = initialModel || 'gemini-1.5-flash'; // Default to Gemini if not specified
    
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
          .select("system_prompt, knowledge_source_info")
          .eq("id", agentId)
          .single();
        
        if (!error && data) {
          if (data.system_prompt) {
            console.log("API Route - Using agent system prompt from database:", data.system_prompt.substring(0, 100) + "...");
            finalSystemPrompt = data.system_prompt;
          } else {
            console.log("API Route - Agent found in database but no system_prompt");
          }
          
          // Extract knowledge from knowledge_source_info
          if (data.knowledge_source_info) {
            // Add text knowledge if available
            if (data.knowledge_source_info.text) {
              knowledgeBase += data.knowledge_source_info.text + "\n\n";
            }
            
            // Add knowledge from files if available (especially PDFs)
            if (data.knowledge_source_info.files && data.knowledge_source_info.files.length > 0) {
              const fileKnowledge = data.knowledge_source_info.files
                .filter((file: any) => file.extractedText) // Only use files that have extracted text
                .map((file: any) => {
                  return `--- Knowledge from ${file.name} ---\n${file.extractedText}\n`;
                })
                .join("\n");
              
              if (fileKnowledge) {
                knowledgeBase += fileKnowledge;
              }
            }
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
    
    // Create a list of Pollinations models that properly respect system prompts
    const SYSTEM_PROMPT_RESPECTING_MODELS = ['llama', 'mistral', 'deepseek'];
    
    // Check if the original model is one that respects system prompts
    const modelRespectsSystemPrompt = model && SYSTEM_PROMPT_RESPECTING_MODELS.includes(model.toLowerCase());

    // Check if model should use Google Gemini API
    const shouldUseGemini = isGeminiModel(model);

    // Use Pollinations API with system prompt respecting models or when Gemini isn't specified
    if (modelRespectsSystemPrompt || !shouldUseGemini) {
      console.log("API Route: Using Pollinations API with model:", model);
      
      try {
        // Process messages for the Pollinations API
        const { processedMessages, contextString } = processConversationHistory(messages);
        
        // Prepare the request for text generation
        const request: TextGenerationRequest = {
          messages: processedMessages,
          model: model,
          system_prompt: finalSystemPrompt,
          temperature: 0.7,
          max_tokens: 1000
        };
        
        // Call the Pollinations API client
        const response = await generateText(request);
        
        // Extract any MCP directives (for image or audio generation)
        const { message, mcpDirectives } = parseMCPResponse(response.text);
        
        // Return the response
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
    } else if (shouldUseGemini) {
      // Use the Google Gemini API directly
      console.log("API Route: Routing to Direct Google Gemini API.");
      
      // Use the API key stored securely in environment variables
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        console.error('API Route: GOOGLE_API_KEY not configured in .env.local');
        return NextResponse.json(
          { success: false, error: 'Google API key not configured' }, 
          { status: 500 }
        );
      }

      try {
        // Initialize the Google Generative AI SDK
        const genAI = new GoogleGenerativeAI(googleApiKey);

        // Select the appropriate Gemini model
        let geminiModelName = 'gemini-1.5-pro-latest'; // Default model
        
        // Map the selected model to an actual Gemini model ID
        if (model.includes('gemini')) {
          geminiModelName = model;
        } else if (model === 'direct-gemini-pro') {
          geminiModelName = 'gemini-1.5-pro-latest';
        } else if (model === 'direct-gemini-flash') {
          geminiModelName = 'gemini-1.5-flash-latest';
        }
        
        console.log("Using Gemini model:", geminiModelName);
        
        const geminiModel = genAI.getGenerativeModel({ 
          model: geminiModelName,
          systemInstruction: finalSystemPrompt 
        });

        // Transform messages into Gemini format
        const geminiMessages = transformMessagesForGemini(messages);
        
        // Generate content
        const result = await geminiModel.generateContent({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        });

        // Extract the response text
        const responseText = result.response.text();
        
        // Parse and extract any MCP directives (for image or audio generation)
        const { message, mcpDirectives } = parseMCPResponse(responseText);
        
        // Return the response
        return NextResponse.json({
          success: true,
          message: message,
          mcpDirectives: mcpDirectives
        });
      } catch (error: any) {
        console.error("Error generating text with Google Gemini API:", error);
        return NextResponse.json(
          { 
            success: false, 
            error: `Failed to fetch response from Google Gemini: ${error.message || "Unknown error"}` 
          }, 
          { status: 500 }
        );
      }
    } else {
      // If we can't determine which API to use, default to Pollinations
      console.log("API Route: Using Pollinations API with default model as fallback");
      
      try {
        const { processedMessages } = processConversationHistory(messages);
        
        const response = await generateText({
          messages: processedMessages,
          model: 'llama', // Default to a model that respects system prompts
          system_prompt: finalSystemPrompt
        });
        
        const { message, mcpDirectives } = parseMCPResponse(response.text);
        
        return NextResponse.json({
          success: true,
          message: message,
          mcpDirectives: mcpDirectives
        });
      } catch (error: any) {
        console.error("Error generating text with fallback model:", error);
        return NextResponse.json(
          { 
            success: false, 
            error: error.message || "Failed to generate response with fallback model" 
          }, 
          { status: 500 }
        );
      }
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