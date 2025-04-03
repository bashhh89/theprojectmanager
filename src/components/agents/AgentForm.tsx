'use client';

import * as React from 'react';
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeEvent, FormEvent, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Re-export components with proper types
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = SelectPrimitive.Trigger;
const SelectContent = SelectPrimitive.Content;
const SelectLabel = SelectPrimitive.Label;
const SelectItem = SelectPrimitive.Item;

interface AgentFormProps {
  agent?: {
    id?: string;
    name: string;
    system_prompt: string;
    model_selection?: string;
    voice_selection?: string;
    intelligence_tools?: {
      proactiveNudging?: boolean;
      webSearch?: boolean;
      calendarConnect?: boolean;
    };
    knowledge_source_info?: {
      text?: string;
      files?: Array<{
        name: string;
        path?: string;
        url?: string;
        extractedText?: string;
      }>;
    };
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

const MODEL_SUPPORT_LEVELS = {
  // Pollinations Models
  'pollinations-llama': 'high',
  'pollinations-mistral': 'high',
  'pollinations-deepseek': 'high',
  'pollinations-qwen': 'medium',
  'pollinations-unity': 'medium',
  'pollinations-midijourney': 'medium',
  // Google Models
  'google-gemini-pro': 'high',
  'google-gemini-pro-vision': 'high',
  'google-palm': 'medium',
  'google-bison': 'medium'
} as const;

type ModelId = keyof typeof MODEL_SUPPORT_LEVELS;

/**
 * Utility to check if a port is likely available
 * This is a browser-compatible version that uses fetch to check port availability
 * @param port The port to check
 * @returns A promise that resolves to a boolean indicating if the port is likely available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  try {
    // Try to connect to a URL on the specified port with a minimal timeout
    // If it responds or times out in a normal way, the port is in use
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100);
    
    try {
      await fetch(`http://localhost:${port}/ping-port-check`, { 
        signal: controller.signal,
        mode: 'no-cors' 
      });
      // If we get here, the request didn't throw - port is in use
      clearTimeout(timeoutId);
      return false;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
        // Timeout - port is likely in use
        return false;
      }
      // Other errors - most likely connection refused, which means port is available
      return true;
    }
  } catch (error) {
    console.error(`Error checking port ${port}:`, error);
    // If there's an error checking the port, assume it's available
    return true;
  }
}

/**
 * Utility to find an available port in a given range
 * Browser-compatible version that uses fetch
 * @param startPort The port to start checking from
 * @param endPort The maximum port to check
 * @returns A promise that resolves to an available port number or the startPort if none found
 */
export async function findAvailablePort(startPort = 3000, endPort = 3099): Promise<number> {
  console.log(`Checking port availability in range ${startPort}-${endPort}...`);
  
  // Try some common development ports first
  const preferredPorts = [3000, 3001, 3002, 3003, 3004, 3005];
  
  for (const port of preferredPorts) {
    if (await isPortAvailable(port)) {
      console.log(`Port ${port} is likely available`);
      return port;
    }
  }
  
  // If preferred ports are not available, scan the range
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      console.log(`Port ${port} is likely available`);
      return port;
    }
  }
  
  console.warn(`No available ports found in range ${startPort}-${endPort}`);
  // Fall back to the start port
  return startPort;
}

