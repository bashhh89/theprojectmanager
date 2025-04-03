import { supabase } from '@/lib/supabaseClient';

export interface Content {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  metadata: {
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    analytics?: {
      views?: number;
      engagement?: number;
    };
  };
}

export interface CreateContentInput {
  title: string;
  content: string;
  status?: 'draft' | 'published';
  metadata?: Content['metadata'];
}

export interface UpdateContentInput extends Partial<CreateContentInput> {
  id: string;
}

export class ContentService {
  static async create(input: CreateContentInput): Promise<Content> {
    const { data, error } = await supabase
      .from('content')
      .insert([{
        ...input,
        status: input.status || 'draft',
        metadata: input.metadata || {}
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(input: UpdateContentInput): Promise<Content> {
    const { id, ...updateData } = input;
    const { data, error } = await supabase
      .from('content')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getById(id: string): Promise<Content> {
    const { data, error } = await supabase
      .from('content')
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async list(options: {
    status?: 'draft' | 'published';
    limit?: number;
    offset?: number;
  } = {}): Promise<Content[]> {
    let query = supabase
      .from('content')
      .select()
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  static async updateMetadata(id: string, metadata: Content['metadata']): Promise<Content> {
    const { data, error } = await supabase
      .from('content')
      .update({ metadata })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async publish(id: string): Promise<Content> {
    const { data, error } = await supabase
      .from('content')
      .update({ status: 'published' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async unpublish(id: string): Promise<Content> {
    const { data, error } = await supabase
      .from('content')
      .update({ status: 'draft' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 