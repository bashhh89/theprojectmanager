'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { RevealPresentation } from '@/components/presentation/RevealPresentation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Loader2, AlertTriangle } from 'lucide-react';

// Define the shape of the presentation data fetched from the API
interface PresentationData {
  id: string;
  title: string;
  presentation_type: string;
  slides: any[]; // Keep as any[] for now, assuming RevealPresentation handles the structure
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
        const response = await fetch(`/api/presentations/${presentationId}`);
        if (!response.ok) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
          } catch (jsonError) {
              // Ignore if response body is not JSON
          }
          throw new Error(errorMsg);
        }
        const data: PresentationData = await response.json();
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

  // --- Rendering Logic --- 

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

  // --- Display Presentation --- 
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 6rem)' }}>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{presentation.title}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/my-presentations">&larr; Back to List</Link>
        </Button>
      </div>

      {/* Presentation Container (similar to generator page) */}
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
              backgroundColor: '#f0f0f0' // Optional background for the container area
            }}>
              {/* Constrained Aspect Ratio Box */}
              <div style={{ width: '100%', maxWidth: '1152px', aspectRatio: '16 / 9', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                {/* Pass the fetched slides data to the component */}
                {/* Ensure RevealPresentation can handle the structure of presentation.slides */}
                <RevealPresentation slides={presentation.slides} />
              </div>
            </div>
        </div>
    </div>
  );
} 