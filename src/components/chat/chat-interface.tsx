"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Book, Server, Save, Star, Settings, Plus, ArrowRight, ChevronDown } from 'lucide-react';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { useSettingsStore, Agent } from '@/store/settingsStore';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from 'next-themes';
import Link from 'next/link'
import { Button } from '../ui/button-unified';
import { cn } from '@/lib/utils';
import { toasts } from '@/components/ui/toast-wrapper';
import { useRouter } from 'next/navigation';
import { AgentSwitcher } from './agent-switcher';

// Saved prompt interface
interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

// Model selection dropdown with QanDu styled UI
const ModelSelector = ({ 
  selectedModel, 
  onModelChange, 
  availableModels 
}: { 
  selectedModel: string; 
  onModelChange: (model: string) => void;
  availableModels: string[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-border bg-card p-2 text-sm hover:bg-muted/50 qandu-transition-all"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
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
          className="text-primary"
        >
          <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          <path d="M12 7v10"></path>
          <path d="M15.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
          <path d="M8.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
        </svg>
        <span className="flex-1 text-left truncate max-w-[120px]">{selectedModel}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={cn("transition-transform", isOpen ? "rotate-180" : "")}
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-border bg-card shadow-md qandu-fade-in">
          <ul className="py-1" role="listbox">
            {availableModels.map((model) => (
              <li 
                key={model}
                onClick={() => {
                  onModelChange(model);
                  setIsOpen(false);
                }}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm qandu-transition-all",
                  model === selectedModel 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted/50"
                )}
                role="option"
                aria-selected={model === selectedModel}
              >
                {model}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [activeEndpoint, setActiveEndpoint] = useState('google');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState('openai-gpt-4o');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const { activeTextModel, setActiveTextModel, darkMode, setDarkMode, activeAgent, setActiveAgent, agents } = useSettingsStore();
  const { createChat } = useChatStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Handle mounted state to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync settings store with theme
  useEffect(() => {
    if (mounted) {
      // When theme changes, update the settings store
      setDarkMode(theme === 'dark');
    }
  }, [theme, setDarkMode, mounted]);

  // Close model selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showModelSelector && !(event.target as Element).closest('.model-selector')) {
        setShowModelSelector(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelSelector]);

  // Available endpoints
  const endpoints = [
    { id: 'google', name: 'Google', icon: 'G', models: ['gemini-pro', 'gemini-flash'] },
    { id: 'openai', name: 'OpenAI', icon: 'O', models: ['gpt-4o', 'gpt-3.5-turbo'] },
    { id: 'anthropic', name: 'Anthropic', icon: 'A', models: ['claude-3-opus', 'claude-3-sonnet'] },
    { id: 'mistral', name: 'Mistral', icon: 'M', models: ['mistral-large', 'mistral-medium'] },
    { id: 'llama', name: 'Llama', icon: 'L', models: ['llama-3.3'] },
    { 
      id: 'pollinations', 
      name: 'Pollinations', 
      icon: 'P', 
      models: [
        'anthropic-claude-3-sonnet',
        'anthropic-claude-3-opus',
        'anthropic-claude-3-haiku',
        'google-gemini-pro',
        'google-gemini-flash',
        'openai-gpt-4-turbo',
        'openai-gpt-3.5-turbo',
        'mistral-medium',
        'mistral-small',
        'mixtral-8x7b',
        'llama-3-70b',
        'assistant-pollinations'
      ] 
    },
  ];

  // Load saved prompts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('saved_prompts');
    if (stored) {
      try {
        setSavedPrompts(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved prompts', e);
      }
    }
  }, []);

  // Load saved model from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem('selected_model');
    if (savedModel) {
      setSelectedModel(savedModel);
      setActiveTextModel(savedModel);
    }
    setMounted(true);
  }, []);

  // Create a new chat
  const handleNewChat = () => {
    const newChatId = createChat();
    
    // Reset the input and UI state
    setShowModelSelector(false);
    setShowSettings(false);
    
    // On mobile, hide the sidebar after creating a new chat
    if (isMobile) {
      setShowSidebar(false);
    }
    
    // Log creation for debugging
    console.log(`Created new chat with ID: ${newChatId}`);
    
    // Show success toast
    toasts.success("New chat created");
    
    // Force scroll to bottom after a short delay to ensure the DOM has updated
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  // Select a model
  const selectModel = (endpointId: string, model: string) => {
    setActiveTextModel(`${endpointId}-${model}`);
    setSelectedModel(`${endpointId}-${model}`);
    setShowModelSelector(false);
    
    // Save the selected model to localStorage
    localStorage.setItem('selected_model', `${endpointId}-${model}`);
    
    toasts.success(`Now using ${endpointId.charAt(0).toUpperCase() + endpointId.slice(1)} ${model}`);
  };

  // Get current model display name
  const getModelDisplayName = () => {
    if (!activeTextModel) return 'Select a model';
    
    const parts = activeTextModel.split('-');
    if (parts.length < 2) return activeTextModel; // Return as is if no dash present
    
    const [endpointId, ...modelNameParts] = parts;
    const modelName = modelNameParts.join('-');
    const endpoint = endpoints.find(e => e.id === endpointId);
    
    // Remove provider name from model if it starts with the same string
    let displayModelName = modelName;
    if (endpoint && modelName.toLowerCase().startsWith(endpointId.toLowerCase())) {
      displayModelName = modelName.substring(endpointId.length).replace(/^[-\s]+/, '');
    }
    
    return endpoint ? `${endpoint.name} ${displayModelName.charAt(0).toUpperCase() + displayModelName.slice(1)}` : activeTextModel;
  };

  // Handle responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  // Fix model selection dropdown visibility
  const toggleModelSelector = () => {
    setShowModelSelector(!showModelSelector);
  };

  // Fix settings button
  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  // Prevent rendering until after client-side hydration
  if (!mounted) {
    return null;
  }

  // Add this before the return statement
  const SettingsModal = () => {
    if (!showSettings) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card w-full max-w-md rounded-lg shadow-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold">Chat Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1.5 rounded-md hover:bg-muted/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Agent Selection</label>
                <div className="space-y-2">
                  {agents.map((agent: Agent) => (
                    <div 
                      key={agent.id}
                      className={cn(
                        "p-3 rounded-md border cursor-pointer transition-all",
                        activeAgent.id === agent.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => {
                        setActiveAgent(agent);
                        // Don't close the settings yet
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{agent.name}</div>
                        {activeAgent.id === agent.id && (
                          <div className="bg-primary text-primary-foreground rounded-full text-xs px-2 py-0.5">
                            Active
                          </div>
                        )}
                      </div>
                      {agent.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {agent.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Model</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => {
                    const [provider, model] = e.target.value.split('-');
                    selectModel(provider, model);
                  }}
                  className="w-full p-2 rounded-md border border-border bg-background"
                >
                  {endpoints.map(endpoint => (
                    endpoint.models.map(model => (
                      <option 
                        key={`${endpoint.id}-${model}`} 
                        value={`${endpoint.id}-${model}`}
                      >
                        {endpoint.name} - {model}
                      </option>
                    ))
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Interface Theme</label>
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-2 rounded-md border border-border bg-background"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sidebar Display</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSidebar(true)}
                    className={`px-3 py-1.5 rounded-md ${showSidebar ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Show
                  </button>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className={`px-3 py-1.5 rounded-md ${!showSidebar ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end p-4 border-t border-border">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden bg-background">
      {/* Left sidebar - can be toggled on mobile */}
      <aside 
        className={cn(
          "h-full border-r border-border bg-card/50 flex-shrink-0 transition-all duration-300 ease-in-out",
          showSidebar ? "w-80" : "w-0",
          isMobile ? "absolute left-0 top-0 z-20 shadow-lg" : "relative"
        )}
      >
        <div className={cn("h-full overflow-auto", showSidebar ? "opacity-100" : "opacity-0", "transition-opacity duration-300")}>
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg">Chat History</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your recent conversations
            </p>
          </div>
          
          <div className="p-3">
            <Button 
              variant="primary-gradient"
              size="sm"
              fullWidth={true}
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14"></path>
                  <path d="M5 12h14"></path>
                </svg>
              }
              onClick={handleNewChat}
            >
              New Chat
            </Button>
          </div>
          
          <nav className="px-3 py-2">
            <div className="space-y-1">
              {/* Example chat history items */}
              {Array.from({ length: 5 }).map((_, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center gap-3 rounded-md p-3 text-sm hover:bg-muted/50 qandu-transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 6.1H3"></path>
                    <path d="M21 12.1H3"></path>
                    <path d="M15.1 18H3"></path>
                  </svg>
                  <div className="flex-1 text-left truncate">
                    Chat Session {i + 1}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {i === 0 ? 'Just now' : `${i}d ago`}
                  </div>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main chat area */}
      <div 
        className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 w-full"
        ref={chatContainerRef}
      >
        {/* Chat header */}
        <header className="p-4 border-b border-border flex items-center justify-between bg-card/30 backdrop-blur-sm">
          <div className="flex items-center">
            {/* Mobile sidebar toggle */}
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="mr-3 p-2 rounded-md hover:bg-muted/50 qandu-transition-all"
              aria-label={showSidebar ? "Close sidebar" : "Open sidebar"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 7h18"></path>
                <path d="M3 12h18"></path>
                <path d="M3 17h18"></path>
              </svg>
            </button>
            
            {/* Chat title */}
            <div>
              <h1 className="font-semibold">New Conversation</h1>
              <p className="text-xs text-muted-foreground">Started today at 2:30 PM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Model selection - moved before agent switcher */}
            <div className="relative model-selector">
              <button 
                onClick={toggleModelSelector}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border hover:bg-muted/50 qandu-transition-all"
              >
                <span className="text-sm">{getModelDisplayName()}</span>
                <ChevronDown size={16} />
              </button>
              
              {showModelSelector && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-md shadow-lg z-[100] w-56 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {endpoints.map((endpoint) => (
                      <div key={endpoint.id} className="p-2 border-b border-border last:border-0">
                        <div className="font-medium text-sm px-2 py-1">{endpoint.name}</div>
                        <div className="space-y-1 mt-1">
                          {endpoint.models.map((model) => (
                            <button
                              key={`${endpoint.id}-${model}`}
                              className={cn(
                                "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted qandu-transition-all",
                                activeTextModel === `${endpoint.id}-${model}` ? "bg-primary/10 text-primary" : ""
                              )}
                              onClick={() => selectModel(endpoint.id, model)}
                            >
                              {model.charAt(0).toUpperCase() + model.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Agent selection dropdown */}
            <AgentSwitcher />
            
            <button 
              className="p-2 rounded-md hover:bg-muted/50 qandu-transition-all"
              aria-label="Chat settings"
              onClick={handleOpenSettings}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </header>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 pb-0">
          <ChatMessages theme={theme || 'light'} />
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
          <ChatInput />
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
} 