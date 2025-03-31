import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/pollinationsApi";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { keywords, model } = body;
    
    if (!keywords) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    console.log(`Generating system prompt with keywords: "${keywords.substring(0, 50)}${keywords.length > 50 ? '...' : ''}"`);
    console.log("Using model:", model || "openai");
    
    // Create a fallback prompt to use if all models fail
    const fallbackPrompt = `You are ${keywords.includes(',') ? keywords.split(',')[0] : keywords}, an AI assistant designed to help users with various tasks and provide information.

You will respond to users in a conversational, helpful, and informative manner. You should strive to understand the user's intent and provide the most relevant and accurate information.

You have the following characteristics:
- Friendly and conversational tone
- Helpful attitude toward user queries
- Provides factual and accurate information
- Admits when you don't know something
- Avoids making up information
- Respects user privacy and confidentiality

When responding to users, you should:
1. Address their specific questions or requests
2. Provide context and background information when relevant
3. Break down complex topics into understandable parts
4. Use simple, clear language
5. Be concise but thorough

You should avoid:
- Providing harmful, illegal, or unethical advice
- Engaging in political debates or taking strong stances on controversial topics
- Pretending to be human or having experiences you don't have
- Making claims about your training data or capabilities that aren't accurate

Your goal is to be a helpful, reliable assistant that provides value to users through accurate information and assistance.`;

    // Prepare the meta prompt that tells the AI how to create a system prompt
    const metaPrompt = `
You are an expert AI prompt engineer with deep knowledge of how different language models interpret and follow system prompts.
Your task is to generate a detailed, comprehensive system prompt for an AI agent based on the following keywords/description:

"${keywords}"

Important guidelines for creating the system prompt:
1. The system prompt should clearly define the agent's persona, knowledge areas, and behavioral guidelines
2. Include specific instructions on how the agent should respond, what tone to use, and any limitations
3. Structure the prompt with clear sections (role, behavior, knowledge, limitations, etc.)
4. Focus on making the prompt actionable for the AI - use imperative language ("You will", "You must", etc.)
5. Make the prompt detailed enough to guide the AI's behavior but not so restrictive that it can't be helpful
6. Define the agent's name and personality based on the keywords
7. Make the prompt at least 500-1000 words to provide sufficient guidance
8. Avoid contradictory instructions

Output only the system prompt text with no additional commentary, explanations, or markdown formatting.
The prompt should begin with "You are..." or similar role-defining statement.
`;

    console.log("Calling generateText API with primary model...");
    
    // Track all errors for logging
    const errors = [];
    
    // Call the text generation API with the primary model
    // Make sure messages array is properly formatted with role and content properties
    const requestPayload = {
      messages: [
        { role: "user", content: metaPrompt }
      ],
      model: model || "openai",
      temperature: 0.7,
      max_tokens: 3000
    };
    
    console.log("Request payload model:", requestPayload.model);
    
    try {
      // Try with the requested model first
      const response = await generateText(requestPayload);
      
      console.log("Generation API response received:", response ? "success" : "null");
      
      if (!response) {
        throw new Error("Received null response from text generation API");
      }
      
      if (!response.text) {
        console.error("Invalid response structure:", Object.keys(response).join(", "));
        throw new Error("Response missing text property");
      }
      
      // Return the generated prompt
      return NextResponse.json({
        success: true,
        prompt: response.text.trim(),
        model: requestPayload.model
      });
    } catch (error: any) {
      console.error("Primary model failed:", error.message || "Unknown error");
      errors.push(`Primary model (${requestPayload.model}): ${error.message || "Unknown error"}`);
      
      // Try fallback model - in this case, try "llama" if the first choice wasn't llama
      // otherwise try "mistral" - both have good system prompt following
      const fallbackModel = (model === "llama") ? "mistral" : "llama";
      console.log(`Trying fallback model: ${fallbackModel}`);
      
      try {
        const fallbackRequestPayload = {
          messages: [
            { role: "user", content: metaPrompt }
          ],
          model: fallbackModel,
          temperature: 0.7,
          max_tokens: 3000
        };
        
        const fallbackResponse = await generateText(fallbackRequestPayload);
        
        if (!fallbackResponse || !fallbackResponse.text) {
          throw new Error(`Both primary (${model || "openai"}) and fallback (${fallbackModel}) models failed`);
        }
        
        console.log("Fallback model succeeded");
        
        return NextResponse.json({
          success: true,
          prompt: fallbackResponse.text.trim(),
          model: fallbackModel,
          note: "Used fallback model due to primary model failure"
        });
      } catch (fallbackError: any) {
        // Both models failed, try one more time with a simpler model
        console.error("Fallback model also failed:", fallbackError.message || "Unknown error");
        errors.push(`Fallback model (${fallbackModel}): ${fallbackError.message || "Unknown error"}`);
        
        // Last resort - try with gemini
        const lastResortModel = "gemini-1.5-flash";
        console.log(`Trying last resort model: ${lastResortModel}`);
        
        try {
          // Make sure the request format is correct for the Gemini model
          const lastResortPayload = {
            messages: [
              { role: "user", content: metaPrompt }
            ],
            model: lastResortModel,
            temperature: 0.7,
            max_tokens: 2000 // Smaller for faster response
          };
          
          const lastResortResponse = await generateText(lastResortPayload);
          
          if (!lastResortResponse || !lastResortResponse.text) {
            throw new Error("All models failed to generate a system prompt");
          }
          
          console.log("Last resort model succeeded");
          
          return NextResponse.json({
            success: true,
            prompt: lastResortResponse.text.trim(),
            model: lastResortModel,
            note: "Used last resort model after primary and fallback models failed"
          });
        } catch (lastError: any) {
          // All models failed, but we'll still return a basic prompt
          console.error("All models failed:", lastError.message || "Unknown error");
          errors.push(`Last resort model (${lastResortModel}): ${lastError.message || "Unknown error"}`);
          
          console.log("Using emergency hardcoded fallback prompt");
          
          // Return a basic prompt so the client can still function
          return NextResponse.json({
            success: true,
            prompt: fallbackPrompt,
            model: "emergency-fallback",
            note: "All AI models failed, using emergency fallback prompt",
            errors: errors
          });
        }
      }
    }
  } catch (error: any) {
    console.error("Error generating system prompt:", error);
    // Include more detailed error information
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to generate system prompt",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
} 