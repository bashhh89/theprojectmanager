'use server' // Mark this module as containing Server Actions

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createWebsite(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('User not authenticated', userError)
    // Redirect to login page instead of throwing an error
    redirect('/login?message=Authentication+required');
  }

  const newSiteName = formData.get('siteName')?.toString() || 'My New Site';

  let newWebsiteId: string | null = null;

  try {
    // Insert the new website
    const { data: newWebsiteData, error: insertError } = await supabase
      .from('websites')
      .insert({ user_id: user.id, name: newSiteName })
      .select('id')
      .single()

    if (insertError) throw insertError;
    if (!newWebsiteData?.id) throw new Error('Failed to create website or retrieve ID.');

    newWebsiteId = newWebsiteData.id;

    // Create a default homepage
    const { error: pageError } = await supabase
      .from('pages')
      .insert({ website_id: newWebsiteId, name: 'Home', slug: '/', is_homepage: true, content: { type: 'doc', content: [] } })

    if (pageError) {
      console.error('Error creating default homepage:', pageError);
      // If homepage creation fails, maybe we should delete the site record?
      // Or just proceed and let user create homepage manually? For now, log and proceed.
      // Consider adding error handling/feedback later.
    }

  } catch (error) {
    console.error('Website creation failed:', error);
    // Throw an error to stop execution and potentially show an error page
    throw new Error('Failed to create website. Please try again.');
  }

  // --- Success --- 
  // Revalidate the dashboard path 
  revalidatePath('/website-builder');
  // Redirect to the new site's editor page
  redirect(`/website-builder/${newWebsiteId}`);
}

export async function createPage(websiteId: string, formData: FormData) {
  'use server' // Can also mark individual functions

  const supabase = await createClient()

  const pageName = formData.get('pageName')?.toString()
  let pageSlug = formData.get('pageSlug')?.toString()

  if (!pageName || !pageSlug) {
    return { error: 'Page Name and Slug are required.' };
  }

  // Basic slug formatting (replace spaces, lowercase, ensure leading slash)
  pageSlug = '/' + pageSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (pageSlug === '/' && pageName.toLowerCase() !== 'home') {
    // Avoid using root slug unless it's the homepage
    pageSlug = '/' + pageName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  // Verify user owns the website (important check!)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Redirect to login page instead of returning an error
    redirect('/login?message=Authentication+required');
  }

  const { data: websiteOwner, error: ownerError } = await supabase
    .from('websites')
    .select('user_id')
    .eq('id', websiteId)
    .eq('user_id', user.id)
    .maybeSingle(); // Use maybeSingle in case siteId is invalid

  if (ownerError || !websiteOwner) {
     console.error('Authorization error or invalid site:', ownerError);
     return { error: 'Failed to verify website ownership.' };
  }

  try {
    const { error: insertError } = await supabase
      .from('pages')
      .insert({
        website_id: websiteId,
        name: pageName,
        slug: pageSlug,
        is_homepage: false, // New pages are not homepage by default
        content: { type: 'doc', content: [] } // Basic empty content
      })

    if (insertError) {
      console.error('Error inserting page:', insertError)
      // Check for unique constraint violation (slug already exists)
      if (insertError.code === '23505') { // PostgreSQL unique violation code
          return { error: `A page with the slug '${pageSlug}' already exists.` };
      }
      throw insertError // Re-throw other errors
    }

    // Revalidate the pages list for this specific site
    revalidatePath(`/website-builder/${websiteId}/pages`)
    return { success: true }; // Indicate success

  } catch (error) {
    console.error('Page creation failed:', error)
    return { error: 'Failed to create page. Please try again.' }
  }
} 