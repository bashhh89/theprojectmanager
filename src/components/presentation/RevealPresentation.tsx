'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { marked } from 'marked'; // Import marked
import { Loader2, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight, Maximize2, FileText } from 'lucide-react';
import { cn } from "@/lib/utils"; // Import cn for conditional classes
import { Button } from "@/components/ui/button";

// Base Reveal CSS
import 'reveal.js/dist/reveal.css';

// REMOVE static import for default theme
// import 'reveal.js/dist/theme/black.css';

// Highlight.js theme (needed for highlight plugin)
import 'reveal.js/plugin/highlight/monokai.css';

// Add print-pdf CSS for PDF export
import '../../../public/reveal.js-assets/pdf.css';

// REMOVE Notes CSS import
// import 'reveal.js/plugin/notes/notes.css';

import type { SlideData } from '@/store/presentationStore';

// Add ClientMetadata interface
interface ClientMetadata {
  companyName?: string;
  industry?: string;
  website?: string;
  linkedInUrl?: string;
  recipientName?: string;
  recipientRole?: string;
  primaryGoal?: string;
}

export interface RevealPresentationProps {
  markdown?: string;
  slides?: SlideData[];
  theme?: 'black' | 'white' | 'league' | 'beige' | 'sky' | 'night' | 'serif' | 'simple' | 'solarized' | 'moon' | 'dracula' | 'custom';
  customTheme?: {
    backgroundColor?: string;
    color?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    headingFont?: string;
  };
  style?: React.CSSProperties;
  onReady?: () => void;
  debug?: boolean;
  onExportPDF?: () => void;
  clientMetadata?: ClientMetadata; // Add client metadata to props
}

// Helper to split markdown into slides
const splitMarkdownIntoSlides = (md: string): string[] => {
  // Use a regex that handles different line endings for --- separator
  return md.split(/^\r?\n---\r?\n/gm);
};

// Regexes
const layoutRegex = /<!--\s*Layout:\s*(background|split-left|split-right|text-only)\s*-->/i;
const imageSuggestionRegex = /<!--\s*Image suggestion:\s*(.*?)\s*-->/i;

type SlideLayout = 'background' | 'split-left' | 'split-right' | 'text-only';

interface SlideDataInternal {
  html: string; // Changed name to avoid confusion with prop
  layout: SlideLayout;
  imagePrompt?: string | null;
  imageUrl?: string | null;
  imageLoading?: boolean;
  style?: string; // Add style property to store presentation style
  // Keep style properties
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headingFont?: string;
}

// Define rendering modes
type RenderMode = 'loading' | 'reveal' | 'fallback' | 'error';

