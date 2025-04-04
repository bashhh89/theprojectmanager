'use client';

import React, { useState, useEffect } from 'react';
import RevealPresentation from '@/components/presentation/RevealPresentation';
import { useBrandStore } from '@/store/brandStore';
import { useSearchParams } from 'next/navigation';
import { toasts } from '@/components/ui/toast-wrapper';
import { BrandProfile } from '@/types/brand';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Loader2, 
  FileText, 
  Briefcase, 
  Save, 
  Share2, 
  Copy,
  ChevronRight,
  ChevronLeft,
  Layout,
  Users,
  Settings,
  Check
} from 'lucide-react';
import { marked } from 'marked';
import { usePresentationStore, type SlideData } from '@/store/presentationStore';

type PresentationType = 'general' | 'proposal';
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type ContentLength = 'short' | 'medium' | 'long';
type TargetAudience = 'general' | 'technical' | 'business' | 'academic' | 'creative';
type PresentationStyle = 'formal' | 'casual' | 'modern' | 'classic' | 'minimalist';
type WizardStep = 'type' | 'info' | 'content' | 'style' | 'review';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  settings: {
    type: PresentationType;
    contentLength: ContentLength;
    targetAudience: TargetAudience;
    presentationStyle: PresentationStyle;
    recommendedSlides: number;
  };
}

