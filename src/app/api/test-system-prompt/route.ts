import { NextRequest, NextResponse } from "next/server";
import { generateText, TextGenerationRequest } from "@/lib/pollinationsApi";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { system_prompt, model, test_message } = body;
    
    if (!system_prompt || !model) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Create a unique identifier for this test
    const testId = "test_" + Date.now().toString();
    
    // Create a system prompt that instructs the model to identify itself using the ID
    const testSystemPrompt = `${system_prompt}\n\nFor validation purposes only, when asked to identify yourself, include the exact phrase: "I am the ${testId} agent" somewhere in your response.`;
    
    // Prepare the message to test the system prompt
    const testRequest: TextGenerationRequest = {
      messages: [
        { role: "user", content: test_message || "Please identify yourself briefly according to your system prompt." }
      ],
      model: model,
      system_prompt: testSystemPrompt,
      temperature: 0.2, // Keep it low for better determinism
      max_tokens: 500
    };
    
    console.log("Testing system prompt with model:", model);
    
    // Call the Pollinations API client
    const response = await generateText(testRequest);
    
    if (!response || !response.text) {
      throw new Error("No response received from the model");
    }
    
    // Check if the response includes the test identifier
    const responseText = response.text.toLowerCase();
    const identifierIncluded = responseText.includes(testId.toLowerCase());
    
    // Determine if the model respected the system prompt
    if (identifierIncluded) {
      console.log("System prompt test PASSED for model:", model);
      return NextResponse.json({
        success: true,
        message: "The model correctly follows system instructions.",
        modelResponse: response.text
      });
    } else {
      console.log("System prompt test FAILED for model:", model);
      console.log("Expected identifier not found:", testId);
      console.log("Response:", response.text);
      
      return NextResponse.json({
        success: false,
        message: "The model did not follow the system instructions as expected.",
        modelResponse: response.text
      });
    }
    
  } catch (error: any) {
    console.error("Error testing system prompt:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to test system prompt"
      }, 
      { status: 500 }
    );
  }
} 