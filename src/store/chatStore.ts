"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MessageContent = {
  type: 'text' | 'image' | 'audio'
  content: string
}

export type Message = {
  role: 'user' | 'assistant'
  content: MessageContent[]
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
  setInputValue: (value: string) => void
  addMessage: (message: Message) => void
  setIsGenerating: (isGenerating: boolean) => void
  createChat: () => string
  deleteChat: (chatId: string) => void
  setActiveChat: (chatId: string) => void
  renameChat: (chatId: string, name: string) => void
  getActiveChatMessages: () => Message[]
  getChatById: (id: string) => ChatSession | undefined
  clearMessages: () => void
  resetAll: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chatSessions: [],
      activeChatId: null,
      inputValue: '',
      isGenerating: false,

      setInputValue: (value) => set({ inputValue: value }),
      
      addMessage: (message) => set((state) => {
        const activeChatId = state.activeChatId;
        if (!activeChatId) return state;
        
        const updatedSessions = state.chatSessions.map(chat => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: [...chat.messages, message],
              updatedAt: new Date()
            };
          }
          return chat;
        });
        
        return {
          chatSessions: updatedSessions
        };
      }),
      
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      
      createChat: () => {
        const newChatId = Date.now().toString();
        const newChat: ChatSession = {
          id: newChatId,
          name: `Chat ${get().chatSessions.length + 1}`,
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
        
        // If we deleted the active chat, select a new one or null
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
      
      clearMessages: () => set((state) => {
        const activeChatId = state.activeChatId;
        if (!activeChatId) return state;
        
        return {
          chatSessions: state.chatSessions.map(chat => 
            chat.id === activeChatId ? { ...chat, messages: [] } : chat
          )
        };
      }),
      
      resetAll: () => set((state) => ({
        chatSessions: [],
        activeChatId: null,
        inputValue: '',
        isGenerating: false
      }))
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