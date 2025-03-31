import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModelSelector } from './ModelSelector';
import { analyzeProjectResponses, ProjectResponsesData } from '@/lib/ai-services/projectAnalysis';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Sparkles, SendHorizontal, ArrowRight, Bot, Loader2 } from 'lucide-react';
import { BrandingPreview } from './BrandingPreview';
import { AIInsights } from './AIInsights';
import { WizardProgress } from './WizardProgress';
import { ProjectReview } from './ProjectReview';
import { createWorkspaceForProject } from '@/lib/anythingllm-service';

interface ProjectCreationWizardProps {
  user: User;
  onProjectCreated?: (projectId: string) => void;
}

type WizardStep = 
  | 'project-info'
  | 'branding'
  | 'website'
  | 'marketing'
  | 'timeline'
  | 'review';

// Example responses for intelligent suggestions
const SUGGESTIONS = {
  purpose: [
    "An e-commerce platform selling sustainable fashion products directly to environmentally conscious consumers",
    "A B2B SaaS platform that helps small businesses manage their inventory and order fulfillment",
    "A community platform connecting remote workers with local coworking spaces and networking events"
  ],
  brandStyle: [
    "Modern and minimal design with bold typography, clean lines, and a focus on sustainability",
    "Professional and trustworthy with a blue-focused color scheme and serif fonts for established credibility",
    "Playful and creative with vibrant colors, hand-drawn elements, and friendly typography"
  ],
  targetAudience: [
    "Urban professionals aged 25-40 who prioritize sustainability and are willing to pay premium prices for quality",
    "Small business owners with 5-50 employees who need better operational efficiency",
    "Remote tech workers looking for community and networking opportunities in new cities"
  ],
  websiteNeeds: [
    "E-commerce functionality with product catalog, secure checkout, and customer accounts",
    "Client portal with dashboard, file sharing, and secure messaging capabilities",
    "Content-driven site with blog, resource library, and email newsletter signup"
  ],
  marketingGoals: [
    "Build brand awareness through content marketing and strategic partnerships with complementary brands",
    "Generate qualified leads through targeted digital advertising and free resource downloads",
    "Create an engaged community through social media presence and user-generated content"
  ],
  timeline: [
    "3-month aggressive timeline with weekly milestones to launch MVP by Q3",
    "6-month comprehensive approach with thorough testing phases before full market launch",
    "Phased 12-month rollout with quarterly feature additions based on user feedback"
  ]
};

// Define the question interface to ensure type safety
interface WizardQuestion {
  question: string;
  field: string;
  placeholder?: string;
  aiPrompt: string;
  required: boolean;
  type?: string;
  options?: Array<{value: string; label: string}>;
}

// Define the step questions with proper typing
type StepQuestionsType = {
  [key in Exclude<WizardStep, 'review'>]: WizardQuestion[];
};

// Add a helper function to parse JSON safely
function tryParseJSON(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    return null;
  }
}

