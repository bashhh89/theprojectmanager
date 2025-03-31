import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SavedPrompt {
  id: string
  command: string
  prompt: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

interface PromptState {
  prompts: SavedPrompt[]
  addPrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePrompt: (id: string, prompt: Partial<SavedPrompt>) => void
  deletePrompt: (id: string) => void
  getPromptByCommand: (command: string) => SavedPrompt | undefined
}

// Helper to generate unique IDs
const generateId = () => `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Define some default prompts
const defaultPrompts: SavedPrompt[] = [
  {
    id: 'image',
    command: 'image',
    prompt: 'Generate an image of [description]',
    tags: ['creative'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'summarize',
    command: 'summarize',
    prompt: 'Summarize the following text in bullet points: [text]',
    tags: ['productivity'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'code',
    command: 'code',
    prompt: 'Write [language] code for [description]',
    tags: ['development'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'explain',
    command: 'explain',
    prompt: 'Explain [concept] in simple terms as if I were a beginner',
    tags: ['learning'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'translate',
    command: 'translate',
    prompt: 'Translate the following to [language]: [text]',
    tags: ['language'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      prompts: defaultPrompts,
      
      addPrompt: (promptData) => set((state) => {
        const newPrompt: SavedPrompt = {
          ...promptData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        return { prompts: [...state.prompts, newPrompt] }
      }),
      
      updatePrompt: (id, promptData) => set((state) => {
        const updatedPrompts = state.prompts.map(prompt => 
          prompt.id === id 
            ? { ...prompt, ...promptData, updatedAt: new Date().toISOString() } 
            : prompt
        )
        return { prompts: updatedPrompts }
      }),
      
      deletePrompt: (id) => set((state) => ({
        prompts: state.prompts.filter(prompt => prompt.id !== id)
      })),
      
      getPromptByCommand: (command) => {
        const promptsList = get().prompts
        return promptsList.find(p => p.command === command)
      }
    }),
    {
      name: 'saved-prompts',
      skipHydration: true,
    }
  )
)

// Function to process a message with prompt commands
export const processMessageWithPrompts = (message: string): string => {
  // Check if message starts with a command
  if (!message.startsWith('/')) return message
  
  // Extract command and parameters
  const parts = message.trim().split(' ')
  const commandStr = parts[0].substring(1) // Remove the leading slash
  
  // Look up the command
  const promptStore = usePromptStore.getState()
  const promptCmd = promptStore.getPromptByCommand(commandStr)
  
  if (!promptCmd) return message // Command not found
  
  // Replace placeholders with remaining text if any
  let fullPrompt = promptCmd.prompt
  const remainingText = parts.slice(1).join(' ').trim()
  
  // Replace placeholders in the format [placeholder]
  const placeholders = fullPrompt.match(/\[(.*?)\]/g) || []
  
  // If there are placeholders and remaining text
  if (placeholders.length > 0 && remainingText) {
    // Try to intelligently map the remaining text to placeholders
    fullPrompt = fullPrompt.replace(/\[(.*?)\]/g, remainingText)
  }
  
  return fullPrompt
} 