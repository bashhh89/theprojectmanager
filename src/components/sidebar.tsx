"use client"

import { useState, useEffect } from "react"
import { useSettingsStore, Agent, defaultAgents } from "@/store/settingsStore"
import { useChatStore, ChatSession } from "@/store/chatStore"
import { AVAILABLE_MODELS } from "@/lib/pollinationsApi"
import { toast } from "@/components/ui/use-toast"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [showAgentModelPrefs, setShowAgentModelPrefs] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [isEditingChatName, setIsEditingChatName] = useState<string | null>(null)
  const [newChatName, setNewChatName] = useState("")
  const [showWidgetPreview, setShowWidgetPreview] = useState(false)
  
  // Form states for new agent
  const [agentName, setAgentName] = useState("")
  const [agentPrompt, setAgentPrompt] = useState("")
  
  // Settings store
  const {
    darkMode, 
    setDarkMode,
    activeTextModel, 
    setActiveTextModel,
    activeImageModel, 
    setActiveImageModel,
    activeVoice, 
    setActiveVoice,
    activeAgent,
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    setAgentModelPreference,
    selectedAgentId,
    setSelectedAgentId
  } = useSettingsStore()

  // Chat store
  const {
    chatSessions,
    activeChatId,
    createChat,
    deleteChat,
    setActiveChat,
    renameChat
  } = useChatStore()

  // Get current agent's model preferences
  const currentAgent = agents.find(a => a.id === activeAgent?.id);
  const agentPrefs = currentAgent?.modelPreferences || {};

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    
    // Update document class
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Apply dark mode on initial load
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Create a new chat
  const handleNewChat = () => {
    createChat()
    toast({
      title: "New chat created",
      description: "Started a new conversation",
    })
  }

  // Handle chat rename
  const handleRenameChat = (chatId: string) => {
    if (!newChatName.trim()) {
      setIsEditingChatName(null)
      return
    }
    
    renameChat(chatId, newChatName.trim())
    setIsEditingChatName(null)
    setNewChatName("")
  }

  // Start editing chat name
  const startEditingChatName = (chat: ChatSession) => {
    setIsEditingChatName(chat.id)
    setNewChatName(chat.name)
  }

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (agentName.trim() === "" || agentPrompt.trim() === "") {
      toast({
        title: "Missing information",
        description: "Please enter both a name and a system prompt for the new agent.",
        variant: "destructive"
      })
      return
    }
    
    if (editingAgent) {
      // Update existing agent
      updateAgent(editingAgent.id, {
        name: agentName,
        systemPrompt: agentPrompt
      })
      
      toast({
        title: "Agent updated",
        description: `${agentName} has been updated.`
      })
    } else {
      // Add new agent with default model preferences
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name: agentName,
        systemPrompt: agentPrompt,
        modelPreferences: {
          textModel: activeTextModel,
          imageModel: activeImageModel,
          voiceModel: activeVoice
        }
      }
      
      addAgent(newAgent)
      
      toast({
        title: "Agent created",
        description: `${agentName} is now ready to use.`
      })
    }
    
    // Reset form
    setAgentName("")
    setAgentPrompt("")
    setShowAgentForm(false)
    setEditingAgent(null)
  }
  
  const handleEditAgent = (agent: Agent) => {
    setAgentName(agent.name)
    setAgentPrompt(agent.systemPrompt)
    setEditingAgent(agent)
    setShowAgentForm(true)
  }
  
  const handleDeleteAgent = (agentId: string) => {
    // Don't allow deleting default agents
    if (defaultAgents.find(a => a.id === agentId)) {
      toast({
        title: "Cannot delete default agent",
        description: "Default agents cannot be deleted.",
        variant: "destructive"
      })
      return
    }
    
    deleteAgent(agentId)
    
    toast({
      title: "Agent deleted",
      description: "The agent has been removed."
    })
  }
  
  // Update model preferences for the current agent
  const handleSaveModelPreferences = () => {
    if (activeAgent) {
      // Save the current model selections as preferences for this agent
      if (activeTextModel) {
        setAgentModelPreference(activeAgent.id, 'textModel', activeTextModel);
      }
      
      if (activeImageModel) {
        setAgentModelPreference(activeAgent.id, 'imageModel', activeImageModel);
      }
      
      if (activeVoice) {
        setAgentModelPreference(activeAgent.id, 'voiceModel', activeVoice);
      }
      
      toast({
        title: "Preferences saved",
        description: `Model preferences for ${activeAgent.name} have been updated.`
      });
      
      setShowAgentModelPrefs(false);
    }
  }

  // Copy widget embed code to clipboard
  const copyWidgetCode = () => {
    if (!selectedAgentId) {
      toast({
        title: "No agent selected",
        description: "Please select an agent for the widget first.",
        variant: "destructive"
      });
      return;
    }

    const embedCode = `<script src="${window.location.origin}/widget.js" data-agent-id="${selectedAgentId}"></script>`;
    navigator.clipboard.writeText(embedCode);
    
    toast({
      title: "Copied to clipboard",
      description: "Widget embed code has been copied to your clipboard."
    });
  }

  return (
    <aside className={`flex flex-col h-screen bg-muted/40 border-r transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between border-b">
        {!isCollapsed && <h2 className="font-semibold">Chat Assistant</h2>}
        <button 
          className="p-2 rounded-md hover:bg-muted"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          className="w-full flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          onClick={handleNewChat}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isCollapsed ? 'hidden' : ''}`}>
          <h3 className="text-sm font-medium mb-2">Chat History</h3>
          {chatSessions.length > 0 ? (
            <ul className="space-y-1">
              {chatSessions.map((chat) => (
                <li key={chat.id}>
                  {isEditingChatName === chat.id ? (
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        className="flex-1 p-1 text-sm border rounded"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameChat(chat.id)
                          } else if (e.key === 'Escape') {
                            setIsEditingChatName(null)
                          }
                        }}
                      />
                      <button 
                        className="ml-1 p-1" 
                        onClick={() => handleRenameChat(chat.id)}
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div 
                      className={`flex items-center justify-between p-2 rounded cursor-pointer ${activeChatId === chat.id ? 'bg-muted' : 'hover:bg-muted/50'} group`}
                      onClick={() => setActiveChat(chat.id)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span className="truncate text-sm">{chat.name}</span>
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100">
                        <button 
                          className="p-1 hover:bg-background rounded"
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditingChatName(chat)
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                          </svg>
                        </button>
                        <button 
                          className="p-1 hover:bg-background rounded"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteChat(chat.id)
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-2">
              No chat history
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="border-t p-4">
        {/* Remove agents section but keep model selectors */}
        {!isCollapsed && (
          <>
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Dark Mode</span>
              <button
                className={`p-1 rounded-md ${darkMode ? 'bg-primary' : 'bg-muted'}`}
                onClick={toggleDarkMode}
              >
                <div className={`w-10 h-5 rounded-full flex items-center ${darkMode ? 'bg-primary-foreground/10' : 'bg-muted-foreground/30'}`}>
                  <div className={`w-4 h-4 rounded-full transition-transform ${darkMode ? 'bg-background translate-x-5' : 'bg-muted-foreground translate-x-1'}`}></div>
                </div>
              </button>
            </div>
            
            {/* Text Model Selector */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Text Model</h3>
              <select
                className="w-full p-2 bg-background border rounded-md"
                value={activeTextModel}
                onChange={(e) => setActiveTextModel(e.target.value)}
              >
                {AVAILABLE_MODELS.text.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {agentPrefs.textModel === model.id ? '(Agent Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Model Selector */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Image Model</h3>
              <select
                className="w-full p-2 bg-background border rounded-md"
                value={activeImageModel}
                onChange={(e) => setActiveImageModel(e.target.value)}
              >
                {AVAILABLE_MODELS.image.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {agentPrefs.imageModel === model.id ? '(Agent Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Selector */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Voice</h3>
              <select
                className="w-full p-2 bg-background border rounded-md"
                value={activeVoice}
                onChange={(e) => setActiveVoice(e.target.value)}
              >
                {AVAILABLE_MODELS.voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} {agentPrefs.voiceModel === voice.id ? '(Agent Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        
        {isCollapsed && (
          <div className="flex justify-center">
            <button
              className="p-2 rounded-md hover:bg-muted"
              onClick={toggleDarkMode}
              title={darkMode ? "Light Mode" : "Dark Mode"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}