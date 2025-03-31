import React from 'react';
import { Check, X, AlertTriangle, Clock, Users, PenTool, Globe, BarChart } from 'lucide-react';

interface ProjectReviewProps {
  projectData: {
    purpose: string;
    type: string;
    timeline?: string;
    brandStyle?: string;
    targetAudience?: string;
    marketingGoals?: string | string[];
    websiteNeeds?: string | string[];
    model: string;
  };
  onBack: () => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

// Define field types
interface ReviewField {
  label: string;
  value?: string | string[];
  required?: boolean;
  displayValue?: string;
}

// Helper function to format field values
function formatFieldValue(value: string | string[] | undefined): string {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(', ');
  return value;
}

export function ProjectReview({ projectData, onBack, onSubmit, isProcessing }: ProjectReviewProps) {
  // Define the sections to display in the review
  const reviewSections = [
    {
      title: 'Project Basics',
      icon: <Clock className="h-5 w-5 text-blue-400" />,
      fields: [
        { label: 'Purpose', value: projectData.purpose, required: true },
        { label: 'Type', value: projectData.type, required: true, 
          displayValue: {
            'business': 'Business (website, marketing, brand identity)',
            'software': 'Software (app, platform, tool)',
            'personal': 'Personal (blog, portfolio, creative)',
            'other': 'Other'
          }[projectData.type] || projectData.type 
        },
        { label: 'Timeline', value: projectData.timeline }
      ] as ReviewField[]
    },
    {
      title: 'Brand & Identity',
      icon: <PenTool className="h-5 w-5 text-pink-400" />,
      fields: [
        { label: 'Brand Style', value: projectData.brandStyle },
        { label: 'Target Audience', value: projectData.targetAudience }
      ] as ReviewField[]
    },
    {
      title: 'Web & Marketing',
      icon: <Globe className="h-5 w-5 text-emerald-400" />,
      fields: [
        { 
          label: 'Website Needs', 
          value: projectData.websiteNeeds,
          displayValue: formatFieldValue(projectData.websiteNeeds)
        },
        { 
          label: 'Marketing Goals', 
          value: projectData.marketingGoals,
          displayValue: formatFieldValue(projectData.marketingGoals)
        }
      ] as ReviewField[]
    },
    {
      title: 'AI Analysis',
      icon: <BarChart className="h-5 w-5 text-purple-400" />,
      fields: [
        { label: 'AI Model', value: projectData.model, 
          displayValue: projectData.model.replace(/-/g, ' ').replace('latest', '').trim() 
        }
      ] as ReviewField[]
    }
  ];

  // Check if all required fields are filled
  const missingRequiredFields = reviewSections
    .flatMap(section => section.fields)
    .filter(field => field.required && (!field.value || (typeof field.value === 'string' && field.value.trim() === '')))
    .map(field => field.label);

  const hasMissingFields = missingRequiredFields.length > 0;

  return (
    <div className="space-y-6">
      {hasMissingFields && (
        <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-500 font-medium">Missing Required Information</h4>
              <p className="text-gray-300 text-sm mt-1">
                Please provide the following required information:
                {' '}
                {missingRequiredFields.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviewSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center space-x-3">
              {section.icon}
              <h3 className="font-medium text-white">{section.title}</h3>
            </div>
            <div className="p-4 space-y-4">
              {section.fields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">{field.label}</div>
                    {field.required && (
                      <div className={`flex items-center text-xs ${!field.value ? 'text-red-500' : 'text-green-500'}`}>
                        {!field.value ? (
                          <>
                            <X className="h-3.5 w-3.5 mr-1" />
                            Required
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Complete
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-white bg-gray-700 p-3 rounded-lg text-sm">
                    {field.displayValue || field.value || (
                      <span className="text-gray-500 italic">Not provided</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-700 text-gray-300 rounded hover:bg-gray-700 transition-colors text-sm"
        >
          Back
        </button>
        
        <button
          type="button"
          onClick={onSubmit}
          disabled={isProcessing || hasMissingFields}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Create Project'}
        </button>
      </div>
    </div>
  );
} 