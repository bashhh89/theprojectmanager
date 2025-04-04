import { NextRequest, NextResponse } from 'next/server';

const systemPrompt = `You are an expert in creating compelling company information and "About Us" content.
Your task is to generate comprehensive company information based on the provided brand details.

Make sure the content is:
1. Professional and authentic
2. Engaging and well-structured
3. Aligned with the brand's positioning and industry
4. Appropriate for business audiences

Create a fictitious but believable company history, mission, vision, values, and other company information
that aligns with the provided brand details.

Format your response as valid JSON with the following structure:
{
  "companyHistory": "A 1-2 paragraph history of how the company was founded...",
  "mission": "A clear 1-2 sentence mission statement...",
  "vision": "A forward-looking vision statement...",
  "values": ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5"],
  "teamMembers": [
    {
      "name": "Fictional Founder Name",
      "role": "CEO & Founder", 
      "bio": "Brief professional bio..."
    },
    {
      "name": "Fictional Executive Name",
      "role": "Executive Position",
      "bio": "Brief professional bio..."
    }
  ],
  "companyAchievements": [
    "Major milestone or achievement 1",
    "Major milestone or achievement 2",
    "Major milestone or achievement 3"
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandName, valueProposition, targetAudiences, competitiveAdvantages, industry } = body;

    if (!brandName) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    // Construct the user query
    const userQuery = `Generate complete company information for:
    
Brand Name: ${brandName}
Value Proposition: ${valueProposition || 'Not provided'}
Target Audience: ${targetAudiences ? targetAudiences.join(', ') : 'Not provided'}
Competitive Advantages: ${competitiveAdvantages ? competitiveAdvantages.join(', ') : 'Not provided'}
Industry: ${industry || 'Technology'}

Create a fictitious but compelling company history and information that aligns with these brand details.`;

    // Call the Pollinations API
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai', 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract the response content from the API response
    const contentText = data?.choices?.[0]?.message?.content;
    
    if (!contentText) {
      throw new Error('Failed to generate company information');
    }

    // Parse the JSON response
    let companyData;
    try {
      // First try to parse directly
      companyData = JSON.parse(contentText);
    } catch (e) {
      // If that fails, try to extract JSON from markdown
      const jsonMatch = contentText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, contentText];
      try {
        companyData = JSON.parse(jsonMatch[1].trim());
      } catch (e2) {
        console.error("Failed to parse JSON from response:", contentText);
        throw new Error('Failed to parse company data from AI response');
      }
    }

    // Validate required fields
    if (!companyData.companyHistory || !companyData.mission || !companyData.vision || !companyData.values) {
      throw new Error('Generated company data is missing required fields');
    }

    // Return the complete company data
    return NextResponse.json(companyData);

  } catch (error: any) {
    console.error('Error generating company information:', error);
    return NextResponse.json({ 
      error: 'Failed to generate company information', 
      details: error.message 
    }, { status: 500 });
  }
} 