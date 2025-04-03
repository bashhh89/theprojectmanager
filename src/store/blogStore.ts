import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageType: 'url' | 'generate';
  author: string;
  publishDate: string;
  status: 'draft' | 'published';
  categories: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface BlogStore {
  posts: BlogPost[];
  isInitialized: boolean;
  isSaving: boolean;
  initialize: () => Promise<void>;
  getPost: (id: string) => BlogPost | undefined;
  createPost: (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>, user: any) => Promise<string>;
  updatePost: (id: string, post: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

export const useBlogStore = create<BlogStore>((set, get) => ({
  posts: [],
  isInitialized: false,
  isSaving: false,

  initialize: async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      set({ posts: data || [], isInitialized: true });
    } catch (error) {
      console.error('Error initializing blog store:', error);
      set({ isInitialized: true });
    }
  },

  getPost: (id) => {
    return get().posts.find(post => post.id === id);
  },

  createPost: async (post, user) => {
    set({ isSaving: true });
    try {
      const newPost = {
        ...post,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: user?.user_metadata?.full_name || 'AI Assistant'
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([newPost])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        posts: [data, ...state.posts],
        isSaving: false
      }));

      return data.id;
    } catch (error) {
      set({ isSaving: false });
      throw error;
    }
  },

  updatePost: async (id, post) => {
    set({ isSaving: true });
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          ...post,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        posts: state.posts.map(p => p.id === id ? { ...p, ...post } : p),
        isSaving: false
      }));
    } catch (error) {
      set({ isSaving: false });
      throw error;
    }
  },

  deletePost: async (id) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        posts: state.posts.filter(p => p.id !== id)
      }));
    } catch (error) {
      throw error;
    }
  }
})); 