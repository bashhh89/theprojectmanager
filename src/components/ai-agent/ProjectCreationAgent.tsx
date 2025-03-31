import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { analyzeProjectResponses } from '@/lib/ai-services/projectAnalysis';
import { ModelSelector } from './ModelSelector';
import { User } from '@supabase/supabase-js';

interface ProjectData {
  title: string;
  description: string;
  objectives: string[];
  timeline: string;
  type: 'software' | 'business' | 'personal' | 'other';
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

interface ProjectCreationAgentProps {
  onProjectCreated?: (projectId: string) => void;
}

const INITIAL_QUESTIONS = [
  {
    id: 'model',
    type: 'model',
    title: 'Choose AI Model',
    description: 'Select the AI model that will help structure your project'
  },
  {
    id: 'purpose',
    type: 'text',
    title: 'Project Purpose',
    question: "What's the main purpose or goal of your project?",
    description: "Describe your project's main objective in a few sentences",
    placeholder: "e.g., Build a mobile app for task management"
  },
  {
    id: 'timeline',
    type: 'text',
    title: 'Project Timeline',
    question: "When would you like this project completed?",
    description: "Provide a rough estimate for the project duration",
    placeholder: "e.g., 3 months, by end of Q2, etc."
  },
  {
    id: 'type',
    type: 'select',
    title: 'Project Type',
    question: "What type of project is this?",
    description: "Select the category that best fits your project",
    options: [
      { id: 'software', label: 'Software Development' },
      { id: 'business', label: 'Business Initiative' },
      { id: 'personal', label: 'Personal Project' },
      { id: 'other', label: 'Other' }
    ]
  }
];

export function ProjectCreationAgent({ onProjectCreated }: ProjectCreationAgentProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [userResponses, setUserResponses] = useState<Record<string, string>>({
    model: 'pollinations-gpt4' // Default to GPT-4 model for more comprehensive results
  });
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleUserResponse = async (response: string) => {
    const currentQuestion = INITIAL_QUESTIONS[currentStep];
    
    // Update responses
    setUserResponses(prev => ({
      ...prev,
      [currentQuestion.id]: response
    }));

    // Move to next step or process responses
    if (currentStep < INITIAL_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Validate required fields before processing
      const requiredFields = ['purpose', 'timeline', 'type'];
      const missingFields = requiredFields.filter(field => !userResponses[field] && !response);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      setIsProcessing(true);
      setError(null);
      
      // Include the last response in the analysis
      const finalResponses = {
        ...userResponses,
        [currentQuestion.id]: response
      };
      
      try {
        console.log('Analyzing project with responses:', finalResponses);
        const analyzed = await analyzeProjectResponses(finalResponses);
        
        if (!analyzed) {
          throw new Error('No analysis data received');
        }
        
        // Validate required fields in the analysis using type-safe checks
        if (!analyzed.title) {
          throw new Error('Invalid project analysis: Missing title');
        }
        if (!analyzed.description) {
          throw new Error('Invalid project analysis: Missing description');
        }
        if (!analyzed.type) {
          throw new Error('Invalid project analysis: Missing type');
        }
        if (!analyzed.objectives || analyzed.objectives.length === 0) {
          throw new Error('Invalid project analysis: Missing objectives');
        }
        if (!analyzed.timeline) {
          throw new Error('Invalid project analysis: Missing timeline');
        }
        if (!analyzed.milestones || analyzed.milestones.length === 0) {
          throw new Error('Invalid project analysis: Missing milestones');
        }
        
        setProjectData(analyzed);
      } catch (err) {
        console.error('Error processing responses:', err);
        
        // Handle different types of errors
        let errorMessage = 'Failed to analyze project';
        
        if (err instanceof Error) {
          if (err.message.includes('502 Bad Gateway')) {
            errorMessage = 'The AI service is temporarily unavailable. Please try again in a few moments.';
          } else if (err.message.includes('Failed to parse')) {
            errorMessage = 'The AI service returned an invalid response. Please try again or select a different model.';
          } else {
            errorMessage = `Analysis failed: ${err.message}`;
          }
        }
        
        setError(errorMessage);
        // Reset to allow trying again
        setCurrentStep(0);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const processResponses = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const analyzed = await analyzeProjectResponses(userResponses);
      setProjectData(analyzed);
    } catch (err) {
      console.error('Error processing responses:', err);
      setError(
        err instanceof Error 
          ? `Failed to analyze project: ${err.message}` 
          : 'Failed to analyze project. Please try again.'
      );
      // Reset to allow trying again
      setCurrentStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateProjectImages = async (projectId: string, prompts: string[]) => {
    try {
      // Generate images for each prompt
      const imagePromises = prompts.map(async (prompt) => {
        const response = await fetch('/api/generate-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate image');
        }

        const data = await response.json();
        return data.imageUrl; // Using imageUrl instead of image
      });

      // Wait for all images to be generated
      const imageUrls = await Promise.all(imagePromises);
      console.log('Generated image URLs:', imageUrls);

      // Store the generated image URLs in Supabase
      const { data: insertedImages, error: imageError } = await supabase
        .from('project_images')
        .insert(
          imageUrls.map((url, index) => ({
            project_id: projectId,
            url,
            prompt: prompts[index],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        )
        .select(); // Add select() to get the inserted data

      if (imageError) {
        console.error('Error storing project images:', imageError);
        throw imageError;
      }

      console.log('Stored project images:', insertedImages);
      return insertedImages;
    } catch (error) {
      console.error('Error generating project images:', error);
      throw error;
    }
  };

  const createProject = async () => {
    if (!projectData || !user) {
      setError('Please log in to create a project');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      // First validate database connection
      const { data: testConnection, error: connectionError } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
        
      if (connectionError) {
        throw new Error(`Database connection error: ${connectionError.message}`);
      }

      console.log('Creating project with data:', projectData);

      // Create project in a transaction-like manner
      const { data: projectResult, error: projectError } = await supabase
        .from('projects')
        .insert([
          {
            name: projectData.title,
            title: projectData.title,
            description: projectData.description,
            type: projectData.type,
            status: 'active',
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            objectives: projectData.objectives || [],
            timeline: projectData.timeline,
            metrics: projectData.metrics || {
              keyPerformanceIndicators: [],
              successCriteria: [],
              healthChecks: []
            },
            risks: projectData.risks || []
          }
        ])
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        throw new Error(`Failed to create project: ${projectError.message}`);
      }
      
      console.log('Project created:', projectResult);
      
      // Add the creator as an owner in the project_members table
      const { error: memberError } = await supabase
        .from('project_members')
        .insert([
          {
            project_id: projectResult.id,
            user_id: user.id,
            role: 'owner',
            invite_accepted: true
          }
        ]);
        
      if (memberError) {
        console.error("Error adding project owner:", memberError);
        // Continue even if this fails, as the project was created successfully
      }

      // Create milestones and tasks in parallel
      if (projectData.milestones && projectData.milestones.length > 0) {
        await Promise.all(projectData.milestones.map(async (milestone) => {
          try {
            console.log('Creating milestone:', milestone);
            
            const { data: milestoneResult, error: milestoneError } = await supabase
              .from('milestones')
              .insert([
                {
                  project_id: projectResult.id,
                  title: milestone.title,
                  description: milestone.description,
                  deadline: milestone.deadline,
                  status: 'pending',
                  user_id: user.id,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ])
              .select()
              .single();

            if (milestoneError) {
              console.error('Milestone creation error:', milestoneError);
              return;
            }

            // Create tasks for this milestone if it was created successfully
            if (milestoneResult && milestone.tasks && milestone.tasks.length > 0) {
              await Promise.all(milestone.tasks.map(async (task) => {
                try {
                  const { data: taskResult, error: taskError } = await supabase
                    .from('tasks')
                    .insert([
                      {
                        project_id: projectResult.id,
                        milestone_id: milestoneResult.id,
                        title: task.title,
                        description: task.description,
                        priority: task.priority || 'medium',
                        status: 'pending',
                        estimated_hours: task.estimatedHours || 0,
                        requirements: task.requirements || [],
                        skills: task.skills || [],
                        user_id: user.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }
                    ])
                    .select()
                    .single();

                  if (taskError) {
                    console.error('Task creation error:', taskError);
                    return;
                  }

                  // Create subtasks if task was created successfully
                  if (taskResult && task.subtasks && task.subtasks.length > 0) {
                    const { error: subtaskError } = await supabase
                      .from('subtasks')
                      .insert(
                        task.subtasks.map(subtask => ({
                          task_id: taskResult.id,
                          project_id: projectResult.id,
                          title: subtask.title,
                          description: subtask.description,
                          status: subtask.status || 'pending',
                          user_id: user.id,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        }))
                      );

                    if (subtaskError) {
                      console.error('Subtask creation error:', subtaskError);
                    }
                  }
                } catch (taskError) {
                  console.error('Error creating task:', taskError);
                }
              }));
            }
          } catch (milestoneError) {
            console.error('Error creating milestone:', milestoneError);
          }
        }));
      }

      // Create Kanban board structure
      if (projectData.visualElements?.kanbanStructure?.columns) {
        try {
          console.log('Creating Kanban columns');
          
          const { error: kanbanError } = await supabase
            .from('kanban_columns')
            .insert(
              projectData.visualElements.kanbanStructure.columns.map((column, index) => ({
                project_id: projectResult.id,
                title: column.title,
                description: column.description,
                order_index: index,
                user_id: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }))
            );

          if (kanbanError) {
            console.error('Kanban column creation error:', kanbanError);
          }
        } catch (kanbanError) {
          console.error('Error creating kanban columns:', kanbanError);
        }
      }

      // Generate and store project images
      try {
        const imageUrls = await generateProjectImages(projectResult.id, projectData.visualElements.suggestedImages);
        console.log('Generated image URLs:', imageUrls);

        if (imageUrls && imageUrls.length > 0) {
          const { error: imageError } = await supabase
            .from('project_images')
            .insert(
              imageUrls.map(url => ({
                project_id: projectResult.id,
                url: url,
                prompt: 'Generated project image',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }))
            );

          if (imageError) {
            console.error('Error storing project images:', imageError);
          }
        }
      } catch (imageError) {
        console.error('Error generating project images:', imageError);
      }

      // Redirect to the project page
      router.push(`/projects/${projectResult.id}`);
      
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-200">{error}</p>
        </div>
      )}
      
      {!projectData ? (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Project Setup Progress</h2>
              <span className="text-sm text-gray-400">
                Step {currentStep + 1} of {INITIAL_QUESTIONS.length}
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / INITIAL_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{INITIAL_QUESTIONS[currentStep].title}</h2>
              <p className="text-gray-400 mt-2">{INITIAL_QUESTIONS[currentStep].description}</p>
            </div>

            {isProcessing ? (
              <div className="text-center py-8">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg">Analyzing your responses with {userResponses.model}...</p>
                <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {INITIAL_QUESTIONS[currentStep].type === 'model' ? (
                  <ModelSelector
                    selectedModel={userResponses.model}
                    onModelSelect={(modelId) => handleUserResponse(modelId)}
                  />
                ) : INITIAL_QUESTIONS[currentStep].type === 'select' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {INITIAL_QUESTIONS[currentStep].options?.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleUserResponse(option.id)}
                        className="flex items-center p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-all"
                      >
                        <span className="text-lg">{option.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg">{INITIAL_QUESTIONS[currentStep].question}</p>
                    <textarea
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                      placeholder={INITIAL_QUESTIONS[currentStep].placeholder}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (currentInput.trim()) {
                            handleUserResponse(currentInput);
                            setCurrentInput('');
                          }
                        }
                      }}
                    />
                    <p className="text-sm text-gray-400">Press Enter to continue, Shift + Enter for new line</p>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  
                  {INITIAL_QUESTIONS[currentStep].type === 'text' && (
                    <button
                      onClick={() => {
                        if (currentInput.trim()) {
                          handleUserResponse(currentInput);
                          setCurrentInput('');
                        }
                      }}
                      disabled={!currentInput.trim()}
                      className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6">Project Structure</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Title</h3>
                <p className="text-xl font-semibold">{projectData.title}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Description</h3>
                <p className="bg-gray-700/50 p-4 rounded-lg">{projectData.description}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Timeline</h3>
                <p className="bg-gray-700/50 p-4 rounded-lg">{projectData.timeline}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Type</h3>
                <span className="inline-block px-4 py-2 bg-gray-700 rounded-full text-blue-400 font-medium">
                  {projectData.type.charAt(0).toUpperCase() + projectData.type.slice(1)}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Objectives</h3>
                <ul className="bg-gray-700/50 p-4 rounded-lg space-y-2">
                  {projectData.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={() => {
                setProjectData(null);
                setCurrentStep(0);
                setUserResponses({ model: userResponses.model });
                setError(null);
              }}
              className="px-6 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Start Over
            </button>
            
            <button
              onClick={createProject}
              disabled={isCreating}
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 