import { NextRequest, NextResponse } from 'next/server';

interface ModelRecommendation {
  id: string;
  name: string;
  score: number;
  reason: string;
}

interface RecommendationResponse {
  recommendations: ModelRecommendation[];
  prompt: string;
  detectedFeatures: string[];
}

// Recommendation patterns based on prompt content
const PATTERNS = [
  {
    name: 'roleplay',
    regex: /\byou are\b|\byou're\b|\bpretend to be\b|\bact as( a| an)?\b/i,
    models: [
      { id: 'llama', score: 0.95, reason: 'Excellent for character roleplay' },
      { id: 'mistral', score: 0.85, reason: 'Good at maintaining character voice' },
      { id: 'deepseek', score: 0.80, reason: 'Generally follows character personas' }
    ]
  },
  {
    name: 'formatting',
    regex: /\buppercase\b|\blowercase\b|\bformat\b|\bwrap\b|\bstructured\b|\bjson\b|\bmarkdown\b|\bhtml\b|\bxml\b/i,
    models: [
      { id: 'gemini-1.5-pro-latest', score: 0.90, reason: 'Strong format adherence' },
      { id: 'direct-gemini-pro', score: 0.88, reason: 'Consistently formats as requested' },
      { id: 'llama', score: 0.82, reason: 'Good at following formatting instructions' }
    ]
  },
  {
    name: 'creative',
    regex: /\bstory\b|\bpoem\b|\bcreative\b|\bimagine\b|\bfiction\b|\bnarrative\b/i,
    models: [
      { id: 'llama', score: 0.92, reason: 'Excellent for creative content' },
      { id: 'gemini-1.5-pro-latest', score: 0.90, reason: 'Great for imaginative responses' },
      { id: 'deepseek', score: 0.85, reason: 'Good at creative writing' }
    ]
  },
  {
    name: 'technical',
    regex: /\bcode\b|\btechnical\b|\bprogramming\b|\bsoftware\b|\bengineering\b|\bexplain technically\b/i,
    models: [
      { id: 'gemini-1.5-pro-latest', score: 0.93, reason: 'Strong technical responses' },
      { id: 'phi', score: 0.88, reason: 'Good for technical content' },
      { id: 'direct-gemini-pro', score: 0.85, reason: 'Handles technical questions well' }
    ]
  },
  {
    name: 'factual',
    regex: /\bfacts\b|\bfactual\b|\binformative\b|\beducational\b|\bteach\b|\bexplain\b/i,
    models: [
      { id: 'gemini-1.5-pro-latest', score: 0.91, reason: 'Excellent for factual content' },
      { id: 'direct-gemini-pro', score: 0.88, reason: 'Provides solid factual responses' },
      { id: 'mistral', score: 0.84, reason: 'Good at providing factual information' }
    ]
  },
  {
    name: 'emotive',
    regex: /\bemotional\b|\bempathetic\b|\bfeelings\b|\bfriendly\b|\bcaring\b|\bcompassionate\b/i,
    models: [
      { id: 'llama', score: 0.89, reason: 'Great at emotional/empathetic responses' },
      { id: 'mistral', score: 0.87, reason: 'Good at conveying emotions' },
      { id: 'deepseek', score: 0.81, reason: 'Handles emotional content well' }
    ]
  },
  {
    name: 'specialized',
    regex: /\bspecialist\b|\bexpert\b|\bprofessor\b|\bdoctor\b|\bscientist\b|\blawyer\b|\bengineering\b/i,
    models: [
      { id: 'gemini-1.5-pro-latest', score: 0.90, reason: 'Strong in specialized domains' },
      { id: 'llama', score: 0.85, reason: 'Good at maintaining expert personas' },
      { id: 'direct-gemini-pro', score: 0.83, reason: 'Handles expert domains well' }
    ]
  },
  {
    name: 'complex',
    regex: /\bcomplex\b|\bdetailed\b|\bthorough\b|\bin-depth\b|\belaborate\b|\bcomprehensive\b/i,
    models: [
      { id: 'llama', score: 0.91, reason: 'Excellent for complex/detailed responses' },
      { id: 'gemini-1.5-pro-latest', score: 0.89, reason: 'Great at handling complexity' },
      { id: 'mistral', score: 0.84, reason: 'Good at detailed explanations' }
    ]
  }
];

// Default recommendations if no patterns match
const DEFAULT_RECOMMENDATIONS = [
  { id: 'llama', score: 0.85, reason: 'Good general-purpose model that follows system prompts' },
  { id: 'mistral', score: 0.80, reason: 'Reliable model for most system prompts' },
  { id: 'deepseek', score: 0.75, reason: 'Compatible with most system prompts' }
];

// Analyze prompt and generate model recommendations
function generateRecommendations(prompt: string): RecommendationResponse {
  // Normalize and clean prompt
  const normalizedPrompt = prompt.trim().toLowerCase();
  
  // Track detected features
  const detectedFeatures: string[] = [];
  
  // Initial score map for all models
  const modelScores: {[key: string]: {score: number, reasons: string[]}} = {};
  
  // Check for each pattern
  for (const pattern of PATTERNS) {
    if (pattern.regex.test(normalizedPrompt)) {
      detectedFeatures.push(pattern.name);
      
      // Update scores for models in this pattern
      for (const model of pattern.models) {
        if (!modelScores[model.id]) {
          modelScores[model.id] = { score: 0, reasons: [] };
        }
        
        // Add to existing score (with diminishing returns for multiple patterns)
        const existingScore = modelScores[model.id].score;
        const incrementalScore = model.score * (1 - existingScore * 0.5);
        modelScores[model.id].score = Math.min(1, existingScore + incrementalScore);
        
        // Add the reason if it's unique
        if (!modelScores[model.id].reasons.includes(model.reason)) {
          modelScores[model.id].reasons.push(model.reason);
        }
      }
    }
  }
  
  // If no patterns matched, use defaults
  if (Object.keys(modelScores).length === 0) {
    for (const model of DEFAULT_RECOMMENDATIONS) {
      modelScores[model.id] = { 
        score: model.score, 
        reasons: [model.reason]
      };
    }
    detectedFeatures.push('general');
  }
  
  // Convert scores map to array and sort by score
  const recommendations: ModelRecommendation[] = Object.entries(modelScores).map(([id, data]) => ({
    id,
    name: getModelName(id),
    score: Number(data.score.toFixed(2)),
    reason: data.reasons.join('; ')
  }));
  
  // Sort by score (highest first)
  recommendations.sort((a, b) => b.score - a.score);
  
  return {
    recommendations: recommendations.slice(0, 5), // Top 5 recommendations
    prompt: prompt,
    detectedFeatures
  };
}

// Helper to get model name from ID
function getModelName(id: string): string {
  const modelMap: {[key: string]: string} = {
    'llama': 'Llama 3.3',
    'mistral': 'Mistral',
    'deepseek': 'DeepSeek',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-pro-latest': 'Gemini 1.5 Pro',
    'direct-gemini-pro': 'Gemini Pro (Direct)',
    'openai': 'OpenAI GPT-4o-mini',
    'llama-scaleway': 'Llama (Scaleway)',
    'phi': 'Phi-4'
  };
  
  return modelMap[id] || id;
}

export async function POST(req: NextRequest) {
  try {
    // Get request body
    const body = await req.json();
    const { prompt } = body;
    
    // Validate request
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt parameter' },
        { status: 400 }
      );
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(prompt);
    
    // Return recommendations
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error generating model recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 