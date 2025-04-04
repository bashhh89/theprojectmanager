import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';
import { nanoid } from 'nanoid';

export interface SlideData {
  title: string;
  content: string;
  layout: 'background' | 'split-left' | 'split-right' | 'text-only';
  imagePrompt?: string;
  image?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headingFont?: string;
  style?: string;
}

export interface Presentation {
  id: string;
  title: string;
  type: 'general' | 'proposal';
  slides: SlideData[];
  brandProfile?: any;
  shareId?: string;
  shareExpiry?: string;
  slideCount: number;
  contentLength: 'short' | 'medium' | 'long';
  createdAt: string;
  updatedAt: string;
}

interface PresentationStore {
  presentations: Presentation[];
  isLoading: boolean;
  error: string | null;
  fetchPresentations: () => Promise<void>;
  createPresentation: (data: Omit<Presentation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePresentation: (id: string, data: Partial<Presentation>) => Promise<void>;
  deletePresentation: (id: string) => Promise<void>;
  generateShareLink: (presentationId: string, expiryHours?: number) => Promise<string>;
}

export const usePresentationStore = create<PresentationStore>((set, get) => ({
  presentations: [],
  isLoading: false,
  error: null,

  fetchPresentations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: presentations, error } = await supabase
        .from('presentations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ presentations: presentations || [], isLoading: false });
    } catch (error: any) {
      console.error('Error fetching presentations:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  createPresentation: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: presentation, error } = await supabase
        .from('presentations')
        .insert([{
          title: data.title,
          type: data.type,
          slides: data.slides,
          brand_profile: data.brandProfile,
          slide_count: data.slideCount,
          content_length: data.contentLength,
        }])
        .select()
        .single();

      if (error) throw error;
      if (!presentation) throw new Error('Failed to create presentation');

      // Update local state
      const { presentations } = get();
      set({ 
        presentations: [presentation, ...presentations],
        isLoading: false 
      });

      return presentation.id;
    } catch (error: any) {
      console.error('Error creating presentation:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updatePresentation: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('presentations')
        .update({
          title: data.title,
          type: data.type,
          slides: data.slides,
          brand_profile: data.brandProfile,
          slide_count: data.slideCount,
          content_length: data.contentLength,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const { presentations } = get();
      const updatedPresentations = presentations.map(p => 
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      );
      set({ presentations: updatedPresentations, isLoading: false });
    } catch (error: any) {
      console.error('Error updating presentation:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deletePresentation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('presentations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const { presentations } = get();
      set({ 
        presentations: presentations.filter(p => p.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error deleting presentation:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  generateShareLink: async (presentationId, expiryHours = 24) => {
    try {
      const shareId = nanoid();
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + expiryHours);

      const { error } = await supabase
        .from('presentations')
        .update({
          share_id: shareId,
          share_expiry: expiryDate.toISOString(),
        })
        .eq('id', presentationId);

      if (error) throw error;

      // Update local state
      const { presentations } = get();
      const updatedPresentations = presentations.map(p => 
        p.id === presentationId 
          ? { ...p, shareId, shareExpiry: expiryDate.toISOString() } 
          : p
      );
      set({ presentations: updatedPresentations });

      // Return the share link
      return `${window.location.origin}/shared/${shareId}`;
    } catch (error: any) {
      console.error('Error generating share link:', error);
      throw new Error('Failed to generate share link');
    }
  },
})); 