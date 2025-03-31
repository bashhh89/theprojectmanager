import { TextGenerationRequest, generateText } from '../pollinationsApi';

interface ProjectAnalysis {
  title: string;
  description: string;
  objectives: string[];
  timeline: string;
  type: 'software' | 'business' | 'personal' | 'other';
  branding: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    typography: {
      headingFont: string;
      bodyFont: string;
      fontPairings: Array<{
        heading: string;
        body: string;
        usage: string;
      }>;
    };
    logoSuggestions: Array<{
      description: string;
      prompt: string;
      style: string;
    }>;
    brandVoice: {
      tone: string;
      personality: string[];
      keywords: string[];
      samplePhrases: string[];
    };
  };
  website: {
    structure: {
      pages: Array<{
        name: string;
        path: string;
        sections: Array<{
          type: string;
          content: any;
          layout: string;
        }>;
      }>;
      navigation: {
        primary: Array<{
          label: string;
          path: string;
        }>;
        footer: Array<{
          section: string;
          links: Array<{
            label: string;
            path: string;
          }>;
        }>;
      };
    };
    content: {
      homepage: {
        hero: {
          headline: string;
          subheadline: string;
          ctaText: string;
          imagePrompt: string;
        };
        sections: Array<{
          title: string;
          content: string;
          imagePrompt: string;
          type: string;
        }>;
      };
      about: {
        story: string;
        mission: string;
        vision: string;
        values: Array<{
          title: string;
          description: string;
          iconPrompt: string;
        }>;
      };
      services: Array<{
        title: string;
        description: string;
        features: string[];
        imagePrompt: string;
        pricing?: {
          amount: number;
          currency: string;
          period: string;
          features: string[];
        };
      }>;
    };
  };
  marketing: {
    socialMedia: {
      platforms: Array<{
        name: string;
        strategy: string;
        postTypes: Array<{
          type: string;
          frequency: string;
          templates: Array<{
            description: string;
            imagePrompt: string;
            captionTemplate: string;
            hashtags: string[];
          }>;
        }>;
      }>;
      contentCalendar: Array<{
        week: number;
        theme: string;
        posts: Array<{
          platform: string;
          content: string;
          imagePrompt: string;
          scheduledFor: string;
        }>;
      }>;
    };
    emailMarketing: {
      campaigns: Array<{
        name: string;
        type: 'welcome' | 'newsletter' | 'promotion' | 'announcement';
        subject: string;
        content: string;
        imagePrompts: string[];
      }>;
      automations: Array<{
        trigger: string;
        sequence: Array<{
          delay: string;
          subject: string;
          content: string;
        }>;
      }>;
    };
  };
  milestones: Array<{
    title: string;
    description: string;
    deadline: string;
    tasks: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      estimatedHours: number;
      subtasks: Array<{
        title: string;
        description: string;
        status: 'pending' | 'in_progress' | 'completed';
      }>;
      requirements: string[];
      skills: string[];
    }>;
  }>;
  visualElements: {
    suggestedImages: string[];
    chartTypes: string[];
    kanbanStructure: {
      columns: Array<{
        title: string;
        description: string;
      }>;
    };
  };
  risks: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  metrics: {
    keyPerformanceIndicators: string[];
    successCriteria: string[];
    healthChecks: string[];
  };
}

