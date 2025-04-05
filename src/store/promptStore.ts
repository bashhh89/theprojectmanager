import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
interface Prompt {
  id: string;
  name: string;
  command: string;
  prompt: string;
  description: string;
  tags: string[];
}

interface PromptState {
  prompts: Prompt[];
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (id: string, prompt: Prompt) => void;
  deletePrompt: (id: string) => void;
  getPromptById: (id: string) => Prompt | undefined;
  getPromptByCommand: (command: string) => Prompt | undefined;
}

// Create store with persistence
export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      prompts: [],
      
      addPrompt: (prompt) => {
        set((state) => ({
          prompts: [...state.prompts, prompt]
        }));
      },
      
      updatePrompt: (id, updatedPrompt) => {
        set((state) => ({
          prompts: state.prompts.map((prompt) => 
            prompt.id === id ? updatedPrompt : prompt
          )
        }));
      },
      
      deletePrompt: (id) => {
        set((state) => ({
          prompts: state.prompts.filter((prompt) => prompt.id !== id)
        }));
      },
      
      getPromptById: (id) => {
        return get().prompts.find((prompt) => prompt.id === id);
      },
      
      getPromptByCommand: (command) => {
        return get().prompts.find((prompt) => 
          prompt.command.toLowerCase() === command.toLowerCase()
        );
      }
    }),
    {
      name: 'prompt-storage',
      skipHydration: false,
    }
  )
); 