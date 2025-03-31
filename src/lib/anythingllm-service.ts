/**
 * AnythingLLM Service
 * 
 * This service handles the integration between the project system and AnythingLLM.
 * It provides methods for creating workspaces, uploading documents, and handling chat.
 */

import { supabase } from '@/lib/supabaseClient';
import AnythingLLMClient from './anythingllm-client';
import { ANYTHINGLLM_CONFIG } from './anythingllm-config';

// Create a global instance of the client
const anythingLLMClient = new AnythingLLMClient(
  ANYTHINGLLM_CONFIG.baseUrl,
  ANYTHINGLLM_CONFIG.apiKey
);

/**
 * Create an AnythingLLM workspace for a project
 * @param projectId The ID of the project
 * @param name The name of the workspace (usually the project name)
 * @returns The created workspace information
 */
export async function createWorkspaceForProject(projectId: string, name: string) {
  try {
    // Check if AnythingLLM integration is enabled
    if (!ANYTHINGLLM_CONFIG.isEnabled) {
      console.warn('AnythingLLM integration is not enabled');
      return null;
    }

    // Create the workspace in AnythingLLM
    const workspace = await anythingLLMClient.createWorkspace(name, {
      similarityThreshold: ANYTHINGLLM_CONFIG.similarity.threshold,
      openAiHistory: ANYTHINGLLM_CONFIG.history.messageCount
    });

    // Update the project with the workspace information
    const { data, error } = await supabase
      .from('projects')
      .update({
        anythingllm_workspace_id: workspace.id,
        anythingllm_workspace_slug: workspace.slug
      })
      .eq('id', projectId)
      .select('id, anythingllm_workspace_id, anythingllm_workspace_slug');

    if (error) {
      console.error('Error updating project with workspace info:', error);
      throw error;
    }

    console.log('Created AnythingLLM workspace for project:', {
      projectId,
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug
    });

    return {
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug
    };
  } catch (error) {
    console.error('Error creating AnythingLLM workspace:', error);
    throw error;
  }
}

/**
 * Upload a document to a project's AnythingLLM workspace
 * @param projectId The ID of the project
 * @param file The file to upload
 * @returns The upload result
 */
export async function uploadDocumentToProject(projectId: string, file: File) {
  try {
    // Check if AnythingLLM integration is enabled
    if (!ANYTHINGLLM_CONFIG.isEnabled) {
      console.warn('AnythingLLM integration is not enabled');
      return null;
    }

    // Get the project's AnythingLLM workspace slug
    const { data: project, error } = await supabase
      .from('projects')
      .select('anythingllm_workspace_slug')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error getting project workspace slug:', error);
      throw error;
    }

    if (!project?.anythingllm_workspace_slug) {
      throw new Error('Project does not have an AnythingLLM workspace');
    }

    // Upload the document to the workspace
    const result = await anythingLLMClient.uploadDocument(
      project.anythingllm_workspace_slug,
      file
    );

    console.log('Uploaded document to AnythingLLM workspace:', {
      projectId,
      workspaceSlug: project.anythingllm_workspace_slug,
      fileName: file.name
    });

    return result;
  } catch (error) {
    console.error('Error uploading document to AnythingLLM:', error);
    throw error;
  }
}

/**
 * Send a chat message to a project's AnythingLLM workspace
 * @param projectId The ID of the project
 * @param message The message to send
 * @param options Additional chat options
 * @returns The chat response
 */
export async function chatWithProject(projectId: string, message: string, options: {
  mode?: 'chat' | 'query';
} = {}) {
  try {
    // Check if AnythingLLM integration is enabled
    if (!ANYTHINGLLM_CONFIG.isEnabled) {
      console.warn('AnythingLLM integration is not enabled');
      return null;
    }

    // Get the project's AnythingLLM workspace slug
    const { data: project, error } = await supabase
      .from('projects')
      .select('anythingllm_workspace_slug')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error getting project workspace slug:', error);
      throw error;
    }

    if (!project?.anythingllm_workspace_slug) {
      throw new Error('Project does not have an AnythingLLM workspace');
    }

    // Send the chat message to the workspace
    const response = await anythingLLMClient.chat(
      project.anythingllm_workspace_slug,
      message,
      options
    );

    return response;
  } catch (error) {
    console.error('Error chatting with AnythingLLM:', error);
    throw error;
  }
}

/**
 * Stream a chat response from a project's AnythingLLM workspace
 * @param projectId The ID of the project
 * @param message The message to send
 * @param options Additional stream options
 * @returns The streaming response
 */
