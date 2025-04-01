import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Ensure you have GOOGLE_GENERATIVE_AI_API_KEY in your environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

// Define the expected structure for each slide object from the AI
interface AISlideObject {
  title: string;
  content: string; // Expecting markdown content
  layout: 'background' | 'split-left' | 'split-right' | 'text-only';
  imagePrompt?: string; // Optional prompt for image generation on non-text-only slides
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      presentationType, // 'general' or 'proposal'
      topic,
      audience,
      additionalInfo,
      clientName,
      projectGoal,
      brandProfile // Optional: Contains colors, fonts etc. We might use this in the prompt
    } = body;

    // --- 1. Construct the Prompt based on Presentation Type --- 
    let systemPrompt = "You are an AI assistant specialized in creating professional presentations.\n";
    systemPrompt += "Generate a JSON array of slide objects for the requested presentation. Each object must have the following properties:\n";
    systemPrompt += "- \"title\": A concise string for the slide title.\n";
    systemPrompt += "- \"content\": A string containing the slide content formatted as Markdown (use headings, lists, paragraphs).\n";
    systemPrompt += "- \"layout\": A string suggesting a layout from: 'background', 'split-left', 'split-right', 'text-only'. Choose appropriately based on content.\n";
    systemPrompt += "- \"imagePrompt\": (Optional) If the layout is NOT 'text-only', provide a short, descriptive string prompt suitable for generating a relevant background or side image (e.g., 'futuristic cityscape', 'team collaborating around a table'). Omit this field or set to null for 'text-only' layouts.\n";
    systemPrompt += "Ensure the output is ONLY the valid JSON array, starting with [ and ending with ]. Do not include any text before or after the JSON array.";
    
    let userQuery = `Presentation Type: ${presentationType}\n`;
    if (presentationType === 'general') {
        userQuery += `Topic: ${topic}\n`;
        userQuery += `Target Audience: ${audience || 'General'}\n`;
        if (additionalInfo) userQuery += `Additional Notes: ${additionalInfo}\n`;
        userQuery += `Generate approximately 5-8 slides suitable for a general presentation on this topic.`;
    } else if (presentationType === 'proposal') {
        userQuery += `Client: ${clientName}\n`;
        userQuery += `Project Goal: ${projectGoal}\n`;
        userQuery += `Target Audience: ${audience || 'Client Decision Makers'}\n`;
        if (additionalInfo) userQuery += `Additional Proposal Details: ${additionalInfo}\n`;
        if (brandProfile?.name) userQuery += `Presenting Brand: ${brandProfile.name}\n`; // Include brand name
        userQuery += `Generate approximately 6-10 slides following a standard sales proposal structure (e.g., Intro, Problem, Solution, About Us, Next Steps). Tailor content towards the client and goal.`;
    }
    
    if (brandProfile) {
       userQuery += `\nConsider the brand's identity if possible (e.g., tone, focus areas - details not fully provided here but keep in mind).`;
    }

    // --- 2. Call the AI Model --- 
    console.log("Sending prompt to AI:", userQuery);
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Use a capable model
    const generationConfig = {
      // Ensure JSON output if model supports it, otherwise rely on prompt instructions
      // responseMimeType: "application/json", // Enable if model explicitly supports JSON mode
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192, // Allow ample space for JSON output
    };
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Okay, I understand. I will generate the presentation slides as a valid JSON array with the specified structure: title, content (markdown), layout, and optional imagePrompt." }] },
      ],
    });
    
    const result = await chat.sendMessage(userQuery);
    const response = result.response;
    const responseText = response.text();
    console.log("Raw AI Response Text:", responseText); // Log the raw response

    // --- 3. Parse the AI Response --- 
    let slides: AISlideObject[] = [];
    try {
        // Clean the response: Remove potential markdown code blocks or leading/trailing text
        const cleanedText = responseText.replace(/```json\n?|```/g, '').trim();
        slides = JSON.parse(cleanedText);
        // Basic validation
        if (!Array.isArray(slides) || slides.length === 0) {
             throw new Error('AI did not return a valid array of slides.');
        }
        // Further validation could check for required properties on each slide object
    } catch (parseError: any) {
        console.error("Failed to parse AI response as JSON:", parseError);
        // Log the original text *before* trying to clean it in this catch block
        console.error("Raw text before parsing attempt:", responseText); 
        // Try a simpler fallback (e.g., a single error slide)
        slides = [{ title: "Error", content: "# Failed to Generate Slides\n\nThe AI response could not be processed.", layout: 'text-only' }];
        // Return error response instead?
        // return NextResponse.json({ error: "Failed to parse AI response.", details: parseError.message }, { status: 500 });
    }

    // --- 4. Return the Slides --- 
    return NextResponse.json({ slides });

  } catch (error: any) {
    console.error("Error in /api/generate-presentation-slides:", error);
    return NextResponse.json({ error: "Failed to generate presentation slides", details: error.message }, { status: 500 });
  }
} 