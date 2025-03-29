import { NextRequest, NextResponse } from "next/server";
import { generateText, TextGenerationRequest, generateAudioUrl } from "@/lib/pollinationsApi";
import { ConversationMemory } from "@/lib/conversationMemory";

export async function POST(req: NextRequest) {
  try {
    console.log("Audio API route called");
    const body = await req.json();
    const { text, voice, mode, context } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    // Choose processing mode based on request
    if (mode === "conversation" && context && Array.isArray(context)) {
      console.log("Using conversation mode with context length:", context.length);
      try {
        // Use our ConversationMemory utility to properly format the conversation context
        const conversationContext = ConversationMemory.processMessages(context);
        
        // Add the current user message if not already included
        // First check if the last message is already from the user with this text
        const lastMessage = conversationContext[conversationContext.length - 1];
        const isLastMessageCurrentUserMessage = 
          lastMessage && 
          lastMessage.role === "user" && 
          lastMessage.content === text;
          
        if (!isLastMessageCurrentUserMessage) {
          conversationContext.push({ role: "user", content: text });
        }
        
        // Log a summary of the conversation context for debugging
        console.log("Conversation context:", ConversationMemory.summarizeContext(conversationContext));
        
        // Use the text generation endpoint with proper conversation context
        const requestBody: TextGenerationRequest = {
          messages: conversationContext,
          model: "openai", // Using OpenAI model for better conversation handling
          temperature: 0.7, // Good balance of consistency and creativity
          max_tokens: 1000, // Allow longer responses for context-aware replies
          private: true,
          system_prompt: "You are a helpful voice assistant having a conversation. Respond concisely and conversationally. Maintain context of the entire conversation history. Keep responses under 3 paragraphs to be good for voice playback. Reference relevant details from previous messages when appropriate."
        };
        
        console.log("Sending conversation request with", conversationContext.length, "messages");
        
        const response = await generateText(requestBody);
        
        if (!response || !response.text) {
          throw new Error("Empty response from AI service");
        }
        
        // Extract and clean up the response text
        const responseText = response.text.trim();
        console.log("AI response:", responseText.substring(0, 100) + (responseText.length > 100 ? "..." : ""));
        
        // Generate audio URL from the AI response with improved reliability
        const audioUrl = generateAudioUrl(responseText, voice);
        
        // Return success with audio URL and response text
        return NextResponse.json({
          success: true,
          audioUrl,
          responseText,
          isConversation: true,
          messageCount: conversationContext.length,
          timestamp: Date.now() // Add timestamp to prevent browser caching
        });
      } catch (convError: any) {
        console.error("Error in conversation mode:", convError);
        
        // Attempt a simplified conversation if the full context failed
        try {
          // Try with a reduced context - just the last 3 exchanges
          const simplifiedContext = ConversationMemory.processMessages(
            context.slice(-6) // Just 3 exchanges (3 user messages + 3 assistant responses)
          );
          simplifiedContext.push({ role: "user", content: text });
          
          const fallbackRequestBody: TextGenerationRequest = {
            messages: simplifiedContext,
            model: "openai",
            max_tokens: 400,
            temperature: 0.5,
            private: true,
            system_prompt: "You are a helpful voice assistant. Due to technical limitations, you only have access to the most recent messages in this conversation. Respond concisely."
          };
          
          const fallbackResponse = await generateText(fallbackRequestBody);
          const fallbackResponseText = fallbackResponse.text?.trim() || 
            "I'm having trouble accessing our conversation history. Could you please rephrase your question?";
          const audioUrl = generateAudioUrl(fallbackResponseText, voice);
          
          return NextResponse.json({
            success: true,
            audioUrl,
            responseText: fallbackResponseText,
            reducedMemory: true,
            timestamp: Date.now()
          });
        } catch (fallbackError) {
          // If even that fails, just respond directly to the current text
          const directResponseBody: TextGenerationRequest = {
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant responding to a single message without conversation history. Keep it brief."
              },
              { role: "user", content: text }
            ],
            model: "openai",
            max_tokens: 200,
            temperature: 0.7
          };
          
          try {
            const directResponse = await generateText(directResponseBody);
            const directResponseText = directResponse.text?.trim() || 
              "I'm sorry, I'm having trouble understanding the context. Could you please ask your question again?";
            const audioUrl = generateAudioUrl(directResponseText, voice);
            
            return NextResponse.json({
              success: true,
              audioUrl,
              responseText: directResponseText,
              fallback: true,
              timestamp: Date.now()
            });
          } catch (directError) {
            // Last resort fallback - just convert the user's text to speech
            const audioUrl = generateAudioUrl(
              "I'm experiencing technical difficulties right now. Please try again in a moment.", 
              voice || "alloy"
            );
            
            return NextResponse.json({
              success: true,
              audioUrl,
              responseText: "Technical difficulties. Please try again.",
              emergency: true,
              timestamp: Date.now()
            });
          }
        }
      }
    } else {
      console.log("Using direct TTS mode");
      // Simple TTS mode - just read the text directly
      const audioUrl = generateAudioUrl(text, voice);
      
      return NextResponse.json({
        success: true,
        audioUrl,
        downloadable: true,
        timestamp: Date.now() // Add timestamp to prevent browser caching
      });
    }
    
  } catch (error: any) {
    console.error("Error in audio generation API:", error);
    
    // Attempt to provide some audio even in case of error
    try {
      const errorMessage = "I'm sorry, there was a technical issue. Please try again.";
      const errorAudioUrl = generateAudioUrl(errorMessage, "alloy");
      
      return NextResponse.json(
        { 
          success: true, 
          audioUrl: errorAudioUrl,
          responseText: errorMessage,
          error: error.message || "An error occurred while generating the audio",
          timestamp: Date.now()
        },
        { status: 200 } // Return 200 so the frontend can still play the error message audio
      );
    } catch (audioError) {
      // If we can't even generate error audio, just return the error
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || "An error occurred while generating the audio" 
        },
        { status: 500 }
      );
    }
  }
}