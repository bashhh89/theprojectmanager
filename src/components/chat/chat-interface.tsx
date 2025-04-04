"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/store/chatStore';
import { useSettingsStore, Agent, TextModelId } from '@/store/settingsStore';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from 'next-themes';
import Link from 'next/link'
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { toasts } from '@/components/ui/toast-wrapper';
import { useRouter } from 'next/navigation';
import { AgentSwitcher } from './agent-switcher';
import { ChatInput } from './chat-input-new';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from '@/hooks/useUser';
import { MODEL_LIST, ModelInfo } from '@/lib/constants';
import { generateImageUrl, generateAudioUrl, generatePollinationsAudio } from '@/lib/pollinationsApi';
import { marked } from 'marked';
import { showError, showSuccess, showInfo } from '@/components/ui/toast';
import { logError } from '@/utils/errorLogging';
import { Sparkle, Pencil, Plus, Menu, CircleUser, MessageSquare, Book, Settings as SettingsIcon, LogOut, Keyboard } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { ModelSelector } from '@/components/chat/model-selector';
import { TextModel } from '@/lib/constants';
import { processMessage } from '@/lib/prompt-service';
import { Message as StoreMessage } from '@/store/chatStore';

// Configure marked options for security and features
marked.setOptions({
  breaks: true,
  gfm: true,
  mangle: false
});

// Safely render markdown with image support
const renderMarkdown = (content: string) => {
  try {
    // Clean up table formatting first
    let processedContent = content.replace(
      /\|(.+)\|/g,
      (match) => {
        if ((match.match(/\|/g) || []).length > 2) {
          // Normalize spacing around pipes and trim whitespace
          return match.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell)
            .join(' | ')
            .trim();
        }
        return match;
      }
    );

    // Add proper table wrapper
    processedContent = processedContent.replace(
      /(\|.+\|\n\|[-:\|\s]+\|\n(\|.+\|\n)+)/g,
      (table) => `<div class="table-wrapper">\n${table}\n</div>`
    );

    // Process images
    processedContent = processedContent.replace(
      /!\[(.*?)\]\((https:\/\/image\.pollinations\.ai\/prompt\/.*?)\)/g,
      (match, altText, imageUrl) => {
        return `<div class="image-preview my-4">
          <img src="${imageUrl}" alt="${altText}" class="rounded-md max-w-full h-auto" />
          <p class="text-xs text-zinc-400 mt-1">${altText}</p>
        </div>`;
      }
    );
    
    const html = marked.parse(processedContent);
    return { __html: html };
  } catch (error) {
    console.error("Error rendering markdown:", error);
    return { __html: `<p>${content}</p>` };
  }
};

// Add keyboard shortcuts map
const KEYBOARD_SHORTCUTS = {
  newChat: 'ctrl+n',
  clearChat: 'ctrl+l',
  focusInput: '/',
  toggleModel: 'ctrl+m',
  toggleAgent: 'ctrl+a',
  toggleTheme: 'ctrl+shift+t',
};

type ModelListType = typeof MODEL_LIST.TEXT[number];

