import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// --- GET Handler (Fetch Single Presentation) ---
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const presentationId = params.id;
  const supabase = createClient();

  // Check for authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Get single presentation auth error:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!presentationId) {
    return NextResponse.json({ error: 'Presentation ID is required' }, { status: 400 });
  }

  try {
    const { data: presentation, error: dbError } = await supabase
      .from('presentations')
      .select('*') // Fetch all columns for the presentation
      .eq('id', presentationId)
      .eq('user_id', user.id) // Ensure the user owns this presentation
      .single(); // Expecting one result

    if (dbError) {
        console.error('Error fetching single presentation:', dbError);
        // Check if error is because row not found
        if (dbError.code === 'PGRST116') { 
             return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Failed to fetch presentation', details: dbError.message }, { status: 500 });
    }

    if (!presentation) {
        // This case might be redundant due to .single() throwing error if not found, but good for safety
        return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    return NextResponse.json(presentation, { status: 200 });

  } catch (error) {
    console.error('Unexpected error fetching single presentation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'An unexpected error occurred', details: errorMessage }, { status: 500 });
  }
}

// --- DELETE Handler (Existing) ---
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const presentationId = params.id;
  const supabase = createClient();

  // Check for authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Delete presentation auth error:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate presentationId (basic check)
  if (!presentationId) {
    return NextResponse.json({ error: 'Presentation ID is required' }, { status: 400 });
  }

  try {
    // Attempt to delete the presentation belonging to the user
    const { error: dbError, count } = await supabase
      .from('presentations')
      .delete()
      .match({ id: presentationId, user_id: user.id }); // Ensure user owns the presentation

    if (dbError) {
      console.error('Error deleting presentation from database:', dbError);
      return NextResponse.json({ error: 'Failed to delete presentation', details: dbError.message }, { status: 500 });
    }

    // Check if any row was actually deleted
    if (count === 0) {
      // This could mean the presentation didn't exist or the user didn't own it
      return NextResponse.json({ error: 'Presentation not found or you do not have permission to delete it' }, { status: 404 });
    }

    // Return success response
    return NextResponse.json({ message: 'Presentation deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error) {
    console.error('Unexpected error deleting presentation:', error);
    // Type assertion for potentially unknown error structure
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'An unexpected error occurred', details: errorMessage }, { status: 500 });
  }
}

// Optional: Add GET handler here if you want to fetch a single presentation by ID
// export async function GET(request: Request, { params }: { params: { id: string } }) { ... } 