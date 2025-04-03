import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient();

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get content versions
    const { data: versions, error: versionsError } = await supabase
      .from('content_versions')
      .select(`
        id,
        title,
        content,
        created_at,
        created_by,
        metadata
      `)
      .eq('content_id', params.id)
      .order('created_at', { ascending: false });

    if (versionsError) {
      console.error('Error fetching versions:', versionsError);
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      );
    }

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error in versions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { title, content, changeType, changeSummary } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new version
    const { data: version, error: versionError } = await supabase
      .from('content_versions')
      .insert({
        content_id: params.id,
        title,
        content,
        created_by: session.user.id,
        metadata: {
          change_type: changeType || 'update',
          change_summary: changeSummary
        }
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error creating version:', versionError);
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      );
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error('Error in versions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { versionId, title, content, changeType, changeSummary } = body;

    // Validate required fields
    if (!versionId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update version
    const { data: version, error: versionError } = await supabase
      .from('content_versions')
      .update({
        title,
        content,
        metadata: {
          change_type: changeType || 'update',
          change_summary: changeSummary
        }
      })
      .eq('id', versionId)
      .eq('created_by', session.user.id)
      .select()
      .single();

    if (versionError) {
      console.error('Error updating version:', versionError);
      return NextResponse.json(
        { error: 'Failed to update version' },
        { status: 500 }
      );
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error('Error in versions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get version ID from URL
    const url = new URL(request.url);
    const versionId = url.searchParams.get('versionId');

    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      );
    }

    // Delete version
    const { error: deleteError } = await supabase
      .from('content_versions')
      .delete()
      .eq('id', versionId)
      .eq('created_by', session.user.id);

    if (deleteError) {
      console.error('Error deleting version:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete version' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in versions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 