const RevealPresentation: React.FC<RevealPresentationProps> = ({ 
  markdown = '', 
  slides = [], // Use the prop name
  theme = 'black', 
  customTheme,
  onReady, 
  style,
  debug = false,
  onExportPDF,
  clientMetadata // Add client metadata parameter
}) => {
  // Force debug to false to hide the debug panel
  const actualDebug = false; // Override the debug prop
  const [isMounted, setIsMounted] = useState(false);
  const [slidesData, setSlidesData] = useState<SlideDataInternal[]>([]);
  const [isFullyProcessed, setIsFullyProcessed] = useState(false);
  const [renderMode, setRenderMode] = useState<RenderMode>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const revealDivRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<any>(null); // Use any for deck ref as before
  const themeLinkRef = useRef<HTMLLinkElement | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emergencyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to add debug info
  const addDebug = (message: string) => {
    console.log(`[RevealPresentation] ${message}`);
    if (actualDebug) {
      setDebugInfo(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
    }
  };

  useEffect(() => { setIsMounted(true); }, []);

  // Emergency fallback timer
  useEffect(() => {
    if (!isMounted) return;
    
    addDebug("Initialization started - waiting for Reveal.js");
    
    // Removing the emergency timer that forces fallback mode
    // Let Reveal.js initialization complete naturally
    
    return () => {
      if (emergencyTimerRef.current) {
        clearTimeout(emergencyTimerRef.current);
      }
    };
  }, [isMounted, renderMode, onReady]);

  // Effect to process slides prop or markdown, layouts, and fetch images
  useEffect(() => {
    if (!isMounted) return; // Wait until mounted
    
    // Prioritize slides prop if available
    const useSlidesProp = slides && slides.length > 0;
    const sourceData = useSlidesProp ? slides : (markdown ? splitMarkdownIntoSlides(markdown) : []);

    if (sourceData.length === 0) {
      addDebug("No source data (markdown or slides prop) provided. Resetting.");
      setSlidesData([]);
      setIsFullyProcessed(false);
      setRenderMode('loading'); // Or maybe an 'empty' state?
      setErrorMessage(null);
      return;
    }
    
    let isCancelled = false;
    setIsFullyProcessed(false);
    setRenderMode('loading');
    setErrorMessage(null);
    addDebug(`Processing ${sourceData.length} slides from ${useSlidesProp ? 'props' : 'markdown'}.`);
    
    const processSourceData = async () => {
      setSlidesData([]); // Clear previous data
      
      try {
        const initialDataPromises: Promise<Omit<SlideDataInternal, 'imageUrl' | 'imageLoading'> & { originalIndex: number }>[] = [];
        const defaultLayouts: SlideLayout[] = ['background', 'split-left', 'split-right', 'text-only'];

        // --- Pass 1: Parse content, layout, and identify image prompts --- 
        for (let i = 0; i < sourceData.length; i++) {
          let slideContent: string;
          let explicitLayout: string | undefined;
          let explicitImagePrompt: string | undefined;
          let initialImageUrl: string | undefined;
          let styleProps: Partial<SlideDataInternal> = {};

          if (useSlidesProp) {
            const slideProp = sourceData[i] as Exclude<RevealPresentationProps['slides'], undefined>[number];
            slideContent = slideProp.content || '';
            explicitLayout = slideProp.layout;
            explicitImagePrompt = slideProp.imagePrompt;
            initialImageUrl = slideProp.image;
            // Capture style props
            styleProps = {
              backgroundColor: slideProp.backgroundColor,
              textColor: slideProp.textColor,
              accentColor: slideProp.accentColor,
              fontFamily: slideProp.fontFamily,
              headingFont: slideProp.headingFont
            };
          } else {
            slideContent = sourceData[i] as string;
          }

          let slideMd = slideContent;
          
          // Extract Layout
          let layout: SlideLayout = defaultLayouts[i % defaultLayouts.length]; // Default layout
          const layoutMatch = explicitLayout ? null : slideMd.match(layoutRegex);
          if (explicitLayout && ['background', 'split-left', 'split-right', 'text-only'].includes(explicitLayout)) {
              layout = explicitLayout as SlideLayout;
          } else if (layoutMatch && layoutMatch[1]) {
              layout = layoutMatch[1].toLowerCase() as SlideLayout;
              slideMd = slideMd.replace(layoutRegex, '').trim(); 
            }
          // addDebug(`Slide ${i+1} layout: ${layout}`);

            // Extract Image Prompt (only if layout is not text-only)
            let imagePrompt: string | null = null;
            if (layout !== 'text-only') {
            const imageMatch = explicitImagePrompt ? null : slideMd.match(imageSuggestionRegex);
            if (explicitImagePrompt) {
                imagePrompt = explicitImagePrompt;
            } else if (imageMatch && imageMatch[1]) {
                imagePrompt = imageMatch[1].trim();
                slideMd = slideMd.replace(imageSuggestionRegex, '').trim();
              } else {
                // Auto-generate image prompt from slide content if none provided
                const titleMatch = slideMd.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1].trim() : slideMd.split('\n')[0].replace(/^#+\s*/, '');
                
                // Create more specific, high-quality image prompts based on layout
                let basePrompt = `${title}, professional, high quality`;
                
                if (layout === 'background') {
                  imagePrompt = `${basePrompt}, soft gradient background, subtle texture, elegant, minimalist, presentation background, corporate style, 16:9 aspect ratio, 4k quality`;
                } else if (layout === 'split-left') {
                  imagePrompt = `${basePrompt}, right-aligned image, clean professional illustration, corporate presentation visual, perfect lighting, detailed, photorealistic, 16:9 aspect ratio`;
                } else if (layout === 'split-right') {
                  imagePrompt = `${basePrompt}, left-aligned image, clean professional illustration, corporate presentation visual, perfect lighting, detailed, photorealistic, 16:9 aspect ratio`;
                } else {
                  imagePrompt = `${basePrompt}, centered composition, professional presentation visual, clean modern design, detailed illustration, 16:9 aspect ratio`;
                }
            }
          }

          // Parse remaining Markdown to HTML (MUST happen here)
            const htmlPromise = Promise.resolve(marked.parse(slideMd))
            .then(html => {
              // Debug the HTML conversion if in debug mode
              if (actualDebug) {
                addDebug(`Processed slide ${i+1} HTML (first 50 chars): ${html.substring(0, 50)}...`);
              }
              return {
                html,
                layout,
                imagePrompt,
                originalIndex: i,
                style: useSlidesProp ? ((sourceData[i] as any).style || '') : '', // Capture style from slide prop
                ...styleProps // Spread style props here
              };
            })
            .catch(err => {
              addDebug(`Error parsing markdown for slide ${i+1}: ${err.message}`);
              // Fallback to basic HTML if parsing fails
              return {
                html: `<h1>${slideContent.substring(0, 30)}...</h1><p>Error processing slide content</p>`,
                layout,
                imagePrompt,
                originalIndex: i,
                style: useSlidesProp ? ((sourceData[i] as any).style || '') : '', // Capture style from slide prop
                ...styleProps
              };
            });
            initialDataPromises.push(htmlPromise);
          }

        const initialDataResults = await Promise.all(initialDataPromises);
          if (isCancelled) return;

        // Set initial slide data structure (HTML content, layout, prompt, NO images yet)
        const initialSlides = initialDataResults.map(data => ({
              ...data,
            imageUrl: useSlidesProp ? (slides[data.originalIndex]?.image || null) : null, // Use pre-existing image if available from prop
            imageLoading: false
          }));
          setSlidesData(initialSlides);
        addDebug(`Processed ${initialSlides.length} initial slides structure.`);

        // --- Pass 2: Fetch images ONLY if needed --- 
          const imageRequests = initialSlides
          .map((slide, index) => (!slide.imageUrl && slide.imagePrompt) ? { index, prompt: slide.imagePrompt } : null)
            .filter(Boolean) as { index: number; prompt: string }[];
          
        if (imageRequests.length === 0) {
            addDebug("No images need to be fetched.");
            setIsFullyProcessed(true); // All processing done
            return; // Skip image fetching
        }
          
        addDebug(`Preparing to fetch ${imageRequests.length} images`);
        const fetchedImageUrls: { [index: number]: string | null } = {};
        
          const batchSize = 3;
          for (let i = 0; i < imageRequests.length; i += batchSize) {
            const batch = imageRequests.slice(i, i + batchSize);
          addDebug(`Processing image batch ${Math.floor(i/batchSize) + 1} (${batch.length} images)`);
            
            const results = await Promise.allSettled(
              batch.map(async (req) => {
                 try {
                addDebug(`Fetching image for slide ${req.index+1} (prompt: "${req.prompt.substring(0, 30)}...")`);
                
                // Get the slide's layout to use for style determination
                const slideLayout = slidesData[req.index]?.layout || 'text-only';
                
                  const response = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    prompt: req.prompt,
                    options: {
                      aspectRatio: '16:9',
                      quality: 'hd',
                      style: slideLayout === 'background' ? 'abstract' : 'photorealistic'
                    },
                    clientMetadata // Pass client metadata to the API
                  })
                });
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                  const data = await response.json();
                  if (data.imageUrl && !isCancelled) {
                    addDebug(`✓ Image received for slide ${req.index+1}`);
                  return { index: req.index, url: data.imageUrl };
                  } else {
                    throw new Error('No image URL in response');
                  }
                } catch (imgError) {
                  addDebug(`✗ Failed to fetch image for slide ${req.index+1}: ${imgError}`);
                      const placeholderUrl = `https://picsum.photos/seed/slide${req.index}/800/600`;
                      addDebug(`Using placeholder image for slide ${req.index+1}`);
                return { index: req.index, url: placeholderUrl };
                }
              })
            );
            
             results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    fetchedImageUrls[result.value.index] = result.value.url;
                }
            });
            
            if (i + batchSize < imageRequests.length && !isCancelled) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between batches
            }
          }
        addDebug("All image fetching completed.");

          if (!isCancelled) {
             // Update slidesData ONCE with all fetched URLs
             setSlidesData(prevData =>
               prevData.map((slide, index) => {
                 if (fetchedImageUrls.hasOwnProperty(index)) {
                 return { ...slide, imageUrl: fetchedImageUrls[index] };
              }
              return slide;
            })
          );
          setIsFullyProcessed(true); // Mark all processing complete
          }

        } catch (error) {
           const errorMsg = error instanceof Error ? error.message : String(error);
           addDebug(`Failed processing: ${errorMsg}`);
           setErrorMessage(`Error processing presentation: ${errorMsg}`);
           if (!isCancelled) {
            setSlidesData([{ html: `<section><h1>Error</h1><p>Error processing presentation: ${errorMsg}</p></section>`, layout: 'text-only' }]);
            setIsFullyProcessed(true); // Mark as processed even on error to show error slide
              setRenderMode('error');
           }
        }
      };

    processSourceData();

    // Remove fallback timer - don't force fallback mode
    // Let Reveal.js initialize properly

      return () => {
        isCancelled = true;
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  // Re-evaluate when source data or mount status changes
  }, [markdown, slides, isMounted, clientMetadata]); 

  // Effect to manage theme CSS link
  useEffect(() => {
    const head = document.head;
    if (themeLinkRef.current) {
      try { head.removeChild(themeLinkRef.current); } catch(e) {}
      themeLinkRef.current = null;
    }
    
    if (theme === 'custom' && customTheme) {
      addDebug("Using custom theme configuration (no CSS link)");
      return;
    }
    
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = `/reveal.js-assets/theme/${theme}.css`;
    themeLink.id = 'reveal-theme';
    head.appendChild(themeLink);
    themeLinkRef.current = themeLink;
    addDebug(`Applied theme CSS: ${theme}.css`);
    
    return () => {
      if (themeLinkRef.current) {
        try { head.removeChild(themeLinkRef.current); } catch (e) {}
        themeLinkRef.current = null;
      }
    };
  }, [theme, customTheme]);

  // Custom CSS for the theme
  const customCSS = React.useMemo(() => {
    if (theme !== 'custom' || !customTheme) return null;
    addDebug("Generating custom theme CSS styles");
    return `
      .reveal h1, .reveal h2, .reveal h3, .reveal h4, .reveal h5, .reveal h6 {
        font-family: ${customTheme.headingFont || customTheme.fontFamily || 'sans-serif'};
        color: ${customTheme.primaryColor || customTheme.color || '#222'};
        margin-bottom: 0.5em;
        text-transform: none;
        letter-spacing: normal;
        text-shadow: none;
      }
      
      .reveal {
        font-family: ${customTheme.fontFamily || 'sans-serif'};
        color: ${customTheme.color || '#222'};
        font-size: 36px;
      }
      
      .reveal p {
        font-family: ${customTheme.fontFamily || 'sans-serif'};
        line-height: 1.4;
        margin-bottom: 1em;
      }
      
      .reveal ul, .reveal ol {
        font-family: ${customTheme.fontFamily || 'sans-serif'};
      }
    `;
  }, [theme, customTheme]);

  // Effect to initialize Reveal.js ONCE data is processed
  useEffect(() => {
    if (!isMounted) return;
    
    // Only try to initialize if we have slides data
    if (slidesData.length === 0) {
      addDebug("No slides data available for initialization");
      return;
    }

    // Wait for DOM to be fully ready
    setTimeout(() => {
      if (!isFullyProcessed) {
        addDebug("Slides not fully processed yet, waiting...");
        return;
      }

      // Previous initialization might be in progress or failed
      if (renderMode !== 'loading') {
        addDebug(`Not initializing, already in ${renderMode} mode`);
        return;
      }

      addDebug("Starting Reveal.js initialization...");
    
      const initializeReveal = async () => {
        try {
          addDebug("Importing Reveal.js modules...");
          const Reveal = (await import('reveal.js')).default;
          const Highlight = (await import('reveal.js/plugin/highlight/highlight')).default;
          
          addDebug("Reveal.js modules imported successfully");
          
          // Make sure the DOM is ready before initializing
          if (!revealDivRef.current) {
            addDebug("RevealDiv ref is not available, forcing to fallback mode");
            setRenderMode('fallback');
            return;
          }
          
          addDebug("Creating new Reveal instance...");
          const deck = new Reveal(revealDivRef.current, {
            embedded: true, 
            width: 960, height: 540, margin: 0.04,
            minScale: 0.2, maxScale: 1.5,
            hash: false, center: true, 
            controls: true, controlsTutorial: false, progress: true, slideNumber: 'c/t',
            transition: 'slide', 
            plugins: [ Highlight ],
            pdfSeparateFragments: false,
          });

          addDebug("Calling deck.initialize()...");
          await deck.initialize();
          addDebug("Reveal initialized successfully");
          
          // Apply layout explicitly after a delay to ensure DOM has updated
          setTimeout(() => {
            try { 
              deck.layout(); 
              addDebug("Reveal layout() called after delay."); 
            } catch (layoutError) { 
              addDebug(`Layout error: ${layoutError}`); 
            }
          }, 200);

          deckRef.current = deck;
          setRenderMode('reveal');
          if (onReady) { onReady(); }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          addDebug(`Failed to initialize Reveal.js: ${errorMsg}`);
          console.error('RevealPresentation initialization error:', error);
          // Fall back to simpler renderer on error
          setRenderMode('fallback');
        }
      };

      initializeReveal();
    }, 100); // Short delay to ensure DOM is ready

    return () => {
      if (deckRef.current) {
        addDebug("Cleaning up Reveal instance (effect cleanup)");
        try { deckRef.current.destroy(); } catch (e) { addDebug(`Error destroying Reveal: ${e}`); }
        deckRef.current = null;
      }
    };
  }, [isMounted, isFullyProcessed, slidesData.length]); // Remove renderMode dependency to prevent loop

  // Function to handle PDF export using browser print
  const handleExportPDF = () => {
    if (renderMode !== 'reveal' || !deckRef.current) {
      addDebug("Cannot export PDF: Not in reveal mode or deck not initialized.");
      return; 
    }
    addDebug("Preparing PDF export via window.print()...");
    
    const printStylesheet = document.createElement('link');
    printStylesheet.rel = 'stylesheet';
    printStylesheet.type = 'text/css';
    printStylesheet.href = '/reveal.js-assets/pdf.css'; 
    document.head.appendChild(printStylesheet);
    document.body.classList.add('print-pdf');
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        try { printStylesheet.remove(); } catch(e){}
        document.body.classList.remove('print-pdf');
        if (onExportPDF) onExportPDF();
        addDebug("PDF export print dialog finished.");
      }, 1000);
    }, 500);
  };

  // --- Render Logic --- 

  // Loading State
  if (renderMode === 'loading') {
    return (
      <>
        <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <h3 className="text-xl font-medium mb-2">Loading Presentation</h3>
          <p className="text-sm text-white/70">Initializing slide layouts and content...</p>
          {slidesData.length > 0 && (
            <div className="mt-4 text-sm">
              Processed {slidesData.length} slides, finalizing display...
            </div>
          )}
      </div>
        {actualDebug && <DebugPanel debugInfo={debugInfo} renderMode={renderMode} isFullyProcessed={isFullyProcessed} slidesCount={slidesData.length} />}
      </>
    );
  }

  // Error State
  if (renderMode === 'error') {
    return (
      <>
        <div className="h-full w-full flex items-center justify-center bg-black">
           {/* Consistent Error Display */}
      </div>
        {actualDebug && <DebugPanel debugInfo={debugInfo} renderMode={renderMode} isFullyProcessed={isFullyProcessed} slidesCount={slidesData.length} />}
      </>
    );
  }
  
  // Fallback Renderer State
  if (renderMode === 'fallback') {
    return (
      <>
        <FallbackRenderer slidesData={slidesData} debug={actualDebug} />
        {actualDebug && <DebugPanel debugInfo={debugInfo} renderMode={renderMode} isFullyProcessed={isFullyProcessed} slidesCount={slidesData.length} />}
      </>
    );
  }
  
  // Reveal.js State (RenderMode === 'reveal')
  return (
    <div className="reveal-presentation-container h-full w-full relative" style={style}>
      {customCSS && <style>{customCSS}</style>}
      
      {/* Add specific layout CSS for different layouts */}
      <style jsx global>{`
        /* Layout styling */
        .reveal .slides section {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
          text-align: left;
        }
        
        /* Background layout with image */
        .reveal .slides section.layout-background .image-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }
        
        .reveal .slides section.layout-background .image-container img {
          opacity: 0.7;
        }
        
        .reveal .slides section.layout-background .content-container {
          position: relative;
          z-index: 10;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        /* Split Left Layout - Content on left, image on right */
        .reveal .slides section.layout-split-left .content-container {
        position: relative;
          z-index: 5;
          margin-right: 50%;
        }
        
        .reveal .slides section.layout-split-left .image-container {
          position: absolute;
          top: 0;
          right: 0;
          width: 48%;
        height: 100%;
          z-index: 5;
        }
        
        /* Split Right Layout - Content on right, image on left */
        .reveal .slides section.layout-split-right .content-container {
          position: relative;
          z-index: 5;
          margin-left: 50%;
        }
        
        .reveal .slides section.layout-split-right .image-container {
        position: absolute;
        top: 0;
        left: 0;
          width: 48%;
          height: 100%;
          z-index: 5;
        }
        
        /* Common image styling for split layouts */
        .reveal .slides section.layout-split-left .image-container img,
        .reveal .slides section.layout-split-right .image-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
          border-radius: 8px;
        }
        
        /* Text-only layout centered content */
        .reveal .slides section.layout-text-only .content-container {
          width: 100%;
          max-width: 90%;
        margin: 0 auto;
        }
        
        /* Typography improvements */
        .reveal .slides section h1, 
        .reveal .slides section h2, 
        .reveal .slides section h3 {
          margin-bottom: 0.5em;
          text-transform: none;
        }
        
        .reveal .slides section ul {
          display: block;
          margin-left: 2em;
          text-align: left;
        }
        
        .reveal .slides section li {
          margin: 0.5em 0;
          display: list-item;
        }

        /* Style-specific styling */
        /* Formal & Professional */
        .reveal .slides section.formal-professional-style {
          background-color: #1a365d;
          color: #ffffff;
        }
        
        .reveal .slides section.formal-professional-style h1,
        .reveal .slides section.formal-professional-style h2 {
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        
        .reveal .slides section.formal-professional-style .content-container {
          padding: 2rem;
        }
        
        /* Casual & Friendly */
        .reveal .slides section.casual-friendly-style {
          background-color: #f9f7f3;
          color: #333333;
        }
        
        .reveal .slides section.casual-friendly-style h1,
        .reveal .slides section.casual-friendly-style h2 {
          color: #ff6347;
          font-weight: 500;
        }
        
        .reveal .slides section.casual-friendly-style .content-container {
          padding: 1.5rem;
          font-size: 1.1em;
        }
        
        /* Modern & Dynamic */
        .reveal .slides section.modern-dynamic-style {
          background-color: #121212;
          color: #ffffff;
        }
        
        .reveal .slides section.modern-dynamic-style .image-container img {
          opacity: 0.7;
          filter: saturate(0.8) contrast(1.1);
        }
        
        .reveal .slides section.modern-dynamic-style .content-container {
          background-color: rgba(0, 0, 0, 0.7);
          padding: 2rem;
          border-radius: 8px;
          margin: 1rem;
          width: calc(100% - 2rem);
        }
        
        .reveal .slides section.modern-dynamic-style h1,
        .reveal .slides section.modern-dynamic-style h2 {
          color: #3d9df0;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        /* Classic & Traditional */
        .reveal .slides section.classic-traditional-style {
          background-color: #f5f0e8;
          color: #333333;
        }
        
        .reveal .slides section.classic-traditional-style h1,
        .reveal .slides section.classic-traditional-style h2 {
          font-family: Georgia, serif;
          color: #8b4513;
        }
        
        .reveal .slides section.classic-traditional-style .content-container {
          font-family: Georgia, serif;
          font-size: 1.05em;
          line-height: 1.6;
        }
        
        /* Clean & Minimalist */
        .reveal .slides section.clean-minimalist-style {
          background-color: #ffffff;
          color: #212121;
        }
        
        .reveal .slides section.clean-minimalist-style h1,
        .reveal .slides section.clean-minimalist-style h2 {
          font-weight: 300;
          letter-spacing: 0.05em;
        }
        
        .reveal .slides section.clean-minimalist-style .content-container {
          padding: 2rem;
          font-weight: 300;
        }
      `}</style>
      
      <div 
        ref={revealDivRef} 
        className="reveal w-full h-full" 
      >
      <div className="slides">
          {slidesData.map((slide, index) => (
          <section 
            key={index}
              className={`slide-${index} layout-${slide.layout} ${slide.style || ''}-style`}
            data-background-color={slide.backgroundColor}
            style={{
              color: slide.textColor || (customTheme ? customTheme.color : undefined),
              fontFamily: slide.fontFamily || (customTheme ? customTheme.fontFamily : undefined)
            }}
          >
              {/* Background Image Layout */}
              {slide.layout === 'background' && slide.imageUrl && (
                <div className="image-container absolute top-0 left-0 w-full h-full z-0">
                  <img 
                    src={slide.imageUrl} 
                    alt="Slide background" 
                    className="object-cover w-full h-full opacity-40"
                  />
                </div>
              )}
              
              {/* Split Left Layout - Image on right */}
              {slide.layout === 'split-left' && slide.imageUrl && (
                <div className="image-container">
                  <img 
                    src={slide.imageUrl} 
              alt="Slide visual" 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              
              {/* Split Right Layout - Image on left */}
              {slide.layout === 'split-right' && slide.imageUrl && (
                <div className="image-container">
                  <img 
                    src={slide.imageUrl} 
                    alt="Slide visual" 
                    className="object-cover w-full h-full"
                  />
            </div>
          )}
          
          <div 
                className="content-container p-8 flex flex-col justify-center"
                style={{ 
                  fontFamily: slide.fontFamily || (customTheme ? customTheme.fontFamily : undefined),
                  height: '100%'
                }}
                dangerouslySetInnerHTML={{ __html: slide.html }}
              />
          </section>
        ))}
          </div>
            </div>
      
      {/* Custom Controls */}
      <div className="custom-controls absolute bottom-4 right-4 flex gap-2 z-20">
        <Button variant="outline" size="icon" onClick={() => deckRef.current?.prev()} disabled={!deckRef.current}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => deckRef.current?.next()} disabled={!deckRef.current}>
          <ChevronRight className="h-5 w-5" />
        </Button>
        {onExportPDF && (
          <Button variant="outline" onClick={handleExportPDF} className="export-pdf-button" disabled={!deckRef.current}>
            <FileText className="h-5 w-5 mr-1" /> PDF
          </Button>
          )}
        </div>

      {actualDebug && <DebugPanel debugInfo={debugInfo} renderMode={renderMode} isFullyProcessed={isFullyProcessed} slidesCount={slidesData.length} />}
      </div>
    );
  };

