import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const cookieStore = cookies(); // Get cookies here

  // Create Supabase client directly in the handler
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStore; // Await here
          return store.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const store = await cookieStore; // Await here
          try {
            store.set({ name, value, ...options });
          } catch (error) {
            // Log error, maybe client disconnected?
            console.error('Error setting cookie:', name, error);
          }
        },
        async remove(name: string, options: CookieOptions) {
          const store = await cookieStore; // Await here
          try {
            store.set({ name, value: '', ...options });
          } catch (error) {
             console.error('Error removing cookie:', name, error);
          }
        },
      },
    }
  );

  // Get user using the created client
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Auth error:', userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('User authenticated:', user.id);

  try {
    const { 
      topic, 
      markdown, 
      theme, 
      ai_provider, 
      ai_model 
    } = await req.json();

    // Basic validation
    if (!topic || !markdown || !theme || !ai_provider || !ai_model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a simple title (can be refined later)
    const title = topic.substring(0, 50) + (topic.length > 50 ? '...' : '');

    console.log(`Attempting to save presentation for user ${user.id}`);

    const { data, error: insertError } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        title,
        topic,
        markdown,
        theme,
        ai_provider,
        ai_model,
      })
      .select('id') // Select the ID of the newly created row
      .single(); // Expect only one row back

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw new Error(insertError.message); // Throw error for catch block
    }

    if (!data || !data.id) {
      throw new Error('Failed to retrieve presentation ID after insert');
    }

    console.log(`Presentation saved with ID: ${data.id} for user ${user.id}`);

    // Return the ID of the saved presentation
    return NextResponse.json({ id: data.id, message: 'Presentation saved successfully' });

  } catch (error: any) {
    console.error('Save presentation API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save presentation',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 