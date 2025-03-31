import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AVAILABLE_MODELS } from "../lib/pollinationsApi"

export interface Agent {
  id: string
  name: string
  systemPrompt: string
  system_prompt: string
  description?: string
  enableSpokenResponses?: boolean
  modelPreferences?: {
    textModel?: string
    imageModel?: string
    voiceModel?: string
  }
}

interface SettingsStore {
  darkMode: boolean
  activeTextModel: string
  activeImageModel: string
  activeAudioModel: string
  activeVoice: string
  activeAgent: Agent
  agents: Agent[]
  selectedAgentId: string | null
  setDarkMode: (darkMode: boolean) => void
  setActiveTextModel: (model: string) => void
  setActiveImageModel: (model: string) => void
  setActiveAudioModel: (model: string) => void
  setActiveVoice: (voice: string) => void
  setActiveAgent: (agent: Agent) => void
  setSelectedAgentId: (agentId: string | null) => void
  addAgent: (agent: Agent) => void
  updateAgent: (agentId: string, updates: Partial<Agent>) => void
  deleteAgent: (agentId: string) => void
  getActiveAgent: () => Agent
  setAgentModelPreference: (agentId: string, modelType: 'textModel' | 'imageModel' | 'voiceModel', modelId: string) => void
  setAgentSpokenResponses: (agentId: string, enableSpokenResponses: boolean) => void
}

// Define default agents
export const defaultAgents: Agent[] = [
  {
    id: "default",
    name: "General Assistant",
    description: "A helpful and versatile AI assistant for general tasks",
    systemPrompt: "You are a helpful AI assistant. Provide concise and accurate responses to user queries.",
    system_prompt: "You are a helpful AI assistant. Provide concise and accurate responses to user queries.",
    enableSpokenResponses: false,
    modelPreferences: {
      textModel: "google-gemini-pro",
    }
  },
  {
    id: "creative-writer",
    name: "Creative Writer",
    description: "An assistant focused on creative writing and storytelling",
    systemPrompt: "You are a creative writing assistant. Help users craft engaging stories, poems, and creative content. Offer inspiration, suggestions, and help with writing challenges.",
    system_prompt: "You are a creative writing assistant. Help users craft engaging stories, poems, and creative content. Offer inspiration, suggestions, and help with writing challenges.",
    enableSpokenResponses: false,
    modelPreferences: {
      textModel: "google-gemini-pro",
    }
  },
  {
    id: "coding-assistant",
    name: "Coding Assistant",
    description: "A specialized assistant for programming and development tasks",
    systemPrompt: "You are a coding assistant. Help users with programming questions, code reviews, debugging, and software development best practices. Prioritize writing clean, efficient, and well-documented code.",
    system_prompt: "You are a coding assistant. Help users with programming questions, code reviews, debugging, and software development best practices. Prioritize writing clean, efficient, and well-documented code.",
    enableSpokenResponses: false,
    modelPreferences: {
      textModel: "google-gemini-pro",
    }
  }
]

const defaultAgent = defaultAgents[0]

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      darkMode: true,
      // Use Google Gemini models with correct provider prefix
      activeTextModel: "google-gemini-pro",
      activeImageModel: 'turbo',
      activeAudioModel: AVAILABLE_MODELS.audio[0].id,
      activeVoice: AVAILABLE_MODELS.voices[0].id,
      activeAgent: defaultAgent,
      agents: defaultAgents,
      selectedAgentId: null, // New property to track the selected Supabase agent ID
      
      setDarkMode: (darkMode) => set({ darkMode }),
      setActiveTextModel: (model) => set({ activeTextModel: model }),
      setActiveImageModel: (model) => set({ activeImageModel: model }),
      setActiveAudioModel: (model) => set({ activeAudioModel: model }),
      setActiveVoice: (voice) => set({ activeVoice: voice }),
      
      setSelectedAgentId: (agentId) => set({ selectedAgentId: agentId }),
      
      setActiveAgent: (agent) => {
        // Update selectedAgentId if this is a Supabase agent (not a default agent)
        const isSupabaseAgent = !defaultAgents.some(a => a.id === agent.id);
        
        const updates: any = { 
          activeAgent: agent,
          // Only update selectedAgentId if this is a Supabase agent
          ...(isSupabaseAgent ? { selectedAgentId: agent.id } : {})
        };
        
        if (agent.modelPreferences) {
          if (agent.modelPreferences.textModel) {
            updates.activeTextModel = agent.modelPreferences.textModel;
          }
          if (agent.modelPreferences.imageModel) {
            updates.activeImageModel = agent.modelPreferences.imageModel;
          }
          if (agent.modelPreferences.voiceModel) {
            updates.activeVoice = agent.modelPreferences.voiceModel;
          }
        }
        
        set(updates);
      },
      
      addAgent: (agent) => {
        // Generate a unique ID if one isn't provided
        const newAgent = {
          ...agent,
          id: agent.id || `agent-${Date.now()}`
        };
        set((state) => ({ agents: [...state.agents, newAgent] }));
        return newAgent;
      },
      
      updateAgent: (agentId, updates) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId ? { ...agent, ...updates } : agent
          ),
          activeAgent:
            state.activeAgent.id === agentId
              ? { ...state.activeAgent, ...updates }
              : state.activeAgent,
        })),
        
      deleteAgent: (agentId) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== agentId),
          activeAgent:
            state.activeAgent.id === agentId ? defaultAgent : state.activeAgent,
          // Reset selectedAgentId if the deleted agent was selected
          selectedAgentId: 
            state.selectedAgentId === agentId ? null : state.selectedAgentId,
        })),
        
      getActiveAgent: () => get().activeAgent,
      
      setAgentModelPreference: (agentId, modelType, modelId) => 
        set((state) => ({
          agents: state.agents.map((agent) => {
            if (agent.id === agentId) {
              // Create or update model preferences
              const modelPreferences = {
                ...agent.modelPreferences || {},
                [modelType]: modelId
              };
              
              return { ...agent, modelPreferences };
            }
            return agent;
          }),
          // If this affects the active agent, update the active model too
          ...(state.activeAgent.id === agentId ? {
            [modelType === 'textModel' ? 'activeTextModel' : 
             modelType === 'imageModel' ? 'activeImageModel' : 'activeVoice']: modelId
          } : {})
        })),
      
      setAgentSpokenResponses: (agentId, enableSpokenResponses) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === agentId ? { ...agent, enableSpokenResponses } : agent
          ),
          activeAgent:
            state.activeAgent.id === agentId
              ? { ...state.activeAgent, enableSpokenResponses }
              : state.activeAgent,
        })),
    }),
    {
      name: "settings-storage",
    }
  )
)