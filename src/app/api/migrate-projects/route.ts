import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/authUtils';

// This is an admin-only endpoint to migrate existing projects to the project_members table
export async function POST() {
  try {
    // Get current user and ensure they're authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Not authenticated' 
      }, { status: 401 });
    }

    // Get user's email to check if they're an admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = profileData?.is_admin === true;
    
    if (!isAdmin) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Unauthorized - Admin access required' 
      }, { status: 403 });
    }

    // Check if the project_members table has the invite_accepted column
    const { data: columnCheckData, error: columnCheckError } = await supabase
      .from('project_members')
      .select('invite_accepted')
      .limit(1)
      .maybeSingle();

    const hasInviteAccepted = !columnCheckError;

    // Prepare the SQL statement based on the presence of invite_accepted column
    let sql;
    
    if (hasInviteAccepted) {
      sql = `
        INSERT INTO project_members (
          project_id,
          user_id,
          role,
          invite_accepted,
          created_at,
          updated_at
        )
        SELECT 
          id as project_id,
          user_id,
          'owner' as role,
          TRUE as invite_accepted,
          now() as created_at,
          now() as updated_at
        FROM 
          projects p
        WHERE 
          NOT EXISTS (
            SELECT 1 FROM project_members pm 
            WHERE pm.project_id = p.id AND pm.user_id = p.user_id
          )
        RETURNING project_id, user_id
      `;
    } else {
      sql = `
        INSERT INTO project_members (
          project_id,
          user_id,
          role,
          created_at,
          updated_at
        )
        SELECT 
          id as project_id,
          user_id,
          'owner' as role,
          now() as created_at,
          now() as updated_at
        FROM 
          projects p
        WHERE 
          NOT EXISTS (
            SELECT 1 FROM project_members pm 
            WHERE pm.project_id = p.id AND pm.user_id = p.user_id
          )
        RETURNING project_id, user_id
      `;
    }

    // Execute the SQL to migrate projects
    const { data: migrationData, error: migrationError } = await supabase.rpc('execute_sql', { sql_query: sql });

    if (migrationError) {
      console.error('Migration error:', migrationError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Migration failed',
        error: migrationError.message,
        details: migrationError.details
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Migration completed successfully',
      data: migrationData || [],
      schema: {
        hasInviteAccepted
      }
    });

  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Migration failed',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
} 