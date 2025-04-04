import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure for each slide object from the AI
interface AISlideObject {
  title: string;
  content: string; // Expecting markdown content
  layout: 'background' | 'split-left' | 'split-right' | 'text-only';
  imagePrompt?: string; // Optional prompt for image generation on non-text-only slides
}

// Define client metadata interface
interface ClientMetadata {
  companyName: string;
  industry?: string;
  website?: string;
  linkedInUrl?: string;
  recipientName?: string;
  recipientRole?: string;
  primaryGoal?: string;
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
      brandProfile,
      slideCount = 10,
      contentLength = 'medium',
      // Allow passing model, default to 'openai' as used in chat route
      model: requestedModel = 'openai',
      // Add client metadata
      clientMetadata
    } = body;

    // Validate required fields
    if (presentationType === 'general' && !topic) {
      return NextResponse.json({ error: 'Topic is required for general presentations' }, { status: 400 });
    }
    if (presentationType === 'proposal' && (!clientName || !projectGoal)) {
      return NextResponse.json({ error: 'Client name and project goal are required for proposals' }, { status: 400 });
    }

    // --- 1. Construct the System Prompt --- 
    const systemPrompt = `You are an AI assistant specialized in creating professional presentations.
Generate a presentation with ${slideCount} slides about the given topic.
The output must be a valid JSON array of slide objects, each containing:
{
  "title": "string (concise slide title)",
  "content": "string (markdown-formatted content with headings, lists, etc.)",
  "layout": "string (one of: 'background', 'split-left', 'split-right', 'text-only')",
  "imagePrompt": "string (optional: only if layout is not 'text-only', describe the image needed)"
}

Content length should be ${contentLength} (short=brief bullet points, medium=balanced, long=detailed).
Choose appropriate layouts based on content type.
Ensure all content is professional and presentation-friendly.
The response MUST BE ONLY the JSON array, with no introductory text, markdown formatting (like \`\`\`json), or closing remarks. Strictly the JSON array.`;

    // --- 2. Construct the User Query --- 
    let userQuery = `Create a ${presentationType} presentation with the following details:\n`;
    if (presentationType === 'general') {
      userQuery += `Topic: ${topic}\n`;
      userQuery += `Target Audience: ${audience || 'General'}\n`;
      if (additionalInfo) userQuery += `Additional Notes: ${additionalInfo}\n`;
    } else if (presentationType === 'proposal') {
      userQuery += `Client: ${clientName}\n`;
      userQuery += `Project Goal: ${projectGoal}\n`;
      userQuery += `Target Audience: ${audience || 'Client Decision Makers'}\n`;
      if (additionalInfo) userQuery += `Additional Proposal Details: ${additionalInfo}\n`;
      if (brandProfile?.name) userQuery += `Presenting Brand: ${brandProfile.name}\n`;
      
      // Add client metadata if available
      if (clientMetadata) {
        userQuery += "\nDetailed Client Information (for personalization):\n";
        if (clientMetadata.companyName) userQuery += `Company: ${clientMetadata.companyName}\n`;
        if (clientMetadata.industry) userQuery += `Industry: ${clientMetadata.industry}\n`;
        if (clientMetadata.recipientName) userQuery += `Main Contact: ${clientMetadata.recipientName}`;
        if (clientMetadata.recipientRole) userQuery += `, ${clientMetadata.recipientRole}`;
        userQuery += "\n";
        if (clientMetadata.primaryGoal) userQuery += `Primary Goal: ${clientMetadata.primaryGoal}\n`;
      }
    }
    userQuery += `\nIMPORTANT: Respond ONLY with the valid JSON array containing the slide objects.`;

    // --- 3. Call the Pollinations AI Model --- 
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery }
    ];

    console.log(`Sending request to Pollinations for presentation: ${topic || clientName}`);
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: requestedModel, // Use the model (defaults to 'openai')
        messages: messages
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pollinations API Error Response:", errorText);
      throw new Error(`Pollinations API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract the response content which *should* be the JSON string
    const responseText = data?.choices?.[0]?.message?.content;
    
    if (!responseText) {
      console.error("Invalid response structure from Pollinations:", data);
      throw new Error('Received invalid response structure from Pollinations API.');
    }

    console.log("Received response text from Pollinations:", responseText);

    // --- 4. Parse and Validate the Response --- 
    let slides: AISlideObject[] = [];
    let parsingSuccess = false;
    try {
      // Clean the response text to ensure it's valid JSON
      const cleanedText = responseText
        .replace(/^```json\n?/, '') // Remove leading ```json
        .replace(/^\s*\[/, '[')     // Ensure it starts with [
        .replace(/\]\s*$/, ']')     // Ensure it ends with ]
        .trim();

      if (!cleanedText.startsWith('[') || !cleanedText.endsWith(']')) {
        throw new Error('Cleaned text is not a valid JSON array string.');
      }

      // Parse the JSON
      slides = JSON.parse(cleanedText);
      console.log("Successfully parsed JSON. Parsed object:", slides);

      // Validate the array
      if (!Array.isArray(slides)) {
        throw new Error('Response is not an array');
      }

      // Validate each slide
      slides = slides.map((slide, index) => {
        if (!slide || typeof slide !== 'object') {
          console.warn(`Invalid slide structure at index ${index}, skipping.`);
          return null; // Mark for removal
        }
        const isValidLayout = ['background', 'split-left', 'split-right', 'text-only'].includes(slide.layout);
        return {
          title: slide.title || 'Untitled Slide',
          content: slide.content || '# No Content\n\nThis slide was not generated correctly.',
          layout: isValidLayout ? slide.layout : 'text-only',
          imagePrompt: !isValidLayout || slide.layout === 'text-only' ? undefined : slide.imagePrompt
        };
      }).filter(slide => slide !== null) as AISlideObject[]; // Filter out invalid slides

      // Ensure we have at least one valid slide
      if (slides.length === 0) {
        console.warn("No valid slides found after validation.");
        throw new Error('No valid slides generated after parsing and validation.');
      }

      console.log(`Validation complete. Found ${slides.length} valid slides.`);
      parsingSuccess = true; // Mark parsing as successful

    } catch (parseError: any) {
      console.error("Failed to parse or validate AI response:", parseError);
      console.error("Raw response text during parse error:", responseText);
      
      // Return a single error slide
      slides = [{
        title: "Generation Error",
        content: `# Generation Error\n\nFailed to generate presentation slides correctly. The AI response could not be processed.\n\n**Error:** ${parseError.message}`,
        layout: "text-only"
      }];
      // Still return 200 OK here, but with an error slide content
      return NextResponse.json({ slides });
    }

    // --- 5. Return the Slides --- 
    if (parsingSuccess && slides.length > 0) {
      console.log(`Successfully generated ${slides.length} slides for presentation: ${topic || clientName}`);
      // Pass clientMetadata in the response
      return NextResponse.json({ 
        slides,
        clientMetadata 
      });
    } else {
      // Should ideally not be reached if parsing error is handled, but as a fallback
      console.error("Reached end of API route without valid slides despite no explicit parsing error.");
      return NextResponse.json({ 
        error: "Failed to generate valid presentation slides after processing AI response.", 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Error in /api/generate-presentation-slides:", error);
    return NextResponse.json({ 
      error: "Failed to generate presentation slides", 
      details: error.message 
    }, { status: 500 });
  }
} 