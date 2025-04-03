import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();

  // Check for authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Get presentations auth error:', authError);
    // If you prefer not to return 401 for potentially public data access scenarios,
    // you might return an empty array or handle differently.
    // But for "My Presentations", unauthorized access should likely be an error.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch presentations for the logged-in user
    const { data: presentations, error: dbError } = await supabase
      .from('presentations')
      .select('*') // Select all columns, or specify needed ones like 'id, title, created_at, type'
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }); // Optional: order by creation date

    if (dbError) {
      console.error('Error fetching presentations from database:', dbError);
      return NextResponse.json({ error: 'Failed to fetch presentations', details: dbError.message }, { status: 500 });
    }

    // Return the fetched presentations (will be an empty array if none found)
    return NextResponse.json(presentations || [], { status: 200 });

  } catch (error) {
    console.error('Unexpected error fetching presentations:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
