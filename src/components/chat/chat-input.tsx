"use client"

import { useState, useRef, useEffect } from "react"
import { useSettingsStore, Agent } from "@/store/settingsStore"
import { useChatStore, Message } from "@/store/chatStore"
import { useMcpRequest } from "@/lib/mcpHelper"
import { processCRMQuery } from "@/lib/concordCRM"
import { toast } from "@/components/ui/use-toast"
import { PromptCommands } from './prompt-commands'
import { processMessageWithPrompts } from '@/lib/prompt-service'

// Define the CRM result type
interface CRMResult {
  success: boolean;
  message: string;
}

// CRM Constants - Inline integration to avoid routing issues
const CRM_KEYWORDS = [
  'contact', 'deal', 'activity', 
  'show', 'find', 'get', 'list',
  'create', 'add', 'update', 'delete',
  'crm', 'concord', 'customer'
]

// Simple CRM mock responses
const processCRMQueryMock = async (query: string) => {
  // Wait a bit to simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('how many contacts') || lowerQuery.includes('count contacts')) {
    return {
      success: true,
      message: "You have 3 contacts in your CRM:\n\n- John Doe | john.doe@example.com | 555-123-4567\n- Jane Smith | jane.smith@example.com | 555-987-6543\n- Bob Johnson | bob.johnson@example.com | 555-456-7890"
    };
  }
  
  if (lowerQuery.includes('list deals') || lowerQuery.includes('show deals')) {
    return {
      success: true,
      message: "Here are your active deals:\n\n1. Software License ($5,000) - Proposal stage\n2. Consulting Project ($10,000) - Negotiation stage\n3. Hardware Purchase ($7,500) - Closed Won"
    };
  }
  
  if (lowerQuery.includes('activities') || lowerQuery.includes('tasks')) {
    return {
      success: true,
      message: "Upcoming activities:\n\n1. Follow-up email - Due: Tomorrow\n2. Proposal meeting - Due: Apr 15\n3. Demo preparation - Due: Apr 20"
    };
  }
  
  return {
    success: false,
    message: "I couldn't understand your CRM query. Try asking about contacts, deals, or activities."
  };
};

