"use client"

import { useState, useEffect } from "react"
import { useSettingsStore, Agent } from "@/store/settingsStore"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function AgentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const { 
    activeAgent, 
    setActiveAgent,
    setSelectedAgentId,
    setAgentSpokenResponses
  } = useSettingsStore()

  // Fetch agents when component mounts
  useEffect(() => {
    fetchAgents()
  }, [])

  // Function to fetch available agents
  const fetchAgents = async () => {
    try {
      setIsLoading(true)
      // Fetch agents from the API
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
      
      // Convert API agents to the format used by the component
      const formattedAgents: Agent[] = data.agents.map((agent: any) => {
        // Ensure there's a valid system prompt in either format
        const systemPromptValue = agent.system_prompt || "You are a helpful assistant.";
        
        return {
          id: agent.id,
          name: agent.name,
          // Store both formats to ensure compatibility
          systemPrompt: systemPromptValue,
          system_prompt: systemPromptValue,
          description: agent.description || `${agent.name} Agent`,
          modelPreferences: agent.model_selection ? {
            textModel: agent.model_selection.text || undefined,
            imageModel: agent.model_selection.image || undefined,
            voiceModel: agent.model_selection.voice || undefined
          } : undefined
        };
      })
      
      console.log("Loaded agents from API:", formattedAgents)
      setAgents(formattedAgents)
    } catch (error) {
      console.error("Error fetching agents:", error)
      // Fallback to settings store if API fails
      const storeAgents = useSettingsStore.getState().agents
      setAgents(storeAgents)
    } finally {
      setIsLoading(false)
    }
  }

  // Select an agent as active
  const selectAgent = (agent: Agent) => {
    console.log("AgentSidebar - Selecting agent:", agent);
    
    // Ensure we have a valid system prompt value
    const systemPromptValue = agent.systemPrompt || agent.system_prompt || "You are a helpful assistant.";
    
    // Create a properly formatted agent object for the store with BOTH formats
    const storeAgent: Agent = {
      ...agent,
      // Ensure all required properties exist
      id: agent.id,
      name: agent.name, 
      systemPrompt: systemPromptValue,
      system_prompt: systemPromptValue,
      description: agent.description || `Selected agent: ${agent.name}`
    };
    
    console.log("AgentSidebar - Setting active agent with:", {
      id: storeAgent.id,
      name: storeAgent.name,
      systemPromptLength: storeAgent.systemPrompt.length,
      system_promptLength: storeAgent.system_prompt.length,
      systemPromptPreview: storeAgent.systemPrompt.substring(0, 50) + "..."
    });
    
    // IMPORTANT: Set both the active agent and the selectedAgentId
    // Make sure the agent state is completely updated
    setActiveAgent(storeAgent);
    setSelectedAgentId(agent.id);
    setIsCollapsed(true); // Collapse after selection
    
    // Force an update to the settings store to ensure the changes take effect
    setTimeout(() => {
      const currentState = useSettingsStore.getState();
      console.log("AgentSidebar - State after agent selection:", {
        activeAgentId: currentState.activeAgent?.id,
        selectedAgentId: currentState.selectedAgentId,
        systemPromptSet: !!currentState.activeAgent?.systemPrompt,
        system_promptSet: !!currentState.activeAgent?.system_prompt
      });
    }, 100);
    
    // Show toast notification with more details
    toast({
      title: `Agent Selected: ${agent.name}`,
      description: "This agent will now respond to your messages using its specific instructions and model preferences",
      duration: 5000
    });
    
    // Add session storage marker so we know this agent was selected during this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastSelectedAgent', agent.id);
      sessionStorage.setItem('lastSelectedAgentName', agent.name);
      sessionStorage.setItem('lastSelectedAgentPrompt', systemPromptValue);
      
      // Also save the full agent as JSON for complete restoration
      try {
        sessionStorage.setItem('lastSelectedAgentFull', JSON.stringify(storeAgent));
        console.log("AgentSidebar - Full agent object saved to session storage");
      } catch (error) {
        console.error("AgentSidebar - Error saving full agent to session storage:", error);
      }
    }
  }

  return (
    <div 
      className={`fixed right-0 top-0 h-screen transition-all duration-300 overflow-hidden z-20 ${
        isCollapsed ? 'w-8' : 'w-64'
      }`}
    >
      {/* Visible toggle tab */}
      <div 
        className={`fixed right-0 top-32 cursor-pointer flex items-center justify-center transition-all duration-300 ${
          isCollapsed ? 'w-8 bg-background/90 border-t border-b border-l rounded-l-md' : 'w-0'
        }`}
        onClick={() => setIsCollapsed(false)}
        title="Show Agents"
        style={{ height: '80px' }}
      >
        {isCollapsed && (
          <span className="text-primary rotate-90 font-medium text-xs whitespace-nowrap">Agents</span>
        )}
      </div>

      {/* Content - Only visible when expanded */}
      {!isCollapsed && (
        <div className="flex flex-col h-full bg-background border-l">
          {/* Header */}
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
              Available Agents
            </h3>
            <button
              className="h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => setIsCollapsed(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
          </div>
          
          {/* Agent List */}
          <div className="flex-1 p-2 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${
                      activeAgent?.id === agent.id 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => selectAgent(agent)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">{agent.name}</span>
                      {activeAgent?.id === agent.id && (
                        <Badge variant="outline" className="bg-primary/10 text-primary text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {agent.systemPrompt}
                    </p>
                    
                    {/* Spoken Responses Toggle - Only show for active agent */}
                    {activeAgent?.id === agent.id && (
                      <div 
                        className="mt-2 pt-2 border-t flex items-center justify-between"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs">
                          Spoken Responses
                        </span>
                        <button
                          id={`spoken-responses-${agent.id}`}
                          role="switch"
                          aria-checked={activeAgent.enableSpokenResponses || false}
                          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background ${activeAgent.enableSpokenResponses ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const checked = !activeAgent.enableSpokenResponses;
                            setAgentSpokenResponses(agent.id, checked);
                            toast({
                              title: checked ? "Spoken responses enabled" : "Spoken responses disabled",
                              description: checked 
                                ? `${agent.name} will now speak its responses using the ${useSettingsStore.getState().activeVoice} voice.` 
                                : `${agent.name} will no longer speak its responses.`,
                              duration: 3000
                            });
                          }}
                        >
                          <span 
                            className={`pointer-events-none block h-3 w-3 rounded-full bg-background transition-transform ${activeAgent.enableSpokenResponses ? 'translate-x-3.5' : 'translate-x-0.5'}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    )}
                    
                    {/* Quick Action Buttons - Edit and Model */}
                    <div className="mt-2 pt-2 border-t flex justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="flex-1 text-xs bg-primary/10 text-primary px-2 py-1.5 rounded flex items-center justify-center hover:bg-primary/20"
                        onClick={(e) => {
                          e.preventDefault();
                          // Navigate to edit page
                          window.location.href = `/agents/edit/${agent.id}`;
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        Edit
                      </button>
                      
                      <button
                        className="flex-1 text-xs bg-accent/60 text-accent-foreground px-2 py-1.5 rounded flex items-center justify-center hover:bg-accent"
                        onClick={(e) => {
                          e.preventDefault();
                          
                          // Show model selection toast
                          const currentModel = agent.modelPreferences?.textModel || 
                                             useSettingsStore.getState().activeTextModel || 
                                             "Default";
                          
                          toast({
                            title: "Current model: " + currentModel,
                            description: (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {["llama", "mistral", "gemini", "openai"].map(model => (
                                  <button 
                                    key={model}
                                    className={`text-xs px-2 py-1 rounded-sm ${
                                      currentModel === model ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                                    }`}
                                    onClick={() => {
                                      // Update agent model preference
                                      const updatedAgent = {...agent};
                                      if (!updatedAgent.modelPreferences) {
                                        updatedAgent.modelPreferences = {};
                                      }
                                      updatedAgent.modelPreferences.textModel = model;
                                      
                                      // Update in settings store
                                      setActiveAgent(updatedAgent);
                                      
                                      // Show confirmation
                                      toast({
                                        title: `Model updated`,
                                        description: `${agent.name} will now use ${model}`,
                                        duration: 3000
                                      });
                                    }}
                                  >
                                    {model}
                                  </button>
                                ))}
                              </div>
                            ),
                            duration: 10000
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                          <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h16a2 2 0 0 0 1.2-.4"></path>
                          <path d="M10.42 11.5a.5.5 0 0 0-.82.5l1.94 3.5c.11.2.38.2.52.05.13-.14.17-.27.1-.45L10.42 11.5z"></path>
                          <path d="M18.75 10.7a.71.71 0 0 0-1.1-.2l-5.9 5.9c-.4.4-.4 1 .1 1.4l2.1 1.8c.4.3 1 .2 1.3-.2L19 15.7"></path>
                          <path d="M19.8 8.7a2 2 0 0 0-1-3L13 2a2 2 0 0 0-2 .5L5.8 7.7c-.4.4-.4 1 0 1.4l6.6 6.6c.2.2.5.3.8.3h.2c.3 0 .5-.1.7-.3l5.7-5.7a2 2 0 0 0 0-1.3z"></path>
                          <path d="M13 2 9 6"></path>
                          <path d="m15 4 3 3"></path>
                        </svg>
                        Model
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Refresh Button */}
          <div className="p-3 border-t">
            <div className="grid grid-cols-2 gap-2">
              <button 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-2 py-2 w-full disabled:opacity-50"
                onClick={fetchAgents}
                disabled={isLoading}
              >
                Refresh
              </button>
              <a 
                href="/agents"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-2 py-2 w-full"
              >
                Manage
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 