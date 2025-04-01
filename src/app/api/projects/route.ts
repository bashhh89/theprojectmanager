import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Server-side function to get user from cookie
async function getUserFromRequest(req: Request) {
  const cookieStore = cookies();
  
  // Create a server client using the same credentials as the client
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdbnkgicweyfixbhfcgx.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYm5rZ2ljd2V5Zml4YmhmY2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjYyMjQsImV4cCI6MjA1ODcwMjIyNH0.lPLD1le6i0Y64x_uXyMndUqMKQ2XEyIUn0sEvfL5KNk',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Get the user session
  const { data } = await supabaseServer.auth.getUser();
  return data.user;
}

export async function POST(req: Request) {
  try {
    // Get current user
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    console.log('Project creation request body:', body);

    // Basic validation
    if (!body.name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Create the project with transaction-like approach
    // First create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          name: body.name,
          title: body.title || body.name,
          description: body.description || '',
          type: body.type || 'default',
          status: body.status || 'active',
          objectives: body.objectives || [],
          timeline: body.timeline || '',
          branding: body.branding || {},
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project', details: projectError.message },
        { status: 500 }
      );
    }

    // Then create the project member entry
    const { error: memberError } = await supabase
      .from('project_members')
      .insert([
        {
          project_id: project.id,
          user_id: user.id,
          role: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (memberError) {
      console.error('Error adding project member:', memberError);
      
      // If adding member fails, delete the project to ensure consistency
      await supabase.from('projects').delete().eq('id', project.id);
      
      return NextResponse.json(
        { error: 'Failed to setup project permissions', details: memberError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Project created successfully',
      project: project
    });
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get current user
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all projects the user is a member of
    const { data: projectMemberships, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);

    if (membershipError) {
      console.error('Error fetching project memberships:', membershipError);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: membershipError.message },
        { status: 500 }
      );
    }

    // If no memberships, return empty array
    if (!projectMemberships || projectMemberships.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    // Get the project IDs
    const projectIds = projectMemberships.map(membership => membership.project_id);

    // Fetch the actual projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: projectsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 