// Real CRM integration function
const processCRMQueryReal = async (query: string): Promise<CRMResult> => {
  try {
    // Get CRM config from localStorage
    const savedConfig = localStorage.getItem('crm_config');
    if (!savedConfig) {
      return {
        success: false,
        message: "CRM is not configured. Please set up your CRM credentials in settings."
      };
    }

    const config = JSON.parse(savedConfig);
    if (!config.baseUrl || !config.apiToken) {
      return {
        success: false,
        message: "CRM configuration is incomplete. Please provide both URL and API token in settings."
      };
    }

    // Call the API route
    const response = await fetch('/api/crm-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        baseUrl: config.baseUrl,
        apiToken: config.apiToken
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error processing CRM query:', error);
    return {
      success: false,
      message: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputValue = useChatStore(state => state.inputValue)
  const setInputValue = useChatStore(state => state.setInputValue)
  const addMessage = useChatStore(state => state.addMessage)
  const setIsGenerating = useChatStore(state => state.setIsGenerating)
  const isGenerating = useChatStore(state => state.isGenerating)
  const activeAgent = useSettingsStore(state => state.activeAgent)
  const selectedAgentId = useSettingsStore(state => state.selectedAgentId)
  const activeVoice = useSettingsStore(state => state.activeVoice)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isImagePromptOpen, setIsImagePromptOpen] = useState(false)
  const [imagePrompt, setImagePrompt] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Agent selection functionality
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentMenu, setShowAgentMenu] = useState(false)
  const [mentionPos, setMentionPos] = useState<{start: number, end: number} | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { sendRequest } = useMcpRequest()

  // Add CRM mode state
  const [isCRMMode, setIsCRMMode] = useState(false);
  const [crmConfigured, setCrmConfigured] = useState(false);
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
  // Check local storage for CRM configuration on mount
  useEffect(() => {
    const storedConfig = localStorage.getItem('crm_config');
    if (storedConfig) {
      setCrmConfigured(true);
    }
  }, []);
  
  // Detect CRM queries
  const [isCRMQuery, setIsCRMQuery] = useState(false);
  
  useEffect(() => {
    if (!inputValue) {
      setIsCRMQuery(false);
      return;
    }
    
    const lowerInput = inputValue.toLowerCase();
    const containsCRMKeyword = CRM_KEYWORDS.some(keyword => 
      lowerInput.includes(keyword)
    );
    
    setIsCRMQuery(containsCRMKeyword);
  }, [inputValue]);

  // Load CRM configuration on mount
  useEffect(() => {
    const loadCrmConfig = () => {
      try {
        const savedConfig = localStorage.getItem('crm_config')
        if (savedConfig) {
          const config = JSON.parse(savedConfig)
          setCrmConfigured(true)
        }
      } catch (error) {
        console.error('Error loading CRM config:', error)
      }
    }
    loadCrmConfig()
  }, [])

  // Fetch agents when component mounts
  useEffect(() => {
    fetchAgents()
  }, [])

  // Function to fetch available agents
  const fetchAgents = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching agents...")
      
      // Fetch agents from the /api/agents endpoint instead of the settings store
      const response = await fetch('/api/agents', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      
      const data = await response.json()
      console.log("Agents loaded from API:", data.agents.length, data.agents.map((a: any) => a.name))
      
      // Convert API agents to the format used by the component
      const formattedAgents: Agent[] = data.agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        systemPrompt: agent.system_prompt
      }))
      
      setAgents(formattedAgents)
    } catch (error) {
      console.error("Error fetching agents:", error)
      // Fallback to settings store if API fails
      const storeAgents = useSettingsStore.getState().agents
      console.log("Falling back to store agents:", storeAgents.length, storeAgents.map(a => a.name))
      setAgents(storeAgents)
    } finally {
      setIsLoading(false)
    }
  }

  // Adjust textarea height as content changes
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = '0'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [inputValue])

  // Modified submit handler to include prompt processing
  const handleSubmit = async () => {
    if (!inputValue.trim() || isGenerating) return;
    
    // Process input for slash commands
    const processedInput = inputValue.startsWith('/')
      ? processMessageWithPrompts(inputValue.trim())
      : inputValue.trim();
    
    // Create and add user message
    const userMessage: Message = {
      role: "user",
      content: [{ type: "text", content: inputValue.trim() }]
    };
    
    addMessage(userMessage);
    setInputValue("");
    setIsGenerating(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    try {
      // Check if this is a CRM query and CRM mode is enabled
      if (isCRMMode && isCRMQuery) {
        console.log("Processing CRM query:", inputValue);
        // Use the real CRM integration instead of the mock
        const crmResult = await processCRMQueryReal(inputValue);
        
        const assistantMessage: Message = {
          role: "assistant",
          content: [{ 
            type: "text", 
            content: crmResult.message || "I couldn't process your CRM request."
          }]
        };
        
        addMessage(assistantMessage);
        
        // Check if spoken responses are enabled for the active agent
        if (activeAgent?.enableSpokenResponses && crmResult.message) {
          await playAssistantResponse(crmResult.message);
        }
      } else if (inputValue.toLowerCase().includes('!generate image') || 
                 inputValue.toLowerCase().includes('generate image')) {
        // Extract the image prompt
        const promptMatch = inputValue.match(/(?:!generate image:|generate image:?)\s*(.*)/i);
        if (promptMatch && promptMatch[1]) {
          const imagePrompt = promptMatch[1].trim();
          
          // Generate image with safety off and nologo
          const imageOptions = {
            prompt: imagePrompt,
            safety: false,
            nologo: true
          };
          
          // Send the request with options
          await sendRequest(`!generate image: ${JSON.stringify(imageOptions)}`, activeAgent, selectedAgentId);
        } else {
          // Process normally with MCP
          const agentToUse = selectedAgent || activeAgent;
          const agentIdToUse = selectedAgent?.id || selectedAgentId;
          
          await sendRequest(processedInput, agentToUse, agentIdToUse);
          
          // Check if spoken responses are enabled for this agent
          if (agentToUse?.enableSpokenResponses) {
            // Get the latest messages after the response
            const messages = useChatStore.getState().getActiveChatMessages();
            const latestMessage = messages[messages.length - 1];
            
            // Ensure it's an assistant message with text content
            if (latestMessage && latestMessage.role === 'assistant') {
              // Extract text content
              const textContent = latestMessage.content
                .filter((item: any) => item.type === 'text')
                .map((item: any) => item.content)
                .join(' ');
              
              if (textContent) {
                // Play the assistant's response as speech
                await playAssistantResponse(textContent);
              }
            }
          }
        }
      } else {
        // Use the processed input for slash commands
        await sendRequest(processedInput, activeAgent, selectedAgentId);
      }
      
      // Reset selected agent to prevent persistence
      setSelectedAgent(null);
      // Import useSettingsStore
      const settingsStore = useSettingsStore.getState();
      settingsStore.setSelectedAgentId(null);
    } catch (error) {
      console.error("Error processing message:", error);
      
      const errorMessage: Message = {
        role: "assistant",
        content: [{ 
          type: "text", 
          content: "Sorry, there was an error processing your request. Please try again."
        }]
      };
      
      addMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(true)
    }
    
    // Submit on Enter (without Shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    
    // Handle @ for agent selection
    if (e.key === "@") {
      console.log("@ key pressed, showing agent menu")
      const start = textareaRef.current?.selectionStart || 0
      setMentionPos({start, end: start + 1})
      setShowAgentMenu(true)
      
      // Ensure we have agents
      if (agents.length === 0) {
        console.log("No agents loaded, fetching agents now")
        fetchAgents()
      } else {
        console.log("Agents available:", agents.length, agents.map(a => a.name))
      }
    }

    // Close agent menu on escape
    if (e.key === "Escape" && showAgentMenu) {
      setShowAgentMenu(false)
    }
  }
  
  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(false)
    }
  }

  // Select an agent from menu
  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowAgentMenu(false)
    
    if (mentionPos) {
      // Replace @mention with the agent name
      const beforeMention = inputValue.substring(0, mentionPos.start)
      const afterMention = inputValue.substring(mentionPos.end)
      setInputValue(beforeMention + '@' + agent.name + ' ' + afterMention)
      setMentionPos(null)
    }
  }

  // Handle microphone input
  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Toggle recording state
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Start voice recording
  const startRecording = async () => {
    try {
      setIsRecording(true)
      // Implement recording logic here
      console.log('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      setIsRecording(false)
    }
  }

  // Stop voice recording
  const stopRecording = async () => {
    try {
      setIsRecording(false)
      // Process recording here
      console.log('Recording stopped')
    } catch (error) {
      console.error('Error stopping recording:', error)
    }
  }

  // Play audio for assistant message
  const playAssistantResponse = async (text: string) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      setIsAudioLoading(true);
      
      console.log(`Generating speech for assistant response: "${text.substring(0, 50)}..."`);
      
      // Call the API with conversation mode
      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: activeVoice,
          mode: "direct" // Use direct mode for simplicity
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.audioUrl) {
        throw new Error('Invalid response from audio API');
      }
      
      console.log("Received audio URL:", data.audioUrl);
      
      // Create and play audio element
      const audio = new Audio(data.audioUrl);
      
      // Set up event handlers
      audio.onloadeddata = () => {
        setIsAudioLoading(false);
        setIsAudioPlaying(true);
        console.log("Audio loaded, playing...");
      };
      
      audio.onended = () => {
        setIsAudioPlaying(false);
        console.log("Audio playback complete");
      };
      
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsAudioLoading(false);
        setIsAudioPlaying(false);
        toast({
          title: "Audio Playback Error",
          description: "Failed to play the assistant's response audio.",
          variant: "destructive"
        });
      };
      
      // Store reference and start playback
      audioRef.current = audio;
      audio.play().catch(error => {
        console.error("Error playing audio:", error);
        setIsAudioLoading(false);
        setIsAudioPlaying(false);
      });
    } catch (error) {
      console.error("Error generating speech:", error);
      setIsAudioLoading(false);
      setIsAudioPlaying(false);
      toast({
        title: "Speech Generation Error",
        description: "Failed to generate speech for the assistant's response.",
        variant: "destructive"
      });
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Implement file handling logic
    console.log('File selected:', file.name)
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Modified handleGenerateImage to support nologo and safety settings
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    console.log('Generating image with prompt:', imagePrompt);
    
    // Create and add user message about the image request
    const userMessage: Message = {
        role: "user",
      content: [{ type: "text", content: `Generate image: ${imagePrompt}` }]
    };
    
    addMessage(userMessage);
    setImagePrompt("");
    setIsGenerating(true);
    setIsImagePromptOpen(false);
    
    try {
      // Message for the placeholder while image is generating
      const assistantMessage: Message = {
        role: "assistant",
        content: [
          { type: "text", content: "Generating image..." },
          { type: "image", content: "placeholder" }
        ]
      };
      
      addMessage(assistantMessage);
      
      // Call to generate image with safety off and nologo
      const imageOptions = {
        prompt: imagePrompt,
        safety: false,
        nologo: true
      };
      
      await sendRequest(`!generate image: ${JSON.stringify(imageOptions)}`, activeAgent, selectedAgentId);
      
      } catch (error) {
        console.error("Error generating image:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: [{ type: "text", content: "Sorry, there was an error generating the image. Please try again." }]
      };
      addMessage(errorMessage);
      } finally {
        setIsGenerating(false);
    }
  };

  // Handle file upload
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Add CRM settings dialog
  const [showCrmSettings, setShowCrmSettings] = useState(false)
  const [crmConfig, setCrmConfig] = useState({
    baseUrl: '',
    apiToken: ''
  });

  const saveCrmSettings = () => {
    try {
      // Validate settings
      if (!crmConfig.baseUrl || !crmConfig.apiToken) {
        toast({
          title: "Validation Error",
          description: "Both CRM URL and API Token are required",
          variant: "destructive"
        });
        return;
      }
      
      // Format the URL properly
      let baseUrl = crmConfig.baseUrl;
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
      }
      
      // Remove trailing slash if present
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      const updatedConfig = {
        ...crmConfig,
        baseUrl
      };
      
      // Save to localStorage
      localStorage.setItem('crm_config', JSON.stringify(updatedConfig));
      setCrmConfig(updatedConfig);
      setCrmConfigured(true);
      setShowCrmSettings(false);
      
      toast({
        title: "CRM Configuration Saved",
        description: "CRM integration is now active",
        variant: "default"
      });
      
      // Test the connection if desired
      if (crmConfig.baseUrl.includes('demo') || crmConfig.baseUrl.includes('example')) {
        toast({
          title: "Demo Mode",
          description: "Running in demo mode with simulated responses",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error saving CRM settings:', error);
      toast({
        title: "Error",
        description: "Failed to save CRM settings",
        variant: "destructive"
      });
    }
  };

  // Add toggle CRM mode function
  const toggleCRMMode = () => {
    if (!crmConfigured) {
      setShowCrmSettings(true);
    } else {
      setIsCRMMode(!isCRMMode);
    }
  };

  // Add function to reset the agent selection
  const resetAgentSelection = () => {
    setSelectedAgent(null);
    const settingsStore = useSettingsStore.getState();
    settingsStore.setSelectedAgentId(null);
    toast({
      title: "Agent reset",
      description: "Using default assistant now",
      variant: "default"
    });
  };

  // Get model settings
  const activeTextModel = useSettingsStore(state => state.activeTextModel);
  const setActiveTextModel = useSettingsStore(state => state.setActiveTextModel);

  // Model selection component
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  // Available text models - simplified list
  const availableModels = [
    { id: "google-gemini-pro", name: "Google Gemini Pro" },
    { id: "google-gemini-flash", name: "Google Gemini Flash" },
    { id: "pollinations-llama", name: "Llama 3.3" },
    { id: "pollinations-mistral", name: "Mistral" }
  ];

  // Add state for slash commands
  const [slashCommandActive, setSlashCommandActive] = useState(false)

  // Update the input change handler to detect slash commands
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Check for slash command activation
    if (value.endsWith('/') && !slashCommandActive) {
      setSlashCommandActive(true)
    } else if (slashCommandActive && !value.includes('/')) {
      setSlashCommandActive(false)
    }
    
    // Continue with existing code for mentor detection if any
    // ... existing input change logic ...
  }
  
  // Handle selecting a prompt from the slash commands menu
  const handleSelectPrompt = (command: string) => {
    setInputValue(command + ' ')
    setSlashCommandActive(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <div className="relative border-t border-gray-700 bg-[#111318] px-4 py-2 sm:mb-0 sm:border-t-0 md:py-3 md:pl-4 md:pr-3">
      {/* Add PromptCommands component */}
      <PromptCommands 
        active={slashCommandActive}
        onSelectPrompt={handleSelectPrompt}
      />
      
      <div className="relative flex flex-row items-center">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or use / for saved prompts..."
          className="max-h-36 min-h-10 w-full resize-none rounded-md border-0 bg-transparent px-4 py-2.5 text-gray-200 shadow-sm ring-1 ring-inset ring-gray-700 focus:ring-inset focus:ring-gray-600 sm:text-sm"
          style={{ height: 'auto' }}
        />
        
        <div className="flex items-center p-2 gap-1">
          {!isGenerating && (
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className={`p-1.5 rounded-md ${inputValue.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-gray-400'} transition-colors`}
              title="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/></svg>
            </button>
          )}
          
          {isGenerating && (
            <button
              onClick={() => setIsGenerating(false)}
              className="p-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
              title="Stop generating"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4"/></svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="absolute right-12 bottom-3 flex items-center space-x-1 text-gray-500">
        {isCRMQuery && crmConfigured && (
          <div className="text-orange-400 mr-2 text-xs font-medium rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            CRM
          </div>
        )}
      </div>
    </div>
  )
}