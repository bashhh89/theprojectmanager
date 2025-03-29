"use client"

import { useState, useEffect } from "react"
import { useSettingsStore, Agent } from "@/store/settingsStore"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

export function AgentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const { 
    activeAgent, 
    setActiveAgent,
    setSelectedAgentId
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