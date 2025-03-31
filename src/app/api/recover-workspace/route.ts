import { NextRequest, NextResponse } from 'next/server';
import { recoverWorkspaceForProject } from '@/lib/anythingllm-service';
import { supabase } from '@/lib/supabaseClient';

/**
 * API route to recover or recreate an AnythingLLM workspace for a project
 * POST /api/recover-workspace
 * Body: { projectId: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Get project ID from request body
    const { projectId } = await req.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
      
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }
    
    // Recover the workspace
    const workspaceInfo = await recoverWorkspaceForProject(projectId);
    
    return NextResponse.json({ 
      success: true,
      workspace: workspaceInfo
    });
  } catch (error: any) {
    console.error('Error recovering workspace:', error);
    return NextResponse.json({ 
      error: `Failed to recover workspace: ${error.message}` 
    }, { status: 500 });
  }
} 