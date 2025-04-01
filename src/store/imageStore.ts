import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  createdAt: string
  projectId?: string
  tags?: string[]
}

interface ImageState {
  images: GeneratedImage[]
  addImage: (image: Omit<GeneratedImage, 'id' | 'createdAt'>) => void
  deleteImage: (id: string) => void
  getProjectImages: (projectId: string) => GeneratedImage[]
  getAllImages: () => GeneratedImage[]
  getRecentImages: (limit?: number) => GeneratedImage[]
  clearImages: () => void
}

export const useImageStore = create<ImageState>()(
  persist(
    (set, get) => ({
      images: [],
      
      addImage: (image) => set((state) => ({
        images: [{
          ...image,
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }, ...state.images]
      })),
      
      deleteImage: (id) => set((state) => ({
        images: state.images.filter((img) => img.id !== id)
      })),
      
      getProjectImages: (projectId) => {
        const state = get()
        return state.images.filter((img) => img.projectId === projectId)
      },
      
      getAllImages: () => {
        const state = get()
        return state.images
      },
      
      getRecentImages: (limit = 10) => {
        const state = get()
        return state.images.slice(0, limit)
      },
      
      clearImages: () => set({ images: [] }),
    }),
    {
      name: 'image-storage',
    }
  )
) 