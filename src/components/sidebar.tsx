"use client"

import { useState, useEffect } from "react"
import { useSettingsStore, Agent, defaultAgents } from "@/store/settingsStore"
import { useChatStore, ChatSession } from "@/store/chatStore"
import { toasts } from '@/components/ui/toast-wrapper'
import { usePathname, useRouter } from 'next/navigation'
import { Home, MessageSquare, Folder, Users, Bot, Wrench, Presentation, Palette, LayoutPanelLeft } from "lucide-react"
import type { LucideIcon } from 'lucide-react'
import React from 'react'
import { useAuth } from "@/context/AuthContext"
import { useSidebarStore } from "@/components/ClientLayout"
import { FiSettings, FiShield, FiLogOut } from 'react-icons/fi'

// Define static model options to avoid dependency on AVAILABLE_MODELS
const VOICE_OPTIONS = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'nova', name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' }
]

const TEXT_MODEL_OPTIONS = [
  { id: 'openai', name: 'OpenAI GPT-4' },
  { id: 'google-gemini-pro', name: 'Google Gemini Pro' },
  { id: 'gemini-1.5-flash-001', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro' }
]

const IMAGE_MODEL_OPTIONS = [
  { id: 'flux', name: 'Flux' },
  { id: 'sdxl', name: 'Stable Diffusion XL' }
]

interface SubMenuItem {
  name: string;
  path: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  submenu?: SubMenuItem[];
}

export default function Sidebar() {
  // Remove local isExpanded state and use the store instead
  const { isExpanded, setIsExpanded } = useSidebarStore()
  const [mounted, setMounted] = useState(false)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [showAgentModelPrefs, setShowAgentModelPrefs] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [isEditingChatName, setIsEditingChatName] = useState<string | null>(null)
  const [newChatName, setNewChatName] = useState("")
  const [showWidgetPreview, setShowWidgetPreview] = useState(false)
  const [agentName, setAgentName] = useState("")
  const [agentPrompt, setAgentPrompt] = useState("")

  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { darkMode, setDarkMode } = useSettingsStore()
  const { createChat } = useChatStore()

  // Settings store hooks
  const {
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

  // Chat store hooks
  const {
    chatSessions,
    activeChatId,
    deleteChat,
    setActiveChat,
    renameChat
  } = useChatStore()

  // Handle mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle dark mode
  useEffect(() => {
    if (mounted) {
      if (darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [darkMode, mounted])

  // Early return if not mounted or no user
  if (!mounted || !user) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-16 overflow-hidden">
        <div className="h-full bg-zinc-900 border-r border-zinc-700/50" />
      </aside>
    )
  }

  const isActive = (path: string) => pathname === path

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Home,
    },
    {
      name: "Chat",
      path: "/chat",
      icon: MessageSquare,
      submenu: [
        {
          name: "Agents",
          path: "/agents",
        },
        {
          name: "History",
          path: "/chat/history",
        }
      ]
    },
    {
      name: "Presentations",
      path: "/tools/presentation-generator",
      icon: Presentation,
      submenu: [
        {
          name: "My Presentations",
          path: "/my-presentations",
        }
      ]
    },
    {
      name: "Brand",
      path: "/brand",
      icon: Palette,
    },
    {
      name: "Website Builder",
      path: "/website-builder",
      icon: LayoutPanelLeft,
    },
    {
      name: "Projects",
      path: "/projects",
      icon: Folder,
    },
    {
      name: "Leads",
      path: "/leads",
      icon: Users,
    },
    {
      name: "Tools",
      path: "/test-tools",
      icon: Wrench,
      submenu: [
        {
          name: "Model Testing",
          path: "/test-playground",
        },
        {
          name: "Image Generator",
          path: "/image-generator",
        },
        {
          name: "Text to Speech",
          path: "/text-to-speech",
        }
      ],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: FiSettings,
    },
    {
      name: "Admin",
      path: "/admin",
      icon: FiShield,
    },
    {
      name: "Logout",
      path: "/logout",
      icon: FiLogOut,
    },
  ]

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

  // Create a new chat
  const handleNewChat = () => {
    // Create a new chat and get its ID
    const newChatId = createChat();
    
    // Reset any agent selection
    setSelectedAgentId(null);
    
    // Notify the user
    toasts.success("New chat created");
    
    // Navigate to the chat page
    router.push(`/chat`);
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

  // Show a minimal sidebar while client-side hydration is happening
  if (!mounted) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-16 overflow-hidden">
        <div className="h-full bg-zinc-900 border-r border-zinc-700/50" />
      </aside>
    )
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 overflow-hidden">
      {/* Single container with width transition */}
      <div 
        className={`h-full bg-zinc-900 border-r border-zinc-700/50 transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'w-56' : 'w-16'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-0 top-4 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 hover:bg-zinc-700 transform translate-x-1/2 text-zinc-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-3 h-3 ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>

        {/* Logo */}
        <div className="p-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
              Q
            </div>
            {isExpanded && (
              <span className="ml-2 text-lg font-semibold whitespace-nowrap text-zinc-100">QanDuAI</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {navItems.map((item) => (
            <React.Fragment key={item.path}>
              <button
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'} px-3 py-1.5 text-sm rounded-md transition-colors ${
                  (pathname.startsWith(item.path) || item.submenu?.some(sub => pathname === sub.path))
                   ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {React.createElement(item.icon, { className: "h-4 w-4 flex-shrink-0" })}
                {isExpanded && (
                  <>
                    <span className="text-sm">{item.name}</span>
                    {item.submenu && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    )}
                  </>
                )}
              </button>
              
              {isExpanded && item.submenu && (
                (pathname.startsWith(item.path) || item.submenu?.some(sub => pathname === sub.path)) && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-zinc-700/50 pl-3">
                    {item.submenu.map((subitem) => (
                      <button
                        key={subitem.path}
                        onClick={() => router.push(subitem.path)}
                        className={`w-full flex items-center space-x-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
                          isActive(subitem.path) ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                        }`}
                      >
                        <span>{subitem.name}</span>
                      </button>
                    ))}
                  </div>
                )
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* New Chat Button */}
        <div className="px-2 py-3 border-t border-zinc-700/50">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors text-sm`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {isExpanded && <span>New Chat</span>}
          </button>
        </div>

        {isExpanded && (
          <>
            {/* User Section */}
            <div className="px-2 py-3 border-t border-zinc-700/50">
              <button
                onClick={() => router.push('/account')}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-zinc-800 cursor-pointer text-zinc-300"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Account</span>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}