const ANALYSIS_PROMPT = `As an AI project management and branding expert, analyze the following project details to create an extremely comprehensive and detailed project structure including branding, website content, and marketing strategy.

IMPORTANT: Create a project structure with exceptional detail and depth. This should include:
- 8-10 comprehensive milestones covering the entire project lifecycle
- 4-6 detailed tasks for each milestone
- 2-4 specific subtasks for each task
- Comprehensive branding strategy with detailed visual guidelines
- Detailed marketing plans across multiple platforms
- Complete website structure with content for all pages
- Detailed risk assessment with mitigation strategies
- Comprehensive metrics and success criteria

Format the response as a valid JSON object with the following structure:
{
  "title": "Project title",
  "description": "Comprehensive project description",
  "objectives": ["List of specific objectives"],
  "timeline": "Overall timeline",
  "type": "project type (software/business/personal/other)",
  "branding": {
    "colors": {
      "primary": "Hex color with explanation",
      "secondary": "Hex color with explanation",
      "accent": "Hex color with explanation",
      "background": "Hex color with explanation",
      "text": "Hex color with explanation"
    },
    "typography": {
      "headingFont": "Suggested Google Font name",
      "bodyFont": "Suggested Google Font name",
      "fontPairings": [
        {
          "heading": "Font name",
          "body": "Font name",
          "usage": "Where to use this pairing"
        }
      ]
    },
    "logoSuggestions": [
      {
        "description": "Logo concept description",
        "prompt": "Detailed image generation prompt",
        "style": "Modern/Minimal/etc"
      }
    ],
    "brandVoice": {
      "tone": "Professional/Friendly/etc",
      "personality": ["Brand personality traits"],
      "keywords": ["Brand-specific keywords"],
      "samplePhrases": ["Example brand voice phrases"]
    }
  },
  "website": {
    "structure": {
      "pages": [
        {
          "name": "Page name",
          "path": "/url-path",
          "sections": [
            {
              "type": "section type",
              "content": "Section content",
              "imagePrompt": "Image generation prompt"
            }
          ]
        }
      ],
      "navigation": {
        "primary": [
          {
            "label": "Nav item label",
            "path": "/path"
          }
        ],
        "footer": [
          {
            "section": "Footer section name",
            "links": [
              {
                "label": "Link label",
                "path": "/path"
              }
            ]
          }
        ]
      }
    },
    "content": {
      "homepage": {
        "hero": {
          "headline": "Attention-grabbing headline",
          "subheadline": "Supporting text",
          "ctaText": "Call to action button text",
          "imagePrompt": "Hero image generation prompt"
        },
        "sections": [
          {
            "title": "Section title",
            "content": "Section content",
            "imagePrompt": "Section image prompt",
            "type": "feature/testimonial/cta/stats"
          }
        ]
      },
      "about": {
        "story": "Company story",
        "mission": "Mission statement",
        "vision": "Vision statement",
        "values": [
          {
            "title": "Value name",
            "description": "Value description",
            "iconPrompt": "Icon generation prompt"
          }
        ]
      },
      "services": [
        {
          "title": "Service name",
          "description": "Service description",
          "features": ["Service features"],
          "imagePrompt": "Service image prompt",
          "pricing": {
            "amount": 0,
            "currency": "USD",
            "period": "monthly/yearly",
            "features": ["Pricing features"]
          }
        }
      ]
    }
  },
  "marketing": {
    "socialMedia": {
      "platforms": [
        {
          "name": "Platform name",
          "strategy": "Platform strategy",
          "postTypes": [
            {
              "type": "Post type",
              "frequency": "Posting frequency",
              "templates": [
                {
                  "description": "Template description",
                  "imagePrompt": "Image generation prompt",
                  "captionTemplate": "Caption template",
                  "hashtags": ["Relevant hashtags"]
                }
              ]
            }
          ]
        }
      ],
      "contentCalendar": [
        {
          "week": 1,
          "theme": "Content theme",
          "posts": [
            {
              "platform": "Platform name",
              "content": "Post content",
              "imagePrompt": "Image prompt",
              "scheduledFor": "Posting time"
            }
          ]
        }
      ]
    },
    "emailMarketing": {
      "campaigns": [
        {
          "name": "Campaign name",
          "type": "welcome/newsletter/promotion/announcement",
          "subject": "Email subject",
          "content": "Email content",
          "imagePrompts": ["Email image prompts"]
        }
      ],
      "automations": [
        {
          "trigger": "Automation trigger",
          "sequence": [
            {
              "delay": "Time delay",
              "subject": "Email subject",
              "content": "Email content"
            }
          ]
        }
      ]
    }
  },
  "milestones": [
    {
      "title": "Milestone title",
      "description": "Milestone description",
      "deadline": "Milestone deadline",
      "tasks": [
        {
          "title": "Task title",
          "description": "Task description",
          "priority": "high/medium/low",
          "estimatedHours": 0,
          "subtasks": [
            {
              "title": "Subtask title",
              "description": "Subtask description",
              "status": "pending"
            }
          ],
          "requirements": ["Required resources"],
          "skills": ["Required skills"]
        }
      ]
    }
  ],
  "visualElements": {
    "suggestedImages": ["Image generation prompts"],
    "chartTypes": ["Chart types"],
    "kanbanStructure": {
      "columns": [
        {
          "title": "Column title",
          "description": "Column description"
        }
      ]
    }
  },
  "risks": [
    {
      "title": "Risk title",
      "description": "Risk description",
      "severity": "high/medium/low",
      "mitigation": "Risk mitigation strategy"
    }
  ],
  "metrics": {
    "keyPerformanceIndicators": ["KPIs"],
    "successCriteria": ["Success criteria"],
    "healthChecks": ["Health checks"]
  }
}

Project Details:
Purpose: {purpose}
Timeline: {timeline}
Type: {type}

Generate an extremely detailed and comprehensive project structure that includes branding, website content, and marketing strategy. Focus on creating a cohesive brand identity and actionable marketing plan. The plan should be detailed enough to serve as a complete blueprint for immediate implementation.`;

