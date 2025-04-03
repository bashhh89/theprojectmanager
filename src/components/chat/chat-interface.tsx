"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/store/chatStore';
import { useSettingsStore, Agent } from '@/store/settingsStore';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from 'next-themes';
import Link from 'next/link'
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { toasts } from '@/components/ui/toast-wrapper';
import { useRouter } from 'next/navigation';
import { AgentSwitcher } from './agent-switcher'; // Keep for settings modal maybe?
import { ChatInput } from './chat-input-new';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from '@/hooks/useUser'; // Now importing from our new hook
import { AVAILABLE_MODELS } from '@/lib/pollinationsApi'; // Import all available models
import { generateImageUrl, generateAudioUrl, generatePollinationsAudio } from '@/lib/pollinationsApi'; // Import all needed audio and image functions
import { marked } from 'marked'; // Import marked for markdown rendering
import { showError, showSuccess, showInfo } from '@/components/ui/toast';
import { logError } from '@/utils/errorLogging';
import { Sparkle, Pencil, Plus, Menu, CircleUser, MessageSquare, Book, Settings as SettingsIcon, LogOut, Keyboard } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

// Configure marked options for security and features
marked.setOptions({
  breaks: true, // Add line breaks on single line breaks
  gfm: true     // Enable GitHub Flavored Markdown
});

