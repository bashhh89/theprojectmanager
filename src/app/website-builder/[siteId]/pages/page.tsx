import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { logger } from '@/lib/utils';

interface PageManagerProps {
  params: { siteId: string };
}

// Fetch and display pages for the current site
const PageManagerPage = async ({ params }: PageManagerProps) => {
  const { siteId } = params;
  const supabase = await createClient();

  let pages: any[] = [];
  let fetchError: string | null = null;

  const { data, error } = await supabase
    .from('pages')
    .select('id, name, slug, is_homepage, created_at')
    .eq('website_id', siteId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error fetching pages', error, { context: 'website-builder-pages', data: { siteId } });
    fetchError = 'Could not fetch pages.';
  } else {
    pages = data || [];
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manage Pages</h2>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Page
        </Button>
      </div>

      {fetchError && (
        <p className="text-red-500 mb-4">{fetchError}</p>
      )}

      {!fetchError && pages.length === 0 ? (
        <p className="text-muted-foreground">This site has no pages yet.</p>
      ) : (
        <div className="border rounded">
          <ul className="divide-y">
            {pages.map(page => (
              <li key={page.id} className="p-3 flex justify-between items-center hover:bg-muted/50">
                <div>
                  <span className="font-medium">{page.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">({page.slug})</span>
                  {page.is_homepage && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      Homepage
                    </span>
                  )}
                </div>
                <div>
                  {/* TODO: Add Edit/Delete buttons later */}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/website-builder/${siteId}/editor/${page.id}`}>Edit Content</Link>
                  </Button>
                  {/* <Button variant="ghost" size="sm" className="ml-2 text-red-500 hover:text-red-600">
                    Delete
                  </Button> */}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PageManagerPage; 