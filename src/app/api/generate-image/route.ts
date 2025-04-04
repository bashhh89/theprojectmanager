import { NextResponse, NextRequest } from 'next/server';

// Basic configuration - Adjust model and potentially add API key if needed
const POLLINATIONS_IMAGE_API = 'https://image.pollinations.ai/prompt';

interface ImageOptions {
  quality?: 'hd' | 'sd';
  aspectRatio?: '16:9' | '4:3' | '1:1';
  style?: 'photorealistic' | 'artistic' | 'abstract' | 'digital-art';
}

interface ClientMetadata {
  companyName?: string;
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
    const { prompt, options = {}, clientMetadata } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Enhanced prompt with client information when available
    let enhancedPrompt = prompt;
    
    // Add client metadata to personalize the image, if available
    if (clientMetadata) {
      console.log('Personalizing image with client metadata:', JSON.stringify(clientMetadata));
      
      // Add industry-specific elements if industry is provided
      if (clientMetadata.industry) {
        const industryModifiers = getIndustryModifiers(clientMetadata.industry);
        enhancedPrompt += `, ${industryModifiers}`;
      }
      
      // Don't add company name directly to avoid text in images
      // Instead, use the industry and goal for context
      
      // If there's a primary goal, incorporate the concepts without explicit naming
      if (clientMetadata.primaryGoal && !prompt.includes(clientMetadata.primaryGoal)) {
        // Extract key concepts from the goal (simplified approach)
        const goalKeywords = extractKeywords(clientMetadata.primaryGoal);
        if (goalKeywords) {
          enhancedPrompt += `, representing ${goalKeywords}`;
        }
      }

      // Add contextual business setting without company name text
      if (clientMetadata.industry) {
        // Add subtle industry context without explicit text
        enhancedPrompt += `, professional ${clientMetadata.industry.toLowerCase()} context`;
      }
    }
    
    // Add style modifiers if not already in the prompt
    if (options.style === 'photorealistic' && !prompt.includes('photorealistic')) {
      enhancedPrompt += ', photorealistic, detailed photography, 8k ultra hd';
    } else if (options.style === 'artistic' && !prompt.includes('artistic')) {
      enhancedPrompt += ', artistic style, vibrant colors, professional design';
    } else if (options.style === 'abstract' && !prompt.includes('abstract')) {
      enhancedPrompt += ', abstract design, subtle gradient, soft colors, minimalist';
    } else if (options.style === 'digital-art' && !prompt.includes('digital art')) {
      enhancedPrompt += ', digital art, crisp, clean lines, professional illustration';
    }

    // Log the original and enhanced prompts for debugging
    console.log('Original prompt:', prompt);
    console.log('Enhanced prompt:', enhancedPrompt);

    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
    // Set dimensions based on quality and aspect ratio
    let width = 1280; // Higher default for better quality
    let height = 720; // Default 16:9
    
    if (options.quality === 'hd') {
      width = 1920;
      height = 1080;
    }
    
    if (options.aspectRatio === '4:3') {
      height = Math.round(width * 0.75); // 4:3 ratio
    } else if (options.aspectRatio === '1:1') {
      height = width; // Square
    } else {
      // Default to 16:9
      height = Math.round(width * 0.5625);
    }
    
    const nologo = true;

    // Construct the Pollinations API URL with specific model params for better images
    const imageUrl = `${POLLINATIONS_IMAGE_API}/${encodedPrompt}?width=${width}&height=${height}&nologo=${nologo}`;

    console.log(`Constructed image URL with enhanced prompt: ${imageUrl}`);

    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error('Error constructing image URL:', error);
    return NextResponse.json(
      { 
        error: 'Failed to construct image URL',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Helper function to extract keywords from a goal statement
function extractKeywords(text: string): string {
  // Simple extraction of key phrases/words (in a real implementation, this could use NLP)
  const words = text.toLowerCase().split(/\s+/);
  
  // Filter common business goal keywords
  const businessGoals = [
    'efficiency', 'productivity', 'growth', 'revenue', 'cost reduction',
    'automation', 'innovation', 'transformation', 'improvement', 'optimization',
    'sales', 'marketing', 'customer', 'experience', 'satisfaction', 'loyalty',
    'digital', 'data', 'analytics', 'insight', 'strategy', 'implementation'
  ];
  
  const foundKeywords = businessGoals.filter(goal => 
    text.toLowerCase().includes(goal)
  );
  
  // Return 2-3 keywords or a portion of the original text if no keywords found
  if (foundKeywords.length > 0) {
    return foundKeywords.slice(0, 3).join(', ');
  } else {
    // Take first 5-10 words as a fallback
    const shortText = words.slice(0, Math.min(10, words.length)).join(' ');
    return shortText.length > 50 ? shortText.slice(0, 50) + '...' : shortText;
  }
}

// Helper function to get industry-specific image modifiers
function getIndustryModifiers(industry: string): string {
  // Map common industries to visual elements that would enhance the image
  const industryMap: Record<string, string> = {
    'technology': 'digital elements, tech visualization, innovation',
    'healthcare': 'medical imagery, caring professionals, health and wellness',
    'finance': 'financial graphs, professional setting, corporate environment',
    'education': 'learning environment, academic setting, knowledge sharing',
    'retail': 'store display, product showcase, customer experience',
    'manufacturing': 'production line, precision machinery, quality craftsmanship',
    'construction': 'architectural elements, building process, structural design',
    'hospitality': 'welcoming atmosphere, service excellence, comfortable environment',
    'transportation': 'logistics, movement, journey visualization',
    'energy': 'power generation, sustainability elements, resource management',
    'agriculture': 'farming elements, natural growth, harvest imagery',
    'real estate': 'property visualization, architectural details, living spaces',
  };
  
  // Look for industry keywords in the provided industry string
  for (const [key, value] of Object.entries(industryMap)) {
    if (industry.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default if no specific industry match found
  return 'business setting, professional atmosphere';
} 