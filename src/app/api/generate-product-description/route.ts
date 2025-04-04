import { NextRequest, NextResponse } from 'next/server';

const systemPrompt = `You are a professional product information generator with expertise in marketing and business.
Your task is to create comprehensive product details based on a brief product name or concept.

Generate the following for the product:
1. A persuasive product description (200-250 words)
2. 3-5 key features with title and brief description for each
3. 3-5 customer benefits with title and brief description for each
4. A list of relevant tags/categories
5. A standard scope of what's typically included
6. Suggested pricing tiers (at least one basic tier with price)

Format your response as valid JSON with the following structure:
{
  "description": "Full product description here...",
  "features": [
    {"title": "Feature 1", "description": "Feature 1 description"},
    {"title": "Feature 2", "description": "Feature 2 description"}
  ],
  "benefits": [
    {"title": "Benefit 1", "description": "Benefit 1 description"},
    {"title": "Benefit 2", "description": "Benefit 2 description"}
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "standardScope": "What's typically included...",
  "pricingModel": [
    {"name": "Basic", "price": 99, "billingCycle": "monthly", "description": "Basic tier description"}
  ]
}

Use professional language focused on business value.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, industry } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Construct the user query with industry context if provided
    const industryContext = industry ? `in the ${industry} industry` : '';
    const userQuery = `Generate complete product information for: ${prompt} ${industryContext}`;

    // Call the Pollinations API
    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai', // Default to OpenAI model
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
      throw new Error('Failed to generate product information');
    }

    // Parse the JSON response
    let productData;
    try {
      // First try to parse directly
      productData = JSON.parse(contentText);
    } catch (e) {
      // If that fails, try to extract JSON from markdown
      const jsonMatch = contentText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, contentText];
      try {
        productData = JSON.parse(jsonMatch[1].trim());
      } catch (e2) {
        console.error("Failed to parse JSON from response:", contentText);
        throw new Error('Failed to parse product data from AI response');
      }
    }

    // Validate required fields
    if (!productData.description) {
      throw new Error('Generated product data is missing required fields');
    }

    // Return the complete product data
    return NextResponse.json(productData);

  } catch (error: any) {
    console.error('Error generating product information:', error);
    return NextResponse.json({ 
      error: 'Failed to generate product information', 
      details: error.message 
    }, { status: 500 });
  }
} 