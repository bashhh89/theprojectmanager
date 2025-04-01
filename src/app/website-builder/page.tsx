import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server'; // Import server client
import { cookies } from 'next/headers'; // Needed for server client
import { createWebsite } from './actions'; // Import the Server Action

// Make the component async to allow server-side data fetching
const WebsiteBuilderDashboardPage = async () => {
  const cookieStore = cookies(); // Required for createClient
  const supabase = createClient(); // Initialize server client

  // Fetch user data
  const { data: { user } } = await supabase.auth.getUser();

  let websites: any[] = [];
  let fetchError: string | null = null;

  if (user) {
    // Fetch websites belonging to the current user
    const { data, error } = await supabase
      .from('websites')
      .select('id, name, created_at') // Select desired columns
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching websites:', error);
      fetchError = 'Could not fetch websites. Please try again.';
    } else {
      websites = data || [];
    }
  } else {
    fetchError = 'Please log in to view your websites.';
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Websites</h2>
        <form action={createWebsite}>
          <Button type="submit">Create New Site</Button>
        </form>
      </div>
      
      {fetchError && (
        <p className="text-red-500 mb-4">{fetchError}</p>
      )}

      {!fetchError && websites.length === 0 ? (
        <p className="text-muted-foreground">You haven't created any websites yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map(site => (
            <div key={site.id} className="border rounded p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-medium mb-1">{site.name || 'Untitled Site'}</h3>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(site.created_at).toLocaleDateString()}
                </p>
                {/* TODO: Add site preview image or other details */}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                 <Link href={`/website-builder/${site.id}`}>Edit Site</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebsiteBuilderDashboardPage; 