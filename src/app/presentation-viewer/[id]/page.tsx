'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import RevealPresentation from '@/components/presentation/RevealPresentation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface PresentationData {
  id: string;
  title: string;
  type: string;
  slides: any[];
  brand_profile?: any | null;
  created_at: string;
}

export default function ViewPresentationPage() {
  const params = useParams();
  const presentationId = params?.id as string | undefined;

  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!presentationId) {
      setError('No presentation ID provided.');
      setIsLoading(false);
      return;
    }

    const fetchPresentation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('presentations')
          .select('*')
          .eq('id', presentationId)
          .single();
          
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Presentation not found');
        
        setPresentation(data);
      } catch (err: any) {
        console.error("Failed to fetch presentation:", err);
        setError(err.message || 'An unknown error occurred while fetching the presentation.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresentation();
  }, [presentationId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading presentation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Error Loading Presentation</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/my-presentations">Back to My Presentations</Link>
        </Button>
      </div>
    );
  }

  if (!presentation) {
    // Should be caught by error handling, but as a fallback
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <h1 className="text-2xl font-bold mb-2">Presentation Not Found</h1>
         <p className="text-muted-foreground mb-6">The requested presentation could not be loaded.</p>
         <Button variant="outline" asChild>
           <Link href="/my-presentations">Back to My Presentations</Link>
         </Button>
      </div>
    );
  }

  // Convert database slides format to the format expected by RevealPresentation
  const formattedSlides = presentation.slides.map((slide: any) => ({
    title: slide.title || '',
    content: slide.content || '',
    layout: slide.layout || 'text-only',
    imagePrompt: slide.imagePrompt,
    image: slide.image,
    backgroundColor: slide.backgroundColor,
    textColor: slide.textColor,
    accentColor: slide.accentColor,
    fontFamily: slide.fontFamily,
    headingFont: slide.headingFont
  }));

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 6rem)' }}>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{presentation.title}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/my-presentations">&larr; Back to My Presentations</Link>
        </Button>
      </div>

      <div style={{ flex: 1, width: '100%', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000'
        }}>
          <div style={{ 
            width: '100%', 
            maxWidth: '1152px', 
            aspectRatio: '16/9', 
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <RevealPresentation 
              slides={formattedSlides} 
              theme={presentation.brand_profile ? 'custom' : 'black'}
              customTheme={presentation.brand_profile ? {
                backgroundColor: presentation.brand_profile.visualIdentity.colorPalette.background,
                color: presentation.brand_profile.visualIdentity.colorPalette.text,
                primaryColor: presentation.brand_profile.visualIdentity.colorPalette.primary,
                secondaryColor: presentation.brand_profile.visualIdentity.colorPalette.secondary,
                accentColor: presentation.brand_profile.visualIdentity.colorPalette.accent,
                fontFamily: presentation.brand_profile.visualIdentity.typography.bodyFont,
                headingFont: presentation.brand_profile.visualIdentity.typography.headingFont,
              } : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 