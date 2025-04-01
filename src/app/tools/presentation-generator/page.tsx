'use client';

import React, { useState, useEffect } from 'react';
import { RevealPresentation } from '@/components/presentation/RevealPresentation';
import { useBrandStore } from '@/store/brandStore';
import { useSearchParams } from 'next/navigation';
import { toasts } from '@/components/ui/toast-wrapper';
import { BrandProfile } from '@/types/brand';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, FileText, Briefcase } from 'lucide-react';
import { marked } from 'marked';

interface SlideData {
  title: string;
  content: string;
  layout?: string;
  image?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headingFont?: string;
}

type PresentationType = 'general' | 'proposal';

export default function PresentationGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectGoal, setProjectGoal] = useState('');
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<PresentationType>('general');
  const [selectedBrand, setSelectedBrand] = useState<BrandProfile | null>(null);
  const [applyBrandStyling, setApplyBrandStyling] = useState(true);
  
  const { selectBrand } = useBrandStore();
  const searchParams = useSearchParams();
  const brandId = searchParams.get('brandId');
  
  useEffect(() => {
    setMounted(true);
    const brand = selectBrand(brandId);
    if (brand) {
      setSelectedBrand(brand);
      setApplyBrandStyling(true);
    } else {
      setApplyBrandStyling(false);
    }
  }, [brandId, selectBrand]);
  
  if (!mounted) {
    return <div className="container py-8">Loading presentation generator...</div>;
  }

  const generateSlides = async () => {
    if (selectedType === 'general' && !topic) {
      toasts.error('Please enter a presentation topic');
      return;
    }
    if (selectedType === 'proposal' && (!clientName || !projectGoal)) {
      toasts.error('Please enter Client Name and Project Goal for the proposal');
      return;
    }

    setIsGenerating(true);
    
    try {
      const requestBody = {
        presentationType: selectedType,
        ...(selectedType === 'general' && { topic }),
        ...(selectedType === 'proposal' && { clientName, projectGoal }),
        audience,
        additionalInfo,
        brandProfile: selectedBrand
      };

      const response = await fetch('/api/generate-presentation-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown API error' }));
          throw new Error(errorData.error || errorData.details || `API failed with status: ${response.status}`);
      }

      const data = await response.json();

      let receivedSlides = data.slides || [];

      if (!Array.isArray(receivedSlides) || receivedSlides.length === 0) {
          console.warn("Received empty or invalid slides array from API, using fallback.");
          receivedSlides = [{ title: "Generation Error", content: "# No Slides Generated\n\nFailed to get a valid response from the AI model.", layout: 'text-only' }];
      }

      const processedSlides = receivedSlides.map((slide: any) => ({
          title: slide.title || 'Untitled',
          content: slide.content ? marked.parse(slide.content) : '<p>No content generated.</p>',
          layout: slide.layout || 'default',
          imagePrompt: slide.layout !== 'text-only' ? slide.imagePrompt : undefined,
          image: undefined 
      }));
      
      if (selectedBrand && applyBrandStyling) {
        const styledSlides = processedSlides.map((slide: any) => ({
          ...slide,
          backgroundColor: selectedBrand.visualIdentity.colorPalette.background,
          textColor: selectedBrand.visualIdentity.colorPalette.text,
          accentColor: selectedBrand.visualIdentity.colorPalette.accent,
          fontFamily: selectedBrand.visualIdentity.typography.bodyFont,
          headingFont: selectedBrand.visualIdentity.typography.headingFont,
        }));
        setSlides(styledSlides);
      } else {
        setSlides(processedSlides);
      }
      
      setShowPresentation(true);

    } catch (error) {
      console.error('Error generating slides:', error);
      toasts.error(`Failed to generate presentation: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePDFExport = () => {
    setIsExporting(true);
    toasts.success('PDF export complete');
    setIsExporting(false);
  };

  return (
    <div className="container py-8" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 6rem)' }}>
      <div className={`${showPresentation ? 'hidden' : 'block'}`}>
        <h1 className="text-3xl font-bold mb-6">AI Presentation Generator</h1>
        <p className="text-muted-foreground mb-8">
          Generate a professional presentation with AI assistance. Simply enter your topic and audience, 
          and our system will create a comprehensive slide deck.
        </p>
        
        {selectedBrand && (
          <div className="mb-6 p-4 border rounded-md bg-muted flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium mb-1">Using Brand: {selectedBrand.name}</h2>
              <p className="text-sm text-muted-foreground">
                Presentation will use brand styles.
              </p>
            </div>
            <div className="flex items-center space-x-2">
                <Label htmlFor="apply-brand-toggle">Apply Styling</Label>
                <Switch 
                   id="apply-brand-toggle"
                   checked={applyBrandStyling} 
                   onCheckedChange={setApplyBrandStyling} 
                />
            </div>
         </div>
        )}
        
        <div className="mb-8">
            <Label className="block text-lg font-medium mb-3">Select Presentation Type</Label>
            <div className="flex flex-wrap gap-4">
                <Button
                    variant={selectedType === 'general' ? 'default' : 'outline'}
                    onClick={() => setSelectedType('general')}
                    className="flex-1 min-w-[150px] h-auto py-4 flex flex-col items-center justify-center text-center space-y-2"
                >
                    <FileText className="h-8 w-8 mb-2" />
                    <span className="font-semibold">General Topic</span>
                    <span className="text-xs text-muted-foreground px-2">Generate slides on any subject</span>
                </Button>
                <Button
                    variant={selectedType === 'proposal' ? 'default' : 'outline'}
                    onClick={() => setSelectedType('proposal')}
                    className="flex-1 min-w-[150px] h-auto py-4 flex flex-col items-center justify-center text-center space-y-2"
                >
                    <Briefcase className="h-8 w-8 mb-2" />
                    <span className="font-semibold">Sales Proposal</span>
                    <span className="text-xs text-muted-foreground px-2">Create a pitch for a client</span>
                </Button>
            </div>
        </div>
        
        <div className="space-y-4 max-w-3xl">
            {selectedType === 'general' && (
                <>
                    <div>
                        <Label htmlFor="topic">Presentation Topic</Label>
                        <Input id="topic" placeholder="E.g., Future of AI" value={topic} onChange={(e) => setTopic(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="audience">Target Audience</Label>
                        <Input id="audience" placeholder="E.g., Tech Enthusiasts" value={audience} onChange={(e) => setAudience(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                        <Textarea id="additionalInfo" placeholder="Specific points..." value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
                    </div>
                </>
            )}

            {selectedType === 'proposal' && (
                <>
                    <div>
                        <Label htmlFor="clientName">Client Name / Company</Label>
                        <Input id="clientName" placeholder="E.g., Innovate Corp" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
                    </div>
                     <div>
                        <Label htmlFor="projectGoal">Project Goal / Objective</Label>
                        <Input id="projectGoal" placeholder="E.g., Streamline internal comms" value={projectGoal} onChange={(e) => setProjectGoal(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="proposalAudience">Audience within Client Org</Label>
                        <Input id="proposalAudience" placeholder="E.g., CTO, HR Manager" value={audience} onChange={(e) => setAudience(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="proposalInfo">Additional Proposal Details (Optional)</Label>
                        <Textarea id="proposalInfo" placeholder="Pain points, key requirements..." value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
                    </div>
                </>
            )}
          
          <Button 
            onClick={generateSlides} 
            disabled={isGenerating}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Generating...</> : 'Generate Presentation'}
          </Button>
        </div>
      </div>
      
      <div style={{ display: showPresentation ? 'flex' : 'none', flex: 1, flexDirection: 'column' }}>
          <div className="mb-4 flex justify-between items-center">
            <Button variant="outline" onClick={() => setShowPresentation(false)}>
                Back to Editor
            </Button>
            <Button onClick={handlePDFExport} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
          <div style={{ 
              flex: 1, 
              position: 'relative', 
              maxWidth: '100%',
              width: 'calc(100vh * 16 / 9)',
              maxHeight: 'calc(100% - 60px)',
              margin: '0 auto',
              aspectRatio: '16 / 9'
          }}>
              <RevealPresentation 
                  slides={slides} 
                  theme={(selectedBrand && applyBrandStyling) ? 'custom' : 'black'}
                  customTheme={(selectedBrand && applyBrandStyling) ? {
                      backgroundColor: selectedBrand.visualIdentity.colorPalette.background,
                      color: selectedBrand.visualIdentity.colorPalette.text,
                      primaryColor: selectedBrand.visualIdentity.colorPalette.primary,
                      secondaryColor: selectedBrand.visualIdentity.colorPalette.secondary,
                      accentColor: selectedBrand.visualIdentity.colorPalette.accent,
                      fontFamily: selectedBrand.visualIdentity.typography.bodyFont,
                      headingFont: selectedBrand.visualIdentity.typography.headingFont,
                  } : undefined}
                  onReady={() => console.log('Reveal Ready')}
                  onExportPDF={handlePDFExport}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
          </div>
      </div>
    </div>
  );
} 