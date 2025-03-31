import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface ProjectMembersStatus {
  exists: boolean;
  error: string | null;
  hasInviteAcceptedColumn: boolean;
  structure: Record<string, unknown>;
}

export async function GET() {
  try {
    // Test basic Supabase connection with projects table
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (projectsError) {
      console.error('Supabase connection error (projects):', projectsError);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed', 
          error: projectsError.message,
          details: projectsError.details 
        }, 
        { status: 500 }
      );
    }

    // Test project_members table access
    const projectMembersStatus: ProjectMembersStatus = {
      exists: false,
      error: null,
      hasInviteAcceptedColumn: false,
      structure: {}
    };

    // First test if the table exists by attempting to query it
    const { data: membersData, error: membersError } = await supabase
      .from('project_members')
      .select('id')
      .limit(1);

    projectMembersStatus.exists = !membersError;
    
    if (membersError) {
      projectMembersStatus.error = membersError.message;
    } else {
      // Now try to specifically query the invite_accepted column
      const { data: inviteData, error: inviteError } = await supabase
        .from('project_members')
        .select('invite_accepted')
        .limit(1);
      
      projectMembersStatus.hasInviteAcceptedColumn = !inviteError;
      
      if (inviteError) {
        projectMembersStatus.error = inviteError.message;
      }
    }

    // Return detailed health check results
    return NextResponse.json({ 
      status: 'ok',
      message: 'System is healthy',
      database: 'connected',
      tables: {
        projects: {
          exists: !projectsError,
          count: projectsData?.[0]?.count || 0
        },
        project_members: projectMembersStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check error:', err);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed', 
        error: err instanceof Error ? err.message : String(err) 
      }, 
      { status: 500 }
    );
  }
} 