const SYSTEM_PROMPT = `You are an expert project manager, brand strategist, and marketing consultant. Your goal is to create extremely detailed, practical, and actionable plans that cover project management, branding, website content, and marketing strategy.

IMPORTANT INSTRUCTIONS FOR JSON RESPONSE:
1. You MUST respond with ONLY a valid JSON object.
2. Do not include ANY text before or after the JSON.
3. Do not use markdown formatting or code blocks.
4. Do not include any explanations or comments.
5. All arrays must be properly initialized, even if empty.
6. All required fields must have non-null values.
7. All dates must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ).
8. All color values must be valid hex codes (e.g., "#FF0000").
9. All URLs must start with '/'.
10. All text content must be properly escaped for JSON.
11. Use empty strings or arrays instead of null values.
12. Ensure all JSON keys are properly quoted.
13. Use proper JSON syntax with commas between items.
14. Arrays and objects must be properly closed.

CRITICAL INSTRUCTIONS FOR COMPREHENSIVE PROJECT CREATION:
1. Create at least 8-10 detailed milestones covering all project phases from initiation to completion
2. Each milestone must have 4-6 detailed tasks with clear descriptions
3. Each task should have 2-4 subtasks with specific actionable steps
4. Include detailed marketing plans with specific content strategies for multiple platforms
5. Provide comprehensive branding guidelines including detailed visual elements
6. Include at least 5-7 detailed risks with mitigation strategies
7. Create specific, measurable metrics and KPIs (at least 5-7 items)
8. Provide detailed website structure with content for all major pages
9. Include specific timeframes and deadlines for all milestones

Required fields in the response:
- title: string (comprehensive, specific title)
- description: string (detailed 3-5 sentence description)
- type: one of ["software", "business", "personal", "other"]
- objectives: string[] (at least 5-7 specific objectives)
- timeline: string (specific timeline with phases)
- milestones: array (at least 8-10 detailed items)
  - Each milestone must have: title, description, deadline, tasks
  - Each task must have: title, description, priority, estimatedHours, requirements, skills
  - Each task must have at least 2-4 detailed subtasks

The project plan should be comprehensive enough to serve as a complete blueprint that can be immediately implemented without additional planning.`;

// Helper function for API requests with exponential backoff (using Pollinations API)
async function getChatCompletionWithRetry(params: any, maxRetries = 3, initialDelay = 1000) {
  let retries = 0;
  let delay = initialDelay;

  while (retries < maxRetries) {
    try {
      console.log(`Using Pollinations API with model: ${params.model}`);
      
      // Convert OpenAI-style params to Pollinations format
      const pollinationsParams = {
        messages: params.messages,
        model: params.model,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 3500
      };
      
      // Call Pollinations API instead of OpenAI directly
      const response = await generateText(pollinationsParams);
      
      if (!response || !response.text) {
        throw new Error('Invalid or empty response from Pollinations API');
      }
      
      // Format the response to match OpenAI structure for compatibility
      return {
        choices: [
          {
            message: {
              content: response.text
            }
          }
        ]
      };
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error);
      
      if (retries === maxRetries - 1) {
        throw error; // Last retry failed
      }
      
      // Exponential backoff with jitter
      await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 200));
      delay *= 2; // Exponential backoff
      retries++;
    }
  }

  throw new Error('Max retries exceeded');
}

// Export the ProjectAnalysis type and the additional type for the function params
export interface ProjectResponsesData {
  model: string;
  purpose: string;
  type: string;
  timeline?: string;
  brandStyle?: string;
  targetAudience?: string;
  marketingGoals?: string | string[];
  websiteNeeds?: string | string[];
}

