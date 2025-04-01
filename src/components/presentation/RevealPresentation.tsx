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

export interface RevealPresentationProps {
  markdown?: string;
  slides?: Array<{
    title: string;
    content: string;
    layout?: string;
    image?: string;
    imagePrompt?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
    headingFont?: string;
  }>;
  theme?: string; 
  customTheme?: {
    backgroundColor?: string;
    color?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    headingFont?: string;
  };
  onReady?: () => void;
  style?: React.CSSProperties;
  debug?: boolean;
  onExportPDF?: () => void;
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

interface SlideData {
  html: string;
  layout: SlideLayout;
  imagePrompt?: string | null;
  imageUrl?: string | null;
  imageLoading?: boolean;
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
  slides = [],
  theme = 'black', 
  customTheme,
  onReady, 
  style,
  debug = false,
  onExportPDF
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [slidesData, setSlidesData] = useState<SlideData[]>([]);
  const [isFullyProcessed, setIsFullyProcessed] = useState(false);
  const [renderMode, setRenderMode] = useState<RenderMode>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const revealDivRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<any>(null);
  const themeLinkRef = useRef<HTMLLinkElement | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emergencyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to add debug info
  const addDebug = (message: string) => {
    console.log(`[RevealPresentation] ${message}`);
    if (debug) {
      setDebugInfo(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
    }
  };

  useEffect(() => { setIsMounted(true); }, []);

  // Emergency fallback timer - force to fallback mode after 10 seconds no matter what
  useEffect(() => {
    if (!isMounted) return;
    
    addDebug("Setting emergency fallback timer");
    emergencyTimerRef.current = setTimeout(() => {
      if (renderMode === 'loading') {
        addDebug("EMERGENCY FALLBACK: Still loading after timeout, switching to fallback mode");
        setRenderMode('fallback');
        if (onReady) {
          addDebug("Calling onReady from emergency fallback");
          onReady();
        }
      }
    }, 10000);
    
    return () => {
      if (emergencyTimerRef.current) {
        clearTimeout(emergencyTimerRef.current);
      }
    };
  }, [isMounted, renderMode, onReady]);

  // Effect to process slides prop or markdown, layouts, and fetch images
  useEffect(() => {
    if (!markdown && slides.length === 0) {
      setSlidesData([]);
      setIsFullyProcessed(false);
      setRenderMode('loading');
      setErrorMessage(null);
      return;
    }
    
    let isCancelled = false;
    setIsFullyProcessed(false);
    setRenderMode('loading');
    setErrorMessage(null);
    
    // --- START Processing SLIDES PROP ---
    if (slides.length > 0) {
      addDebug(`Processing ${slides.length} slides from props`);
      
      // Initial processing: structure data, identify prompts
      const initialProcessedSlides = slides.map((slide, index) => {
        const layout = (slide.layout || 'default') as SlideLayout;
        const html = slide.content || '<p></p>'; 
        const imagePrompt = slide.layout !== 'text-only' ? (slide.imagePrompt || null) : null;
        
        return {
          html,
          layout,
          imageUrl: slide.image || null,
          imagePrompt: imagePrompt,
          imageLoading: false, // Start with false, manage later if fetch needed
          // Style properties
          backgroundColor: slide.backgroundColor,
          textColor: slide.textColor,
          accentColor: slide.accentColor,
          fontFamily: slide.fontFamily, 
          headingFont: slide.headingFont
        };
      });
      
      setSlidesData(initialProcessedSlides); // Set initial structure (no images yet)
      addDebug(`Processed initial ${initialProcessedSlides.length} slides from props structure.`);
      
      // --- Fetch images based on prompts ---
      const fetchImagesForSlides = async () => {
          const imageRequests = initialProcessedSlides
            .map((slide, index) => slide.imagePrompt && !slide.imageUrl ? { index, prompt: slide.imagePrompt } : null)
            .filter(Boolean) as { index: number; prompt: string }[];
          
          if (imageRequests.length === 0) {
              addDebug("No images to fetch based on prompts.");
              setIsFullyProcessed(true); // All done if no images needed
              return;
          }
          
          addDebug(`Preparing to fetch ${imageRequests.length} images based on prompts...`);
          const fetchedImageUrls: { [index: number]: string | null } = {}; // Store results here
          
          // Use same batch fetching logic
          const batchSize = 3;
          for (let i = 0; i < imageRequests.length; i += batchSize) {
            const batch = imageRequests.slice(i, i + batchSize);
            addDebug(`Processing image batch ${i/batchSize + 1} (${batch.length} images)`);
            
            const results = await Promise.allSettled(
              batch.map(async (req) => {
                try {
                  addDebug(`Fetching image for slide ${req.index+1} (prompt: \"${req.prompt.substring(0, 30)}...\")`);
                  const response = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: req.prompt })
                  });
                  if (!response.ok) throw new Error(`API Error: ${response.status}`);
                  const data = await response.json();
                  if (data.imageUrl && !isCancelled) {
                    addDebug(`✓ Image received for slide ${req.index+1}`);
                    // Store successful URL temporarily
                    return { index: req.index, url: data.imageUrl };
                  } else {
                    throw new Error('No image URL in response');
                  }
                } catch (imgError) {
                  addDebug(`✗ Failed to fetch image for slide ${req.index+1}: ${imgError}`);
                  // Try fallback immediately if fetch fails
                   try {
                      const placeholderUrl = `https://picsum.photos/seed/slide${req.index}/800/600`;
                      addDebug(`Using placeholder image for slide ${req.index+1}`);
                      return { index: req.index, url: placeholderUrl }; // Store fallback URL
                    } catch (fallbackError) {
                      addDebug(`Fallback failed: ${fallbackError}`);
                       return { index: req.index, url: null }; // Indicate failure
                    }
                }
              })
            );
            
            // Process results for the completed batch
             results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    fetchedImageUrls[result.value.index] = result.value.url;
                }
                // Optionally handle rejected promises if needed, though catch block does fallback
            });
            
