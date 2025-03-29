"use client"

import { useState, useRef, useEffect } from "react"
import { useSettingsStore, Agent } from "@/store/settingsStore"
import { useChatStore, Message } from "@/store/chatStore"
import { useMcpRequest } from "@/lib/mcpHelper"

export function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputValue = useChatStore(state => state.inputValue)
  const setInputValue = useChatStore(state => state.setInputValue)
  const addMessage = useChatStore(state => state.addMessage)
  const setIsGenerating = useChatStore(state => state.setIsGenerating)
  const isGenerating = useChatStore(state => state.isGenerating)
  const activeAgent = useSettingsStore(state => state.activeAgent)
  const selectedAgentId = useSettingsStore(state => state.selectedAgentId)
  const activeChatId = useChatStore(state => state.activeChatId)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isImagePromptOpen, setIsImagePromptOpen] = useState(false)
  const [imagePrompt, setImagePrompt] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Agent selection functionality
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentMenu, setShowAgentMenu] = useState(false)
  const [mentionPos, setMentionPos] = useState<{start: number, end: number} | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const { sendRequest } = useMcpRequest()

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

  const handleSubmit = async () => {
    if (!inputValue.trim() || isGenerating) return
    
    // Create and add user message
    const userMessage: Message = {
      role: "user",
      content: [{ type: "text", content: inputValue.trim() }]
    }
    
    addMessage(userMessage)
    setInputValue("")
    setIsGenerating(true)
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    
    try {
      // Use the selected agent if one was mentioned with @, otherwise use the active agent
      const agentToUse = selectedAgent || activeAgent
      // Get the agent ID - can be a string or null
      const agentIdToUse = selectedAgent?.id || selectedAgentId
      
      // Pass the agent to the request
      await sendRequest(inputValue, agentToUse, agentIdToUse)
      
      // Reset selected agent after submission
      setSelectedAgent(null)
    } catch (error) {
      console.error("Error sending request:", error)
      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content: [{ type: "text", content: "Sorry, there was an error processing your request. Please try again." }]
      }
      addMessage(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }
  
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
    
    // Replace the @ with the selected agent name in the input
    if (mentionPos) {
      const before = inputValue.substring(0, mentionPos.start)
      const after = inputValue.substring(mentionPos.end)
      setInputValue(before + `@${agent.name} ` + after)
      
      // Reset mention position
      setMentionPos(null)
      
      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = before.length + agent.name.length + 2 // +2 for @ and space
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  // Handle microphone input
  const handleMicClick = () => {
    if (!isRecording) {
      // Start recording logic
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setIsRecording(true);
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks: BlobPart[] = [];
            
            mediaRecorder.addEventListener("dataavailable", event => {
              audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener("stop", () => {
              const audioBlob = new Blob(audioChunks);
              const audioUrl = URL.createObjectURL(audioBlob);
              
              // Convert audio to text (would connect to speech-to-text API)
              // For now, we'll just add a placeholder message
              setInputValue(inputValue + " [Voice input transcription would appear here] ");
              setIsRecording(false);
            });
            
            // Stop recording after 5 seconds
            mediaRecorder.start();
            setTimeout(() => {
              mediaRecorder.stop();
            }, 5000);
          })
          .catch(error => {
            console.error("Error accessing microphone:", error);
            setIsRecording(false);
          });
      } else {
        alert("Your browser doesn't support microphone access");
      }
    } else {
      // Stop recording logic
      setIsRecording(false);
    }
  };

  // Handle image generation
  const handleGenerateImage = () => {
    if (imagePrompt.trim()) {
      // Add a message with an image generation directive
      const imageMessage: Message = {
        role: "user",
        content: [{ type: "text", content: `!generate image: ${imagePrompt.trim()}` }]
      };
      
      addMessage(imageMessage);
      
      // Process the image generation request
      setIsGenerating(true);
      try {
        sendRequest(`!generate image: ${imagePrompt.trim()}`, activeAgent, selectedAgentId);
      } catch (error) {
        console.error("Error generating image:", error);
      } finally {
        setIsGenerating(false);
        setIsImagePromptOpen(false);
        setImagePrompt("");
      }
    }
  };

  // Handle file upload
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check if file is PDF or image
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);
      
      // Add user message indicating file upload
      const fileType = file.type === 'application/pdf' ? 'PDF' : 'image';
      
      const userMessage: Message = {
        role: "user",
        content: [
          { type: "text", content: `I've uploaded a ${fileType} file: ${file.name}` },
          // In a real implementation, you'd process the file and add appropriate content
          // For now, just adding text content about the upload
        ]
      };
      
      addMessage(userMessage);
      
      // For a complete implementation, you would:
      // 1. Upload the file to a server or process it client-side
      // 2. Extract text from PDFs or analyze images
      // 3. Add the processed content to the chat
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      alert("Please upload a PDF or image file");
    }
  };

  return (
    <div className="p-4 border-t bg-background sticky bottom-0 z-10">
      {isImagePromptOpen && (
        <div className="max-w-3xl mx-auto mb-2 flex">
          <input
            type="text"
            className="flex-1 rounded-l-lg border bg-background px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            placeholder="Describe the image you want to generate..."
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGenerateImage();
              }
            }}
          />
          <button
            className="rounded-r-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            onClick={handleGenerateImage}
          >
            Generate
          </button>
        </div>
      )}
      <form
        className="relative flex flex-col max-w-3xl mx-auto"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <div className="flex items-center mb-2">
          <button
            type="button"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setIsImagePromptOpen(!isImagePromptOpen)}
            title="Generate image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </button>
          <button
            type="button"
            className={`p-2 rounded-md ${isRecording ? 'text-red-500' : 'text-muted-foreground'} hover:text-foreground hover:bg-muted`}
            onClick={handleMicClick}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
          <button
            type="button"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleFileUpload}
            title="Upload file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf,image/*"
            onChange={handleFileChange}
          />
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] max-h-[200px] resize-none"
            placeholder="Type your message here... (Use @ to mention an agent)"
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
          />
          
          {/* Agent selection menu */}
          {showAgentMenu && (
            <div className="absolute bottom-full left-0 right-0 bg-background rounded-md border shadow-md max-h-[200px] overflow-y-auto z-20 mb-1">
              {isLoading ? (
                <div className="p-3 text-center text-muted-foreground">
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Loading agents...
                </div>
              ) : agents.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground">
                  No agents available
                </div>
              ) : (
                <ul className="py-1">
                  {agents.map((agent) => (
                    <li 
                      key={agent.id}
                      className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => selectAgent(agent)}
                    >
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{agent.systemPrompt.substring(0, 60)}...</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Active agent indicator */}
          {selectedAgent && (
            <div className="absolute top-0 right-0 m-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
              Using: {selectedAgent.name}
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-2">
          <div>
            {/* Upload button */}
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="shrink-0 rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!inputValue.trim() || isGenerating}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
              </svg>
              <span className="sr-only">Send</span>
            </button>
          </div>
        </div>
      </form>
      <div className="mt-1 text-xs text-center text-muted-foreground">
        <span className="opacity-75">Press Enter to send, Shift+Enter for new line</span>
      </div>
    </div>
  )
}