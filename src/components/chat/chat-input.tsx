"use client"

import { useState, useRef, useEffect, KeyboardEvent, RefAttributes } from "react"
import { useSettingsStore, Agent } from "@/store/settingsStore"
import { useChatStore, Message } from "@/store/chatStore"
import { useMcpRequest } from "@/lib/mcpHelper"
import { callPollinationsChat, AVAILABLE_MODELS, generatePollinationsAudio } from "@/lib/pollinationsApi"
import { processCRMQuery } from "@/lib/concordCRM"
import { toast } from "@/components/ui/use-toast"
import { PromptCommands } from './prompt-commands'
import { processMessageWithPrompts, SavedPrompt } from '@/lib/prompt-service'
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define SpeechRecognition interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Define CRM_KEYWORDS
const CRM_KEYWORDS = [
  'crm', 'customer', 'contact', 'lead', 'opportunity', 'deal', 'account',
  'find contact', 'search contact', 'look up', 'customer data'
];

// Gemini Style Icons (Replace with actual SVGs or components)
const PaperclipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>;
const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5l0 14"/><path d="m18 11-6-6-6 6"/></svg>;
const LoaderIcon = () => <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>;
const TempChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>; // Placeholder icon

// Interface for props, including the potential onSubmit from parent
interface ChatInputProps {
  onSubmit?: (message: string) => void;
}

// Utility to adjust textarea height
const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto'; // Reset height
  textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
};