// Helper function to check if a value is empty (similar to the one in AIInsights)
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function ProjectCreationWizard({ user, onProjectCreated }: ProjectCreationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('project-info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);

  // Enhanced state initialization to handle complex project data
  const [projectData, setProjectData] = useState({
    model: 'google-gemini-1.5-pro-latest',
    purpose: '',
    type: 'business',
    timeline: '',
    brandStyle: '',
    targetAudience: '',
    marketingGoals: [] as string[],
    websiteNeeds: [] as string[]
  });

  // Define conversational questions for each step with proper typing
  const stepQuestions: StepQuestionsType = {
    'project-info': [
      {
        question: "What's the main purpose of your project?",
        field: "purpose",
        placeholder: "Tell me about the core purpose of your project...",
        aiPrompt: "I'll help you define your project. What are you trying to accomplish?",
        required: true
      },
      {
        question: "What type of project is this?",
        field: "type",
        type: "select",
        options: [
          { value: "business", label: "Business (website, marketing, brand identity)" },
          { value: "software", label: "Software (app, platform, tool)" },
          { value: "personal", label: "Personal (blog, portfolio, creative)" },
          { value: "other", label: "Other" }
        ],
        aiPrompt: "Let's categorize this project to better guide our approach.",
        required: true
      }
    ],
    'branding': [
      {
        question: "How would you describe your ideal brand style?",
        field: "brandStyle",
        placeholder: "Modern, traditional, playful, luxury, minimalist...",
        aiPrompt: "Your brand's visual personality sets the tone for everything. What style resonates with your vision?",
        required: false
      },
      {
        question: "Who is your target audience?",
        field: "targetAudience",
        placeholder: "Describe the people you want to reach...",
        aiPrompt: "Understanding your audience helps create a brand that connects. Who are you trying to reach?",
        required: false
      }
    ],
    'website': [
      {
        question: "What are your website needs and goals?",
        field: "websiteNeeds",
        type: "multi-select",
        placeholder: "E-commerce, content showcase, lead generation...",
        aiPrompt: "Your website is your digital home. What functionality does it need to achieve your goals?",
        required: false
      }
    ],
    'marketing': [
      {
        question: "What are your key marketing goals?",
        field: "marketingGoals",
        type: "multi-select",
        placeholder: "Brand awareness, lead generation, community building...",
        aiPrompt: "Marketing connects you with your audience. What do you want to achieve?",
        required: false
      }
    ],
    'timeline': [
      {
        question: "What's your timeline for this project?",
        field: "timeline",
        placeholder: "3 months, 6 months, ongoing...",
        aiPrompt: "Great! Now let's talk about timing. When do you want to launch or complete different phases?",
        required: false
      }
    ]
  };

  // Get current step's questions - handle 'review' step separately
  const currentQuestions = currentStep !== 'review' ? stepQuestions[currentStep] : [];
  const currentQuestionData = currentQuestions[activeQuestion] || null;
  
  // Determine if can proceed to next question
  const canProceedToNextQuestion = 
    !currentQuestionData?.required || 
    (currentQuestionData?.field && projectData[currentQuestionData.field as keyof typeof projectData]);
  
  // Function to handle input changes with more interactive behavior
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
    
    // Show "thinking" indicator for a brief moment to simulate AI engagement
    if (value.length > 10 && !isThinking) {
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
      }, 1000);
    }
  };

  // Handle multi-select options
  const handleMultiSelectOption = (field: string, value: string) => {
    setProjectData(prev => {
      const currentValues = prev[field as keyof typeof prev] as string[];
      
      // If already selected, remove it; otherwise add it
      if (Array.isArray(currentValues)) {
        return currentValues.includes(value)
          ? { ...prev, [field]: currentValues.filter(v => v !== value) }
          : { ...prev, [field]: [...currentValues, value] };
      }
      
      // Initialize as array if it wasn't already
      return { ...prev, [field]: [value] };
    });
  };

  // Apply suggestion (modified to handle arrays and provide feedback)
  const applySuggestion = (field: string, value: string) => {
    if (field === 'websiteNeeds' || field === 'marketingGoals') {
      // For multi-select fields
      handleMultiSelectOption(field, value);
      // Add a subtle flash effect or toast notification here if desired
    } else {
      // For text fields, replace or append based on current value
      setProjectData(prev => {
        const currentValue = prev[field as keyof typeof prev];
        // If the field is currently empty, just set it to the suggestion
        // Otherwise, append the suggestion to what's already there
        const newValue = !currentValue || (typeof currentValue === 'string' && currentValue.trim() === '') 
          ? value 
          : `${currentValue}. ${value}`;
        return { ...prev, [field]: newValue };
      });
    }
    
    // Close suggestions panel after selection
    setShowSuggestions(null);
    
    // Optional: Show a brief confirmation that the suggestion was applied
    const confirmationElement = document.createElement('div');
    confirmationElement.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 animate-fade-in-out';
    confirmationElement.textContent = 'Suggestion applied!';
    document.body.appendChild(confirmationElement);
    
    // Remove the confirmation after a short delay
    setTimeout(() => {
      document.body.removeChild(confirmationElement);
    }, 2000);
  };

  // Navigate to next question or step
  const handleNextQuestion = () => {
    // Save response for animation effect
    if (currentQuestionData) {
      setResponses(prev => [...prev, projectData[currentQuestionData.field as keyof typeof projectData] as string]);
    }
    
    // Check if there are more questions in current step
    if (activeQuestion < currentQuestions.length - 1) {
      // Move to next question in current step
      setActiveQuestion(prev => prev + 1);
    } else {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      // Move to next step and reset active question
      const currentIndex = steps.findIndex(step => step.id === currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id);
        setActiveQuestion(0);
      }
    }
  };

  const handleBack = () => {
    if (activeQuestion > 0) {
      // Go back to previous question in current step
      setActiveQuestion(prev => prev - 1);
    } else {
      // Go back to previous step and set active question to last question of that step
      const currentIndex = steps.findIndex(step => step.id === currentStep);
      if (currentIndex > 0) {
        const prevStep = steps[currentIndex - 1].id as Exclude<WizardStep, 'review'>;
        setCurrentStep(prevStep);
        setActiveQuestion(stepQuestions[prevStep].length - 1);
      }
    }
  };

  const steps: Array<{ id: WizardStep; title: string; description: string }> = [
    {
      id: 'project-info',
      title: 'Project Information',
      description: 'Tell us about your project'
    },
    {
      id: 'branding',
      title: 'Branding',
      description: 'Define your brand identity'
    },
    {
      id: 'website',
      title: 'Website',
      description: 'Plan your website structure'
    },
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Set up your marketing strategy'
    },
    {
      id: 'timeline',
      title: 'Timeline',
      description: 'Plan your project timeline'
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and create your project'
    }
  ];

  const handleCreate = async () => {
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    setProcessingStage('Analyzing project data...');

    const timeoutId = setTimeout(() => {
      if (isProcessing) {
        setError('The operation timed out. Please try again later.');
        setIsProcessing(false);
      }
    }, 60000);

    try {
      setProcessingStage('Analyzing project requirements...');
      setProcessingProgress(10);
      
      // Use the projectData directly, which now has the correct type
      const projectDataToAnalyze: ProjectResponsesData = {
        ...projectData
      };
      
      const analysis = await analyzeProjectResponses(projectDataToAnalyze);
      setProcessingProgress(30);

      setProcessingStage('Creating your project...');
      setProcessingProgress(50);
      const { data: projectResult, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            name: analysis.title,
            title: analysis.title,
            description: analysis.description,
            type: analysis.type,
            status: 'active',
            objectives: analysis.objectives,
            timeline: analysis.timeline,
            branding: analysis.branding,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (projectError) throw projectError;
      setProcessingProgress(60);

      // Create AnythingLLM workspace for the project
      setProcessingStage('Setting up AI knowledge base...');
      try {
        await createWorkspaceForProject(projectResult.id, analysis.title);
      } catch (workspaceError) {
        console.error('Error creating AnythingLLM workspace:', workspaceError);
        // Continue with project creation even if workspace creation fails
      }
      setProcessingProgress(70);

      setProcessingStage('Setting up website structure...');
      if (analysis.website?.structure?.pages) {
        const { error: pagesError } = await supabase
          .from('website_pages')
          .insert(
            analysis.website.structure.pages.map(page => ({
              project_id: projectResult.id,
              name: page.name,
              path: page.path,
              layout: { sections: page.sections },
              status: 'draft',
              user_id: user.id
            }))
          );

        if (pagesError) console.error('Error creating pages:', pagesError);
      }
      setProcessingProgress(80);

      setProcessingStage('Creating project milestones and tasks...');
      for (const milestone of analysis.milestones) {
        const { data: milestoneResult, error: milestoneError } = await supabase
          .from('milestones')
          .insert([
            {
              project_id: projectResult.id,
              title: milestone.title,
              description: milestone.description,
              deadline: milestone.deadline,
              status: 'pending',
              user_id: user.id
            }
          ])
          .select()
          .single();

        if (milestoneError) {
          console.error('Error creating milestone:', milestoneError);
          continue;
        }

        for (const task of milestone.tasks) {
          const { data: taskResult, error: taskError } = await supabase
            .from('tasks')
            .insert([
              {
                project_id: projectResult.id,
                milestone_id: milestoneResult.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: 'pending',
                estimated_hours: task.estimatedHours,
                requirements: task.requirements,
                skills: task.skills,
                user_id: user.id
              }
            ])
            .select()
            .single();

          if (taskError) {
            console.error('Error creating task:', taskError);
            continue;
          }

          if (task.subtasks && task.subtasks.length > 0) {
            const { error: subtaskError } = await supabase
              .from('subtasks')
              .insert(
                task.subtasks.map(subtask => ({
                  task_id: taskResult.id,
                  project_id: projectResult.id,
                  title: subtask.title,
                  description: subtask.description,
                  status: subtask.status,
                  user_id: user.id
                }))
              );

            if (subtaskError) console.error('Error creating subtasks:', subtaskError);
          }
        }
      }
      setProcessingProgress(90);

      setProcessingStage('Setting up project workflow...');
      if (analysis.visualElements?.kanbanStructure?.columns) {
        const { error: kanbanError } = await supabase
          .from('kanban_columns')
          .insert(
            analysis.visualElements.kanbanStructure.columns.map((column, index) => ({
              project_id: projectResult.id,
              title: column.title,
              description: column.description,
              order_index: index,
              user_id: user.id
            }))
          );

        if (kanbanError) console.error('Error creating kanban columns:', kanbanError);
      }
      setProcessingProgress(100);

      clearTimeout(timeoutId);

      if (onProjectCreated) {
        onProjectCreated(projectResult.id);
      } else {
        router.push(`/projects/${projectResult.id}`);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
    }
  };
  
  // Render the conversational interface for the current question
  const renderConversationalQuestion = () => {
    if (!currentQuestionData) return null;
    
    return (
      <div className="space-y-5 transition-all duration-300">
        {/* AI prompt */}
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 bg-blue-600/10 p-4 rounded-lg rounded-tl-none max-w-[80%]">
            <p className="text-white">{currentQuestionData.aiPrompt}</p>
            <p className="text-sm text-blue-300 mt-2 font-medium">{currentQuestionData.question}</p>
          </div>
        </div>

        {/* Show branding preview for branding-related questions */}
        {currentStep === 'branding' && currentQuestionData.field === 'brandStyle' && (
          <div className="ml-14 mb-4">
            <BrandingPreview 
              brandStyle={projectData.brandStyle} 
              projectType={projectData.type} 
            />
          </div>
        )}

        {/* Input section */}
        <div className="ml-14 mt-4">
          {/* Show thinking indicator */}
          {isThinking && (
            <div className="flex items-center space-x-2 text-gray-400 animate-pulse text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking of suggestions...</span>
            </div>
          )}
          
          {/* Input field */}
          <div className="relative">
            {currentQuestionData.type === 'select' ? (
              <div className="w-full relative z-10">
                <select 
                  name={currentQuestionData.field}
                  value={projectData[currentQuestionData.field as keyof typeof projectData] as string}
                  onChange={handleInputChange}
                  className="w-full p-3 pl-4 pr-10 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                >
                  <option value="">Select an option...</option>
                  {currentQuestionData.options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            ) : currentQuestionData.type === 'multi-select' ? (
              <div className="w-full relative z-10">
                {/* Show selected items as chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {Array.isArray(projectData[currentQuestionData.field as keyof typeof projectData]) && 
                   (projectData[currentQuestionData.field as keyof typeof projectData] as string[]).map((item, index) => (
                    <div key={index} className="bg-blue-700 text-white px-3 py-1 rounded-full flex items-center text-sm">
                      <span>{item}</span>
                      <button 
                        type="button" 
                        className="ml-2 text-white hover:text-gray-200"
                        onClick={() => handleMultiSelectOption(currentQuestionData.field, item)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>

                {/* Input for new items */}
                <textarea
                  name={currentQuestionData.field}
                  placeholder={`${currentQuestionData.placeholder} (Type and press Enter to add)`}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  rows={2}
                  onFocus={() => setShowSuggestions(currentQuestionData.field)}
                  onKeyDown={(e) => {
                    // Add custom value when Enter is pressed (without Shift for newline)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const customValue = e.currentTarget.value.trim();
                      if (customValue) {
                        handleMultiSelectOption(currentQuestionData.field, customValue);
                        e.currentTarget.value = ''; // Clear the input
                      }
                    }
                  }}
                />
                
                {/* Quick suggestion buttons */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTIONS[currentQuestionData.field as keyof typeof SUGGESTIONS]?.slice(0, 5).map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-md text-xs"
                      onClick={() => handleMultiSelectOption(currentQuestionData.field, suggestion)}
                    >
                      {suggestion.split(' ').slice(0, 3).join(' ')}...
                    </button>
                  ))}
                  <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-xs"
                    onClick={() => setShowSuggestions(currentQuestionData.field)}
                  >
                    More options...
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 w-full relative z-10">
                <textarea
                  name={currentQuestionData.field}
                  value={projectData[currentQuestionData.field as keyof typeof projectData] as string}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                  placeholder={currentQuestionData.placeholder}
                  rows={3}
                  onFocus={() => setShowSuggestions(currentQuestionData.field)}
                />
                
                {/* Suggestion button */}
                <button 
                  type="button"
                  onClick={() => setShowSuggestions(currentQuestionData.field)}
                  className="mt-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md flex items-center self-start transition-colors"
                  aria-label="Show suggestions for this field"
                >
                  <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
                  <span>Need ideas? See suggestions</span>
                </button>
              </div>
            )}
            
            {/* Suggestions popup */}
            {showSuggestions === currentQuestionData.field && SUGGESTIONS[currentQuestionData.field as keyof typeof SUGGESTIONS] && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden" style={{ maxHeight: '300px' }}>
                <div className="p-2 border-b border-gray-700 flex justify-between sticky top-0 bg-gray-800">
                  <h4 className="text-sm font-medium text-gray-300">Suggested ideas</h4>
                  <button 
                    onClick={() => setShowSuggestions(null)}
                    className="text-gray-500 hover:text-gray-300 p-1"
                    aria-label="Close suggestions"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(300px - 40px)' }}>
                  {SUGGESTIONS[currentQuestionData.field as keyof typeof SUGGESTIONS]?.map((suggestion, index) => (
                    <button 
                      key={index}
                      type="button"
                      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                      onClick={() => applySuggestion(currentQuestionData.field, suggestion)}
                    >
                      <p className="text-sm text-white">{suggestion}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Show AI Insights when there's content */}
          {!isEmpty(projectData[currentQuestionData.field as keyof typeof projectData]) && (
            <div className="mt-4">
              <AIInsights 
                step={currentStep}
                field={currentQuestionData.field}
                currentValue={projectData[currentQuestionData.field as keyof typeof projectData]}
                projectType={projectData.type}
              />
            </div>
          )}
          
          {/* Navigation controls */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 'project-info' && activeQuestion === 0}
              className="px-4 py-2 border border-gray-700 text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Back
            </button>
            
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={!canProceedToNextQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {activeQuestion === currentQuestions.length - 1 && currentStep !== 'review'
                ? 'Next Section'
                : currentStep === 'review' 
                  ? 'Create Project'
                  : 'Continue'
              }
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Show past responses in conversation history */}
        {responses.length > 0 && (
          <div className="mt-8 border-t border-gray-800 pt-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-400">Conversation History</h3>
            <div className="space-y-3">
              {responses.map((response, index) => (
                <div key={index} className="flex items-start space-x-3 opacity-70">
                  <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300">
                    You
                  </div>
                  <div className="flex-1 bg-gray-800 p-3 rounded-lg text-sm text-gray-300">
                    {response}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReview = () => {
    return (
      <ProjectReview
        projectData={projectData}
        onBack={handleBack}
        onSubmit={handleCreate}
        isProcessing={isProcessing}
      />
    );
  };

  const renderStep = () => {
    if (currentStep === 'review') {
      return renderReview();
    }
    
    return renderConversationalQuestion();
  };

  // Add a function to handle complex JSON input
  const handleComplexProjectData = (jsonData: any) => {
    if (!jsonData) return;
    
    try {
      // Map incoming JSON structure to our projectData structure
      const mappedData = {
        ...projectData,
        purpose: jsonData.description || '',
        type: jsonData.type || 'business',
        timeline: typeof jsonData.timeline === 'object' 
          ? JSON.stringify(jsonData.timeline) 
          : jsonData.timeline || '',
        brandStyle: jsonData.branding?.description || '',
        targetAudience: jsonData.marketingStrategy?.targetAudience || '',
        // Add other mappings as needed
      };
      
      setProjectData(mappedData);
      
      // Auto advance to final step since we have all the data
      setCurrentStep('review');
      
      // Mark all steps as completed
      setCompletedSteps(['project-info', 'branding', 'website', 'marketing', 'timeline']);
    } catch (error) {
      console.error("Error processing complex project data:", error);
      setError("Failed to process project data. Please try again.");
    }
  };

  // Add effect to check URL for JSON data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jsonData = urlParams.get('projectData');
    
    if (jsonData) {
      const parsedData = tryParseJSON(jsonData);
      if (parsedData) {
        handleComplexProjectData(parsedData);
      }
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <WizardProgress 
        steps={steps.map(s => ({ id: s.id, title: s.title }))}
        currentStepId={currentStep}
        completedSteps={completedSteps}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-white">
          {error}
        </div>
      )}

      {isProcessing && (
        <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white font-medium">{processingStage}</div>
            <div className="text-white text-sm">{processingProgress}%</div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          {steps.find(step => step.id === currentStep)?.title}
        </h2>
        <p className="text-gray-400 mb-6">
          {steps.find(step => step.id === currentStep)?.description}
        </p>
        {renderStep()}
      </div>
    </div>
  );
} 