import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LogLevel } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload = await request.json();
    const { level, message, context, data, userId = user?.id } = payload;
    
    // Validate required fields
    if (!level || !message) {
      return NextResponse.json({ error: 'Missing required fields: level, message' }, { status: 400 });
    }
    
    // Validate log level
    if (!Object.values(LogLevel).includes(level as LogLevel)) {
      return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
    }
    
    // Insert log into the database
    const { error } = await supabase.from('system_logs').insert({
      level,
      message,
      context,
      data,
      user_id: userId,
    });
    
    if (error) {
      console.error('Error storing log in database:', error);
      return NextResponse.json({ error: 'Failed to store log' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in logs API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 