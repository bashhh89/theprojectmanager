"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageContent } from '@/store/chatStore';
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

// Configure marked options for security and features
marked.setOptions({
  breaks: true,
  gfm: true
});

// Safely render markdown with image support
const renderMarkdown = (content: string) => {
  try {
    const imageRegex = /!\[(.*?)\]\((https:\/\/image\.pollinations\.ai\/prompt\/.*?)\)/g;
    let processedContent = content.replace(
      imageRegex,
      (match, altText, imageUrl) => {
        return `<div class="image-preview my-4">
          <img src="${imageUrl}" alt="${altText}" class="rounded-md max-w-full h-auto" />
          <p class="text-xs text-zinc-400 mt-1">${altText}</p>
        </div>`;
      }
    );
    
    processedContent = processedContent.replace(
      /!\[Generated Image\]\(https:\/\/image\.pollinations\.ai\/prompt\/(.*?)(\?width=(\d+)&height=(\d+)&nologo=true)\)/g,
      (match, encodedPrompt, params, width, height) => {
        const decodedPrompt = decodeURIComponent(encodedPrompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}${params}`;
        return `<div class="image-preview my-4">
          <img src="${imageUrl}" alt="${decodedPrompt}" class="rounded-md my-2 max-w-full" />
          <p class="text-xs text-zinc-400 mt-1">${decodedPrompt}</p>
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
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);

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
    setIsGenerating
  } = useChatStore();
  
  const messages = getActiveChatMessages();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

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
    if (messagesEndRef.current && messages.length > 0) {
      const container = chatContainerRef.current;
      if (container) {
        const prevScrollHeight = container.scrollHeight;
        
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        const isUserMessage = messages[messages.length - 1]?.role === 'user';
        
        if (isNearBottom || isUserMessage) {
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight;
            const heightDiff = newScrollHeight - prevScrollHeight;
            
            if (heightDiff > 0) {
              container.scrollTop = container.scrollTop + heightDiff;
            }
            
            messagesEndRef.current?.scrollIntoView({ 
              behavior: isUserMessage ? "auto" : "smooth",
              block: "end"
            });
          });
        }
      }
    }
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showAccountMenu) {
        setShowAccountMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu]);

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

  const handleMessageSubmit = async (content: string) => {
    if (!content.trim() || !isOnline) {
      if (!isOnline) {
        setMessageQueue(prev => [...prev, { 
          role: "user", 
          content: [{ type: 'text' as const, content: content.trim() }] 
        }]);
        showInfo('Message queued - will send when back online');
      }
      return;
    }

    try {
      await smartRetry(async () => {
        await addMessage({ 
          role: "user", 
          content: [{ type: 'text' as const, content: content.trim() }] 
        });
      });

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setLastError(null);
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to send message',
        context: 'Message Submit',
        additionalData: { content, retryCount }
      });
      setLastError('Failed to send message');
      showError('Message failed to send. Will retry automatically.');
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

  const handleSubmit = async (content: string) => {
    if (!content.trim()) return;

    try {
      const formattedContent: MessageContent[] = [{ type: 'text' as const, content: content.trim() }];

      await addMessage({
        role: 'user',
        content: formattedContent
      });

      setIsGenerating(true);

      let response;
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: formattedContent }],
            model: activeTextModel,
            systemPrompt: activeAgent?.systemPrompt,
            agent: activeAgent
          }),
        });
      } catch (error) {
        console.error('Error calling API:', error);
        const fallbackModel: TextModel = 'openai';
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: formattedContent }],
            model: fallbackModel,
            systemPrompt: activeAgent?.systemPrompt,
            agent: activeAgent
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const data = await response.json();
      
      await addMessage({
        role: 'assistant',
        content: [{ type: 'text' as const, content: data.message }]
      });

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      await addMessage({
        role: 'assistant',
        content: [{ type: 'text' as const, content: 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again in a few moments.' }]
      });

      showError('Unable to connect to the AI service. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!mounted) {
    return <div className="h-screen w-screen bg-zinc-900"></div>;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-900 text-zinc-200">
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
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 text-xs"
            onClick={handleNewChat}
          > 
            <Plus size={16} /> 
            <span>New Chat</span>
          </Button>
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
          className="h-full overflow-y-auto"
        >
          {isNewChat ? (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <div className="mb-4">
                <svg className="w-12 h-12 text-zinc-100 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/>
                  <path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/>
                </svg>
              </div>
              <h1 className="text-3xl font-medium text-zinc-200">
                Good evening, {userName}
              </h1>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-4 space-y-6">
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

                  <div className={cn(
                    "flex-1 px-4 py-2 rounded-lg",
                    message.role === 'user' ? "bg-blue-600/20" : "bg-zinc-800"
                  )}>
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
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-zinc-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/>
                      <path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="flex-1 px-4 py-2 rounded-lg bg-zinc-800">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-px" />
            </div>
          )}
        </div>
      </main>

      <div className="shrink-0 border-t border-zinc-700/50 bg-zinc-900 px-4 py-4">
        <ChatInput 
          onSubmit={handleSubmit}
          isGenerating={isGenerating}
          ref={inputRef}
        />
        <p className="text-xs text-zinc-500 text-center mt-2">
          AI assistants may display inaccurate info, including about people, so double-check responses. 
          <Link href="/privacy" className="underline hover:text-zinc-400 mx-1">Privacy policy</Link>
          <Link href="/terms" className="underline hover:text-zinc-400 mx-1">Terms of service</Link>
        </p>
      </div>

      {showKeyboardShortcuts && <KeyboardShortcutsModal />}
    </div>
  );
} 