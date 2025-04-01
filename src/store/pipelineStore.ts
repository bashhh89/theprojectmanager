import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateId } from '@/lib/utils'

export interface Pipeline {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

interface PipelineStore {
  pipelines: Pipeline[]
  currentPipelineId: string | null
  
  // Actions
  addPipeline: (name: string, description?: string) => Pipeline
  updatePipeline: (id: string, updates: Partial<Pipeline>) => void
  deletePipeline: (id: string) => void
  setCurrentPipeline: (id: string) => void
  getCurrentPipeline: () => Pipeline | undefined
}

// Default pipelines
const defaultPipelines: Pipeline[] = [
  {
    id: 'new',
    name: 'New',
    description: 'Newly created leads',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'contacted',
    name: 'Contacted',
    description: 'Leads that have been reached out to',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'qualified',
    name: 'Qualified',
    description: 'Leads that have been qualified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'converted',
    name: 'Converted',
    description: 'Successfully converted leads',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'closed',
    name: 'Closed',
    description: 'Closed leads (not converted)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set, get) => ({
      pipelines: defaultPipelines,
      currentPipelineId: defaultPipelines[0].id,
      
      addPipeline: (name, description) => {
        const newPipeline: Pipeline = {
          id: generateId(),
          name,
          description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set((state) => ({
          pipelines: [...state.pipelines, newPipeline],
        }))
        
        return newPipeline
      },
      
      updatePipeline: (id, updates) => {
        set((state) => ({
          pipelines: state.pipelines.map((pipeline) =>
            pipeline.id === id
              ? { ...pipeline, ...updates, updatedAt: new Date().toISOString() }
              : pipeline
          ),
        }))
      },
      
      deletePipeline: (id) => {
        const state = get()
        
        // Don't delete if it's the only pipeline or it's a default status
        if (state.pipelines.length <= 1 || defaultPipelines.some(p => p.id === id)) {
          return
        }
        
        set((state) => ({
          pipelines: state.pipelines.filter((pipeline) => pipeline.id !== id),
          currentPipelineId:
            state.currentPipelineId === id
              ? state.pipelines[0].id
              : state.currentPipelineId,
        }))
      },
      
      setCurrentPipeline: (id) => {
        set({ currentPipelineId: id })
      },
      
      getCurrentPipeline: () => {
        const { pipelines, currentPipelineId } = get()
        return pipelines.find((pipeline) => pipeline.id === currentPipelineId)
      },
    }),
    {
      name: 'pipeline-storage',
    }
  )
) 