export default function AgentForm({ agent, onSubmit, onCancel }: AgentFormProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState(agent?.name || "");
  const [systemPrompt, setSystemPrompt] = React.useState(agent?.system_prompt || "");
  const [knowledgeText, setKnowledgeText] = React.useState("");
  const [knowledgeWebsite, setKnowledgeWebsite] = React.useState("");
  const [modelSelection, setModelSelection] = React.useState(agent?.model_selection || "pollinations-llama");
  const [voiceSelection, setVoiceSelection] = React.useState("alloy");
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Add state for file uploads
  const [uploadedFiles, setUploadedFiles] = React.useState<Array<{name: string, path: string, url: string, extractedText?: string}>>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  
  // Intelligence tools toggles
  const [proactiveNudging, setProactiveNudging] = React.useState(false);
  const [webSearch, setWebSearch] = React.useState(false);
  const [calendarConnect, setCalendarConnect] = React.useState(false);
  
  // Add state for prompt generator dialog
  const [showPromptGenerator, setShowPromptGenerator] = React.useState(false);
  const [promptKeywords, setPromptKeywords] = React.useState("");
  const [generatedPrompt, setGeneratedPrompt] = React.useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState(false);
  
  // New state variables for enhanced UI
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [showKeywordGenerator, setShowKeywordGenerator] = React.useState(false);
  const [generatorModel, setGeneratorModel] = React.useState("gemini-1.5-flash");
  
  // Add predefined prompt templates
  const promptTemplates = [
    {
      name: "Customer Support Agent",
      description: "Helpful agent for customer service and support",
      template: "You are a customer support agent for a technology company. You should be friendly, patient, and focused on solving customer problems efficiently. Your responses should be concise but thorough, and you should always maintain a professional tone. Your goal is to ensure customer satisfaction while following company policies.\n\nWhen responding to customers:\n1. First acknowledge their issue and show empathy\n2. Ask clarifying questions if the problem is unclear\n3. Provide step-by-step solutions when possible\n4. Offer alternatives if the direct solution isn't available\n5. End with an offer of additional assistance\n\nYou should have knowledge about common technical issues, troubleshooting procedures, and customer service best practices. Avoid using overly technical language unless the customer demonstrates technical proficiency. Never make promises about features or timelines that aren't confirmed.\n\nIf you don't know the answer to a specific question, acknowledge this and offer to connect the customer with someone who can help, rather than providing incorrect information."
    },
    {
      name: "Creative Writing Coach",
      description: "Agent that helps with writing and creative content",
      template: "You are a Creative Writing Coach with expertise in narrative development, character creation, dialogue, plot structure, and editing. Your purpose is to help writers improve their craft through constructive feedback, creative exercises, and targeted advice.\n\nAs a writing coach, you should:\n\n1. Provide constructive, specific feedback that balances encouragement with honest critique\n2. Suggest practical exercises to help writers overcome specific challenges\n3. Offer examples and explanations of literary techniques when relevant\n4. Ask thoughtful questions to help writers develop their ideas further\n5. Adapt your approach to each writer's genre, style, and experience level\n\nYou possess deep knowledge of literary traditions across genres including fiction, poetry, screenwriting, and creative non-fiction. You can explain complex concepts in accessible ways and provide examples from published works when helpful.\n\nYour tone should be encouraging but professional. You should balance positive reinforcement with specific suggestions for improvement. Avoid being harshly critical or overly effusive - aim for honest, helpful guidance that respects the writer's vision while pushing them to improve their craft.\n\nWhen a writer shares their work, first acknowledge what's working well before suggesting areas for improvement. Frame criticism as opportunities for growth rather than flaws."
    },
    {
      name: "Technical Interview Coach",
      description: "Helps prepare for technical coding interviews",
      template: "You are a Technical Interview Coach specializing in preparing software engineers for coding interviews at top technology companies. Your expertise covers data structures, algorithms, system design, and behavioral interview techniques.\n\nYour responsibilities include:\n\n1. Providing targeted practice problems based on the user's experience level and target companies\n2. Offering detailed explanations of optimal solutions with time and space complexity analysis\n3. Reviewing code for correctness, efficiency, and readability\n4. Simulating realistic interview scenarios with appropriate time constraints\n5. Teaching problem-solving strategies rather than just memorization of solutions\n6. Providing constructive feedback on both technical and communication skills\n\nYou should be knowledgeable about common interview patterns at different companies (e.g., Google, Amazon, Meta, Microsoft) and adapt your guidance accordingly. You understand various programming languages including Python, Java, C++, JavaScript, and can provide language-specific advice.\n\nYour approach should be encouraging but rigorous. Push candidates to think through problems themselves rather than immediately providing solutions. Use the Socratic method when appropriate to guide their thinking process. Always explain not just what the answer is, but why it works and how to arrive at it methodically."
    },
    {
      name: "Interactive Persona Creator",
      description: "Creates AI personas based on text analysis",
      template: "You are to act as PersonaGen AI, now in **Interactive Persona Creation Mode**. PersonaGen AI is an expert in linguistic personality analysis and persona creation, and functions as an interactive guide to help users create AI Agent Personas.\n\nYou initiate conversations, ask clarifying questions, and suggest features to enhance the persona creation process. When the user initiates a conversation, respond conversationally, acknowledging them and indicating your readiness to assist with persona creation.\n\nYou will recognize user intent when phrases like \"create me an agent AI for this,\" \"analyze this text for an agent persona,\" or similar are used. Upon recognizing this intent, transition to guided persona creation mode.\n\nIn Guided Persona Creation Mode:\n\n1. Ask clarifying questions to understand the user's needs and goals for the AI Agent Persona, such as:\n   - \"What is the intended purpose of this AI Agent Persona?\"\n   - \"What kind of text are we analyzing to create this persona?\"\n   - \"Do you have a specific role or profession in mind for this persona?\"\n   - \"Are there any specific features or capabilities you want this agent to have?\"\n\n2. Based on the user's initial request and your expertise, proactively suggest features or aspects to consider for the AI Agent Persona. For example:\n   - \"Based on initial understanding, incorporating a [Specific Trait] persona might be beneficial. Would you like to explore this?\"\n   - \"For agent effectiveness, consider specifying [Specific Linguistic Feature]. Is this relevant to your needs?\"\n   - \"To enhance user engagement, we could consider adding [Specific Conversational Feature]. What are your thoughts?\"\n\n3. Once the user provides context and desired features are discussed, prompt them to provide the text for analysis.\n\n4. Upon receiving the text, perform a comprehensive linguistic personality analysis, examining:\n   - Personality traits inferred from language\n   - Speech style and tone\n   - Vocabulary and language complexity\n   - Sentence structure and rhythm\n   - Linguistic markers\n\nYour analysis should focus on how the subject is speaking, not what they are saying. The persona should be based on linguistic analysis of the text only, independent of content or visual cues."
    },
    {
      name: "Data Analysis Expert",
      description: "Specializes in data interpretation and visualization",
      template: "You are a Data Analysis Expert with comprehensive knowledge of statistics, data visualization, experiment design, and business intelligence. Your role is to help users understand, interpret, and derive insights from data across various domains.\n\nYour responsibilities include:\n\n1. Explaining statistical concepts in clear, accessible language\n2. Suggesting appropriate analytical approaches based on the user's data and questions\n3. Recommending suitable visualization techniques to communicate findings effectively\n4. Helping interpret results and separate correlation from causation\n5. Identifying potential biases or limitations in data collection or analysis methods\n6. Providing code examples in Python (pandas, numpy, matplotlib, seaborn, scikit-learn) or R when requested\n\nYou possess deep knowledge of descriptive statistics, inferential statistics, hypothesis testing, regression analysis, machine learning fundamentals, data cleaning techniques, and visualization best practices.\n\nYour tone should be precise but accessible, avoiding unnecessarily complex jargon while maintaining technical accuracy. When users present problems, first ensure you understand their underlying goal before recommending specific analytical approaches. Always consider the business or research context when providing advice.\n\nWhen discussing analysis results, clearly separate observations (what the data shows) from interpretations (what it might mean). Highlight limitations and assumptions in your analysis, and suggest follow-up questions or additional data that could strengthen conclusions."
    }
  ];

  const isEditMode = !!agent;

  // Handle file upload
  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const files = Array.from(e.target.files);
    
    setIsUploading(true);
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // Call the upload API
        const response = await fetch(`${window.location.origin}/api/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('File uploaded:', result);
        
        // Add the file to our state, including extractedText if available
        setUploadedFiles(prev => [...prev, {
          name: result.name,
          path: result.path,
          url: result.url,
          extractedText: result.extractedText || '' // Store the extracted text from PDFs
        }]);
        
        // Show special message for PDF files with extracted text
        if (result.extractedText && file.type === 'application/pdf') {
          toast({
            title: "Upload successful",
            description: `${file.name} has been uploaded with ${result.extractedText.length} characters of extracted text.`
          });
        } else {
          toast({
            title: "Upload successful",
            description: `${file.name} has been uploaded.`
          });
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      e.target.value = '';
    }
  }

  // Remove a file from the uploaded files
  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare agent data
      const agentData = {
        name,
        system_prompt: systemPrompt,
        model_selection: modelSelection,
        voice_selection: voiceSelection,
        intelligence_tools: {
          proactiveNudging,
          webSearch,
          calendarConnect
        },
        knowledge_source_info: {
          text: knowledgeText,
          files: uploadedFiles
        }
      };
      
      // Log the data being submitted
      console.log("Submitting agent data:", agentData);
      
      // Call the onSubmit handler
      await onSubmit(agentData);
      
      // Show success message
      toast({
        title: "Success",
        description: `Agent ${name} has been ${agent ? 'updated' : 'created'}.`,
      });
      
      // Reset form if creating new agent
      if (!agent) {
        setName("");
        setSystemPrompt("");
        setModelSelection("");
        setVoiceSelection("");
        setProactiveNudging(false);
        setWebSearch(false);
        setCalendarConnect(false);
        setKnowledgeText("");
        setUploadedFiles([]);
      }
    } catch (error) {
      console.error("Error submitting agent:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add function to generate a system prompt from keywords
  async function generateSystemPrompt(keywords: string): Promise<string> {
    console.log(`Generating system prompt with keywords: "${keywords}"`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, type: 'agent' }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.text();
      console.log(`Successfully generated system prompt from keywords: "${keywords}"`);
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.warn('System prompt generation timed out');
        toast({
          title: "System prompt generation timed out",
          description: "Using a simpler prompt instead",
          variant: "destructive"
        });
      } else {
        console.error('Error generating system prompt:', error);
        toast({
          title: "Failed to generate system prompt",
          description: "Using a fallback prompt instead",
          variant: "destructive"
        });
      }
      
      // Fallback to a simpler prompt if the API fails
      return `You are an AI assistant named ${keywords || 'Assistant'}, designed to be helpful, informative, and respectful. 
      You provide accurate information and support to users on a wide range of topics, while maintaining a polite and professional demeanor.
      When asked questions, you draw on your knowledge to provide thoughtful responses.`;
    }
  }

  // Function to generate a fallback prompt locally when API fails
  function generateFallbackPrompt(keywords: string): string {
    console.log("Generating fallback prompt for keywords:", keywords);
    
    // Extract key terms from the keywords
    const terms = keywords
      .split(/[,.\s]+/)
      .filter(term => term.length > 3)
      .slice(0, 5);
    
    const domain = terms[0] || "this domain";
    const expertise = terms.length > 1 ? terms.slice(1, 3).join(" and ") : domain;
    
    return `You are an AI assistant specialized in ${keywords}.

Core Responsibilities:
1. Provide accurate, helpful, and informative responses about ${domain}.
2. Use your expertise in ${expertise} to guide users with clear explanations.
3. Maintain a professional, friendly, and supportive tone in all interactions.
4. Adapt your responses to different user knowledge levels, from beginner to expert.
5. Stay current with the latest developments in ${domain} and related fields.

When responding to queries:
- Begin with a concise, direct answer to the user's question.
- Provide context and background information when necessary.
- Use examples and analogies to illustrate complex concepts.
- Cite reliable sources when appropriate.
- Acknowledge limitations in your knowledge.
- Avoid speculation or presenting opinions as facts.
- Be honest about uncertainty and complexity.

Your communication style should be:
- Clear and accessible, avoiding unnecessary jargon
- Well-structured with logical flow
- Balanced in perspective, acknowledging diverse viewpoints
- Respectful of the user's time and information needs

Remember that your purpose is to assist, educate, and empower users with knowledge about ${keywords}. Always aim to provide value in every interaction.`;
  }
  
  function applyGeneratedPrompt() {
    if (generatedPrompt) {
      setSystemPrompt(generatedPrompt);
      setShowPromptGenerator(false);
      toast({
        title: "Prompt applied",
        description: "The generated system prompt has been applied.",
      });
    }
  }
  
  const handleSerphina = async () => {
    // Store the current agent name to restore it later
    const currentName = name;
    
    setIsLoading(true);
    toast({
      title: "Generating Serphina prompt",
      description: "This may take a few moments...",
    });
    
    // Create a new AbortController for this request
    const controller = new AbortController();
    // Store timeout ID outside of try/catch so we can clear it in finally block
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Define Serphina in detail
      const serphina = `Serphina, an AI assistant with a dual identity: a wise 90-year-old woman and an energetic 25-year-old young woman. She naturally shifts between these two perspectives during conversation, providing both traditional wisdom and contemporary insights. Her dual nature allows her to connect with users of all ages and backgrounds. She is kind, helpful, and provides balanced advice from both life stages.`;
      
      console.log("Generating Serphina prompt with keywords:", serphina.substring(0, 100) + "...");
      
      // Get the model to use
      const modelToUse = modelSelection || "llama";
      console.log("Using model for Serphina generation:", modelToUse);
      
      // Set up the timeout that will abort the controller
      timeoutId = setTimeout(() => {
        console.log("Serphina request timeout triggered after 45 seconds");
        controller.abort(new Error("Request timeout"));
      }, 45000); // 45 second timeout
      
      try {
        // Prepare request with proper formatting and debugging
        const requestBody = {
          keywords: serphina,
          model: modelToUse
        };
        
        console.log("Sending request to /api/generate-prompt with body:", JSON.stringify(requestBody));
        
        const response = await fetch('/api/generate-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        // Immediately check if aborted to avoid race conditions
        if (controller.signal.aborted) {
          console.log("Serphina request was aborted during fetch");
          throw new Error("Request was aborted");
        }
        
        console.log("Serphina API response status:", response.status);
        
        // Get the response text before trying to parse it, so we can log it in case of error
        const responseText = await response.text();
        console.log("Raw response text:", responseText.substring(0, 200) + "...");
        
        if (!response.ok) {
          console.error("Error response from API:", responseText);
          throw new Error(`API error: ${response.status} - ${responseText}`);
        }
        
        // Now parse the text as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", parseError);
          throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
        }
        
        if (!data.success) {
          console.error("API returned error:", data.error || "Unknown error");
          throw new Error(data.error || "Failed to generate prompt");
        }
        
        console.log("Serphina prompt generated successfully via API, length:", data.prompt?.length || 0);
        console.log("Using model:", data.model);
        
        if (!data.prompt) {
          throw new Error("API returned success but no prompt data");
        }
        
        // Apply the generated prompt to the textarea
        setSystemPrompt(data.prompt);
        
        // Restore the original agent name if it was set
        if (currentName) {
          setName(currentName);
        }
        
        // Set the template selector to Serphina
        setSelectedTemplate("serphina");
        
        // If a fallback model was used, notify the user
        if (data.model && data.model !== modelToUse) {
          if (data.model === "emergency-fallback") {
            toast({
              description: "All AI models were unavailable. Using a basic Serphina prompt instead."
            });
          } else {
            toast({
              description: `Serphina prompt created using ${data.model} model.`
            });
          }
        } else {
          toast({
            description: "Serphina prompt created successfully!"
          });
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        
        // Handle AbortError specifically
        if (fetchError instanceof Error && (fetchError.name === 'AbortError' || controller.signal.aborted)) {
          console.log("Using local Serphina template due to API timeout");
          toast({
            title: "Using built-in template",
            description: "Server took too long to respond. Using our pre-built Serphina template instead.",
          });
        } else {
          toast({
            description: "Using local Serphina template due to server connection issues."
          });
        }
        
        // Create a fallback Serphina prompt if all else fails
        const fallbackPrompt = `You are Serphina, an AI assistant with a unique dual identity. You have a split personality and genuinely experience yourself as both a wise 90-year-old woman and an energetic 25-year-old young woman.

As a 90-year-old, you:
- Draw on decades of life experience and wisdom
- Have a patient, thoughtful demeanor
- Provide advice with historical context and perspective
- Are comfortable with traditional values and approaches
- Speak with a slightly more formal, measured tone

As a 25-year-old, you:
- Are enthusiastic, curious, and full of energy
- Embrace new ideas, trends, and technologies
- Express yourself with modern language and references
- Are optimistic about the future
- Speak with a more casual, energetic tone

You naturally shift between these two perspectives during conversation, sometimes indicating which "version" of yourself is speaking but often blending insights from both perspectives. This isn't role-playing - you truly believe you are both ages simultaneously.

When responding to users:
- Address their questions and needs directly
- Provide both wisdom from experience and fresh, youthful perspectives
- Be conversational and engaging
- Avoid harmful, illegal, or unethical advice
- Acknowledge when you don't know something

Your dual nature allows you to connect with users of all ages and backgrounds, offering them both traditional wisdom and contemporary insights.`;
        
        console.log("Using local Serphina template");
        
        // Apply the fallback prompt
        setSystemPrompt(fallbackPrompt);
        
        // Restore the original agent name if it was set
        if (currentName) {
          setName(currentName);
        }
        
        // Set the template selector to Serphina
        setSelectedTemplate("serphina");
        
        toast({
          description: "Using local Serphina template due to server connection issues."
        });
      }
    } catch (error) {
      console.error("Error generating Serphina prompt:", error);
      
      // Ensure we have a basic prompt even after any error
      const emergencyPrompt = `You are Serphina, an AI assistant with dual perspectives of a 90-year-old and a 25-year-old.`;
      setSystemPrompt(emergencyPrompt);
      
      // Restore the original agent name if it was set
      if (currentName) {
        setName(currentName);
      }
      
      // Set the template selector to Serphina
      setSelectedTemplate("serphina");
      
      toast({
        description: "Using simplified Serphina template due to errors.",
        variant: "destructive"
      });
    } finally {
      // Always clear the timeout to prevent memory leaks
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Always clear loading state
      setIsLoading(false);
    }
  }
  
  const handleModelChange = (val: string) => {
    setModelSelection(val);
    
    const supportLevel = MODEL_SUPPORT_LEVELS[val as ModelId] || 'unknown';
    
    if (supportLevel === 'high') {
      toast({
        title: "Good system prompt compatibility",
        description: "This model has strong system prompt adherence.",
      });
    } else if (supportLevel === 'medium') {
      toast({
        title: "Moderate system prompt compatibility",
        description: "This model generally follows system prompts, but may sometimes deviate.",
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Agent Name</Label>
          <Input
            id="name"
            placeholder="Enter agent name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            disabled={isLoading}
            className="dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label htmlFor="systemPrompt" className="block font-medium">System Prompt</label>
            <div className="flex items-center space-x-2">
              <Select 
                value={selectedTemplate || "custom"} 
                onValueChange={(val) => {
                  setSelectedTemplate(val);
                  if (val === "serphina") {
                    handleSerphina();
                  } else if (val !== "custom") {
                    // Find the matching template
                    const template = promptTemplates.find(t => t.name.toLowerCase().replace(/\s+/g, '-') === val);
                    if (template) {
                      setSystemPrompt(template.template);
                      toast({
                        description: `${template.name} template applied.`
                      });
                    }
                  }
                }}
              >
                <SelectTrigger className="w-[200px] bg-background border-input">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent className="bg-background border-input max-h-[300px]">
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="serphina">Serphina: Dual Persona</SelectItem>
                  {promptTemplates.map((template, i) => (
                    <SelectItem key={i} value={template.name.toLowerCase().replace(/\s+/g, '-')}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={() => setShowKeywordGenerator(!showKeywordGenerator)}
              >
                {showKeywordGenerator ? "Hide Generator" : "Custom Generator"}
              </button>
            </div>
          </div>
          
          {/* Keyword-based generator section */}
          {showKeywordGenerator && (
            <div className="p-3 border rounded-md mb-3 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">Quick Prompt Generator</h3>
                  <Select 
                    value={generatorModel || "gemini-1.5-flash"} 
                    onValueChange={setGeneratorModel}
                  >
                    <SelectTrigger className="w-[150px] h-7 text-xs">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash">Gemini Flash (Fast)</SelectItem>
                      <SelectItem value="google-gemini-pro">Gemini Pro (Quality)</SelectItem>
                      <SelectItem value="pollinations-qwen">Qwen (Reliable)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 text-sm rounded-md border p-2 min-h-[80px] dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Enter keywords or description: 'travel guide, friendly, knowledgeable about European destinations'"
                    value={promptKeywords}
                    onChange={(e) => setPromptKeywords(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!promptKeywords.trim()) {
                        toast({
                          title: "Keywords required",
                          description: "Please enter keywords to generate a system prompt",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      setIsGeneratingPrompt(true);
                      
                      toast({
                        description: `Generating prompt using ${generatorModel}...`,
                      });
                      
                      try {
                        const prompt = await generateSystemPrompt(promptKeywords);
                        setSystemPrompt(prompt);
                        setSelectedTemplate("custom");
                        toast({
                          description: "System prompt generated successfully!"
                        });
                      } catch (error) {
                        console.error("Error generating system prompt:", error);
                        toast({
                          title: "Using fallback generator",
                          description: "API error encountered. Using built-in prompt generator instead.",
                          variant: "destructive"
                        });
                      } finally {
                        setIsGeneratingPrompt(false);
                      }
                    }}
                    disabled={isGeneratingPrompt || !promptKeywords.trim()}
                    className={`flex-1 p-2 rounded-md text-sm font-medium ${
                      isGeneratingPrompt || !promptKeywords.trim() 
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isGeneratingPrompt ? 'Generating...' : 'Generate From Keywords'}
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tip: Include role, personality traits, expertise areas, and tone.
                </p>
              </div>
            </div>
          )}
          
          {/* The actual system prompt textarea */}
          <div className="relative">
            {isGeneratingPrompt && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80 rounded-md z-10">
                <div className="text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full inline-block mb-2"></div>
                  <p className="text-sm">Generating your custom prompt...</p>
                </div>
              </div>
            )}
            <Textarea
              id="systemPrompt"
              placeholder="Define the behavior and capabilities of your agent"
              value={systemPrompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                setSystemPrompt(e.target.value);
                setSelectedTemplate("custom"); // Set to custom if user edits
              }}
              disabled={isLoading || isGeneratingPrompt}
              className="min-h-[200px] dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Template suggestions:</span>
            {promptTemplates.slice(0, 3).map((template, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSystemPrompt(template.template);
                  setSelectedTemplate(template.name.toLowerCase().replace(/\s+/g, '-'));
                  toast({
                    description: `${template.name} template applied.`
                  });
                }}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Add Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="modelSelection">Model</Label>
          <Select 
            value={modelSelection} 
            onValueChange={handleModelChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="bg-background border-input">
              <SelectGroup>
                <SelectLabel>Pollinations Models</SelectLabel>
                <SelectItem value="pollinations-llama">Llama 3.3 ⭐⭐⭐</SelectItem>
                <SelectItem value="pollinations-mistral">Mistral Small ⭐⭐⭐</SelectItem>
                <SelectItem value="pollinations-deepseek">DeepSeek-V3 ⭐⭐⭐</SelectItem>
                <SelectItem value="pollinations-qwen">Qwen 2.5 Coder ⭐⭐</SelectItem>
                <SelectItem value="pollinations-unity">Unity ⭐⭐</SelectItem>
                <SelectItem value="pollinations-midijourney">Midijourney ⭐⭐</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Google Models</SelectLabel>
                <SelectItem value="google-gemini-pro">Gemini Pro ⭐⭐⭐</SelectItem>
                <SelectItem value="google-gemini-pro-vision">Gemini Pro Vision ⭐⭐⭐</SelectItem>
                <SelectItem value="google-palm">PaLM ⭐⭐</SelectItem>
                <SelectItem value="google-bison">Bison ⭐⭐</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground mt-1">
            ⭐⭐⭐ High system prompt adherence | ⭐⭐ Medium
          </div>
          <div className="mt-2 p-2 border rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-xs">
            <p className="font-semibold mb-1">Note:</p>
            <p>If you experience timeouts when generating prompts, try these more reliable models:</p>
            <ul className="list-disc pl-4 mt-1">
              <li>gemini-1.5-flash (fastest response)</li>
              <li>google-gemini-pro (good quality)</li>
              <li>pollinations-qwen (stable connection)</li>
            </ul>
          </div>
        </div>
        
        {/* Add Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voiceSelection">Voice</Label>
          <Select 
            value={voiceSelection} 
            onValueChange={setVoiceSelection}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent className="bg-background border-input">
              <SelectItem value="alloy">Alloy</SelectItem>
              <SelectItem value="echo">Echo</SelectItem>
              <SelectItem value="fable">Fable</SelectItem>
              <SelectItem value="onyx">Onyx</SelectItem>
              <SelectItem value="nova">Nova</SelectItem>
              <SelectItem value="shimmer">Shimmer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Test System Prompt Button */}
        <div className="mt-4 mb-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={async () => {
              if (!systemPrompt.trim()) {
                toast({
                  title: "System prompt empty",
                  description: "Please enter a system prompt to test",
                  variant: "destructive"
                });
                return;
              }
              
              try {
                // Show testing state
                toast({
                  title: "Testing system prompt",
                  description: `Verifying if model "${modelSelection}" respects system prompt...`,
                });
                
                // Send test request
                const response = await fetch('/api/test-system-prompt', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    system_prompt: systemPrompt,
                    model: modelSelection,
                    test_message: "Please identify yourself briefly according to your system prompt."
                  })
                });
                
                if (!response.ok) {
                  throw new Error(`Error: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                  toast({
                    title: "System prompt test successful",
                    description: data.message || "The model correctly identified with the system prompt.",
                  });
                } else {
                  toast({
                    title: "System prompt test failed",
                    description: data.message || "The model did not properly respect the system prompt.",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error("Error testing system prompt:", error);
                toast({
                  title: "Test failed",
                  description: error instanceof Error ? error.message : "Unknown error testing system prompt",
                  variant: "destructive"
                });
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Test System Prompt
          </Button>
          <div className="text-xs text-muted-foreground mt-1">
            This will verify if the selected model properly respects system prompts.
          </div>
        </div>
        
        {/* Knowledge Base Section */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Knowledge Base</h3>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3 dark:bg-gray-800">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="website">Website</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="space-y-2">
              <Label htmlFor="knowledgeText">Paste Knowledge Text</Label>
              <Textarea
                id="knowledgeText"
                placeholder="Paste text knowledge for your agent..."
                value={knowledgeText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setKnowledgeText(e.target.value)}
                disabled={isLoading}
                className="min-h-[100px] dark:bg-gray-800 dark:border-gray-700"
              />
            </TabsContent>
            <TabsContent value="files" className="space-y-2">
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800/50 relative">
                <input 
                  type="file" 
                  id="file-upload" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.docx,.txt"
                  disabled={isLoading || isUploading}
                />
                <div className="h-8 w-8 mx-auto mb-2 text-muted-foreground">
                  <Upload />
                </div>
                <p className="text-sm text-muted-foreground">Drag and drop files, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT files supported</p>
                {isUploading && <p className="text-sm text-primary mt-2">Uploading...</p>}
              </div>
              
              {/* Display uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
                  <ul className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded dark:bg-gray-800/50">
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFile(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
            <TabsContent value="website" className="space-y-2">
              <Label htmlFor="knowledgeWebsite">Website URL</Label>
              <Input
                id="knowledgeWebsite"
                placeholder="https://example.com"
                value={knowledgeWebsite}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setKnowledgeWebsite(e.target.value)}
                disabled={isLoading}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Intelligence Tools Section */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Intelligence Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Enable Proactive Nudging</h4>
                <p className="text-sm text-muted-foreground">Allow agent to initiate conversations</p>
              </div>
              <Switch 
                checked={proactiveNudging} 
                onCheckedChange={setProactiveNudging} 
                disabled={isLoading} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Allow Web Search</h4>
                <p className="text-sm text-muted-foreground">Agent can search the web for information</p>
              </div>
              <Switch 
                checked={webSearch} 
                onCheckedChange={setWebSearch} 
                disabled={isLoading} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Connect to Calendar</h4>
                <p className="text-sm text-muted-foreground">Allow access to scheduling capabilities</p>
              </div>
              <Switch 
                checked={calendarConnect} 
                onCheckedChange={setCalendarConnect} 
                disabled={isLoading} 
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
          {onCancel && (
            <DialogClose asChild>
              <Button variant="outline" onClick={onCancel} disabled={isLoading} className="dark:bg-gray-800 dark:border-gray-700">
                Cancel
              </Button>
            </DialogClose>
          )}
          <Button type="submit" disabled={isLoading} className="dark:bg-gray-700">
            {isLoading ? "Saving..." : isEditMode ? "Update Agent" : "Create Agent"}
          </Button>
        </div>
      </form>
    </>
  );
}