// Safely render markdown with image support
const renderMarkdown = (content: string) => {
  try {
    // Check if there's markdown image syntax that needs to be converted to real images
    // This regex finds markdown image syntax: ![text](url)
    const imageRegex = /!\[(.*?)\]\((https:\/\/image\.pollinations\.ai\/prompt\/.*?)\)/g;
    
    // Replace all image markdown with actual HTML image tags
    let processedContent = content.replace(
      imageRegex,
      (match, altText, imageUrl) => {
        // Create an actual img tag with the URL
        return `<div class="image-preview my-4">
          <img src="${imageUrl}" alt="${altText}" class="rounded-md max-w-full h-auto" />
          <p class="text-xs text-zinc-400 mt-1">${altText}</p>
        </div>`;
      }
    );
    
    // Also specifically target the Pollinations image format with width and height params
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
    
    // Render the markdown to HTML
    const html = marked.parse(processedContent);
    
    // Return the HTML to be rendered
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

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Keep state if sidebar might be added later
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);
  const [showAllModels, setShowAllModels] = useState(false);
  const { user, userDetails } = useUser(); // Get user data
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use the proper model list from AVAILABLE_MODELS
  const availableModels = AVAILABLE_MODELS.TEXT.map(model => model.id);
  
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
  const { theme, setTheme } = useTheme(); // Still useful for dark/light base
  const router = useRouter();

  // Set theme to dark by default to match Gemini style
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  useEffect(() => {
    setMounted(true);
    // Initialize active model only if it's not set or invalid
    if (!activeTextModel || !availableModels.includes(activeTextModel)) {
      setActiveTextModel('openai');
    }
  }, [availableModels, setActiveTextModel]);

  useEffect(() => {
    setIsNewChat(messages.length === 0);
  }, [messages]);

  // Handle responsive sidebar (if keeping sidebar)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add useEffect for auto-scrolling
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Dependency array includes messages

  // Add an effect to close the account menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showAccountMenu) {
        setShowAccountMenu(false);
      }
    }
    
    // Add event listener for mousedown outside component
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

  const handleModelChange = (model: string) => {
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

  const handleWelcomeSubmit = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Start loading state
      const loadingMessage = { role: "assistant", content: [{ type: "text", content: "..." }] };
      addMessage({ role: "user", content: [{ type: "text", content }] });
      
      // Clear loading message once real response comes
      setIsNewChat(false);
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to send message',
        context: 'Message Submit',
        additionalData: { content }
      });
      showError('Could not send message. Please try again.');
    }
  };

  // Add automatic retry for failed messages
  const retryMessage = async (messageIndex: number) => {
    try {
      const messages = getActiveChatMessages();
      const messageToRetry = messages[messageIndex];
      
      if (!messageToRetry) {
        throw new Error('Message not found');
      }

      // Remove failed message and try again
      messages.splice(messageIndex, 1);
      addMessage(messageToRetry);
      showSuccess('Retrying message...');
    } catch (error) {
      logError({
        error: error instanceof Error ? error.toString() : 'Failed to retry message',
        context: 'Message Retry'
      });
      showError('Could not retry message. Please try again.');
    }
  };

  // Add connection status monitoring
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showSuccess('Back online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showError('You are offline. Messages will be queued.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add message queue for offline mode
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);

  useEffect(() => {
    if (isOnline && messageQueue.length > 0) {
      const processQueue = async () => {
        for (const message of messageQueue) {
          try {
            await addMessage(message);
          } catch (error) {
            logError({
              error: error instanceof Error ? error.toString() : 'Failed to process queued message',
              context: 'Queue Processing'
            });
          }
        }
        setMessageQueue([]);
      };
      processQueue();
    }
  }, [isOnline, messageQueue]);

  // Get model name for display
  const getModelDisplayName = (modelId: string) => {
    const model = AVAILABLE_MODELS.TEXT.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  // Attempt to get a reasonable user name, fallback to "User"
  const userName = userDetails?.full_name || user?.email?.split('@')[0] || 'User'; 

  // Get voice options from the openai-audio model
  const availableVoices = AVAILABLE_MODELS.TEXT.find(model => model.id === 'openai-audio')?.voices || 
    ['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'];

  // Smart retry with exponential backoff
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

  // Keyboard shortcuts
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

  // Enhanced message handling
  const handleMessageSubmit = async (content: string) => {
    if (!content.trim() || !isOnline) {
      if (!isOnline) {
        setMessageQueue(prev => [...prev, { role: "user", content: [{ type: "text", content }] }]);
        showInfo('Message queued - will send when back online');
      }
      return;
    }

    try {
      await smartRetry(async () => {
        await addMessage({ role: "user", content: [{ type: "text", content }] });
      });

      // Auto-scroll and clear any previous errors
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

  // Add keyboard shortcuts modal
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
      // Add user message
      addMessage({ role: "user", content: [{ type: "text", content }] });
      
      // Set generating state
      setIsGenerating(true);

      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: getActiveChatMessages(),
          model: activeTextModel,
          systemPrompt: activeAgent?.systemPrompt,
          agent: activeAgent
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add assistant message
      addMessage({
        role: "assistant",
        content: [{ type: "text", content: data.message }]
      });

      setIsNewChat(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      showError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!mounted) {
    // Simple loading state
    return <div className="h-screen w-screen bg-zinc-900"></div>;
  }

  // Main content display based on whether there are messages
  const MainContent = () => {
    if (isNewChat) {
      // Gemini-style Welcome Screen
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-20">
          <div className="mb-4">
             {/* Replace with Google Logo SVG */} 
             <svg className="w-12 h-12 text-zinc-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/><path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/></svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-medium text-zinc-200 mb-10">
            Good evening, {userName} 
          </h1>
          {/* Input is handled by the main ChatInput component below */}
        </div>
      );
    } else {
      // Gemini-style Chat View
      return (
        <div className="px-4 pb-4 pt-6" ref={chatContainerRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}
              >
                 {/* Assistant Avatar (Conditional) */}
                 {message.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center shrink-0 mt-1">
                       <svg className="w-4 h-4 text-zinc-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/><path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/></svg>
                    </div>
                 )}
                 {/* Wrapper for Message Content and TTS Button */}
                 <div className={`relative group flex-1 ${message.role === 'user' ? 'ml-auto max-w-[85%]' : 'max-w-[85%]'}`}> 
                   {/* Actual Message Content Bubble/Text */} 
                   <div 
                     className={`text-zinc-200 leading-relaxed break-words ${ 
                       message.role === 'user' 
                         ? 'bg-zinc-700/80 p-3 rounded-lg float-right' 
                         : 'p-2' 
                     }`}
                   >
                     {message.content?.map((item, i) => (
                        <div key={i}>
                           {item.type === 'text' ? (
                             <div 
                               className="markdown-content prose prose-invert prose-sm max-w-none"
                               dangerouslySetInnerHTML={renderMarkdown(item.content)} 
                             />
                           ) : item.type === 'image' ? (
                             <div className="my-2">
                               <img 
                                 src={item.content} 
                                 alt="Generated image" 
                                 className="rounded-md max-w-full h-auto" 
                               />
                               <p className="text-xs text-zinc-400 mt-1">Generated image</p>
                             </div>
                           ) : (
                             `[Unsupported content: ${item.type}]`
                           )}
                        </div>
                     ))}
                   </div>
                   {/* TTS Button - Always visible for assistant messages, opacity changes on hover */} 
                   {message.role === 'assistant' && message.content?.some(c => c.type === 'text') && (
                       <button 
                           className="absolute -right-2 -bottom-2 opacity-30 hover:opacity-100 transition-opacity p-1.5 bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600"
                           onClick={() => {
                               const textToSpeak = message.content?.find(c => c.type === 'text')?.content;
                               if (textToSpeak) {
                                   // Use Pollinations AI for TTS - with exact=true to repeat exactly the same response
                                   toasts.success("Playing voice with Pollinations AI");
                                   
                                   // Use selected voice or default to "nova"
                                   const voice = useSettingsStore.getState().activeVoice || "nova";
                                   
                                   // Call Pollinations API to generate audio with exact=true parameter
                                   generatePollinationsAudio(textToSpeak, voice, true)
                                       .then(audioUrl => {
                                           if (audioUrl) {
                                               const audio = new Audio(audioUrl);
                                               audio.play();
                                           } else {
                                               toasts.error("Failed to generate audio");
                                           }
                                       })
                                       .catch(err => {
                                           console.error("TTS error:", err);
                                           toasts.error("Error generating audio");
                                       });
                               }
                           }}
                           title="Play exact message audio with Pollinations AI"
                       >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                       </button>
                   )}
                 </div> { /* Closing div for the content/TTS wrapper */ }
                 {/* User Avatar (Conditional) */}
                 {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 ml-3">
                       <span className="text-xs font-medium text-white">{userName.charAt(0).toUpperCase()}</span> 
                    </div>
                 )}
              </div> // Closing div for the entire message row
            ))}
            {/* Typing Indicator */} 
            {isGenerating && (
               <div className="flex items-start gap-3">
                   <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center shrink-0 mt-1">
                       {/* Placeholder G logo SVG */}
                       <svg className="w-4 h-4 text-zinc-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/><path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/></svg>
                   </div>
                  <div className="text-zinc-400 p-3">
                     {/* Simple pulsing dot for typing indicator */} 
                     <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div> 
                  </div>
               </div>
            )}
          </div>
          {/* Scroll anchor */} 
          <div ref={messagesEndRef} className="h-0" /> 
        </div>
      );
    }
  };

  // Group models into categories for easier selection
  const modelGroups = {
    // Standard models: no special capabilities and censored
    standard: AVAILABLE_MODELS.TEXT.filter(model => 
      !model.reasoning && 
      !model.vision && 
      !model.audio && 
      model.censored !== false // Use this instead of uncensored
    ),
    // Reasoning models
    reasoning: AVAILABLE_MODELS.TEXT.filter(model => 
      model.reasoning === true
    ),
    // Models with vision or audio capabilities
    multimodal: AVAILABLE_MODELS.TEXT.filter(model => 
      (model.vision === true || model.audio === true) && !model.reasoning
    )
  };

  // Get top 5 models to show in collapsed view
  const topModels = [
    'openai',
    'openai-large',
    'mistral',
    'llama',
    'qwen-coder'
  ].filter(modelId => availableModels.includes(modelId));

  // Main Layout - Adjust flex structure for sticky footer
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-900 text-zinc-200">
      {/* Header remains at the top */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-zinc-700/50 shrink-0 z-10">
        {/* Left side of Header - Restored with model and agent selectors */}
        <div className="flex items-center gap-3">
          {/* Model Selector */}
          <Select value={activeTextModel} onValueChange={handleModelChange}>
            <SelectTrigger className="h-9 pl-3 pr-2 text-sm font-medium border border-zinc-700 bg-zinc-800 hover:bg-zinc-700/60 focus:ring-0 focus:border-zinc-600 rounded-md text-zinc-100 max-w-[260px]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0002 11.2424C14.3381 11.2424 16.2426 9.33785 16.2426 7C16.2426 4.66215 14.3381 2.75757 12.0002 2.75757C9.6623 2.75757 7.75772 4.66215 7.75772 7C7.75772 9.33785 9.6623 11.2424 12.0002 11.2424Z" fill="currentColor"/><path d="M11.9999 21.2424C16.142 21.2424 19.5832 17.7902 19.5832 13.6481C19.5832 9.50596 16.142 6.06482 11.9999 6.06482C7.85778 6.06482 4.41656 9.50596 4.41656 13.6481C4.41656 17.7902 7.85778 21.2424 11.9999 21.2424Z" fill="currentColor"/></svg>
                <span className="truncate max-w-[180px]">{getModelDisplayName(activeTextModel)}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100 max-h-[400px]">
              {/* Toggle button */}
              <div className="px-2 py-1.5 mb-1 border-b border-zinc-700">
                <button 
                  type="button"
                  className="w-full text-xs justify-between flex items-center text-zinc-400 hover:text-zinc-300 py-1 px-2 rounded hover:bg-zinc-700/50"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAllModels(!showAllModels); }}
                >
                  {showAllModels ? 'Show Fewer Models' : 'Show All Models'} 
                  {showAllModels ? 
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg> : 
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  }
                </button>
              </div>
              {/* Conditional model rendering */}                  
              {!showAllModels ? (
                <div className="py-1">
                  {topModels.map((modelId) => {
                    const model = AVAILABLE_MODELS.TEXT.find(m => m.id === modelId);
                    if (!model) return null;
                    return (
                      <SelectItem key={modelId} value={modelId} className="text-sm hover:bg-zinc-700 focus:bg-zinc-700">
                        {model.name}
                      </SelectItem>
                    );
                  })}
                </div>
              ) : (
                <>
                  {/* Standard Models */}
                  {modelGroups.standard.length > 0 && (
                    <div className="py-1">
                      <div className="px-2 pt-1 pb-1 text-xs text-zinc-500 font-medium">Standard Models</div>
                      {modelGroups.standard.map((model) => (
                        <SelectItem key={model.id} value={model.id} className="text-sm hover:bg-zinc-700 focus:bg-zinc-700">
                          {model.name}
                        </SelectItem>
                      ))}
                    </div>
                  )}
                  {/* Reasoning Models */}
                  {modelGroups.reasoning.length > 0 && (
                    <div className="py-1 border-t border-zinc-700">
                      <div className="px-2 pt-1 pb-1 text-xs text-zinc-500 font-medium">Reasoning Models</div>
                      {modelGroups.reasoning.map((model) => (
                        <SelectItem key={model.id} value={model.id} className="text-sm hover:bg-zinc-700 focus:bg-zinc-700">
                          {model.name}
                        </SelectItem>
                      ))}
                    </div>
                  )}
                  {/* Multimodal Models */}
                  {modelGroups.multimodal.length > 0 && (
                    <div className="py-1 border-t border-zinc-700">
                      <div className="px-2 pt-1 pb-1 text-xs text-zinc-500 font-medium">Multimodal Models</div>
                      {modelGroups.multimodal.map((model) => (
                        <SelectItem key={model.id} value={model.id} className="text-sm hover:bg-zinc-700 focus:bg-zinc-700">
                          {model.name}
                        </SelectItem>
                      ))}
                    </div>
                  )}
                </> 
              )}
            </SelectContent>
          </Select>

          {/* Agent Selector */}
          <Select value={activeAgent?.id || "default"} onValueChange={(agentId) => {
            if (agentId === "manage") {
              // Navigate to the agents page
              router.push('/agents');
              return;
            }
            
            if (agentId === "default") {
              // Reset to default agent
              setActiveAgent(null);
              return;
            }
            
            // Find and set the selected agent
            const selectedAgent = agents.find(a => a.id === agentId);
            if (selectedAgent) {
              setActiveAgent(selectedAgent);
              // Show toast notification with our improved toast system
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
          
          {/* New Chat Button */}
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
        {/* Right side of Header */}
        <div className="flex items-center gap-2">
           {/* User Account Button with Dropdown */}
           <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-zinc-400 hover:text-zinc-100 rounded-full"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
              >
                <CircleUser size={22} />
              </Button>
              
              {/* Account Dropdown Menu */}
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
                          // Handle logout
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
           {/* Add keyboard shortcuts button */}
           <button
             onClick={() => setShowKeyboardShortcuts(true)}
             className="p-2 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
             title="Keyboard shortcuts"
           >
             <Keyboard size={20} />
           </button>
        </div>
      </header>

      {/* Message list area - SINGLE scrollable container */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto">
          <MainContent />
          {/* Scroll anchor inside the scrolling container */}
          <div ref={messagesEndRef} className="h-0" />
        </div>
      </main>

      {/* Input/Footer area - fixed at the bottom */}
      <div className="px-4 pb-3 pt-2 border-t border-zinc-700/50 shrink-0 bg-zinc-900 z-10">
         <ChatInput 
           onSubmit={handleSubmit} 
           key={isNewChat ? 'welcome-input' : 'chat-input'} 
           ref={inputRef}
         />
         <p className="text-xs text-zinc-500 text-center pt-2">
           AI assistants may display inaccurate info, including about people, so double-check responses. 
           <Link href="/privacy" className="underline hover:text-zinc-400 mx-1">Privacy policy</Link>
           <Link href="/terms" className="underline hover:text-zinc-400 mx-1">Terms of service</Link>
         </p>
      </div>

      {/* Show keyboard shortcuts modal */}
      {showKeyboardShortcuts && <KeyboardShortcutsModal />}
    </div>
  );
} 