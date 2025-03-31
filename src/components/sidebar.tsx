"use client"

import { useState, useEffect } from "react"
import { useSettingsStore, Agent, defaultAgents } from "@/store/settingsStore"
import { useChatStore, ChatSession } from "@/store/chatStore"
import { AVAILABLE_MODELS } from "@/lib/pollinationsApi"
import { toasts } from '@/components/ui/toast-wrapper'
import { usePathname, useRouter } from 'next/navigation'

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => pathname === path

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1"></rect>
          <rect width="7" height="5" x="14" y="3" rx="1"></rect>
          <rect width="7" height="9" x="14" y="12" rx="1"></rect>
          <rect width="7" height="5" x="3" y="16" rx="1"></rect>
        </svg>
      ),
    },
    {
      name: 'Chat',
      path: '/chat',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
          <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
        </svg>
      ),
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"></path>
        </svg>
      ),
    },
    {
      name: 'Agents',
      path: '/agents',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
    {
      name: 'Tools',
      path: '/tools',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
        </svg>
      ),
    },
  ]

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
    // Create a new chat and get its ID
    const newChatId = createChat();
    
    // Reset any agent selection
    setSelectedAgentId(null);
    
    // Notify the user
    toasts.success("New chat created");
    
    // Navigate to the new chat, ensuring we stay on the correct port
    const baseUrl = window.location.origin;
    router.push(`/chat/${newChatId}`);
    
    // If we're on the wrong port, fix it
    const currentPort = window.location.port;
    const targetPort = process.env.NEXT_PUBLIC_PORT || '3002';
    
    if (currentPort !== targetPort) {
      window.location.href = `${window.location.protocol}//${window.location.hostname}:${targetPort}/chat/${newChatId}`;
    }
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
      toasts.error("Please enter both a name and a system prompt for the new agent.");
      return
    }
    
    if (editingAgent) {
      // Update existing agent
      updateAgent(editingAgent.id, {
        name: agentName,
        systemPrompt: agentPrompt
      })
      
      toasts.success(`${agentName} has been updated.`);
    } else {
      // Add new agent with default model preferences
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name: agentName,
        systemPrompt: agentPrompt,
        system_prompt: agentPrompt,
        modelPreferences: {
          textModel: activeTextModel,
          imageModel: activeImageModel,
          voiceModel: activeVoice
        }
      }
      
      addAgent(newAgent)
      
      toasts.success(`${agentName} is now ready to use.`);
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
      toasts.error("Default agents cannot be deleted.");
      return
    }
    
    deleteAgent(agentId)
    
    toasts.success("The agent has been removed.");
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
      
      toasts.success(`Model preferences for ${activeAgent.name} have been updated.`);
      
      setShowAgentModelPrefs(false);
    }
  }

  // Copy widget embed code to clipboard
  const copyWidgetCode = () => {
    if (!selectedAgentId) {
      toasts.error("Please select an agent for the widget first.");
      return;
    }

    const embedCode = `<script src="${window.location.origin}/widget.js" data-agent-id="${selectedAgentId}"></script>`;
    navigator.clipboard.writeText(embedCode);
    
    toasts.success("Widget embed code has been copied to your clipboard.");
  }

  return (
    <div className={`fixed top-0 left-0 h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 z-50 
      ${isExpanded ? 'w-64' : 'w-20'}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-8 bg-gray-800 rounded-full p-1.5 border border-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>

      {/* Logo */}
      <div className="p-6 mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xl">
            Q
          </div>
          {isExpanded && (
            <span className="ml-3 text-xl font-semibold whitespace-nowrap">QanDuAI</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex items-center px-3 py-3 mb-2 rounded-lg transition-colors
              ${isActive(item.path) 
                ? 'bg-blue-500/10 text-blue-500' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`}
          >
            <span className="w-5 h-5">{item.icon}</span>
            {isExpanded && (
              <span className="ml-3 whitespace-nowrap">{item.name}</span>
            )}
          </a>
        ))}
      </nav>

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

      {/* Agent Selection */}
      <div className={`p-4 border-t ${isCollapsed ? 'hidden' : ''}`}>
        <h3 className="text-sm font-medium mb-2">Active Agent</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">
            {selectedAgentId ? activeAgent?.name : "Default Assistant"}
          </span>
          {selectedAgentId && (
            <button
              onClick={() => setSelectedAgentId(null)}
              className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800/30"
            >
              Reset Agent
            </button>
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
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
                Voice
                <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">Active</span>
              </h3>
              <select
                className="w-full p-2 bg-background border rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                value={activeVoice}
                onChange={(e) => setActiveVoice(e.target.value)}
              >
                {AVAILABLE_MODELS.voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} {voice.description ? `(${voice.description})` : ''} {agentPrefs.voiceModel === voice.id ? '(Agent Default)' : ''}
                  </option>
                ))}
              </select>
              
              <div className="mt-2 flex items-center">
                <button
                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mr-2 hover:bg-primary/20"
                  onClick={() => {
                    window.open('/audio-tts', '_blank');
                  }}
                >
                  Test Voices
                </button>
                <span className="text-xs text-muted-foreground">
                  Enable spoken responses in Agent Settings
                </span>
              </div>
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
    </div>
  )
}