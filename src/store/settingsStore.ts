import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Define the default agent
const defaultAgent = {
  id: "default-agent",
  name: "Default Assistant",
  systemPrompt: "You are a helpful AI assistant.",
  system_prompt: "You are a helpful AI assistant.",
  modelPreferences: {
    textModel: "google-gemini-pro",
    imageModel: "flux",
    voiceModel: "alloy"
  }
}

// Define the default agents list
export const defaultAgents = [defaultAgent]

export interface Agent {
  id: string
  name: string
  systemPrompt: string
  system_prompt: string
  description?: string
  modelPreferences?: {
    textModel?: string
    imageModel?: string
    voiceModel?: string
  }
  enableSpokenResponses?: boolean
}

interface SettingsState {
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
  activeTextModel: string
  setActiveTextModel: (model: string) => void
  activeImageModel: string
  setActiveImageModel: (model: string) => void
  activeVoice: string
  setActiveVoice: (voice: string) => void
  activeAgent: Agent | null
  setActiveAgent: (agent: Agent | null) => void
  agents: Agent[]
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, agent: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  setAgentModelPreference: (agentId: string, type: 'textModel' | 'imageModel' | 'voiceModel', value: string) => void
  selectedAgentId: string | null
  setSelectedAgentId: (id: string | null) => void
  agentSpokenResponses: boolean
  setAgentSpokenResponses: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: true,
      setDarkMode: (darkMode) => set({ darkMode }),
      
      // Initialize with default values
      activeTextModel: "google-gemini-pro",
      setActiveTextModel: (model) => set({ activeTextModel: model }),
      
      activeImageModel: "flux",
      setActiveImageModel: (model) => set({ activeImageModel: model }),
      
      activeVoice: "alloy",
      setActiveVoice: (voice) => set({ activeVoice: voice }),
      
      activeAgent: defaultAgent,
      setActiveAgent: (agent) => {
        if (!agent) {
          set({ activeAgent: null });
          return;
        }

        const updates: any = { activeAgent: agent };

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
      
      agents: defaultAgents,
      addAgent: (agent) => set((state) => ({
        agents: [...state.agents, agent]
      })),
      
      updateAgent: (id, updates) => set((state) => ({
        agents: state.agents.map(agent =>
          agent.id === id ? { ...agent, ...updates } : agent
        ),
        activeAgent:
          state.activeAgent?.id === id
            ? { ...state.activeAgent, ...updates }
            : state.activeAgent,
      })),
      
      deleteAgent: (id) => set((state) => ({
        agents: state.agents.filter(agent => agent.id !== id),
        activeAgent:
          state.activeAgent?.id === id ? defaultAgent : state.activeAgent,
        selectedAgentId:
          state.selectedAgentId === id ? null : state.selectedAgentId,
      })),
      
      setAgentModelPreference: (agentId, modelType, modelId) =>
        set((state) => ({
          agents: state.agents.map((agent) => {
            if (agent.id === agentId) {
              const modelPreferences = {
                ...agent.modelPreferences || {},
                [modelType]: modelId
              };

              return { ...agent, modelPreferences };
            }
            return agent;
          }),
          ...(state.activeAgent?.id === agentId ? {
            [modelType === "textModel" ? "activeTextModel" :
             modelType === "imageModel" ? "activeImageModel" : "activeVoice"]: modelId
          } : {})
        })),
      
      selectedAgentId: null,
      setSelectedAgentId: (id) => set({ selectedAgentId: id }),
      
      agentSpokenResponses: false,
      setAgentSpokenResponses: (enabled) => set({ agentSpokenResponses: enabled }),
    }),
    {
      name: 'settings-storage',
    }
  )
) 