export async function streamChatWithProject(projectId: string, message: string, options: {
  mode?: 'chat' | 'query';
} = {}) {
  try {
    // Check if AnythingLLM integration is enabled
    if (!ANYTHINGLLM_CONFIG.isEnabled) {
      console.warn('AnythingLLM integration is not enabled');
      return null;
    }

    // Get the project's AnythingLLM workspace slug
    const { data: project, error } = await supabase
      .from('projects')
      .select('anythingllm_workspace_slug')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error getting project workspace slug:', error);
      throw error;
    }

    if (!project?.anythingllm_workspace_slug) {
      throw new Error('Project does not have an AnythingLLM workspace');
    }

    // Stream the chat response from the workspace
    const stream = await anythingLLMClient.streamChat(
      project.anythingllm_workspace_slug,
      message,
      options
    );

    return stream;
  } catch (error) {
    console.error('Error streaming chat with AnythingLLM:', error);
    throw error;
  }
}

/**
 * Check if AnythingLLM integration is available
 * @returns Whether the integration is available
 */
export async function isAnythingLLMAvailable() {
  if (!ANYTHINGLLM_CONFIG.isEnabled) {
    return false;
  }

  try {
    return await anythingLLMClient.validateApiKey();
  } catch (error) {
    console.error('Error validating AnythingLLM API key:', error);
    return false;
  }
}

/**
 * Delete a document from a project's AnythingLLM workspace
 * @param projectId The ID of the project
 * @param documentId The ID of the document in AnythingLLM
 * @returns Success status
 */
export async function deleteDocumentFromProject(projectId: string, documentId: string) {
  try {
    // Check if AnythingLLM integration is enabled
    if (!ANYTHINGLLM_CONFIG.isEnabled) {
      console.warn('AnythingLLM integration is not enabled');
      return null;
    }

    // Get the project's AnythingLLM workspace slug
    const { data: project, error } = await supabase
      .from('projects')
      .select('anythingllm_workspace_slug')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error getting project workspace slug:', error);
      throw error;
    }

    if (!project?.anythingllm_workspace_slug) {
      throw new Error('Project does not have an AnythingLLM workspace');
    }

    // Make a DELETE request to AnythingLLM API
    const url = `${ANYTHINGLLM_CONFIG.baseUrl}/v1/workspace/${project.anythingllm_workspace_slug}/document/${documentId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ANYTHINGLLM_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Document deletion failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    // Also update local database record
    await supabase
      .from('project_documents')
      .delete()
      .eq('anythingllm_doc_id', documentId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting document from AnythingLLM:', error);
    throw error;
  }
}

/**
 * Recover or recreate an AnythingLLM workspace for a project
 * @param projectId The ID of the project
 * @returns The created workspace information
 */
export async function recoverWorkspaceForProject(projectId: string) {
  try {
    // Check if AnythingLLM integration is enabled
    if (!ANYTHINGLLM_CONFIG.isEnabled) {
      console.warn('AnythingLLM integration is not enabled');
      return null;
    }

    // Get the project details
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error getting project details:', error);
      throw error;
    }

    // Check if the workspace still exists in AnythingLLM
    let workspaceExists = false;
    if (project.anythingllm_workspace_slug) {
      try {
        const response = await fetch(
          `${ANYTHINGLLM_CONFIG.baseUrl}/v1/workspace/${project.anythingllm_workspace_slug}`,
          {
            headers: {
              'Authorization': `Bearer ${ANYTHINGLLM_CONFIG.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        workspaceExists = response.ok;
      } catch (e) {
        console.error('Error checking workspace existence:', e);
        workspaceExists = false;
      }
    }

    // If workspace exists, return the existing info
    if (workspaceExists) {
      return {
        workspaceId: project.anythingllm_workspace_id,
        workspaceSlug: project.anythingllm_workspace_slug
      };
    }

    // Otherwise, create a new workspace
    const workspace = await anythingLLMClient.createWorkspace(project.name || `Project-${projectId}`, {
      similarityThreshold: ANYTHINGLLM_CONFIG.similarity.threshold,
      openAiHistory: ANYTHINGLLM_CONFIG.history.messageCount
    });

    // Update the project with the new workspace information
    const { data, error: updateError } = await supabase
      .from('projects')
      .update({
        anythingllm_workspace_id: workspace.id,
        anythingllm_workspace_slug: workspace.slug
      })
      .eq('id', projectId)
      .select('id, anythingllm_workspace_id, anythingllm_workspace_slug');

    if (updateError) {
      console.error('Error updating project with workspace info:', updateError);
      throw updateError;
    }

    console.log('Recovered AnythingLLM workspace for project:', {
      projectId,
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug
    });

    return {
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug
    };
  } catch (error) {
    console.error('Error recovering AnythingLLM workspace:', error);
    throw error;
  }
} 