export async function analyzeProjectResponses(projectData: ProjectResponsesData): Promise<ProjectAnalysis> {
  try {
    validateRequiredFields(projectData);

    // Generate random branding colors based on project inputs
    const brandingColors = generateDynamicBrandingColors(projectData.brandStyle, projectData.type);
    
    // Format marketingGoals and websiteNeeds arrays into comma-separated strings if they're arrays
    const marketingGoalsStr = Array.isArray(projectData.marketingGoals) 
      ? projectData.marketingGoals.join(', ') 
      : projectData.marketingGoals || '';
      
    const websiteNeedsStr = Array.isArray(projectData.websiteNeeds) 
      ? projectData.websiteNeeds.join(', ') 
      : projectData.websiteNeeds || '';
    
    const openaiResponse = await getChatCompletionWithRetry({
      model: projectData.model,
      temperature: 0.7,
      max_tokens: 3500,
      messages: [
        {
          role: "system",
          content: `You are a comprehensive project planning and analysis expert.
          Your task is to analyze project inputs and generate detailed, actionable plans.
          Provide thorough, thoughtful analysis with specific, customized recommendations.
          Make the project plan truly personalized and unique to this specific project.
          Use concrete examples and specific strategies whenever possible.
          For branding, incorporate the user's preferences but enhance them with creative, differentiated suggestions.
          Use the provided branding colors in your suggestions.`
        },
        {
          role: "user",
          content: `Generate a comprehensive project plan based on the following inputs:
          
          Purpose: ${projectData.purpose}
          Project Type: ${projectData.type}
          ${projectData.timeline ? `Timeline: ${projectData.timeline}` : ''}
          ${projectData.brandStyle ? `Brand Style: ${projectData.brandStyle}` : ''}
          ${projectData.targetAudience ? `Target Audience: ${projectData.targetAudience}` : ''}
          ${marketingGoalsStr ? `Marketing Goals: ${marketingGoalsStr}` : ''}
          ${websiteNeedsStr ? `Website Needs: ${websiteNeedsStr}` : ''}
          
          Provide a JSON response with the following structure:
          {
            "title": "Project title derived from purpose",
            "description": "Expanded description of the project",
            "objectives": ["Key objective 1", "Key objective 2", "Key objective 3"],
            "timeline": {
              "phases": [
                {
                  "name": "Phase name",
                  "description": "Phase description",
                  "duration": "Duration in weeks",
                  "tasks": ["Task 1", "Task 2"]
                }
              ]
            },
            "type": "Project type (business, software, personal, etc.)",
            "branding": {
              "name": "Suggested brand name",
              "tagline": "Brand tagline or slogan",
              "description": "Brand identity description",
              "primaryColor": "${brandingColors.primary}",
              "secondaryColor": "${brandingColors.secondary}",
              "accentColor": "${brandingColors.accent}",
              "backgroundTheme": "light or dark",
              "typography": {
                "headingFont": "Suggested font family for headings",
                "bodyFont": "Suggested font family for body text",
                "style": "Typographic style description"
              },
              "visualElements": ["Visual element 1", "Visual element 2"]
            },
            "website": {
              "structure": {
                "pages": [
                  {
                    "name": "Page name",
                    "path": "/url-path",
                    "sections": [
                      {
                        "type": "Section type (hero, features, etc.)",
                        "title": "Section title",
                        "content": "Section content description"
                      }
                    ]
                  }
                ]
              }
            },
            "marketingStrategy": {
              "channels": [
                {
                  "name": "Channel name",
                  "description": "How to use this channel",
                  "priority": "high, medium, or low"
                }
              ],
              "contentPlan": ["Content idea 1", "Content idea 2"],
              "targetAudience": "Target audience description" 
            },
            "milestones": [
              {
                "title": "Milestone title",
                "description": "Milestone description",
                "deadline": "Deadline in ISO format",
                "tasks": [
                  {
                    "title": "Task title",
                    "description": "Task description",
                    "priority": "Priority level",
                    "estimatedHours": Number of hours,
                    "requirements": ["Requirement 1", "Requirement 2"],
                    "skills": ["Skill 1", "Skill 2"],
                    "subtasks": [
                      {
                        "title": "Subtask title",
                        "description": "Subtask description",
                        "status": "pending"
                      }
                    ]
                  }
                ]
              }
            ],
            "risks": ["Risk 1", "Risk 2", "Risk 3"],
            "metrics": ["Metric 1", "Metric 2", "Metric 3"],
            "visualElements": {
              "kanbanStructure": {
                "columns": [
                  {
                    "title": "Column title",
                    "description": "Column description"
                  }
                ]
              }
            }
          }
          `
        }
      ]
    });

    console.log("OpenAI Response: ", openaiResponse);
    
    if (!openaiResponse.choices || openaiResponse.choices.length === 0) {
      throw new Error('Invalid response from AI service');
    }

    // Extract JSON from the completion text - handle both JSON string and object formats
    let jsonContent = '';
    try {
      jsonContent = openaiResponse.choices[0]?.message?.content || '';
      
      // Handle when the content is wrapped with backticks or contains markdown
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                         jsonContent.match(/\{[\s\S]*\}/);
                         
      if (jsonMatch && jsonMatch[1]) {
        jsonContent = jsonMatch[1];
      } else if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const analysis = JSON.parse(jsonContent);
      return analysis;
    } catch (error) {
      console.error('Error parsing JSON from OpenAI response:', error);
      console.error('Raw content:', jsonContent);
      throw new Error('Failed to parse project analysis from AI service');
    }
  } catch (error) {
    console.error('Error in analyzeProjectResponses:', error);
    throw error;
  }
}