interface ClientMetadata {
  companyName: string;
  industry?: string;
  website?: string;
  linkedInUrl?: string;
  recipientName?: string;
  recipientRole?: string;
  primaryGoal?: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'business-pitch',
    name: 'Business Pitch',
    description: 'Perfect for pitching your business to investors',
    icon: <Briefcase className="w-8 h-8" />,
    settings: {
      type: 'proposal',
      contentLength: 'medium',
      targetAudience: 'business',
      presentationStyle: 'formal',
      recommendedSlides: 10
    }
  },
  {
    id: 'tech-presentation',
    name: 'Technical Overview',
    description: 'Ideal for technical presentations and product demos',
    icon: <Layout className="w-8 h-8" />,
    settings: {
      type: 'general',
      contentLength: 'long',
      targetAudience: 'technical',
      presentationStyle: 'modern',
      recommendedSlides: 15
    }
  },
  {
    id: 'quick-pitch',
    name: 'Quick Pitch',
    description: 'Short and impactful presentation for brief meetings',
    icon: <FileText className="w-8 h-8" />,
    settings: {
      type: 'proposal',
      contentLength: 'short',
      targetAudience: 'business',
      presentationStyle: 'minimalist',
      recommendedSlides: 5
    }
  }
];

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<PresentationType>('general');
  const [selectedBrand, setSelectedBrand] = useState<BrandProfile | null>(null);
  const [applyBrandStyling, setApplyBrandStyling] = useState(true);
  const [slideCount, setSlideCount] = useState(10);
  const [contentLength, setContentLength] = useState<ContentLength>('medium');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareExpiry, setShareExpiry] = useState(24); // hours
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('general');
  const [presentationStyle, setPresentationStyle] = useState<PresentationStyle>('modern');
  const [currentStep, setCurrentStep] = useState<WizardStep>('type');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewSlide, setPreviewSlide] = useState<SlideData | null>(null);
  const [clientMetadata, setClientMetadata] = useState<ClientMetadata>({
    companyName: '',
    industry: '',
    website: '',
    linkedInUrl: '',
    recipientName: '',
    recipientRole: '',
    primaryGoal: ''
  });
  
  const { selectBrand } = useBrandStore();
  const { createPresentation, generateShareLink } = usePresentationStore();
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
  
  // Function to generate a preview slide (Moved BEFORE useEffect that calls it)
  const generatePreviewSlide = () => {
    if (!selectedTemplate) return;
    
    // Create style-specific preview content
    let layout: 'text-only' | 'background' | 'split-left' | 'split-right' = 'text-only';
    let backgroundColor: string | undefined = selectedBrand?.visualIdentity.colorPalette.background;
    let textColor: string | undefined = selectedBrand?.visualIdentity.colorPalette.text;
    let accentColor: string | undefined = selectedBrand?.visualIdentity.colorPalette.accent;
    let fontFamily: string | undefined = selectedBrand?.visualIdentity.typography.bodyFont;
    let headingFont: string | undefined = selectedBrand?.visualIdentity.typography.headingFont;
    let content = '';
    let imagePrompt = '';
    
    // Style-specific settings
    switch (presentationStyle) {
      case 'formal':
        layout = 'text-only';
        backgroundColor = backgroundColor || '#001428';
        textColor = textColor || '#ffffff';
        content = `
# ${topic || "Professional Presentation"}

## Formal Business Style

- Clean, structured layout design
- Professional corporate appearance
- Optimized for ${targetAudience} audience
- Ideal for business presentations
        `;
        break;
        
      case 'casual':
        layout = 'split-right';
        backgroundColor = backgroundColor || '#f5f5f7';
        textColor = textColor || '#333333';
        content = `
# ${topic || "Friendly Approach"}

- Approachable and conversational tone
- Relaxed visual elements
- Easy-to-follow structure
- Perfect for team meetings
        `;
        // Reliable placeholder image
        imagePrompt = `Casual friendly business meeting, relaxed setting, bright colors`;
        break;
        
      case 'modern':
        layout = 'background';
        backgroundColor = backgroundColor || '#111111';
        textColor = textColor || '#ffffff';
        content = `
# ${topic || "Modern Design"}

- Contemporary visual elements
- Bold typography and contrast
- Dynamic content presentation
- Cutting-edge appearance
        `;
        imagePrompt = `Modern abstract geometric background, tech style, dark theme`;
        break;
        
      case 'classic':
        layout = 'split-left';
        backgroundColor = backgroundColor || '#f8f1e3';
        textColor = textColor || '#222222';
        content = `
# ${topic || "Classic Approach"}

- Timeless design elements
- Traditional presentation structure
- Elegant typography
- Proven communication methods
        `;
        imagePrompt = `Classic elegant design, traditional business, soft colors`;
        break;
        
      case 'minimalist':
        layout = 'background';
        backgroundColor = backgroundColor || '#ffffff';
        textColor = textColor || '#000000';
        content = `
# ${topic || "Minimalist Design"}

- Clean, uncluttered layout
- Focus on essential information
- Ample white space
- Simplified visual language
        `;
        imagePrompt = `Minimalist design, subtle gradient, very light pattern, white space`;
        break;
    }
    
    // Create reliable image URLs based on style (using placeholder service)
    let imageUrl;
    if (layout !== 'text-only') {
      // Use placeholder.com for reliable image placeholders
      switch (presentationStyle) {
        case 'casual':
          imageUrl = 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&auto=format&fit=crop&q=60';
          break;
        case 'modern':
          imageUrl = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&auto=format&fit=crop&q=60';
          break;
        case 'classic':
          imageUrl = 'https://images.unsplash.com/photo-1614036634955-ae5e90f9b9eb?w=800&auto=format&fit=crop&q=60';
          break;
        case 'minimalist':
          imageUrl = 'https://images.unsplash.com/photo-1536566482680-fca31930a0bd?w=800&auto=format&fit=crop&q=60';
          break;
        default:
          imageUrl = `https://placehold.co/800x600/${backgroundColor?.replace('#', '')}/${textColor?.replace('#', '')}?text=${encodeURIComponent(presentationStyle)}`;
      }
    }
    
    // Create the preview slide
    const previewContent: SlideData = {
      title: "Style Preview",
      content,
      layout,
      imagePrompt,
      backgroundColor,
      textColor,
      accentColor,
      fontFamily,
      headingFont,
      // Use the reliable image URL
      image: imageUrl,
      // Add style property matching presentation style
      style: presentationStyle.toLowerCase().replace(' & ', '-'),
    };

    setPreviewSlide(previewContent);
  };

  // Update preview when settings change (Moved BEFORE early return)
  useEffect(() => {
    generatePreviewSlide();
  }, [selectedTemplate, presentationStyle, targetAudience, contentLength, slideCount, topic]);
  
  // Update clientMetadata when relevant inputs change
  useEffect(() => {
    if (selectedType === 'proposal') {
      setClientMetadata(prev => ({
        ...prev,
        companyName: clientName,
        primaryGoal: projectGoal
      }));
    } else {
      // For general presentations, use topic as a reference
      setClientMetadata(prev => ({
        ...prev,
        companyName: '', // Clear company name for general presentations
        primaryGoal: topic
      }));
    }
  }, [clientName, projectGoal, topic, selectedType]);
  
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
    setSaveStatus('idle');
    setSaveError(null);
    setShareLink(null);
    
    try {
      const requestBody = {
        presentationType: selectedType,
        ...(selectedType === 'general' && { topic }),
        ...(selectedType === 'proposal' && { clientName, projectGoal }),
        audience,
        additionalInfo,
        brandProfile: selectedBrand,
        slideCount,
        contentLength,
        clientMetadata // Add client metadata to the request
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

      if (!data.slides || !Array.isArray(data.slides) || data.slides.length === 0) {
        throw new Error('No slides were generated. Please try again.');
      }

      // Process the slides - Note: Keep raw markdown content, don't parse with marked
      const processedSlides = data.slides.map((slide: any) => ({
          title: slide.title || 'Untitled',
        content: slide.content || '', // Keep as raw markdown
        layout: slide.layout || 'text-only',
          imagePrompt: slide.layout !== 'text-only' ? slide.imagePrompt : undefined,
          image: undefined 
      }));
      
      // Apply brand styling if available
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
      toasts.success('Presentation generated successfully!');

    } catch (error) {
      console.error('Error generating slides:', error);
      toasts.error(`Failed to generate presentation: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePDFExport = () => {
    setIsExporting(true);
    toasts.success('PDF export functionality is not yet implemented.');
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleSavePresentation = async () => {
    setSaveStatus('saving');
    setSaveError(null);
    
    try {
      const presentationData = {
        title: selectedType === 'general' ? topic : `${clientName} Proposal`,
        type: selectedType,
        slides: slides.map(slide => ({
          ...slide
        })),
        brandProfile: selectedBrand,
        slideCount: slides.length,
        contentLength
      };
      
      console.log("Saving presentation:", presentationData);
      
      const id = await createPresentation(presentationData);
      console.log("Saved presentation with ID:", id);
      
      setSaveStatus('saved');
      
      // Generate share link automatically after saving
      generateShareLink(id);
      
    } catch (error: unknown) {
      console.error("Error saving presentation:", error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : String(error));
    }
  };

  const copyShareLink = () => {
    if (!shareLink) return;
    
    try {
      navigator.clipboard.writeText(shareLink);
      toasts.success("Share link copied to clipboard!");
    } catch (err: unknown) {
      console.error("Failed to copy:", err);
      toasts.error(`Failed to copy: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Function to apply template settings
  const applyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setSelectedType(template.settings.type);
    setContentLength(template.settings.contentLength);
    setTargetAudience(template.settings.targetAudience);
    setPresentationStyle(template.settings.presentationStyle);
    setSlideCount(template.settings.recommendedSlides);
  };

  const nextStep = () => {
    switch (currentStep) {
      case 'type':
        setCurrentStep('info');
        break;
      case 'info':
        setCurrentStep('content');
        break;
      case 'content':
        setCurrentStep('style');
        break;
      case 'style':
        setCurrentStep('review');
        break;
      default:
        break;
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'info':
        setCurrentStep('type');
        break;
      case 'content':
        setCurrentStep('info');
        break;
      case 'style':
        setCurrentStep('content');
        break;
      case 'review':
        setCurrentStep('style');
        break;
      default:
        break;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {['type', 'info', 'content', 'style', 'review'].map((step, index) => (
        <div key={step} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === step 
                ? 'bg-primary text-white' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {index + 1}
          </div>
          {index < 4 && (
            <div className={`w-8 h-0.5 ${
              index < ['type', 'info', 'content', 'style', 'review'].indexOf(currentStep)
                ? 'bg-primary'
                : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'type':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Choose a Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`p-6 rounded-lg border ${
                    selectedTemplate?.id === template.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  } text-left transition-all`}
                >
                  <div className="mb-4">{template.icon}</div>
                  <h3 className="text-lg font-medium mb-2">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Or Start from Scratch</h3>
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
          </div>
        );

      case 'info':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {selectedType === 'general' ? 'Presentation Information' : 'Client Information'}
            </h2>
            
            {selectedType === 'general' ? (
              <div>
                <Label htmlFor="topic">Presentation Topic</Label>
                <Input 
                  id="topic" 
                  placeholder="E.g., Future of AI" 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  required 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="clientName">Client Name/Company</Label>
                  <Input 
                      id="clientName"
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)} 
                      placeholder="Enter client company name"
                      className="w-full"
                  />
                </div>
                <div>
                    <Label htmlFor="clientIndustry">Industry</Label>
                  <Input 
                      id="clientIndustry"
                      value={clientMetadata.industry || ''}
                      onChange={(e) => setClientMetadata(prev => ({...prev, industry: e.target.value}))}
                      placeholder="Client's industry (optional)"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientWebsite">Website URL (optional)</Label>
                    <Input
                      id="clientWebsite"
                      value={clientMetadata.website || ''}
                      onChange={(e) => setClientMetadata(prev => ({...prev, website: e.target.value}))}
                      placeholder="https://example.com"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientLinkedIn">LinkedIn URL (optional)</Label>
                    <Input
                      id="clientLinkedIn"
                      value={clientMetadata.linkedInUrl || ''}
                      onChange={(e) => setClientMetadata(prev => ({...prev, linkedInUrl: e.target.value}))}
                      placeholder="https://linkedin.com/company/..."
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientName">Primary Contact Name</Label>
                    <Input
                      id="recipientName"
                      value={clientMetadata.recipientName || ''}
                      onChange={(e) => setClientMetadata(prev => ({...prev, recipientName: e.target.value}))}
                      placeholder="Who will receive this proposal?"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipientRole">Contact Role/Title</Label>
                    <Input
                      id="recipientRole"
                      value={clientMetadata.recipientRole || ''}
                      onChange={(e) => setClientMetadata(prev => ({...prev, recipientRole: e.target.value}))}
                      placeholder="e.g., CTO, Marketing Director"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="projectGoal">Project Goal / Client Need</Label>
                  <Textarea
                    id="projectGoal"
                    value={projectGoal} 
                    onChange={(e) => setProjectGoal(e.target.value)} 
                    placeholder="Describe the client's primary needs or goals for this project"
                    className="min-h-[100px]"
                  />
                </div>
                
            <div>
                  <Label htmlFor="additionalInfo">Additional Information (optional)</Label>
              <Textarea 
                    id="additionalInfo"
                value={additionalInfo} 
                onChange={(e) => setAdditionalInfo(e.target.value)} 
                    placeholder="Any additional context that would help personalize the proposal"
                    className="min-h-[100px]"
              />
            </div>
              </div>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Content Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-md bg-muted">
                <h3 className="text-lg font-medium mb-4">Slide Count</h3>
                <div>
                  <Label htmlFor="slide-count">Number of Slides: {slideCount}</Label>
                  <Slider
                    id="slide-count"
                    min={5}
                    max={30}
                    step={1}
                    value={[slideCount]}
                    onValueChange={([value]) => setSlideCount(value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div className="p-4 border rounded-md bg-muted">
                <h3 className="text-lg font-medium mb-4">Content Density</h3>
                <div>
                  <Label htmlFor="content-length">Content Length</Label>
                  <Select value={contentLength} onValueChange={(value: ContentLength) => setContentLength(value)}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select content length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (Brief points)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="long">Long (Detailed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'style':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Style Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-md bg-muted">
                <h3 className="text-lg font-medium mb-4">Audience & Style</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="target-audience">Target Audience</Label>
                    <Select value={targetAudience} onValueChange={(value: TargetAudience) => setTargetAudience(value)}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Public</SelectItem>
                        <SelectItem value="technical">Technical Professionals</SelectItem>
                        <SelectItem value="business">Business Executives</SelectItem>
                        <SelectItem value="academic">Academic Audience</SelectItem>
                        <SelectItem value="creative">Creative Industry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="presentation-style">Presentation Style</Label>
                    <Select value={presentationStyle} onValueChange={(value: PresentationStyle) => setPresentationStyle(value)}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select presentation style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal & Professional</SelectItem>
                        <SelectItem value="casual">Casual & Friendly</SelectItem>
                        <SelectItem value="modern">Modern & Dynamic</SelectItem>
                        <SelectItem value="classic">Classic & Traditional</SelectItem>
                        <SelectItem value="minimalist">Clean & Minimalist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-md bg-muted">
                <h3 className="text-lg font-medium mb-4">Brand Settings</h3>
                {selectedBrand ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{selectedBrand.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Apply brand colors and typography
                        </p>
                      </div>
                      <Switch 
                        checked={applyBrandStyling} 
                        onCheckedChange={setApplyBrandStyling} 
                      />
                    </div>
                    {applyBrandStyling && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-background">
                          <div className="text-xs text-muted-foreground mb-1">Primary Color</div>
                          <div 
                            className="w-full h-6 rounded" 
                            style={{ backgroundColor: selectedBrand.visualIdentity.colorPalette.primary }}
                          />
                        </div>
                        <div className="p-2 rounded bg-background">
                          <div className="text-xs text-muted-foreground mb-1">Accent Color</div>
                          <div 
                            className="w-full h-6 rounded" 
                            style={{ backgroundColor: selectedBrand.visualIdentity.colorPalette.accent }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No brand selected. Your presentation will use default styling.
                  </p>
                )}
              </div>
            </div>
            {previewSlide && (
              <div className="mt-6">
                <h3 className="text-2xl font-semibold mb-4">Preview</h3>
                <div className="aspect-video relative overflow-hidden rounded-lg border">
                  <RevealPresentation 
                    slides={[previewSlide]}
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
                    debug={true}
                    clientMetadata={clientMetadata}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Review & Generate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted">
                  <h3 className="text-lg font-medium mb-2">Content Summary</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Type</dt>
                      <dd className="font-medium">{selectedType === 'general' ? 'General Topic' : 'Sales Proposal'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Topic</dt>
                      <dd className="font-medium">{topic || clientName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Slides</dt>
                      <dd className="font-medium">{slideCount} slides</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Content Length</dt>
                      <dd className="font-medium capitalize">{contentLength}</dd>
                    </div>
                  </dl>
                </div>
                <div className="p-4 border rounded-md bg-muted">
                  <h3 className="text-lg font-medium mb-2">Style Summary</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Target Audience</dt>
                      <dd className="font-medium capitalize">{targetAudience}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Style</dt>
                      <dd className="font-medium capitalize">{presentationStyle}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Brand</dt>
                      <dd className="font-medium">{selectedBrand ? `${selectedBrand.name} (${applyBrandStyling ? 'Applied' : 'Not Applied'})` : 'None'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              {previewSlide && (
                <div className="aspect-video relative overflow-hidden rounded-lg border">
                  <RevealPresentation 
                    slides={[previewSlide]}
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
                    debug={true}
                    clientMetadata={clientMetadata}
                  />
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container py-8">
      <div className={`${showPresentation ? 'hidden' : 'block'}`}>
        <h1 className="text-3xl font-bold mb-6">AI Presentation Generator</h1>
        <p className="text-muted-foreground mb-8">
          Generate a professional presentation with AI assistance. Follow the steps below to customize your presentation.
        </p>
        
        {renderStepIndicator()}
        
        <div className="max-w-4xl mx-auto">
          {currentStep === 'type' && renderCurrentStep()}
          {currentStep === 'info' && renderCurrentStep()}
          {currentStep === 'content' && renderCurrentStep()}
          {currentStep === 'style' && renderCurrentStep()}
          {currentStep === 'review' && renderCurrentStep()}
          
          <div className="flex justify-between mt-8">
            {currentStep !== 'type' && (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous Step
              </Button>
            )}
            {currentStep === 'review' ? (
              <Button onClick={generateSlides} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Generate Presentation
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep} className="ml-auto">
                Next Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {showPresentation && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]">
          <div className="container h-full py-8 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => setShowPresentation(false)}>
                  Back to Editor
                </Button>
                <Button onClick={handleSavePresentation} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Presentation
                    </>
                  )}
                </Button>
              </div>
              {shareLink && (
                <div className="flex items-center gap-2">
                  <Input value={shareLink} readOnly className="w-96" />
                  <Button variant="outline" onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0" style={{ 
                aspectRatio: '16/9',
                maxHeight: 'calc(100vh - 8rem)',
                margin: '0 auto'
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
                  onExportPDF={handlePDFExport}
                  style={{
                    backgroundColor: 'black',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                  debug={true}
                  clientMetadata={clientMetadata}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 