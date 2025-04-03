import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  // const cookieStore = cookies(); // No longer needed here
  const supabase = createClient(); // Call without arguments

  // Check for authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Save presentation auth error:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let presentationData;
  try {
    presentationData = await request.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { title, type, slides, brandProfile } = presentationData;

  // Validate required fields
  if (!title || !type || !slides || !Array.isArray(slides)) {
    return NextResponse.json({ error: 'Missing required fields: title, type, and slides array are required.' }, { status: 400 });
  }

  try {
    // Prepare data for insertion
    const dataToInsert = {
      user_id: user.id,
      title: title,
      presentation_type: type,
      slides: slides,
      brand_profile: brandProfile || null,
      // created_at is handled by the database default
    };

    const { data, error: dbError } = await supabase
      .from('presentations')
      .insert([dataToInsert])
      .select() // Return the inserted row
      .single(); // Expecting a single row back

    if (dbError) {
      console.error('Error saving presentation to database:', dbError);
      return NextResponse.json({ error: 'Failed to save presentation', details: dbError.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 }); // Return the created presentation

  } catch (error) {
    console.error('Unexpected error saving presentation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 