// Update FallbackRenderer to also use the improved layout handling
const FallbackRenderer: React.FC<{ slidesData: SlideDataInternal[], debug?: boolean }> = ({ slidesData, debug }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  if (!slidesData || slidesData.length === 0) return <div>No slides to display.</div>;
  const currentSlide = slidesData[currentSlideIndex];

  const goToNext = () => setCurrentSlideIndex(i => Math.min(i + 1, slidesData.length - 1));
  const goToPrev = () => setCurrentSlideIndex(i => Math.max(i - 1, 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goToNext();
      else if (e.key === 'ArrowLeft') goToPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slidesData.length]);

    return (
    <div className="fallback-slides w-full h-full bg-gray-900 text-white relative overflow-hidden">
      <style>{`
        .fallback-slide.layout-background .content {
          position: relative;
          z-index: 10;
          width: 100%;
          text-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        
        .fallback-slide.layout-split-left .content {
          margin-right: 45%;
          text-align: left;
          margin-left: 5%;
        }
        
        .fallback-slide.layout-split-right .content {
          margin-left: 45%;
          text-align: left;
          margin-right: 5%;
        }
        
        .fallback-slide.layout-text-only .content {
          max-width: 80%;
          margin: 0 auto;
        }
        
        .fallback-slide h1, .fallback-slide h2, .fallback-slide h3 {
          margin-bottom: 0.5em;
        }
        
        .fallback-slide ul {
          text-align: left;
          margin-left: 1.5em;
        }
      `}</style>
      
      <div className={`fallback-slide w-full h-full p-8 flex items-center justify-center layout-${currentSlide.layout}`}
           style={{
             backgroundColor: currentSlide.backgroundColor || '#111',
             color: currentSlide.textColor || 'white',
             fontFamily: currentSlide.fontFamily,
           }}> 
        {/* Background Layout */}
        {currentSlide.layout === 'background' && currentSlide.imageUrl && (
          <img 
            src={currentSlide.imageUrl} 
            alt="Slide background" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
          />
        )}
        
        {/* Split Left Layout - Image on right */}
        {currentSlide.layout === 'split-left' && currentSlide.imageUrl && (
          <img 
            src={currentSlide.imageUrl} 
            alt="Slide visual" 
            className="absolute top-0 right-0 w-1/2 h-full object-cover z-0"
          />
        )}
        
        {/* Split Right Layout - Image on left */}
        {currentSlide.layout === 'split-right' && currentSlide.imageUrl && (
          <img 
            src={currentSlide.imageUrl} 
            alt="Slide visual" 
            className="absolute top-0 left-0 w-1/2 h-full object-cover z-0"
          />
      )}
      
      <div 
          className="content relative z-10" 
          style={{ fontFamily: currentSlide.fontFamily }}
          dangerouslySetInnerHTML={{ __html: currentSlide.html }} 
        />
      </div>
      
      {/* Fallback Navigation */} 
      <div className="fallback-navigation absolute bottom-5 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
        <Button variant="outline" size="icon" onClick={goToPrev} disabled={currentSlideIndex === 0}>
            <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="slide-counter text-sm text-white/70">{currentSlideIndex + 1} / {slidesData.length}</span>
        <Button variant="outline" size="icon" onClick={goToNext} disabled={currentSlideIndex === slidesData.length - 1}>
            <ChevronRight className="h-5 w-5" />
        </Button>
        </div>
      
      {debug && <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 text-xs rounded z-30">
        Fallback Mode - Layout: {currentSlide.layout}
      </div>}
    </div>
  );
};

// Debug Panel Component (Simplified)
const DebugPanel: React.FC<{ debugInfo: string[], renderMode: string, isFullyProcessed: boolean, slidesCount: number }> = 
  ({ debugInfo, renderMode, isFullyProcessed, slidesCount }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white p-2 max-h-40 overflow-y-auto z-[999] text-xs font-mono">
    <div>Mode: {renderMode} | Processed: {isFullyProcessed ? 'Yes' : 'No'} | Slides: {slidesCount}</div>
    {debugInfo.map((msg, i) => <div key={i} className="opacity-80">{msg}</div>)}
  </div>
);

export { RevealPresentation };
// Ensure dynamic import for client-side execution
export default dynamic(() => Promise.resolve(RevealPresentation), { ssr: false }); 