// Add the getModelDisplayName function to format model IDs nicely
const getModelDisplayName = (modelId: string): string => {
  // Find the model in the AVAILABLE_MODELS list
  const model = AVAILABLE_MODELS.TEXT.find(m => m.id === modelId);
  
  // Return the name if found, otherwise capitalize the model ID
  if (model?.name) {
    return model.name;
  }
  
  // Fallback format: capitalize and replace dashes with spaces
  return modelId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function ChatInput({ onSubmit }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const {
    inputValue,
    setInputValue,
    addMessage,
    setIsGenerating,
    isGenerating,
    activeChatId,
    getActiveChatMessages
  } = useChatStore(state => ({
    inputValue: state.inputValue,
    setInputValue: state.setInputValue,
    addMessage: state.addMessage,
    setIsGenerating: state.setIsGenerating,
    isGenerating: state.isGenerating,
    activeChatId: state.activeChatId,
    getActiveChatMessages: state.getActiveChatMessages
  }));
  const {
    activeAgent,
    activeTextModel,
    activeVoice,
    agents,
    setActiveAgent,
    autoPlayAfterVoiceInput,
    setAutoPlayAfterVoiceInput
  } = useSettingsStore(state => ({
    activeAgent: state.activeAgent,
    activeTextModel: state.activeTextModel,
    activeVoice: state.activeVoice,
    agents: state.agents,
    setActiveAgent: state.setActiveAgent,
    autoPlayAfterVoiceInput: state.autoPlayAfterVoiceInput,
    setAutoPlayAfterVoiceInput: state.setAutoPlayAfterVoiceInput
  }));
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { sendRequest } = useMcpRequest()

  // Add CRM mode state
  const [isCRMMode, setIsCRMMode] = useState(false);
  const [crmConfigured, setCrmConfigured] = useState(false);
  
  // Detect CRM queries
  const [isCRMQuery, setIsCRMQuery] = useState(false);
  
  // State for PromptCommands
  const [slashCommandActive, setSlashCommandActive] = useState(false)
  // Add state for agent mentions
  const [agentMentionActive, setAgentMentionActive] = useState(false)
  const [micSettings, setMicSettings] = useState(false);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState("");
  // Optional: Keep track of recognition instance
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!inputValue) {
      setIsCRMQuery(false);
      return;
    }
    
    const lowerInput = inputValue.toLowerCase();
    const containsCRMKeyword = CRM_KEYWORDS.some((keyword: string) => 
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
          setCrmConfigured(true)
        }
      } catch (error) {
        console.error('Error loading CRM config:', error)
      }
    }
    loadCrmConfig()
  }, [])

  // Adjust textarea height as content changes
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      adjustTextareaHeight(textarea)
    }
  }, [inputValue])

  // Combined input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Check for slash command activation
    // Look for a slash preceded by a space or at the start of the text
    if ((value.endsWith('/') && (value.length === 1 || value[value.length-2] === ' ')) && !slashCommandActive) {
      setSlashCommandActive(true)
      setAgentMentionActive(false) // Close agent mention if open
    } else if (slashCommandActive && !value.includes('/')) {
      setSlashCommandActive(false)
    }
    
    // Check for @ mention activation
    // Look for @ preceded by a space or at the start of the text
    if ((value.endsWith('@') && (value.length === 1 || value[value.length-2] === ' ')) && !agentMentionActive) {
      setAgentMentionActive(true)
      setSlashCommandActive(false) // Close slash command if open
    } else if (agentMentionActive && !value.includes('@')) {
      setAgentMentionActive(false)
    }
  }

  // Handle selecting a prompt from PromptCommands
  const handleSelectPrompt = (command: string | SavedPrompt) => {
    if (typeof command === 'string') {
      setInputValue(command);
    } else {
      // It's a SavedPrompt object
      setInputValue(command.prompt);
    }
    setSlashCommandActive(false);
    textareaRef.current?.focus();
  }

  // Handle selecting an agent from mentions
  const handleSelectAgent = (agent: Agent) => {
    // Get cursor position
    const textarea = textareaRef.current
    if (!textarea) return
    
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = inputValue.substring(0, cursorPos)
    const textAfterCursor = inputValue.substring(cursorPos)
    
    // Find the last @ in the text before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      // Insert the agent name at that position
      const newText = textBeforeCursor.substring(0, lastAtIndex) + 
                      `@${agent.name} ` + 
                      textAfterCursor
      
      setInputValue(newText)
    }
    
    setAgentMentionActive(false)
    textareaRef.current?.focus()
  }

  // Handle voice recording and speech recognition
  const handleRecordClick = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Start recording if browser supports it
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        setIsRecording(true);
        startSpeechRecognition();
      } else {
        toast({ 
          title: "Recording Not Supported", 
          description: "Your browser does not support voice recording.",
          variant: "destructive"
        });
      }
    }
  }
  
  // Function to start speech recognition
  const startSpeechRecognition = () => {
    try {
      // Create a speech recognition instance
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Save to ref for later access
      recognitionRef.current = recognition;
      setRecognitionActive(true);
      
      // Set up event handlers
      recognition.onstart = () => {
        console.log("Speech recognition started");
        setRecognitionResult("");
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Process results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Set current transcript as input value
        if (finalTranscript) {
          setInputValue(finalTranscript);
          setRecognitionResult(finalTranscript);
        } else if (interimTranscript) {
          setInputValue(interimTranscript);
        }
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended");
        setRecognitionActive(false);
        setIsRecording(false);
        
        // If we have text and auto-submit is enabled, submit it
        if (recognitionResult && autoPlayAfterVoiceInput) {
          console.log("Auto-submitting voice input");
          setTimeout(() => handleSubmit(), 500);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Recognition error", event.error);
        setRecognitionActive(false);
        setIsRecording(false);
        
        toast({ 
          title: "Recognition Error", 
          description: `Error: ${event.error}`,
          variant: "destructive"
        });
      };
      
      // Start recognition
      recognition.start();
      
    } catch (error) {
      console.error("Speech recognition error:", error);
      setIsRecording(false);
      setRecognitionActive(false);
      
      toast({ 
        title: "Recognition Failed", 
        description: "Failed to start speech recognition.",
        variant: "destructive"
      });
    }
  }
  
  // Modified submit handler to support TTS auto-play
  const handleSubmit = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isGenerating || !activeChatId) {
      console.warn("handleSubmit blocked: Input empty, generating, or no active chat ID.");
      return;
    }

    // Process input for image generation commands
    const processedInput = (() => {
      // Check if the input contains an image generation command
      const imageMatch = trimmedInput.match(/generate an image of (.+)/i) || 
                       trimmedInput.match(/create an image of (.+)/i) ||
                       trimmedInput.match(/make an image of (.+)/i);
      
      if (imageMatch) {
        const imagePrompt = imageMatch[1].trim();
        const markdownImage = `\n\n![Generated Image](https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1280&height=1024&nologo=true)`;
        
        // Add the markdown image syntax to the user message
        return trimmedInput + markdownImage;
      }
      
      // If no special processing needed, return the original content
      return trimmedInput;
    })();

    const newMessageForStore: Message = {
      role: "user",
      content: [{ type: "text", content: processedInput }]
    };
    
    addMessage(newMessageForStore);
    setInputValue(""); 
    setRecognitionResult("");

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, 0);
    
    setIsGenerating(true);
    setError(null); 
    
    console.log("handleSubmit: Preparing API request");
    console.log("handleSubmit: Active Chat ID:", activeChatId);
    console.log("handleSubmit: Active Model:", activeTextModel);
    const currentMessages = getActiveChatMessages(); 
    const messagesForApi = currentMessages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content?.find(c => c.type === 'text')?.content || "" 
    }));
    console.log("handleSubmit: Messages for API (count):", messagesForApi.length);
    console.log("handleSubmit: System Prompt:", activeAgent?.system_prompt);

    try {
      const response = await callPollinationsChat(
        messagesForApi, 
        activeTextModel, 
        activeAgent?.system_prompt
      );
      
      console.log("handleSubmit: API Response Received:", response);

      let assistantContent = "";
      if (typeof response === 'string') {
        assistantContent = response;
      } else if (response?.message?.content) {
         assistantContent = response.message.content;
      } else if (response?.choices?.[0]?.message?.content) {
         assistantContent = response.choices[0].message.content;
      } else if (response?.text) {
         assistantContent = response.text;
      }
      
      if (assistantContent) {
          // Auto-play TTS if after voice input and auto-play is enabled
          if (autoPlayAfterVoiceInput && recognitionResult) {
            setTimeout(async () => {
              try {
                const audioUrl = await generatePollinationsAudio(assistantContent, activeVoice, false);
                if (audioUrl) {
                  const audio = new Audio(audioUrl);
                  audio.play();
                }
              } catch (err) {
                console.error("Auto TTS error:", err);
              }
            }, 500);
          }
          
          // Process assistant content before adding to message store
          const processedAssistantContent = (() => {
            // Check if we should process for image generation
            const imageGenerationCommands = [
              /generate an image of (.*?)(?:\.|$)/i,
              /create an image of (.*?)(?:\.|$)/i,
              /make an image of (.*?)(?:\.|$)/i,
              /show me (.*?)(?:\.|$)/i,
              /visualize (.*?)(?:\.|$)/i
            ];
            
            // Check each pattern
            for (const pattern of imageGenerationCommands) {
              const match = assistantContent.match(pattern);
              if (match) {
                const imagePrompt = match[1].trim();
                const markdownImage = `\n\n![Generated Image](https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1280&height=1024&nologo=true)`;
                
                // Add the markdown image syntax to the response
                return assistantContent + markdownImage;
              }
            }
            
            return assistantContent;
          })();
          
          // Create the assistant message with processed content
          const assistantMessage: Message = {
            role: "assistant",
            content: [{ type: 'text', content: processedAssistantContent }],
          };
          addMessage(assistantMessage);
      } else {
          console.error("handleSubmit: Could not extract content from API response", response);
          setError("Failed to understand the AI response.");
      }

    } catch (error: any) {
      console.error("handleSubmit: Error caught during API call:", error);
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage); 
      toast({
        title: "API Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle keyboard shortcuts for submit
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(true)
    }
    
    // Submit on Enter (but not with Shift for newline)
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating && !slashCommandActive) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleKeyUp = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(false)
    }
  }

  // Handle file attachment click
  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement file upload logic 
    toast({ title: "File Upload (WIP)", description: "File upload is not yet implemented." });
    if(e.target.files) console.log("Selected file:", e.target.files[0].name);
    // Reset file input
    e.target.value = '';
  }

  const handleImagePromptClick = () => {
    // TODO: Implement image prompt modal or logic
    // setIsImagePromptOpen(true); 
    toast({ title: "Generate Image (Placeholder)", description: "Functionality not yet implemented." });
  }

  // Add this function at the top level of the component, before the return statement
  const handleKeyListener = (e: KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.type === 'keydown') {
      // Example: Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
    }
  };

  return (
    <div className="relative">
      {/* Show PromptCommands when slash command is active */}
      {slashCommandActive && <PromptCommands active={slashCommandActive} onSelectPrompt={handleSelectPrompt}/>}
      
      {/* Add AgentMentions component when @ mention is active */}
      {agentMentionActive && (
        <div className="absolute bottom-full left-0 right-0 w-full max-h-[300px] overflow-y-auto rounded-md bg-zinc-800 border border-zinc-700 shadow-lg z-10 mb-2">
          <div className="p-2 border-b border-zinc-700">
            <div className="text-sm text-zinc-400">@Mention an agent</div>
          </div>
          {/* List available agents */}
          <div className="py-1">
            {agents.map((agent) => (
              <div 
                key={agent.id}
                className="px-3 py-2 hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-2"
                onClick={() => {
                  handleSelectAgent(agent);
                  setActiveAgent(agent); // Also set this as the active agent
                }}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center shrink-0">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-zinc-400 truncate">{agent.description || agent.system_prompt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-end gap-2 p-2 bg-zinc-800 rounded-xl border border-zinc-700/50 shadow-md">
        {/* File attachment button */}
        <button
           className="p-2 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100"
           onClick={handleFileClick}
           title="Attach file"
           disabled={isGenerating}
        >
           <PaperclipIcon /> 
        </button>
        
        {/* Microphone button with settings popup */}
        <div className="relative">
          <button
            onClick={(e) => {
              // If Alt/Option key is pressed, show settings instead of starting recording
              if (e.altKey) {
                setMicSettings(!micSettings);
              } else {
                handleRecordClick();
              }
            }}
            className={`p-2 rounded-full hover:bg-zinc-700 transition-colors ${isRecording ? 'text-red-500' : 'text-zinc-400 hover:text-zinc-100'} relative group`}
            title={isRecording ? "Stop recording" : "Start voice recording (Alt+click for settings, Auto-play response enabled)"}
            disabled={isGenerating}
          >
            <MicIcon />
            <div className="absolute -top-1 -right-1 w-3 h-3 opacity-0 group-hover:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bg-zinc-700 rounded-full p-0.5"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/></svg>
            </div>
          </button>
          
          {/* Simple settings popup */}
          {micSettings && (
            <div className="absolute top-0 right-0 transform -translate-y-full mt-2 w-72 bg-zinc-800 border border-zinc-700 rounded-md p-3 shadow-lg z-50">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-zinc-100">Voice Input Settings</h4>
                <div className="flex items-center justify-between">
                  <label htmlFor="auto-tts" className="text-sm text-zinc-100">Auto-play response</label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      id="auto-tts" 
                      checked={autoPlayAfterVoiceInput}
                      onChange={() => setAutoPlayAfterVoiceInput(!autoPlayAfterVoiceInput)}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full ${autoPlayAfterVoiceInput ? 'bg-blue-500' : 'bg-zinc-600'} transition`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${autoPlayAfterVoiceInput ? 'translate-x-4' : ''}`}></div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  When enabled, after using voice input, the AI's response will be read aloud automatically using the selected voice. 
                  Note: Speaker button will read the exact response, while voice input will generate a normal response.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* If TextareaAutosize still has typing issues, fall back to standard textarea with manual resize */}
        <textarea
          ref={textareaRef}
          className="flex-1 bg-transparent resize-none px-1 py-2 border-0 focus:ring-0 focus:outline-none text-base text-zinc-100 placeholder:text-zinc-500"
          placeholder={`Message ${getModelDisplayName(activeTextModel)}...`}
          rows={1}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          disabled={isGenerating}
          style={{ overflow: 'auto', minHeight: '40px', maxHeight: '150px' }}
        />
        
        <button
           className={`p-2 rounded-full transition-colors ${inputValue.trim() && !isGenerating ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
          onClick={handleSubmit}
          disabled={!inputValue.trim() || isGenerating}
          title="Send message"
        >
           {isGenerating ? <LoaderIcon /> : <ArrowUpIcon />}
        </button>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        multiple={false}
      />
    </div>
  );
}