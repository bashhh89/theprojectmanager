"use client"

import { useState, useEffect, useRef } from "react"
import { useSettingsStore, Agent, defaultAgents } from "@/store/settingsStore"
import { useChatStore, ChatSession } from "@/store/chatStore"
import { toasts } from '@/components/ui/toast-wrapper'
import { usePathname, useRouter } from 'next/navigation'
import { Home, MessageSquare, ChevronDown, ChevronRight, Folder, Users, Bot, Wrench, Presentation, Palette, LayoutPanelLeft, Trash2, Pencil, Check, X, FileText } from "lucide-react"
import type { LucideIcon } from 'lucide-react'
import React from 'react'
import { useAuth } from "@/context/AuthContext"
import { useSidebarStore } from "@/components/ClientLayout"
import { FiSettings, FiShield, FiLogOut } from 'react-icons/fi'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface User {
  id: string;
  email: string;
  role?: 'admin' | 'user';
}

interface SidebarProps {
  user: User | null;
  isExpanded: boolean;
  onToggle: () => void;
}

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
  const { isExpanded, setIsExpanded } = useSidebarStore()
  const [mounted, setMounted] = useState(false)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [showAgentModelPrefs, setShowAgentModelPrefs] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [showWidgetPreview, setShowWidgetPreview] = useState(false)
  const [agentName, setAgentName] = useState("")
  const [agentPrompt, setAgentPrompt] = useState("")
  const [showAllChats, setShowAllChats] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [isChatListExpanded, setIsChatListExpanded] = useState(true)

  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { darkMode, setDarkMode } = useSettingsStore()

  // Combined store hooks
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

  // Subscribe to chat store with specific selectors
  const chatSessions = useChatStore(state => state.chatSessions)
  const activeChatId = useChatStore(state => state.activeChatId)
  const createChat = useChatStore(state => state.createChat)
  const deleteChat = useChatStore(state => state.deleteChat)
  const setActiveChat = useChatStore(state => state.setActiveChat)
  const renameChat = useChatStore(state => state.renameChat)

  // Handle mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize with a default chat if none exists
  useEffect(() => {
    if (mounted && (!chatSessions || chatSessions.length === 0)) {
      console.log('Creating initial chat...');
      createChat()
    }
  }, [mounted, chatSessions, createChat])

  // Debug logging
  useEffect(() => {
    console.log('Current chat sessions:', chatSessions);
    console.log('Active chat ID:', activeChatId);
  }, [chatSessions, activeChatId])

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

  // Focus input when editing starts (Moved BEFORE early return)
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select(); // Select text for easy replacement
    }
  }, [isEditingTitle]);

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
    // Main Features
    {
      name: "Chat",
      path: "/chat",
      icon: MessageSquare,
    },
    {
      name: "Projects",
      path: "/projects",
      icon: Folder,
    },
    {
      name: "Products",
      path: "/products",
      icon: Wrench,
    },
    {
      name: "Presentations",
      path: "/tools/presentation-generator",
      icon: Presentation,
      submenu: [
        {
          name: "New Presentation",
          path: "/tools/presentation-generator"
        },
        {
          name: "My Presentations",
          path: "/my-presentations"
        }
      ]
    },
    {
      name: "Proposals",
      path: "/proposals",
      icon: FileText,
    },
    {
      name: "Website Builder",
      path: "/website-builder",
      icon: LayoutPanelLeft,
    },

    // Content & Marketing
    {
      name: "Blog",
      path: "/dashboard/blog-posts",
      icon: Folder,
    },
    {
      name: "Company",
      path: "/company",
      icon: Palette,
    },
    {
      name: "Leads",
      path: "/leads",
      icon: Users,
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

  // Handle chat rename logic
  const handleRenameChatConfirm = (chatId: string) => {
    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle && chatId === isEditingTitle) {
      renameChat(chatId, trimmedTitle);
    }
    setIsEditingTitle(null); // Exit editing mode regardless of save
    setEditedTitle(''); // Reset edited title
  };

  // Create a new chat
  const handleNewChat = () => {
    try {
      const newChatId = createChat();
      setActiveChat(newChatId);
      router.push('/chat');
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
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

  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    try {
      setActiveChat(chatId);
      router.push('/chat');
      setConfirmingDeleteId(null);
    } catch (error) {
      console.error('Error selecting chat:', error);
    }
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

        {/* Main Navigation */}
        <div className="flex-1 flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
          {/* Quick Actions */}
          <div className="px-2 py-2 border-b border-zinc-700/50">
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

          {/* Conversations Section - Accordion */}
          {isExpanded && chatSessions.length > 0 && (
            <div className="flex-shrink-0 overflow-hidden border-b border-zinc-700/50 pb-2 mb-2">
              {/* Accordion Header Button */}
              <button 
                className="px-3 py-2 flex items-center justify-between w-full text-left hover:bg-zinc-800/50 rounded-md" 
                onClick={() => setIsChatListExpanded(!isChatListExpanded)}
              >
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Conversations</span>
                <div className='flex items-center'>
                  {chatSessions.length > 5 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { 
                        e.stopPropagation();
                        setShowAllChats(!showAllChats); 
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          setShowAllChats(!showAllChats);
                        }
                      }}
                      className="text-xs text-zinc-400 hover:text-zinc-300 mr-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    >
                      {showAllChats ? 'Less' : 'All'}
                    </span>
                  )}
                  {isChatListExpanded ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
                </div>
              </button>
              {/* Collapsible Chat List */}
              {isChatListExpanded && (
                <div className="space-y-1 overflow-y-auto max-h-[30vh] px-2 mt-1">
                  {(showAllChats ? chatSessions : chatSessions.slice(0, 5)).map((chat, index) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "flex items-center justify-between group px-2 py-1.5 rounded-md cursor-pointer",
                        activeChatId === chat.id && !isEditingTitle ? "bg-zinc-800/50" : "hover:bg-zinc-800/50",
                        isEditingTitle === chat.id ? "bg-zinc-800" : ""
                      )}
                      onClick={() => {
                        if (!isEditingTitle && confirmingDeleteId !== chat.id) {
                           handleChatSelect(chat.id);
                        } else if (confirmingDeleteId && confirmingDeleteId !== chat.id) {
                          setConfirmingDeleteId(null);
                          handleChatSelect(chat.id);
                        } else if (isEditingTitle === chat.id) {
                        } else {
                           setConfirmingDeleteId(null);
                        }
                      }}
                    >
                      {isEditingTitle === chat.id ? (
                        <input
                          ref={titleInputRef}
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          onBlur={() => {
                            setTimeout(() => {
                               if (document.activeElement !== titleInputRef.current) {
                                 handleRenameChatConfirm(chat.id)
                               }
                            }, 100);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameChatConfirm(chat.id);
                            } else if (e.key === 'Escape') {
                              setIsEditingTitle(null);
                              setEditedTitle('');
                            }
                          }}
                          className="flex-1 bg-transparent px-0 py-0 border-none focus:ring-0 outline-none text-zinc-100 min-w-0 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className="flex-1 text-left truncate text-sm text-zinc-100"
                          title={chat.name || `Chat ${index + 1}`}
                        >
                          {chat.name || `Chat ${index + 1}`}
                        </span>
                      )}

                      <div className="flex items-center gap-1 chat-item-actions">
                         {isEditingTitle === chat.id ? (
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               handleRenameChatConfirm(chat.id);
                             }}
                             className="p-1 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-700/50"
                             title="Save name"
                           >
                             <Check size={14} />
                           </button>
                         ) : confirmingDeleteId === chat.id ? (
                           <>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 deleteChat(chat.id);
                                 setConfirmingDeleteId(null);
                               }}
                               className="p-1 text-green-500 hover:text-green-400 rounded-md hover:bg-zinc-700/50"
                               title="Confirm delete"
                             >
                               <Check size={14} />
                             </button>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setConfirmingDeleteId(null);
                               }}
                               className="p-1 text-red-500 hover:text-red-400 rounded-md hover:bg-zinc-700/50"
                               title="Cancel delete"
                             >
                               <X size={14} />
                             </button>
                           </>
                         ) : (
                           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                               onClick={(e) => {
                                 e.stopPropagation(); 
                                 setIsEditingTitle(chat.id);
                                 setEditedTitle(chat.name || `Chat ${index + 1}`);
                                 setConfirmingDeleteId(null);
                               }}
                               className="p-1 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-700/50"
                               title="Rename chat"
                             >
                               <Pencil size={14} />
                             </button>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setConfirmingDeleteId(chat.id);
                                 setIsEditingTitle(null);
                               }}
                               className="p-1 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-700/50"
                               title="Delete chat"
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Navigation Items */}
          <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'} px-3 py-1.5 text-sm rounded-md transition-colors ${
                  pathname.startsWith(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {React.createElement(item.icon, { className: "h-4 w-4 flex-shrink-0" })}
        {isExpanded && (
                  <span className="text-sm">{item.name}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Items */}
        <div className="flex-shrink-0 border-t border-zinc-700/50">
          {/* Tools Section */}
          <div className="px-2 py-2">
            <button
              onClick={() => router.push('/test-tools')}
              className={`w-full flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'} px-3 py-1.5 text-sm rounded-md text-zinc-300 hover:bg-zinc-800`}
            >
              <Wrench className="h-4 w-4 flex-shrink-0" />
              {isExpanded && <span>Tools</span>}
            </button>
          </div>

          {/* Settings & Account */}
          <div className="px-2 py-2 space-y-1">
            <button
              onClick={() => router.push('/settings')}
              className={`w-full flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'} px-3 py-1.5 text-sm rounded-md text-zinc-300 hover:bg-zinc-800`}
            >
              <FiSettings className="h-4 w-4 flex-shrink-0" />
              {isExpanded && <span>Settings</span>}
            </button>
            
            {user && 'role' in user && user.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className={`w-full flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'} px-3 py-1.5 text-sm rounded-md text-zinc-300 hover:bg-zinc-800`}
              >
                <FiShield className="h-4 w-4 flex-shrink-0" />
                {isExpanded && <span>Admin</span>}
              </button>
            )}

            <button
              onClick={() => router.push('/account')}
              className={`w-full flex items-center ${isExpanded ? 'space-x-2' : 'justify-center'} px-3 py-1.5 text-sm rounded-md text-zinc-300 hover:bg-zinc-800`}
            >
              <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
              {isExpanded && <span>Account</span>}
              </button>
            </div>
        </div>
      </div>
    </aside>
  )
}