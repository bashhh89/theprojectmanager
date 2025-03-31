import { supabase } from '@/lib/supabaseClient';

export interface GeneratedImageData {
  id?: string;
  user_id: string;
  prompt: string;
  image_url: string;
  project_id?: string;
  task_id?: string;
  created_at?: string;
}

export interface GeneratedAudioData {
  id?: string;
  user_id: string;
  text: string;
  audio_url: string;
  project_id?: string;
  task_id?: string;
  created_at?: string;
}

/**
 * Save a generated image to the database
 */
export async function saveGeneratedImage(imageData: GeneratedImageData) {
  try {
    const { data, error } = await supabase
      .from('generated_images')
      .insert([imageData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error saving generated image:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save a generated audio to the database
 */
export async function saveGeneratedAudio(audioData: GeneratedAudioData) {
  try {
    const { data, error } = await supabase
      .from('generated_audio')
      .insert([audioData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error saving generated audio:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all generated images for a user
 */
export async function getUserGeneratedImages(userId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_images')
      .select(`
        *,
        projects:project_id (id, title),
        tasks:task_id (id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching generated images:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all generated audio for a user
 */
export async function getUserGeneratedAudio(userId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_audio')
      .select(`
        *,
        projects:project_id (id, title),
        tasks:task_id (id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching generated audio:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get generated images for a specific project
 */
export async function getProjectGeneratedImages(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching project generated images:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get generated audio for a specific project
 */
export async function getProjectGeneratedAudio(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_audio')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching project generated audio:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get generated images for a specific task
 */
export async function getTaskGeneratedImages(taskId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching task generated images:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get generated audio for a specific task
 */
export async function getTaskGeneratedAudio(taskId: string) {
  try {
    const { data, error } = await supabase
      .from('generated_audio')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching task generated audio:', error);
    return { success: false, error: error.message };
  }
} 