// Validate that required fields are present
function validateRequiredFields(projectData: any) {
  if (!projectData.purpose || !projectData.type) {
    throw new Error('Missing required project data: purpose and type are required');
  }
}

// Helper function to generate dynamic branding colors based on project inputs
function generateDynamicBrandingColors(brandStyle?: string, projectType?: string): { primary: string, secondary: string, accent: string } {
  // Default colors if no preferences are provided
  const defaults = {
    business: { primary: '#2563eb', secondary: '#1e40af', accent: '#7dd3fc' },
    software: { primary: '#6366f1', secondary: '#4338ca', accent: '#a5b4fc' },
    personal: { primary: '#ec4899', secondary: '#be185d', accent: '#f9a8d4' },
    other: { primary: '#10b981', secondary: '#065f46', accent: '#6ee7b7' }
  };
  
  // Start with defaults based on project type
  const baseColors = defaults[projectType as keyof typeof defaults] || defaults.other;
  
  // Modify colors based on brand style if provided
  if (brandStyle) {
    const brandStyleLower = brandStyle.toLowerCase();
    
    // Color modifications based on brand style keywords
    if (brandStyleLower.includes('modern') || brandStyleLower.includes('minimal')) {
      return { 
        primary: '#3b82f6', 
        secondary: '#1e40af', 
        accent: '#93c5fd' 
      };
    }
    
    if (brandStyleLower.includes('playful') || brandStyleLower.includes('creative') || brandStyleLower.includes('vibrant')) {
      return { 
        primary: '#ec4899', 
        secondary: '#db2777', 
        accent: '#f472b6' 
      };
    }
    
    if (brandStyleLower.includes('luxury') || brandStyleLower.includes('premium') || brandStyleLower.includes('elegant')) {
      return { 
        primary: '#6b7280', 
        secondary: '#111827', 
        accent: '#f59e0b' 
      };
    }
    
    if (brandStyleLower.includes('trust') || brandStyleLower.includes('professional') || brandStyleLower.includes('corporate')) {
      return { 
        primary: '#1e40af', 
        secondary: '#1e3a8a', 
        accent: '#60a5fa' 
      };
    }
    
    if (brandStyleLower.includes('eco') || brandStyleLower.includes('green') || brandStyleLower.includes('sustain')) {
      return { 
        primary: '#059669', 
        secondary: '#065f46', 
        accent: '#34d399' 
      };
    }
    
    if (brandStyleLower.includes('tech') || brandStyleLower.includes('future') || brandStyleLower.includes('innov')) {
      return { 
        primary: '#3b82f6', 
        secondary: '#1e40af', 
        accent: '#6ee7b7' 
      };
    }
  }
  
  // Add slight randomization to make each set unique even with the same inputs
  const randomizeColor = (hexColor: string): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Add small random variation (±10)
    const variation = 10;
    const newR = Math.max(0, Math.min(255, r + Math.floor(Math.random() * variation * 2) - variation));
    const newG = Math.max(0, Math.min(255, g + Math.floor(Math.random() * variation * 2) - variation));
    const newB = Math.max(0, Math.min(255, b + Math.floor(Math.random() * variation * 2) - variation));
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };
  
  return {
    primary: randomizeColor(baseColors.primary),
    secondary: randomizeColor(baseColors.secondary),
    accent: randomizeColor(baseColors.accent)
  };
} 