            if (i + batchSize < imageRequests.length && !isCancelled) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          addDebug("All image fetching based on prompts completed.");
          
          if (!isCancelled) {
            // Update slidesData ONCE with all fetched URLs
            setSlidesData(prevData =>
              prevData.map((slide, index) => {
                if (fetchedImageUrls.hasOwnProperty(index)) {
                   return { ...slide, imageUrl: fetchedImageUrls[index], imageLoading: false };
                }
                return { ...slide, imageLoading: false }; // Ensure loading is false
              })
            );
            setIsFullyProcessed(true); // Mark all processing complete AFTER state update
          }
      };

      fetchImagesForSlides(); // Start fetching images
      
      // Fallback timer (keep for Reveal init issues)
      fallbackTimerRef.current = setTimeout(() => {
         if (!isCancelled && renderMode === 'loading') { // Check !isCancelled
          addDebug("Fallback timer triggered - switching to fallback mode");
          setRenderMode('fallback');
          if (onReady) { onReady(); }
        }
      }, 15000); // Timeout remains
      
      return () => { isCancelled = true; if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current); };
    }
    // --- END Processing SLIDES PROP ---

    // --- START Processing MARKDOWN PROP ---
    if (markdown) { // Only process markdown if slides prop wasn't used
      addDebug("Started processing markdown and images");
      const processMarkdownAndImages = async () => {
        setSlidesData([]); // Clear previous data
        
        try {
          addDebug("Processing markdown, layout, and images...");
          const rawSlides = splitMarkdownIntoSlides(markdown);
          const initialDataPromises: Promise<Omit<SlideData, 'imageUrl' | 'imageLoading'>>[] = []; // Type adjustment
          
          // Available layouts to cycle through if none specified
          const defaultLayouts: SlideLayout[] = ['background', 'split-left', 'split-right', 'text-only'];
          
          // First pass: Parse markdown, layout, and identify image prompts
          for (let i = 0; i < rawSlides.length; i++) {
            let slideMd = rawSlides[i];
            
            // Extract Layout (or cycle through layouts if none specified)
            let layout: SlideLayout = defaultLayouts[i % defaultLayouts.length]; // Default layout based on position
            const layoutMatch = slideMd.match(layoutRegex);
            if (layoutMatch && layoutMatch[1]) {
              layout = layoutMatch[1].toLowerCase() as SlideLayout;
              slideMd = slideMd.replace(layoutRegex, '').trim(); 
            }
            
            addDebug(`Slide ${i+1} layout: ${layout}`);

            // Extract Image Prompt (only if layout is not text-only)
            let imagePrompt: string | null = null;
            
            if (layout !== 'text-only') {
              const imageMatch = slideMd.match(imageSuggestionRegex);
              
              if (imageMatch && imageMatch[1]) {
                // Use explicit image suggestion if provided
                imagePrompt = imageMatch[1].trim();
                slideMd = slideMd.replace(imageSuggestionRegex, '').trim();
              } else {
                // Auto-generate image prompt from slide content if none provided
                // Extract first few words from content for the image prompt
                const contentWords = slideMd.replace(/#/g, '').trim().split(' ');
                const autoPrompt = contentWords.slice(0, Math.min(8, contentWords.length)).join(' ');
                imagePrompt = `${autoPrompt}, high quality, professional presentation visual`;
                addDebug(`Auto-generated image prompt for slide ${i+1}: "${autoPrompt.substring(0, 30)}..."`);
              }
            }

            // Parse remaining Markdown to HTML
            const htmlPromise = Promise.resolve(marked.parse(slideMd))
              .then(html => ({
                html,
                layout,
                imagePrompt,
                // No imageLoading/imageUrl here yet
              }));
            initialDataPromises.push(htmlPromise);
          }

          const initialData = await Promise.all(initialDataPromises);
          if (isCancelled) return;

          // Set initial slide data structure (no images)
          const initialSlides = initialData.map(data => ({
              ...data,
              imageUrl: null, // Initialize imageUrl
              imageLoading: false // Initialize loading state
          }));
          setSlidesData(initialSlides);
          addDebug(`Processed ${initialSlides.length} initial slides structure from markdown`);

          // Second pass: Fetch images for all slides that need them
          const imageRequests = initialSlides
            .map((slide, index) => slide.imagePrompt ? { index, prompt: slide.imagePrompt } : null)
            .filter(Boolean) as { index: number; prompt: string }[];
          
          addDebug(`Preparing to fetch ${imageRequests.length} images for markdown slides`);
          const fetchedImageUrls: { [index: number]: string | null } = {}; // Store results
          
          // Process image requests in smaller batches
          const batchSize = 3;
          for (let i = 0; i < imageRequests.length; i += batchSize) {
            const batch = imageRequests.slice(i, i + batchSize);
            addDebug(`Processing image batch ${i/batchSize + 1} (${batch.length} images)`);
            
            const results = await Promise.allSettled(
              batch.map(async (req) => {
                 try {
                  addDebug(`Fetching image for slide ${req.index+1} with prompt: "${req.prompt.substring(0, 30)}..."`);
                  const response = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: req.prompt })
                  });
                  if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
                  const data = await response.json();
                  if (data.imageUrl && !isCancelled) {
                    addDebug(`✓ Image received for slide ${req.index+1}`);
                     return { index: req.index, url: data.imageUrl }; // Store success
                  } else {
                    throw new Error('No image URL in response');
                  }
                } catch (imgError) {
                  addDebug(`✗ Failed to fetch image for slide ${req.index+1}: ${imgError}`);
                   try {
                     // Generate a placeholder image URL based on the slide number
                      const placeholderUrl = `https://picsum.photos/seed/slide${req.index}/800/600`;
                      addDebug(`Using placeholder image for slide ${req.index+1}`);
                      return { index: req.index, url: placeholderUrl }; // Store fallback
                   } catch (fallbackError) {
                     addDebug(`Could not set fallback image: ${fallbackError}`);
                     return { index: req.index, url: null }; // Indicate failure
                   }
                }
              })
            );
            
            // Process results for the completed batch
             results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    fetchedImageUrls[result.value.index] = result.value.url;
                }
                // Optionally handle rejected promises
            });
            
            // Small delay between batches
            if (i + batchSize < imageRequests.length && !isCancelled) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          addDebug("All image processing completed for markdown slides");

          if (!isCancelled) {
             // Update slidesData ONCE with all fetched URLs
             setSlidesData(prevData =>
               prevData.map((slide, index) => {
                 if (fetchedImageUrls.hasOwnProperty(index)) {
                   return { ...slide, imageUrl: fetchedImageUrls[index], imageLoading: false };
                 }
                  return { ...slide, imageLoading: false }; // Ensure loading is false
               })
             );
             setIsFullyProcessed(true); // Mark all processing complete AFTER state update

            // Fallback timer (keep for Reveal init issues)
            fallbackTimerRef.current = setTimeout(() => {
              if (!isCancelled && renderMode === 'loading') { // Check !isCancelled
                addDebug("FALLBACK TIMER: Switching to fallback mode");
                setRenderMode('fallback');
                if (onReady) {
                  addDebug("Calling onReady from fallback timer");
                  onReady();
                }
              }
            }, 5000);
          }

        } catch (error) {
           const errorMsg = error instanceof Error ? error.message : String(error);
           addDebug(`Failed processing: ${errorMsg}`);
           setErrorMessage(`Error processing presentation: ${errorMsg}`);
           if (!isCancelled) {
              setSlidesData([{ html: `<section>Error processing presentation: ${errorMsg}</section>`, layout: 'text-only' }]);
              setIsFullyProcessed(true);
              setRenderMode('error');
           }
        }
      };

      processMarkdownAndImages();

      return () => {
        isCancelled = true;
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      };
    }
    // --- END Processing MARKDOWN PROP ---

    // Add else case if neither markdown nor slides provided
    else {
        addDebug("No markdown or slides prop provided. Resetting state.");
        setSlidesData([]);
        setIsFullyProcessed(false); // Not processed
        setRenderMode('loading'); // Or perhaps an 'empty' state?
        setErrorMessage(null);
    }

  }, [markdown, slides, isMounted]); // Added isMounted dependency

  // Effect to manage theme CSS link
  useEffect(() => {
    const head = document.head;
    
    // Remove any existing theme link
    if (themeLinkRef.current) {
      head.removeChild(themeLinkRef.current);
      themeLinkRef.current = null;
    }
    
    // If using a custom theme, don't add a theme CSS file
    if (theme === 'custom' && customTheme) {
      addDebug("Using custom theme configuration");
      return;
    }
    
    // Create new theme link
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = `/reveal.js-assets/theme/${theme}.css`;
    themeLink.id = 'reveal-theme';
    
    // Add to document head
    head.appendChild(themeLink);
    themeLinkRef.current = themeLink;
    
    addDebug(`Applied theme: ${theme}`);
    
    return () => {
      // Remove theme link on cleanup
      if (themeLinkRef.current) {
        try {
          head.removeChild(themeLinkRef.current);
        } catch (e) {
          console.error("Error removing theme link:", e);
        }
        themeLinkRef.current = null;
      }
    };
  }, [theme, customTheme]);

  // Custom CSS for the theme (if using customTheme)
  const customCSS = React.useMemo(() => {
    if (theme !== 'custom' || !customTheme) return null;
    
    return `
      .reveal {
        font-family: ${customTheme.fontFamily || 'sans-serif'};
        color: ${customTheme.color || '#222'};
      }
      
      .reveal h1, .reveal h2, .reveal h3, .reveal h4, .reveal h5, .reveal h6 {
        font-family: ${customTheme.headingFont || customTheme.fontFamily || 'sans-serif'};
        color: ${customTheme.primaryColor || customTheme.color || '#222'};
      }
      
      .reveal .slides {
        background-color: ${customTheme.backgroundColor || '#fff'};
      }
      
      .reveal a {
        color: ${customTheme.accentColor || '#00008B'};
      }
      
      .reveal .controls button {
        color: ${customTheme.secondaryColor || customTheme.primaryColor || '#555'};
      }
    `;
  }, [theme, customTheme]);

  // Add CSS to dynamically adjust text size based on content amount
  useEffect(() => {
    if (!isMounted) return;
    
    // Add custom CSS to handle text overflow and scaling
    const style = document.createElement('style');
    style.textContent = `
      /* Base presentation styling */
      .reveal, .reveal .slides, .reveal .slides section {
        visibility: visible !important;
        display: block !important;
      }
      
      /* Make sure controls are visible */
      .reveal .controls {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      
      /* Auto-scale text in split layouts */
      .reveal .layout-split-left .content-container,
      .reveal .layout-split-right .content-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        width: 100%;
      }
      
      /* Prevent overflow with auto-scaling text */
      .reveal .slides section {
        overflow: hidden !important;
      }
      
      /* Ensure content fits within the slide */
      .reveal .slides section .content-container {
        overflow: hidden !important;
        height: 100%;
      }
      
      /* Add specific styles for better text readability */
      .reveal .layout-split-left .content-container h1,
      .reveal .layout-split-right .content-container h1 {
        font-size: 2.5em;
        margin-bottom: 0.5em;
      }
      
      .reveal .layout-split-left .content-container h2,
      .reveal .layout-split-right .content-container h2 {
        font-size: 1.8em;
        margin-bottom: 0.4em;
      }
      
      .reveal .layout-split-left .content-container p,
      .reveal .layout-split-right .content-container p {
        font-size: 1.2em;
        line-height: 1.4;
      }
      
      .reveal .layout-split-left .content-container ul,
      .reveal .layout-split-right .content-container ul {
        font-size: 1.1em;
        line-height: 1.3;
      }
      
      /* Better image handling for Reveal */
      .reveal .image-container img {
        object-fit: cover !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* Adjust reveal image container sizes for split layouts */
      .reveal .layout-split-left .image-container,
      .reveal .layout-split-right .image-container {
        width: 45% !important;
        height: 100% !important;
      }
      
      .reveal .layout-split-left .image-container {
        left: 0;
        top: 0;
      }
      
      .reveal .layout-split-right .image-container {
        right: 0;
        top: 0;
      }
      
      /* Adjust content container for split layouts to accommodate larger images */
      .reveal .layout-split-left .content-container {
        right: 0;
        top: 0;
        width: 55% !important;
      }
      
      .reveal .layout-split-right .content-container {
        left: 0;
        top: 0;
        width: 55% !important;
      }
      
      /* Custom controls for Reveal */
      .custom-controls {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        z-index: 100;
        pointer-events: auto !important;
      }
      
      .custom-controls button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      .custom-controls button:hover {
        background: rgba(255, 255, 255, 0.4);
      }
      
      /* Style for the PDF export button */
      .custom-controls button.export-pdf-button {
        width: auto;
        padding: 0 12px;
        font-size: 14px;
        font-weight: bold;
        background: rgba(255, 100, 100, 0.5);
      }
      
      .custom-controls button.export-pdf-button:hover {
        background: rgba(255, 100, 100, 0.7);
      }
      
      /* Print styles for PDF export */
      @media print {
        body * {
          visibility: hidden;
        }
        
        .reveal, .reveal * {
          visibility: visible;
        }
        
        .reveal {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }
        
        .reveal .custom-controls {
          display: none !important;
        }
        
        @page {
          size: 1920px 1080px;
          margin: 0;
        }
      }
      
      /* Fallback mode styles */
      .fallback-slides {
        background: #1c1c1c;
        color: white;
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
      }
      
      .fallback-slide {
        width: 100%;
        height: 100%;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
      }
      
      .fallback-slide h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }
      
      .fallback-slide h2 {
        font-size: 2rem;
        margin-bottom: 0.8rem;
      }
      
      .fallback-slide p {
        font-size: 1.2rem;
        line-height: 1.5;
      }
      
      /* Better image handling for different layouts */
      
      /* Default image styling */
      .fallback-slide img.slide-image {
        max-width: 90%;
        max-height: 60%;
        object-fit: contain;
        margin: 0 auto 2rem;
      }
      
      /* Background layout */
      .fallback-slide.background {
        justify-content: center;
        text-align: center;
      }
      
      .fallback-slide.background img.slide-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
        opacity: 0.25;
        z-index: 0;
      }
      
      .fallback-slide.background .content {
        position: relative;
        z-index: 1;
        width: 80%;
        margin: 0 auto;
        text-align: center;
      }
      
      /* Split-left layout */
      .fallback-slide.split-left {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
      }
      
      .fallback-slide.split-left img.slide-image {
        width: 45%;
        max-width: 45%;
        max-height: 90%;
        margin: 0;
        order: -1;
      }
      
      .fallback-slide.split-left .content {
        width: 53%;
        padding-left: 2%;
      }
      
      /* Split-right layout */
      .fallback-slide.split-right {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
      }
      
      .fallback-slide.split-right img.slide-image {
        width: 45%;
        max-width: 45%;
        max-height: 90%;
        margin: 0;
      }
      
      .fallback-slide.split-right .content {
        width: 53%;
        padding-right: 2%;
        order: -1;
      }
      
      /* Text-only layout */
      .fallback-slide.text-only .content {
        width: 80%;
        margin: 0 auto;
        text-align: center;
      }
      
      /* Image loading indicator */
      .image-loading-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2;
      }
      
      /* Layout indicator for debugging */
      .layout-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.5);
        color: white;
        padding: 3px 6px;
        font-size: 12px;
        border-radius: 4px;
      }
      
      /* Navigation controls for fallback mode */
      .fallback-navigation {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        z-index: 100;
      }
      
      .fallback-navigation .nav-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      .fallback-navigation .nav-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.4);
      }
      
      .fallback-navigation .nav-button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .fallback-navigation .slide-counter {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [isMounted]);

  // Function to handle PDF export
  const handleExportPDF = () => {
    if (deckRef.current) {
      addDebug("Preparing PDF export");
      
      // The recommended approach for PDF export is to open a special print URL
      // Create a print stylesheet link element
      const printStylesheet = document.createElement('link');
      printStylesheet.rel = 'stylesheet';
      printStylesheet.type = 'text/css';
      printStylesheet.href = '/reveal.js-assets/pdf.css'; // Use our own PDF print stylesheet
      
      // Add a print-pdf class to the body to trigger print styles
      document.body.classList.add('print-pdf');
      
      // Add the print stylesheet
      document.head.appendChild(printStylesheet);
      
      // Give styles time to apply
      setTimeout(() => {
        // Open browser print dialog
        window.print();
        
        // Clean up after printing
        setTimeout(() => {
          // Remove print stylesheet
          printStylesheet.remove();
          
          // Remove print-pdf class
          document.body.classList.remove('print-pdf');
          
          // Call the callback if provided
          if (onExportPDF) {
            onExportPDF();
          }
          
          addDebug("PDF export completed");
        }, 1000);
      }, 500);
    } else {
      addDebug("Cannot export PDF: Reveal deck not initialized");
    }
  };

  // Effect to initialize Reveal.js
  useEffect(() => {
    if (!isMounted || !revealDivRef.current || !isFullyProcessed || slidesData.length === 0) {
       // Clean up previous instance if we are skipping after being initialized
       if (deckRef.current) {
          addDebug("Cleaning up previous deck before skipping init...");
          try { deckRef.current.destroy(); } catch(e) {}
          deckRef.current = null;
       }
       // Don't change render mode if it's already set to something other than loading
       if (renderMode === 'loading') {
         addDebug("Skipping Reveal.js initialization (conditions not met)");
       }
       return;
    }
    
    // Only try to initialize if we're in loading mode
    if (renderMode !== 'loading') {
      addDebug(`Skipping Reveal.js initialization (render mode is ${renderMode})`);
      return;
    }

    addDebug("Starting Reveal.js initialization...");
    
    const initializeReveal = async () => {
      try {
        // Simple dynamic import with minimal configuration
        const Reveal = (await import('reveal.js')).default;
        const Highlight = (await import('reveal.js/plugin/highlight/highlight')).default;
        
        // Check for null again just before creating the instance
        if (!revealDivRef.current) {
          addDebug("Reveal container ref is null, cannot initialize");
          throw new Error("Reveal container ref is null");
        }
        
        addDebug("Creating new Reveal instance with minimal configuration");
        const deck = new Reveal(revealDivRef.current, {
          // --- Core Embed & Sizing Configuration --- 
          embedded: true, 
          width: 960,    // Standard width (adjust if needed)
          height: 540,   // Standard 16:9 height (adjust if needed)
          margin: 0.04,  // Recommended margin for embedded decks
          minScale: 0.2, // Allow scaling down
          maxScale: 1.5, // Allow scaling up
          // --- Controls & Navigation --- 
          controls: true,        
          controlsTutorial: true, 
          progress: true,
          slideNumber: true, 
          hash: false, // Disable hash updates for embedding
          center: true, // Center slides vertically?
          // --- Appearance & Behavior --- 
          transition: 'slide',
          // --- Plugins --- 
          plugins: [ Highlight ],
          // --- PDF Settings --- 
          pdfSeparateFragments: false,
          pdfMaxPagesPerSlide: 1,
        });

        // Initialize with error catching
        try {
          addDebug("Calling Reveal.initialize()");
          await deck.initialize();
          addDebug("Reveal initialized successfully");
          
          // Try to force layout
          try {
            deck.layout();
            addDebug("Reveal layout() called successfully");
          } catch (layoutError) {
            addDebug(`Layout error: ${layoutError}`);
          }

          // Save reference and update state
          deckRef.current = deck;
          setRenderMode('reveal');
          
          // Call onReady callback
          if (onReady) {
            addDebug("Calling onReady callback");
            onReady();
          }
          
          // Clear fallback timer
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }
        } catch (initError) {
          // If initialize fails, throw error for the outer catch block
          throw new Error(`Initialize failed: ${initError}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addDebug(`Failed to initialize Reveal.js: ${errorMsg}`);
        
        // Fall back to basic mode if Reveal initialization fails
        setRenderMode('fallback');
        
        // Still call onReady since we're showing content in fallback mode
        if (onReady) {
          addDebug("Calling onReady in fallback mode");
          onReady();
        }
      }
    };

    // Start initialization
    initializeReveal();

    // Cleanup function
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      
      if (deckRef.current) {
        addDebug("Cleaning up Reveal instance (effect cleanup)");
        try {
          deckRef.current.destroy();
          deckRef.current = null;
        } catch (e) {
          addDebug(`Error destroying Reveal instance: ${e}`);
        }
      }
    };
  }, [isMounted, isFullyProcessed, slidesData, renderMode, onReady]);

  // Basic fallback renderer component
  const FallbackRenderer = () => {
    if (!slidesData.length) return null;
    
    // Show all slides in fallback mode with simple navigation
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const currentSlide = slidesData[currentSlideIndex];
    
    const goToNextSlide = () => {
      if (currentSlideIndex < slidesData.length - 1) {
        setCurrentSlideIndex(currentSlideIndex + 1);
      }
    };
    
    const goToPrevSlide = () => {
      if (currentSlideIndex > 0) {
        setCurrentSlideIndex(currentSlideIndex - 1);
      }
    };
    
    // Add keyboard navigation support
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'Space') {
          goToNextSlide();
        } else if (e.key === 'ArrowLeft') {
          goToPrevSlide();
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlideIndex]);
    
    return (
      <div className="fallback-slides">
        <div className={`fallback-slide ${currentSlide.layout}`}>
          {/* Show image with proper layout positioning */}
          {currentSlide.imageUrl && (
            <img 
              src={currentSlide.imageUrl} 
              alt="Slide visual" 
              className={`slide-image ${currentSlide.layout}`}
            />
          )}
          
          {/* Show loading indicator if still loading image */}
          {currentSlide.imageLoading && (
            <div className="image-loading-indicator">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-400">Loading image...</p>
            </div>
          )}
          
          <div 
            className="content"
            dangerouslySetInnerHTML={{ __html: currentSlide.html }}
          />
          
          {/* Navigation controls */}
          <div className="fallback-navigation">
            <button 
              onClick={goToPrevSlide}
              disabled={currentSlideIndex === 0}
              className="nav-button prev"
              aria-label="Previous slide"
            >
              ←
            </button>
            <span className="slide-counter">
              {currentSlideIndex + 1} / {slidesData.length}
            </span>
            <button 
              onClick={goToNextSlide}
              disabled={currentSlideIndex === slidesData.length - 1}
              className="nav-button next"
              aria-label="Next slide"
            >
              →
            </button>
          </div>
          
          {/* Layout indicator for debugging */}
          {debug && (
            <div className="layout-indicator">
              Layout: {currentSlide.layout}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Debug panel
  const DebugPanel = () => {
    if (!debug) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 text-white p-2 max-h-48 overflow-y-auto z-50 text-xs">
        <div className="mb-1 font-bold">Debug Info:</div>
        <div className="mb-1">Mode: {renderMode} | Processed: {isFullyProcessed ? 'Yes' : 'No'} | Slides: {slidesData.length}</div>
        {debugInfo.map((msg, i) => (
          <div key={i} className="opacity-80">{msg}</div>
        ))}
      </div>
    );
  };

  // Show loading indicator
  if (renderMode === 'loading') {
    return (
      <>
        <div className="h-full w-full flex items-center justify-center bg-black">
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-gray-300 animate-spin mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-medium">
              {!isFullyProcessed ? "Processing Slides..." : "Preparing Presentation..."}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {isFullyProcessed ? "Almost there..." : "Please wait..."}
            </p>
          </div>
        </div>
        <DebugPanel />
      </>
    );
  }
  
  // Show error state
  if (renderMode === 'error') {
    return (
      <>
        <div className="h-full w-full flex items-center justify-center bg-black">
          <div className="text-center max-w-lg px-4">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Presentation Error</h2>
            <p className="text-gray-300 mb-4">{errorMessage || "An unknown error occurred"}</p>
            <p className="text-gray-400 text-sm">
              Try refreshing the page or contact support if the issue persists.
            </p>
          </div>
        </div>
        <DebugPanel />
      </>
    );
  }
  
  // Show fallback renderer if Reveal.js failed to initialize
  if (renderMode === 'fallback') {
    return (
      <>
        <FallbackRenderer />
        <DebugPanel />
      </>
    );
  }
  
  // Render Reveal structure with conditional layouts
  return (
    <div className="reveal-presentation-container" style={style}>
      {/* Add custom CSS if using a custom theme */}
      {customCSS && <style>{customCSS}</style>}
      
      {(renderMode as string) === 'loading' && (
        <div className="loading-container">
          <div className="loading-spinner">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <p>Loading your presentation...</p>
          </div>
        </div>
      )}
      
      {(renderMode as string) === 'fallback' && (
        <FallbackRenderer />
      )}
      
      {(renderMode as string) === 'error' && (
        <div className="error-container">
          <div className="error-message">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h3>Error Loading Presentation</h3>
            {errorMessage && <p>{errorMessage}</p>}
          </div>
        </div>
      )}
      
      <div 
        ref={revealDivRef} 
        className="reveal" 
        style={{ 
          visibility: (renderMode as string) === 'reveal' ? 'visible' : 'hidden',
          display: (renderMode as string) === 'reveal' ? 'block' : 'none'
        }}
      >
        <div className="slides">
          {slidesData.map((slide, index) => (
            <section 
              key={index} 
              className={`slide-${index} layout-${slide.layout}`}
              data-background-color={slide.backgroundColor}
              data-color={slide.textColor}
            >
              {(slide.layout === 'background' || slide.layout === 'split-left' || slide.layout === 'split-right') && slide.imageUrl && (
                <div className="image-container">
                  <img src={slide.imageUrl} alt="Slide background" />
                </div>
              )}
              <div className="content-container" dangerouslySetInnerHTML={{ __html: slide.html }} />
            </section>
          ))}
        </div>
      </div>
      
      {/* Add custom navigation controls that will always be visible */}
      {(renderMode as string) !== 'loading' && (
        <div className="custom-controls">
          <button onClick={() => deckRef.current?.prev()} disabled={!deckRef.current}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => deckRef.current?.next()} disabled={!deckRef.current}>
            <ChevronRight className="h-5 w-5" />
          </button>
          <button onClick={handleExportPDF} disabled={!deckRef.current}>
            <FileText className="h-5 w-5" />
          </button>
        </div>
      )}

      {debug && (
        <DebugPanel />
      )}
    </div>
  );
};

export { RevealPresentation };
export default dynamic(() => Promise.resolve(RevealPresentation), { ssr: false }); 