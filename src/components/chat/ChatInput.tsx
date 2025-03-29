"use client";

import { useRef, useState, useEffect } from "react";
import { SendIcon, Image as ImageIcon, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChatStore } from "@/store/chatStore";
import { useMcpRequest } from "@/lib/mcpHelper";
import { Input } from "@/components/ui/input";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useSettingsStore } from "@/store/settingsStore";

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  model_selection?: string;
  voice_selection?: string;
  knowledge_source_info?: any;
}

export function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendRequest } = useMcpRequest();
  const addMessage = useChatStore(state => state.addMessage);
  const setIsGenerating = useChatStore(state => state.setIsGenerating);
  const { activeAgent, selectedAgentId } = useSettingsStore();
  const [input, setInput] = useState("");
  const [isImagePromptOpen, setIsImagePromptOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  
  // Agent selection functionality
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [mentionPos, setMentionPos] = useState<{start: number, end: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // On component mount, check if there's a global selected agent
  useEffect(() => {
    if (activeAgent && !selectedAgent) {
      console.log("ChatInput - Setting selected agent from activeAgent:", activeAgent.name);
      
      // Create a complete agent object with both system prompt formats
      const systemPromptValue = activeAgent.systemPrompt || activeAgent.system_prompt || '';
      
      setSelectedAgent({
        id: activeAgent.id,
        name: activeAgent.name,
        system_prompt: systemPromptValue,
        systemPrompt: systemPromptValue, // Ensure both formats are available
        description: activeAgent.description
      });
    }
  }, [activeAgent, selectedAgent]);

  // Fetch agents when component mounts
  useEffect(() => {
    fetchAgents();
  }, []);

  // Function to fetch agents from API
  async function fetchAgents() {
    try {
      setIsLoading(true);
      const apiUrl = `${window.location.origin}/api/agents`;
      console.log("Fetching agents from:", apiUrl);
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        console.log("Agents loaded successfully:", data.agents);
        setAgents(data.agents || []);
      } else {
        console.error("Failed to fetch agents. Status:", response.status);
        // Use mock agents as fallback
        const mockAgents = [
          {
            id: "mock-agent-1",
            name: "Default Assistant",
            system_prompt: "You are a helpful assistant."
          }
        ];
        console.log("Using mock agents as fallback");
        setAgents(mockAgents);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
      // Use mock agents as fallback
      setAgents([
        {
          id: "mock-agent-1",
          name: "Default Assistant",
          system_prompt: "You are a helpful assistant."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    addMessage({
      role: "user",
      content: [
        {
          type: "text",
          content: input
        }
      ]
    });

    // Clear input
    setInput("");

    // Send to AI - use selected agent from component state OR the global selected agent
    setIsGenerating(true);
    try {
      // Use the selected agent from this component if available, otherwise use active agent from store
      const agentToUse = selectedAgent || activeAgent;
      const agentIdToUse = selectedAgent?.id || selectedAgentId;
      
      console.log("ChatInput - Submitting message with agent:", {
        name: agentToUse?.name || "None",
        id: agentIdToUse || "None",
        systemPromptPreview: agentToUse?.systemPrompt?.substring(0, 50) || agentToUse?.system_prompt?.substring(0, 50) || "None",
        source: selectedAgent ? "Local component state" : activeAgent ? "Global store" : "None available"
      });

      await sendRequest(input, agentToUse, agentIdToUse);
    } catch (error) {
      console.error("ChatInput - Error processing request:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (not Shift+Enter)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    // Handle @ for agent selection
    if (e.key === "@") {
      console.log("@ key pressed, showing agent menu");
      const start = textareaRef.current?.selectionStart || 0;
      setMentionPos({start, end: start + 1});
      setShowAgentMenu(true);
      
      // Ensure we have agents
      if (agents.length === 0) {
        console.log("No agents loaded, fetching agents now");
        fetchAgents();
      }
    }

    // Close agent menu on escape
    if (e.key === "Escape" && showAgentMenu) {
      setShowAgentMenu(false);
    }
  };

  // Select an agent from menu
  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentMenu(false);
    
    // Replace the @ with the selected agent name in the input
    if (mentionPos) {
      const before = input.substring(0, mentionPos.start);
      const after = input.substring(mentionPos.end);
      setInput(before + `@${agent.name} ` + after);
      
      // Reset mention position
      setMentionPos(null);
      
      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = before.length + agent.name.length + 2; // +2 for @ and space
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Handle image generation
  const handleGenerateImage = () => {
    if (imagePrompt.trim()) {
      // Add a message with an image generation directive
      const imageMessage = {
        role: "user",
        content: [{ type: "text", content: `!generate image: ${imagePrompt.trim()}` }]
      };
      
      addMessage(imageMessage);
      
      // Process the image generation request
      setIsGenerating(true);
      try {
        // Use the selected agent from this component if available, otherwise use active agent from store
        const agentToUse = selectedAgent || activeAgent;
        const agentIdToUse = selectedAgent?.id || selectedAgentId;
        
        sendRequest(`!generate image: ${imagePrompt.trim()}`, agentToUse, agentIdToUse);
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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log("File selected:", file.name);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mt-auto mx-auto">
      {/* Add info about Gemini models */}
      <div className="p-2 mb-2 text-xs bg-muted/30 rounded-md text-center">
        <p>Tip: For better agent persona handling, try using a Google Gemini model from your agent settings.</p>
      </div>
      
      <div className="relative">
        {/* Current Agent Badge */}
        {selectedAgent && (
          <div className="absolute -top-8 left-0 px-3 py-1 bg-primary/20 text-primary-foreground rounded-t-md text-xs flex items-center">
            <span>Agent: {selectedAgent.name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 w-5 p-0 ml-2" 
              onClick={() => setSelectedAgent(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      
        {/* File input (hidden) */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />
        
        <div className="relative flex items-center border rounded-md bg-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
          <Textarea
            ref={textareaRef}
            placeholder={selectedAgent 
              ? `Message ${selectedAgent.name}...` 
              : "Type a message or use @ to select an agent..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[40px] resize-none border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-3 pr-20"
            rows={1}
            style={{
              height: "auto",
              minHeight: "60px",
              maxHeight: "200px"
            }}
          />
          
          {/* Agent selection menu - Modified for better visibility */}
          {showAgentMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
              <div className="p-2 bg-gray-900 rounded-t-md border-b border-gray-700">
                <h3 className="text-sm font-medium text-white">Select an Agent</h3>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto p-1">
                {isLoading ? (
                  <div className="p-3 text-center text-sm text-gray-400">Loading agents...</div>
                ) : agents.length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-400">
                    No agents found. Please create an agent first.
                  </div>
                ) : (
                  <div>
                    {agents.map(agent => (
                      <div 
                        key={agent.id} 
                        onClick={() => selectAgent(agent)}
                        className="p-2 hover:bg-gray-700 rounded cursor-pointer mb-1 border border-transparent hover:border-gray-600"
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            <span className="text-xs">{agent.name.substring(0, 2).toUpperCase()}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{agent.name}</p>
                            <p className="text-xs text-gray-400 truncate">{agent.system_prompt.substring(0, 60)}...</p>
                          </div>
                          {agent.model_selection && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 ml-2">
                              {agent.model_selection.split('-')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-2 bg-gray-900 border-t border-gray-700 rounded-b-md">
                <p className="text-xs text-gray-400">
                  Can't see your agents? <a href="/agents" className="text-blue-400 hover:underline">Create new agents</a>
                </p>
              </div>
            </div>
          )}
          
          <div className="absolute right-0 flex items-center mr-2 space-x-1">
            {/* Add Agent Selection Button */}
            <button
              onClick={() => {
                console.log("Manual agent selection triggered");
                setShowAgentMenu(!showAgentMenu);
                if (agents.length === 0) {
                  fetchAgents();
                }
              }}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Select an agent"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a5 5 0 0 1 5 5v6a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"></path>
                <path d="M15.2 22a3 3 0 0 0 2.8-3"></path>
                <path d="M8.8 22a3 3 0 0 1-2.8-3"></path>
                <path d="M7 7.6v.8a3 3 0 0 0 6 0v-.8"></path>
              </svg>
            </button>

            {/* Image prompt button */}
            <button
              onClick={() => setIsImagePromptOpen(!isImagePromptOpen)}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Generate an image"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </button>
            
            {/* Upload button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleFileUpload}
            >
              <label className="cursor-pointer">
                <Mic className="h-5 w-5" />
              </label>
            </Button>
            
            {/* Send button */}
            <Button 
              size="icon" 
              className="h-8 w-8"
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 