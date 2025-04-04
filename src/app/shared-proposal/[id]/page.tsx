'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

// Define the shape of the proposal data
interface ProposalData {
  id: string;
  title: string;
  client_name: string;
  client_logo?: string | null;
  sections: {
    title: string;
    content: string;
    layout?: string;
    imageUrl?: string;
  }[];
  brand_profile?: any;
  status: string;
  created_at: string;
}

export default function SharedProposalPage() {
  const params = useParams();
  const shareId = params.id as string;
  
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch proposal by share ID
  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setIsLoading(true);
        
        if (!shareId) {
          throw new Error('Share ID is required');
        }
        
        // Fetch proposal by share ID
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('share_id', shareId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Proposal not found');
        }
        
        // Check if share link has expired
        if (data.share_expiry && new Date(data.share_expiry) < new Date()) {
          throw new Error('This shared link has expired');
        }
        
        // Update proposal status to 'viewed' if it's currently 'sent'
        if (data.status === 'sent') {
          await supabase
            .from('proposals')
            .update({ status: 'viewed' })
            .eq('id', data.id);
        }
        
        // Set the proposal data
        setProposal(data as ProposalData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching proposal:', err);
        setError(err.message || 'Failed to load proposal');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProposal();
  }, [shareId]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-muted-foreground mb-6" />
        <p className="text-muted-foreground">Loading proposal...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <Card>
            <CardHeader className="flex flex-col items-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <CardTitle>Unable to Load Proposal</CardTitle>
              <CardDescription className="text-center">
                {error}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button variant="outline" asChild>
                <a href="/">Return to Dashboard</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  // Render proposal content
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with proposal title and client logo */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{proposal?.title}</h1>
          <p className="text-xl text-muted-foreground">Prepared for {proposal?.client_name}</p>
        </div>
        
        {proposal?.client_logo && (
          <div className="flex-shrink-0 h-20 w-48 relative">
            <Image 
              src={proposal.client_logo}
              alt={`${proposal.client_name} logo`}
              fill
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          </div>
        )}
      </header>
      
      {/* Proposal sections */}
      <div className="space-y-12">
        {proposal?.sections.map((section, index) => {
          // Determine the layout component to use
          const layoutClass = getLayoutClass(section.layout || 'full-width');
          
          return (
            <section key={index} className="border-b pb-12 last:border-b-0">
              <h2 className="text-2xl font-semibold mb-6">{section.title}</h2>
              
              <div className={layoutClass}>
                {/* Content */}
                <div className="prose max-w-none dark:prose-invert">
                  {section.content.split('\n').map((paragraph, pIndex) => (
                    paragraph.trim() ? (
                      <p key={pIndex}>{paragraph}</p>
                    ) : (
                      <br key={pIndex} />
                    )
                  ))}
                </div>
                
                {/* Image if applicable */}
                {section.imageUrl && (section.layout === 'image-left' || section.layout === 'image-right') && (
                  <div className="relative h-64 md:h-auto">
                    <Image
                      src={section.imageUrl}
                      alt={section.title}
                      fill
                      className="rounded-lg object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      
      {/* Footer with company info based on brand profile */}
      <footer className="mt-16 border-t pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-medium mb-2">Contact Us</h3>
            {proposal?.brand_profile?.contactInfo?.email && (
              <p className="text-sm">Email: {proposal.brand_profile.contactInfo.email}</p>
            )}
            {proposal?.brand_profile?.contactInfo?.phone && (
              <p className="text-sm">Phone: {proposal.brand_profile.contactInfo.phone}</p>
            )}
          </div>
          
          {proposal?.brand_profile?.contactInfo?.website && (
            <div>
              <h3 className="font-medium mb-2">Website</h3>
              <p className="text-sm flex items-center">
                <a href={proposal.brand_profile.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center hover:underline">
                  {proposal.brand_profile.contactInfo.website}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </div>
          )}
          
          <div className="text-right hidden md:block">
            <p className="text-sm text-muted-foreground">
              Generated on {new Date(proposal?.created_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper function to get layout classes
function getLayoutClass(layout: string): string {
  switch (layout) {
    case 'full-width':
      return '';
    case 'two-column':
      return 'grid grid-cols-1 md:grid-cols-2 gap-8';
    case 'image-left':
      return 'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12';
    case 'image-right':
      return 'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12';
    case 'centered':
      return 'max-w-2xl mx-auto text-center';
    default:
      return '';
  }
} 