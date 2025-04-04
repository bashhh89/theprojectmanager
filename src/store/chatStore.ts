"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PromptExecutionResult } from '@/types/prompts'

export type MessageRole = 'user' | 'assistant' | 'system' | 'command'

export interface MessageContent {
  type: 'text' | 'image';
  content: string;
}

export interface Message {
  id: string
  role: MessageRole
  content: string | MessageContent[]
  timestamp: number
  metadata?: {
    command?: string
    args?: Record<string, string>
    result?: PromptExecutionResult
    error?: string
  }
}

export type ChatSession = {
  id: string
  name: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatState {
  chatSessions: ChatSession[]
  activeChatId: string | null
  inputValue: string
  isGenerating: boolean
  isLoading: boolean
  error: string | null
  setInputValue: (value: string) => void
  addMessage: (role: MessageRole, content: string, metadata?: Message['metadata']) => void
  setIsGenerating: (isGenerating: boolean) => void
  createChat: () => string
  deleteChat: (chatId: string) => void
  setActiveChat: (chatId: string) => void
  renameChat: (chatId: string, name: string) => void
  getActiveChatMessages: () => Message[]
  getChatById: (id: string) => ChatSession | undefined
  clearMessages: () => void
  resetAll: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  deleteMessage: (id: string) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chatSessions: [],
      activeChatId: null,
      inputValue: '',
      isGenerating: false,
      isLoading: false,
      error: null,

      setInputValue: (value) => set({ inputValue: value }),
      
      addMessage: (role, content, metadata) => {
        const { activeChatId, chatSessions } = get();
        if (!activeChatId) {
          // If no active chat, create one
          const newChatId = get().createChat();
          set({ activeChatId: newChatId });
        }

        const newMessage: Message = {
          id: Date.now().toString(),
          role,
          content: typeof content === 'string' ? [{ type: 'text', content }] : content,
          timestamp: Date.now(),
          metadata,
        };

        set((state) => ({
          chatSessions: state.chatSessions.map(chat =>
            chat.id === (activeChatId || state.activeChatId)
              ? {
                  ...chat,
                  messages: [...chat.messages, newMessage],
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },
      
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      
      createChat: () => {
        const newChatId = Date.now().toString();
        const chatCount = get().chatSessions.length;
        const newChat: ChatSession = {
          id: newChatId,
          name: `New Conversation ${chatCount + 1}`,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          chatSessions: [...state.chatSessions, newChat],
          activeChatId: newChatId
        }));
        
        return newChatId;
      },
      
      deleteChat: (chatId) => set((state) => {
        const newSessions = state.chatSessions.filter(c => c.id !== chatId);
        let newActiveId = state.activeChatId;
        
        if (state.activeChatId === chatId) {
          newActiveId = newSessions.length > 0 ? newSessions[0].id : null;
        }
        
        return {
          chatSessions: newSessions,
          activeChatId: newActiveId
        };
      }),
      
      setActiveChat: (chatId) => set({ activeChatId: chatId }),
      
      renameChat: (chatId, name) => set((state) => ({
        chatSessions: state.chatSessions.map(chat => 
          chat.id === chatId ? { ...chat, name } : chat
        )
      })),
      
      getActiveChatMessages: () => {
        const { chatSessions, activeChatId } = get();
        const activeChat = chatSessions.find(c => c.id === activeChatId);
        return activeChat?.messages || [];
      },
      
      getChatById: (id) => {
        return get().chatSessions.find(chat => chat.id === id);
      },
      
      clearMessages: () => {
        const { activeChatId } = get();
        if (!activeChatId) return;

        set((state) => ({
          chatSessions: state.chatSessions.map(chat =>
            chat.id === activeChatId
              ? { ...chat, messages: [], updatedAt: new Date() }
              : chat
          ),
        }));
      },
      
      resetAll: () => set({
        chatSessions: [],
        activeChatId: null,
        inputValue: '',
        isGenerating: false,
        isLoading: false,
        error: null
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      deleteMessage: (id) => {
        const { activeChatId } = get();
        if (!activeChatId) return;

        set((state) => ({
          chatSessions: state.chatSessions.map(chat =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: chat.messages.filter(msg => msg.id !== id),
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },

      updateMessage: (id, updates) => {
        const { activeChatId } = get();
        if (!activeChatId) return;

        set((state) => ({
          chatSessions: state.chatSessions.map(chat =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === id ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: new Date(),
                }
              : chat
          ),
        }));
      },
    }),
    {
      name: 'chat-storage',
    }
  )
);

// Initialize with a default chat if none exists
if (typeof window !== 'undefined') {
  const { chatSessions, createChat } = useChatStore.getState();
  if (chatSessions.length === 0) {
    createChat();
  }
}

// Helper function to format command results for display
export const formatCommandResult = (result: PromptExecutionResult): string => {
  if (!result.success) {
    return `Error: ${result.error || 'Unknown error'}`;
  }

  if (result.metadata?.type === 'image') {
    return `[Image Generated] ${result.content}`;
  }

  if (result.metadata?.type === 'code') {
    return `[Code Generated]\n\`\`\`${result.metadata.language}\n${result.content}\n\`\`\``;
  }

  return result.content;
};

// Helper function to create a command message
export const createCommandMessage = (
  command: string,
  args: Record<string, string>,
  result: PromptExecutionResult
): Message => ({
  id: Date.now().toString(),
  role: 'command',
  content: result.content,
  timestamp: Date.now(),
  metadata: {
    command,
    args,
    result,
  },
});

// Helper function to create a system message
export const createSystemMessage = (content: string): Message => ({
  id: Date.now().toString(),
  role: 'system',
  content,
  timestamp: Date.now(),
});

// Helper function to create a user message
export const createUserMessage = (content: string): Message => ({
  id: Date.now().toString(),
  role: 'user',
  content,
  timestamp: Date.now(),
});

// Helper function to create an assistant message
export const createAssistantMessage = (content: string): Message => ({
  id: Date.now().toString(),
  role: 'assistant',
  content,
  timestamp: Date.now(),
});