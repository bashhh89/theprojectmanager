import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabaseClient';

// Define the proposal slide data structure
export interface ProposalSection {
  title: string;
  content: string;
  layout?: 'full-width' | 'two-column' | 'image-left' | 'image-right' | 'centered';
  imageUrl?: string;
}

// Define proposal status types
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';

// Define the proposal data structure
export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  clientLogo?: string;
  sections: ProposalSection[];
  brandProfile?: any;
  shareId?: string;
  shareExpiry?: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

// Define the proposal store interface
interface ProposalStore {
  proposals: Proposal[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  fetchProposals: () => Promise<void>;
  createProposal: (data: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProposal: (id: string, data: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  
  // Sharing
  generateShareLink: (proposalId: string, expiryHours?: number) => Promise<string>;
}

// Create the proposal store
export const useProposalStore = create<ProposalStore>((set, get) => ({
  proposals: [],
  isLoading: false,
  error: null,
  
  // Fetch proposals from database
  fetchProposals: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Fetch proposals for the current user
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform database records to match our Proposal interface
      const transformedProposals = data.map(item => ({
        id: item.id,
        title: item.title,
        clientName: item.client_name,
        clientLogo: item.client_logo,
        sections: item.sections || [],
        brandProfile: item.brand_profile,
        shareId: item.share_id,
        shareExpiry: item.share_expiry,
        status: item.status || 'draft',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      set({ proposals: transformedProposals, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching proposals:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  // Create a new proposal
  createProposal: async (proposalData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Transform proposal data for database
      const dbProposal = {
        title: proposalData.title,
        client_name: proposalData.clientName,
        client_logo: proposalData.clientLogo,
        sections: proposalData.sections,
        brand_profile: proposalData.brandProfile,
        share_id: proposalData.shareId,
        share_expiry: proposalData.shareExpiry,
        status: proposalData.status || 'draft',
        user_id: user.id
      };
      
      // Insert proposal into database
      const { data, error } = await supabase
        .from('proposals')
        .insert([dbProposal])
        .select()
        .single();
      
      if (error) throw error;
      
      if (!data) {
        throw new Error('Failed to create proposal');
      }
      
      // Transform database record to match our Proposal interface
      const newProposal: Proposal = {
        id: data.id,
        title: data.title,
        clientName: data.client_name,
        clientLogo: data.client_logo,
        sections: data.sections || [],
        brandProfile: data.brand_profile,
        shareId: data.share_id,
        shareExpiry: data.share_expiry,
        status: data.status || 'draft',
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      // Update local state
      set(state => ({ 
        proposals: [newProposal, ...state.proposals],
        isLoading: false 
      }));
      
      return data.id;
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  // Update an existing proposal
  updateProposal: async (id, proposalData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Build update object from proposalData, transforming to snake_case for DB
      const updates: Record<string, any> = {};
      
      if (proposalData.title !== undefined) updates.title = proposalData.title;
      if (proposalData.clientName !== undefined) updates.client_name = proposalData.clientName;
      if (proposalData.clientLogo !== undefined) updates.client_logo = proposalData.clientLogo;
      if (proposalData.sections !== undefined) updates.sections = proposalData.sections;
      if (proposalData.brandProfile !== undefined) updates.brand_profile = proposalData.brandProfile;
      if (proposalData.status !== undefined) updates.status = proposalData.status;
      
      // Update proposal in database
      const { error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      const { proposals } = get();
      const updatedProposals = proposals.map(proposal => 
        proposal.id === id
          ? { ...proposal, ...proposalData, updatedAt: new Date().toISOString() }
          : proposal
      );
      
      set({ proposals: updatedProposals, isLoading: false });
    } catch (error: any) {
      console.error('Error updating proposal:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  // Delete a proposal
  deleteProposal: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Delete proposal from database
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      const { proposals } = get();
      set({ 
        proposals: proposals.filter(proposal => proposal.id !== id),
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  // Generate a share link for a proposal
  generateShareLink: async (proposalId, expiryHours = 24) => {
    try {
      const shareId = nanoid();
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + expiryHours);
      
      // Update proposal with share details
      const { error } = await supabase
        .from('proposals')
        .update({
          share_id: shareId,
          share_expiry: expiryDate.toISOString(),
          status: 'sent' // Update status when shared
        })
        .eq('id', proposalId);
      
      if (error) throw error;
      
      // Update local state
      const { proposals } = get();
      const updatedProposals = proposals.map(p => 
        p.id === proposalId 
          ? { 
              ...p, 
              shareId, 
              shareExpiry: expiryDate.toISOString(),
              status: 'sent' as ProposalStatus
            } 
          : p
      );
      
      set({ proposals: updatedProposals });
      
      // Return the share link
      return `${window.location.origin}/shared-proposal/${shareId}`;
    } catch (error: any) {
      console.error('Error generating share link:', error);
      throw new Error('Failed to generate share link');
    }
  }
})); 