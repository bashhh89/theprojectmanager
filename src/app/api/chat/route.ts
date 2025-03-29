import { NextRequest, NextResponse } from "next/server";
import { 
  generateText, 
  processConversationHistory, 
  TextGenerationRequest 
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
    let model = initialModel;
    
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

    // Force routing to Google API only if the model doesn't respect system prompts
    // and we have a system prompt to respect
    const shouldUseGoogle = 
      (systemPrompt && !modelRespectsSystemPrompt) || 
      (model && (model.includes('gemini') || model === 'claude-3' || model === 'chat-bison-001' || model === 'direct-gemini-pro' || model === 'direct-gemini-flash'));

    if (shouldUseGoogle) {
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
        const genAI = new GoogleGenerativeAI(googleApiKey);

        // Basic safety settings - adjust as needed
        const safetySettings = [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

        // Map the model ID to the correct Google model ID
        let googleModelId;
        if (model === 'direct-gemini-flash') {
          googleModelId = 'gemini-1.5-flash-latest';
        } else if (model === 'google-gemini-pro') {
          googleModelId = 'gemini-1.5-pro-latest';
        } else {
          // Use the model ID directly if it's already a Google model ID
          googleModelId = model;
        }

        console.log('API Route: Using Google model ID:', googleModelId);

        const geminiApiModel = genAI.getGenerativeModel({
          model: googleModelId,
          systemInstruction: finalSystemPrompt || undefined, // Pass system prompt here
          safetySettings: safetySettings,
        });

        // Transform messages from OpenAI format to Gemini format
        const geminiMessages = transformMessagesForGemini(messages);

        console.log("API Route (Gemini): Sending messages:", JSON.stringify(geminiMessages, null, 2).substring(0, 500) + "...");

        // Make the API call
        const result = await geminiApiModel.generateContent({
          contents: geminiMessages,
          // Add generationConfig if needed
          // generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        });

        const response = result.response;

        // Check for safety blocks or empty responses
        if (!response || !response.candidates || response.candidates.length === 0 || !response.text) {
          console.warn('API Route (Gemini): Response was empty or blocked.', response?.promptFeedback);
          let blockReason = response?.promptFeedback?.blockReason || 'No content';
          let safetyRatings = response?.candidates?.[0]?.safetyRatings || [];
          return NextResponse.json(
            { success: false, error: `Blocked by safety settings or no content generated. Reason: ${blockReason}`, details: safetyRatings }, 
            { status: 400 }
          );
        }

        const textResponse = response.text();

        console.log('API Route: Successfully received response from Google Gemini.');
        
        // Return in the format the client expects
        return NextResponse.json({
          success: true,
          message: textResponse,
          mcpDirectives: [], // No MCP directives for Gemini responses
          modelUsed: "Google " + googleModelId // Add information about which model was actually used
        });

      } catch (error: any) {
        console.error('API Route: Error calling Google Gemini API:', error);
        return NextResponse.json(
          { success: false, error: `Failed to fetch response from Google Gemini: ${error.message || String(error)}` }, 
          { status: 500 }
        );
      }
    } else {
      // Log which model we're using
      const modelToUse = modelRespectsSystemPrompt ? model : (systemPrompt ? 'llama' : model);
      console.log(`API Route: Using Pollinations API with model: ${modelToUse || 'llama'} (${modelRespectsSystemPrompt ? 'respects' : 'doesn\'t respect'} system prompts)`);
      
      // Process conversation history to ensure proper format
      const { processedMessages, contextString } = processConversationHistory(messages);
      
      // Create a messages array with system message as the first item
      const finalSystemPrompt = systemPrompt;
      
      // ENSURE THIS IS THE FORMAT USED - This is the standard OpenAI format
      const messagesForPollinations = finalSystemPrompt
        ? [{ role: 'system', content: finalSystemPrompt }, ...messages.filter(m => m.role !== 'system')]
        : messages;
      
      // Create request body for Pollinations API - NO top-level system_prompt
      const requestBody: TextGenerationRequest = {
        messages: messagesForPollinations,
        model: modelToUse || "llama", // Use llama by default for system prompts
        temperature: 0.7,
        private: true
      };
      
      console.log("API Route - Sending request to Pollinations API with model:", requestBody.model);
      
      try {
        // Call Pollinations API  
        const response = await generateText(requestBody);
        
        console.log("API Route - Received RAW response from Pollinations API:", 
          typeof response === 'string' 
            ? (response as string).substring(0, 200) + "..." 
            : (typeof response.text === 'string'
                ? response.text.substring(0, 400) + "..."
                : JSON.stringify(response, null, 2).substring(0, 400) + "..."));
        
        if (!response || !response.text) {
          console.error("Invalid or empty response from Pollinations API:", response);
          return NextResponse.json(
            { success: false, error: "Received invalid response from AI service" },
            { status: 500 }
          );
        }
        
        // Parse MCP directives from the response
        const { message, mcpDirectives } = parseMCPResponse(response);
        
        // Return successful response with message and directives
        return NextResponse.json({
          success: true,
          message,
          mcpDirectives,
          modelUsed: "Pollinations " + (modelToUse || "llama") // Add information about which model was actually used
        });
      } catch (apiError: any) {
        // Handle specific Pollinations API errors
        if (apiError.message && apiError.message.includes("More credits are required")) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Your Pollinations account needs more credits to process this request."
            },
            { status: 402 }  // 402 Payment Required
          );
        }
        
        // Re-throw for general error handling
        throw apiError;
      }
    }
  } catch (error: any) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "An error occurred while processing your request"
      },
      { status: 500 }
    );
  }
}