interface LocalMessageContent {
  type: 'text' | 'image';
  content: string;
}

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: LocalMessageContent[];
  timestamp: number;
}

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);
  const [showAllModels, setShowAllModels] = useState(false);
  const { user, userDetails } = useUser();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const availableModels = MODEL_LIST.TEXT.map((model: ModelListType) => model.id);
  
  const { 
    activeTextModel, 
    setActiveTextModel, 
    activeAgent, 
    setActiveAgent,
    activeVoice,
    setActiveVoice,
    agents 
  } = useSettingsStore();
  
  const { 
    getActiveChatMessages, 
    addMessage, 
    isGenerating, 
    createChat,
    resetAll,
    setIsGenerating,
    activeChatId,
    chatSessions
  } = useChatStore();
  
  const messages = getActiveChatMessages();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  // Initialize chat if none exists
  useEffect(() => {
    if (!activeChatId && chatSessions.length === 0) {
      createChat();
    }
  }, [activeChatId, chatSessions.length, createChat]);

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  useEffect(() => {
    setMounted(true);
    if (!activeTextModel || !availableModels.includes(activeTextModel)) {
      setActiveTextModel('openai');
    }
  }, [availableModels, setActiveTextModel]);

  useEffect(() => {
    setIsNewChat(messages.length === 0);
  }, [messages]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const scrollToBottom = () => {
      const container = chatContainerRef.current;
      
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    // Call scrollToBottom whenever messages change or when generating
    requestAnimationFrame(scrollToBottom);
  }, [messages, isGenerating]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAccountMenu) {
        setShowAccountMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu, setShowAccountMenu]);

  const handleNewChat = () => {
    try {
      resetAll();
      const newChatId = createChat();
      setIsNewChat(true);
      router.push(`/chat`);
      showSuccess('Started new chat');
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to create new chat',
        context: 'Chat Creation'
      });
      showError('Could not create new chat. Please try again.');
    }
  };

  const handleModelChange = (model: TextModelId) => {
    try {
      setActiveTextModel(model);
      showSuccess(`Switched to ${getModelDisplayName(model)}`);
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to switch model',
        context: 'Model Switch'
      });
      showError('Could not switch models. Please try again.');
    }
  };

  const getModelDisplayName = (modelId: string) => {
    const model = MODEL_LIST.TEXT.find((m: ModelListType) => m.id === modelId);
    return model ? model.name : modelId;
  };

  const userName = userDetails?.full_name || user?.email?.split('@')[0] || 'User';

  const audioModel = MODEL_LIST.TEXT.find((model: ModelListType) => model.id === 'openai-audio');
  const availableVoices = audioModel?.voices || ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'];

  const smartRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
    try {
      setRetryCount(prev => prev + 1);
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      const result = await operation();
      setRetryCount(0);
      return result;
    } catch (error) {
      if (retryCount < maxRetries) {
        showError(`Retrying... (${retryCount + 1}/${maxRetries})`);
        return smartRetry(operation, maxRetries);
      }
      throw error;
    }
  };

  useHotkeys(KEYBOARD_SHORTCUTS.newChat, (e) => {
    e.preventDefault();
    handleNewChat();
  });

  useHotkeys(KEYBOARD_SHORTCUTS.clearChat, (e) => {
    e.preventDefault();
    resetAll();
    showSuccess('Chat cleared');
  });

  useHotkeys(KEYBOARD_SHORTCUTS.focusInput, (e) => {
    if (e.target === document.body) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  });

  useHotkeys(KEYBOARD_SHORTCUTS.toggleModel, (e) => {
    e.preventDefault();
    setShowAllModels(prev => !prev);
  });

  const handleSubmit = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Add user message
      addMessage('user', content);
      setIsGenerating(true);

      // Process the message and get AI response
      const response = await processMessage(content);

      // Add AI response
      if (response.success) {
        addMessage('assistant', response.content);
      } else {
        addMessage('assistant', `Error: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to process message',
        context: 'Message Processing'
      });
      showError('Could not process message. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const KeyboardShortcutsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowKeyboardShortcuts(false)}>
      <div className="bg-zinc-800 p-6 rounded-lg max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4 text-zinc-100">Keyboard Shortcuts</h3>
        <div className="space-y-3">
          {Object.entries(KEYBOARD_SHORTCUTS).map(([action, key]) => (
            <div key={action} className="flex justify-between">
              <span className="text-zinc-300">{action.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
              <kbd className="px-2 py-1 bg-zinc-700 rounded text-sm">{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return <div className="h-screen w-screen bg-zinc-900"></div>;
  }

  return (
    <div className="fixed inset-0 ml-[240px]">
      <div className="flex h-full flex-col overflow-hidden bg-zinc-900 text-zinc-200">
      <header className="shrink-0 border-b border-zinc-700/50 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <ModelSelector
            value={activeTextModel}
            onValueChange={handleModelChange}
          />

          <Select value={activeAgent?.id || "default"} onValueChange={(agentId) => {
            if (agentId === "manage") {
              router.push('/agents');
              return;
            }
            
            if (agentId === "default") {
              setActiveAgent(null);
              return;
            }
            
            const selectedAgent = agents.find(a => a.id === agentId);
            if (selectedAgent) {
              setActiveAgent(selectedAgent);
              toasts.success(`Agent ${selectedAgent.name} selected`);
            }
          }}>
            <SelectTrigger className="h-9 pl-3 pr-2 text-sm font-medium border border-zinc-700 bg-zinc-800 hover:bg-zinc-700/60 focus:ring-0 focus:border-zinc-600 rounded-md text-zinc-100 max-w-[180px]">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                <span className="truncate max-w-[120px]">{activeAgent?.name || "Default Agent"}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
              <SelectItem value="default" className="text-sm hover:bg-zinc-700 focus:bg-zinc-700">
                Default Agent
              </SelectItem>
              <div className="py-1 border-t border-zinc-700">
                <div className="px-2 pt-1 pb-1 text-xs text-zinc-500 font-medium">My Agents</div>
                {agents.length === 0 ? (
                  <div className="px-2 py-2 text-xs text-zinc-400">
                    No custom agents found
                  </div>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id} className="text-sm hover:bg-zinc-700 focus:bg-zinc-700">
                      {agent.name}
                    </SelectItem>
                  ))
                )}
              </div>
              <div className="py-1 border-t border-zinc-700">
                <SelectItem value="manage" className="text-sm hover:bg-zinc-700 focus:bg-zinc-700 text-blue-400">
                  Manage Agents...
                </SelectItem>
              </div>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-zinc-400 hover:text-zinc-100 rounded-full"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
            >
              <CircleUser size={22} />
            </Button>
            
            {showAccountMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-2 border-b border-zinc-700 text-sm text-zinc-300">
                  {userName || 'User Account'}
                </div>
                <ul>
                  <li>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-700">
                      <MessageSquare size={16} />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-zinc-300 hover:bg-zinc-700">
                      <SettingsIcon size={16} />
                      <span>Settings</span>
                    </Link>
                  </li>
                  <li className="border-t border-zinc-700">
                    <button 
                      className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-zinc-700 w-full text-left"
                      onClick={() => {
                        router.push('/logout');
                      }}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowKeyboardShortcuts(true)}
            className="p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            title="Keyboard shortcuts"
          >
            <Keyboard size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div 
          ref={chatContainerRef}
            className="h-full overflow-y-auto overflow-x-hidden px-4"
            style={{ 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
        >
          {isNewChat ? (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <div className="mb-4">
                <svg className="w-12 h-12 text-zinc-100 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/>
                  <path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/>
                </svg>
              </div>
                <h1 className="text-3xl font-medium text-zinc-200 mb-3">
                  Start a New Conversation
              </h1>
                <p className="text-zinc-400 max-w-md mb-6">
                  Ask me anything - from creative writing to coding help, research questions, or just casual conversation.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => inputRef.current?.focus()}
                    className="text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Typing
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowKeyboardShortcuts(true)}
                    className="text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    View Shortcuts
                  </Button>
                </div>
            </div>
          ) : (
              <div className="max-w-3xl mx-auto py-8 mb-[120px]">
                <div className="space-y-6">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === 'user' ? "bg-blue-600" : "bg-zinc-700"
                  )}>
                    {message.role === 'user' ? (
                      <span className="text-sm font-medium text-white">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <svg className="w-5 h-5 text-zinc-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/>
                        <path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/>
                      </svg>
                    )}
                  </div>

                      <div 
                        className={cn(
                          "flex-1 px-4 py-2 rounded-lg overflow-hidden text-left",
                    message.role === 'user' ? "bg-blue-600/20" : "bg-zinc-800"
                        )}
                        style={{
                          maxWidth: 'calc(100% - 4rem)',
                          wordBreak: 'break-word'
                        }}
                      >
                    {Array.isArray(message.content) ? (
                      message.content.map((item, i) => (
                        <div key={i}>
                          {item.type === 'text' && (
                            <div 
                              className="prose prose-invert prose-sm max-w-none"
                              dangerouslySetInnerHTML={renderMarkdown(item.content)} 
                            />
                          )}
                          {item.type === 'image' && (
                            <div className="my-2">
                              <img 
                                src={item.content} 
                                alt="Generated" 
                                className="rounded-lg max-w-full h-auto" 
                                    loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div 
                        className="prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={renderMarkdown(
                          typeof message.content === 'string' 
                            ? message.content 
                            : JSON.stringify(message.content)
                        )} 
                      />
                    )}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-zinc-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/>
                      <path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/>
                    </svg>
                  </div>
                      <div className="px-4 py-2 rounded-lg bg-zinc-800 w-auto">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
                </div>
                
                <div 
                  ref={messagesEndRef} 
                  className="h-px w-full" 
                  aria-hidden="true"
                />
            </div>
          )}
        </div>
      </main>

        <footer className="shrink-0 border-t border-zinc-700/50 bg-zinc-900 px-4 py-4 fixed bottom-0 right-0 left-[240px]">
          <div className="max-w-3xl mx-auto">
        <ChatInput 
          onSubmit={handleSubmit}
          ref={inputRef}
        />
        <p className="text-xs text-zinc-500 text-center mt-2">
          AI assistants may display inaccurate info, including about people, so double-check responses. 
          <Link href="/privacy" className="underline hover:text-zinc-400 mx-1">Privacy policy</Link>
          <Link href="/terms" className="underline hover:text-zinc-400 mx-1">Terms of service</Link>
        </p>
      </div>
        </footer>

      {showKeyboardShortcuts && <KeyboardShortcutsModal />}
      </div>
    </div>
  );
} 

<style jsx global>{`
  .prose {
    max-width: none;
    width: 100%;
  }
  
  .prose p {
    margin-top: 1em;
    margin-bottom: 1em;
    line-height: 1.6;
  }

  .prose table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 1.5rem 0;
    background: rgb(24 24 27);
    border-radius: 8px;
    overflow: hidden;
  }

  .prose thead {
    background: rgb(39 39 42);
  }

  .prose th {
    text-transform: none;
    font-size: 0.9375rem;
    font-weight: 500;
    color: rgb(244 244 245);
    padding: 12px 24px;
    text-align: left;
    border-bottom: 1px solid rgba(63, 63, 70, 0.5);
    white-space: nowrap;
  }

  .prose td {
    padding: 16px 24px;
    color: rgb(228 228 231);
    font-size: 0.9375rem;
    line-height: 1.5;
    border-bottom: 1px solid rgba(63, 63, 70, 0.3);
  }

  .prose tr:last-child td {
    border-bottom: none;
  }

  .prose tr:hover td {
    background: rgba(39, 39, 42, 0.5);
  }

  .table-wrapper {
    margin: 1.5rem 0;
    overflow-x: auto;
    border-radius: 8px;
    background: rgb(24 24 27);
  }

  .table-wrapper table {
    margin: 0;
    min-width: 100%;
  }

  .prose pre {
    background: rgba(24, 24, 27, 0.7);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
  }

  .prose code {
    background: rgba(24, 24, 27, 0.7);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.875em;
  }

  .prose ul, .prose ol {
    padding-left: 1.5em;
    margin: 1em 0;
  }

  .prose li {
    margin: 0.5em 0;
  }

  .prose blockquote {
    border-left: 3px solid #3b82f6;
    padding-left: 1em;
    margin: 1em 0;
    color: #94a3b8;
  }
`}</style> 