import React, { useEffect, useState } from 'react';
import { Sparkles, Lightbulb, BrainCircuit } from 'lucide-react';

interface AIInsightsProps {
  step: string;
  field?: string;
  currentValue?: string | string[] | any;
  projectType?: string;
}

export function AIInsights({ step, field, currentValue, projectType }: AIInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (step && field) {
      setIsLoading(true);
      
      // Simulate AI processing time
      const timeout = setTimeout(() => {
        const generatedInsights = generateInsights(step, field, currentValue, projectType);
        setInsights(generatedInsights);
        setIsLoading(false);
      }, 800);
      
      return () => clearTimeout(timeout);
    }
  }, [step, field, currentValue, projectType]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-indigo-900/20 border border-indigo-800 p-4 flex items-center justify-center">
        <div className="animate-pulse flex items-center space-x-2 text-indigo-300">
          <BrainCircuit className="h-5 w-5" />
          <span className="text-sm font-medium">Analyzing your input...</span>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-indigo-900/20 border border-indigo-800 p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="h-4 w-4 text-indigo-300" />
        <h3 className="text-sm font-medium text-indigo-300">AI Insights</h3>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li key={index} className="flex items-start space-x-2 text-sm text-white">
            <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p>{insight}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper function to safely check if a value is empty
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

// Helper function to safely convert value to string for analysis
function getValueAsString(value: any): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value || '');
}

function generateInsights(step: string, field: string, currentValue?: any, projectType?: string): string[] {
  // If no value is provided, return empty insights
  if (isEmpty(currentValue)) {
    return [];
  }

  // Convert currentValue to string for analysis
  const valueStr = getValueAsString(currentValue);

  // Generate different insights based on step and field
  switch (step) {
    case 'project-info':
      if (field === 'purpose') {
        const insights = [
          "Consider breaking down your purpose into measurable objectives for clearer focus.",
          "Projects with well-defined purposes typically have higher completion rates."
        ];
        
        // Add conditional insights based on content
        if (valueStr.toLowerCase().includes('website')) {
          insights.push("For website projects, consider your content strategy early in the planning.");
        }
        
        if (valueStr.toLowerCase().includes('app') || valueStr.toLowerCase().includes('application')) {
          insights.push("Mobile app projects benefit from user testing at each development milestone.");
        }
        
        if (valueStr.toLowerCase().includes('marketing')) {
          insights.push("Effective marketing projects clearly define the target audience and conversion metrics.");
        }
        
        return insights;
      }
      
      if (field === 'type') {
        const typeInsights: Record<string, string[]> = {
          business: [
            "Business projects benefit from competitive market analysis.",
            "Consider including a financial projection section in your business plan."
          ],
          software: [
            "Software projects work best with iterative development cycles.",
            "Consider technical requirements and infrastructure needs early."
          ],
          personal: [
            "Personal projects allow for more creative freedom in design choices.",
            "Establishing a realistic timeline helps maintain momentum for personal projects."
          ],
          other: [
            "Unique projects often benefit from interdisciplinary approaches.",
            "Consider documenting your process for future reference."
          ]
        };
        
        return typeInsights[valueStr] || typeInsights.other;
      }
      break;
      
    case 'branding':
      if (field === 'brandStyle') {
        const insights = [
          "Strong brands maintain consistency across all touchpoints.",
          "Your brand style should resonate with your target audience's preferences."
        ];
        
        // Add conditional insights
        if (valueStr.toLowerCase().includes('modern') || valueStr.toLowerCase().includes('minimal')) {
          insights.push("Modern minimalist designs often use whitespace strategically to create focus.");
        }
        
        if (valueStr.toLowerCase().includes('playful') || valueStr.toLowerCase().includes('vibrant')) {
          insights.push("Playful brands often benefit from animation elements in digital products.");
        }
        
        if (valueStr.toLowerCase().includes('luxury') || valueStr.toLowerCase().includes('premium')) {
          insights.push("Premium brands typically use subdued color palettes with metallic accents.");
        }
        
        return insights;
      }
      
      if (field === 'targetAudience') {
        return [
          "The more specific your target audience definition, the more effective your marketing will be.",
          "Consider creating user personas to better understand your audience's needs and preferences.",
          "Different audience segments may respond better to different communication styles."
        ];
      }
      break;
      
    case 'website':
      if (field === 'websiteNeeds') {
        const insights = [
          "Plan your site architecture with user journeys in mind.",
          "Website speed is a critical factor for both user experience and SEO."
        ];
        
        if (valueStr.toLowerCase().includes('ecommerce') || valueStr.toLowerCase().includes('shop')) {
          insights.push("E-commerce sites require particular attention to security and payment processing.");
          insights.push("Product filtering and search functionality significantly impact conversion rates.");
        }
        
        if (valueStr.toLowerCase().includes('content') || valueStr.toLowerCase().includes('blog')) {
          insights.push("Content-focused sites benefit from clear categorization and robust search capabilities.");
        }
        
        if (valueStr.toLowerCase().includes('lead') || valueStr.toLowerCase().includes('conversion')) {
          insights.push("Lead generation sites work best with streamlined forms and clear calls to action.");
        }
        
        return insights;
      }
      break;
      
    case 'marketing':
      if (field === 'marketingGoals') {
        const insights = [
          "Effective marketing strategies focus on specific, measurable objectives.",
          "Consider the customer journey when developing your marketing tactics."
        ];
        
        if (valueStr.toLowerCase().includes('brand awareness')) {
          insights.push("Brand awareness campaigns work well with storytelling and visual consistency.");
        }
        
        if (valueStr.toLowerCase().includes('lead generation')) {
          insights.push("Lead generation typically requires valuable content offers and streamlined conversion paths.");
        }
        
        if (valueStr.toLowerCase().includes('sales') || valueStr.toLowerCase().includes('revenue')) {
          insights.push("Sales-focused marketing requires clear tracking of attribution and ROI metrics.");
        }
        
        return insights;
      }
      break;
      
    case 'timeline':
      if (field === 'timeline') {
        const insights = [
          "Building buffer time into your schedule helps accommodate unexpected challenges.",
          "Breaking larger milestones into smaller tasks improves tracking and accountability."
        ];
        
        if (valueStr.toLowerCase().includes('month')) {
          insights.push("Monthly milestones help maintain momentum while allowing for course correction.");
        }
        
        if (valueStr.toLowerCase().includes('agile') || valueStr.toLowerCase().includes('sprint')) {
          insights.push("Agile approaches work best with regular retrospectives to improve processes.");
        }
        
        if (valueStr.toLowerCase().includes('deadline') || valueStr.toLowerCase().includes('launch')) {
          insights.push("Working backward from key deadlines can help identify critical path dependencies.");
        }
        
        return insights;
      }
      break;
      
    default:
      return [];
  }
  
  return [];
} 