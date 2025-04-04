import { NextRequest, NextResponse } from 'next/server';

interface PromptData {
  clientName: string;
  clientIndustry: string;
  clientGoals: string;
  sections: string[];
  clientWebsite?: string;
  companySize?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PromptData;
    const { clientName, clientIndustry, clientGoals, sections, clientWebsite, companySize } = body;

    console.log("Received proposal generation request:", { clientName, clientIndustry, sections });

    if (!clientName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Client name is required' 
      }, { status: 400 });
    }

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'At least one section is required' 
      }, { status: 400 });
    }

    // Generate content using AI
    const proposalContent = await generateProposalContent({
      clientName,
      clientIndustry,
      clientGoals,
      sections,
      clientWebsite,
      companySize
    });

    return NextResponse.json({
      success: true,
      sections: proposalContent
    });
  } catch (error: any) {
    console.error('Error generating proposal content:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to generate proposal content', 
      details: error.message 
    }, { status: 500 });
    }
}

async function generateProposalContent(data: {
  clientName: string;
  clientIndustry: string;
  clientGoals: string;
  sections: string[];
  clientWebsite?: string;
  companySize?: string;
}) {
  const { clientName, clientIndustry, clientGoals, sections, clientWebsite, companySize } = data;
  
  // Create system prompt for AI model - be very specific about JSON output
  const systemPrompt = `
    You are an expert business proposal writer specializing in creating persuasive, professional content.
    You will generate content for a business proposal for ${clientName}, a ${companySize || ''} company in the ${clientIndustry} industry.
    
    The client's main goals are: ${clientGoals}
    ${clientWebsite ? `The client's website is: ${clientWebsite}` : ''}
    
    INSTRUCTIONS:
    1. Generate detailed, persuasive content for each section of the proposal
    2. Focus on addressing the client's specific industry and goals
    3. Use professional, confident language appropriate for business proposals
    4. Be concise but comprehensive - each section should be 100-300 words
    5. Format content as clean Markdown with appropriate headings and formatting
    6. IMPORTANT: Structure your response as a valid JSON ARRAY with one string element for each section
    
    Example of expected response format:
    [
      "## Introduction\\nWe understand the unique challenges facing businesses in the ${clientIndustry} industry...",
      "## Objectives\\nOur primary objective is to help ${clientName} achieve the following goals:\\n\\n- Goal 1\\n- Goal 2...",
      "## Services\\nWe offer comprehensive solutions tailored specifically to ${clientName}'s needs..."
    ]
    
    Do not include any explanations or metadata outside the JSON structure.
  `;

  // Create user prompt with section requirements
  const userPrompt = `
    Create content for the following ${sections.length} proposal sections for ${clientName}:
${sections.map((section, index) => `${index + 1}. ${section}`).join('\n')}

    Remember to respond ONLY with a valid JSON array where each element is the content for the corresponding section.
    Each array element should be a markdown string with appropriate formatting.
  `;

  try {
    console.log("Sending proposal generation request to AI");

    // Call AI service to generate proposal content
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('AI service error:', response.status, errorText);
      throw new Error(`AI generation failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("AI response received", { success: !!result?.choices?.[0]?.message });
    
    const contentText = result?.choices?.[0]?.message?.content;
    
    if (!contentText) {
      throw new Error('No content received from AI service');
    }

    // Extract JSON from various possible response formats
    let jsonContent = '';
    
    // Check for code blocks
    const jsonMatch = contentText.match(/```json\n([\s\S]*)\n```/) || 
                     contentText.match(/```\n([\s\S]*)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
      jsonContent = jsonMatch[1].trim();
    } else {
      // Try to clean the content by looking for array brackets
      const arrayMatch = contentText.match(/\[\s*"([\s\S]*)"\s*\]/);
      if (arrayMatch) {
        jsonContent = contentText;
      } else {
        // Otherwise use the raw content
        jsonContent = contentText.trim();
      }
    }
    
    // Parse the content as JSON, with robust error handling
    try {
      console.log("Attempting to parse AI response as JSON");
      let sectionsContent;
      
      // Try parsing directly
      try {
        sectionsContent = JSON.parse(jsonContent);
      } catch (e) {
        // If direct parsing fails, try to fix common JSON issues
        const cleanedJson = jsonContent
          .replace(/\\'/g, "'") // Fix escaped single quotes
          .replace(/\\n/g, "\\\\n") // Normalize newlines
          .replace(/\n/g, "\\n"); // Replace literal newlines
          
        // Try one more time with the cleaned JSON
        sectionsContent = JSON.parse(cleanedJson);
      }
      
      // Ensure we have the right format - array of strings
      if (!Array.isArray(sectionsContent)) {
        console.error("AI response is not an array:", sectionsContent);
        throw new Error('AI response is not in the expected array format');
      }
      
      console.log(`Successfully parsed AI response with ${sectionsContent.length} sections`);
      
      // Make sure we have content for each section
      const finalSections = [];
      for (let i = 0; i < sections.length; i++) {
        if (i < sectionsContent.length && sectionsContent[i]) {
          finalSections.push(sectionsContent[i]);
        } else {
          // Add fallback content for missing sections
          finalSections.push(`## ${sections[i]}\nContent to be added.`);
        }
      }
      
      return finalSections;
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e, jsonContent);
      
      // Fallback: if parsing fails, split by sections and format manually
      console.log("Using fallback section parsing");
      const fallbackSections = [];
      
      for (const section of sections) {
        // Try to find content for each section
        const sectionRegex = new RegExp(`## ${section}[\\s\\S]*?(?=## |$)`, 'i');
        const match = contentText.match(sectionRegex);
        
        if (match && match[0]) {
          fallbackSections.push(match[0]);
        } else {
          // Add placeholder for missing sections
          fallbackSections.push(`## ${section}\nContent to be added.`);
        }
      }
      
      return fallbackSections;
    }
  } catch (error: any) {
    console.error('Error in content generation:', error);
    throw new Error(`Failed to generate proposal content: ${error.message}`);
  }
}
