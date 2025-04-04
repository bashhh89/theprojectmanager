'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Plus, FileText, Globe } from 'lucide-react';
import { useBrandStore } from '@/store/brandStore';
import { useProposalStore, type ProposalSection } from '@/store/proposalStore';
import { useProductStore, type Product } from '@/store/productStore';
import { toasts } from '@/components/ui/toast-wrapper';

interface ClientMetadata {
  companyName: string;
  companySize?: string;
  industry?: string;
  contact?: string;
  website?: string;
  primaryGoal?: string;
}

export default function CreateProposalPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<'client' | 'services' | 'sections' | 'branding' | 'review'>('client');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScrapingWebsite, setIsScrapingWebsite] = useState(false);
  
  // Proposal data
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientLogo, setClientLogo] = useState('');
  const [clientMetadata, setClientMetadata] = useState<ClientMetadata>({
    companyName: '',
    companySize: '',
    industry: '',
    contact: '',
    website: '',
    primaryGoal: ''
  });
  const [sections, setSections] = useState<ProposalSection[]>([
    { title: 'Introduction', content: '', layout: 'full-width' },
    { title: 'Objectives', content: '', layout: 'two-column' },
    { title: 'Services', content: '', layout: 'image-left' },
    { title: 'Process', content: '', layout: 'image-right' },
    { title: 'Pricing', content: '', layout: 'two-column' }
  ]);
  
  // Brand data
  const { brands, activeBrandId, getActiveBrand } = useBrandStore();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>("none");
  
  // Product data
  const { products, fetchProducts } = useProductStore();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // Access proposal store for CRUD operations
  const { createProposal } = useProposalStore();
  
  // Set up mounted state
  useEffect(() => {
    setMounted(true);
    
    // Use the active brand as default if available
    if (activeBrandId) {
      setSelectedBrandId(activeBrandId);
    }
    
    // Fetch products
    fetchProducts();
  }, [activeBrandId, fetchProducts]);
  
  if (!mounted) {
    return <div className="container py-8">Loading proposal creator...</div>;
  }
  
  // Handle toggling a product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  // Get the selected brand profile
  const brandProfile = selectedBrandId ? brands.find(brand => brand.id === selectedBrandId) : null;
  
  // Add a function to handle website scraping
  const handleScrapeWebsite = async () => {
    if (!clientMetadata.website) {
      toasts.error('Please enter a website URL');
      return;
    }
    
    // Ensure the URL has a protocol
    let websiteUrl = clientMetadata.website;
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      websiteUrl = `https://${websiteUrl}`;
      // Update the website URL with protocol
      setClientMetadata(prev => ({
        ...prev,
        website: websiteUrl
      }));
    }
    
    setIsScrapingWebsite(true);
    
    try {
      // Call API to scrape website
      const response = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: websiteUrl 
        }),
      });
      
      if (!response.ok) {
        // Try to get more detailed error information
        const errorData = await response.json().catch(() => ({ error: 'Failed to scrape website' }));
        throw new Error(errorData.details || errorData.error || `Error ${response.status}: Failed to scrape website`);
      }
      
      const data = await response.json();
      console.log('Scraped data:', data);
      
      // Check if this was a limited/proxy scrape
      const isLimitedData = !!data.note?.includes("Limited data");
      
      // Update client metadata with scraped data
      if (data.scrapedData) {
        const { title, description, industryHints, logoUrl } = data.scrapedData;
        const analysis = data.analysis || {};
        
        // Update client name if empty
        if (!clientName && title) {
          setClientName(title);
        }
        
        // Update title if empty
        if (!title && title) {
          setTitle(`${title} Proposal`);
        } else if (!title) {
          setTitle('Business Proposal');
        }
        
        // Update logo if available and client logo not already set
        if (logoUrl && !clientLogo) {
          setClientLogo(logoUrl);
          toasts.success('Logo found and imported');
        }
        
        // Update industry
        const detectedIndustry = industryHints?.length ? industryHints[0] : analysis.industry || '';
        if (detectedIndustry) {
          setClientMetadata(prev => ({
            ...prev,
            industry: detectedIndustry,
            companyName: prev.companyName || title || '',
          }));
        }
        
        // Update business goals/focus
        if (analysis && analysis.businessFocus) {
          setClientMetadata(prev => ({
            ...prev,
            primaryGoal: analysis.businessFocus
          }));
        }
        
        if (isLimitedData) {
          toasts.info('Limited website data was imported - you may need to fill in some details manually');
        } else {
          toasts.success('Website data imported successfully');
        }
      } else {
        toasts.info('Limited data was found on this website');
      }
    } catch (error: any) {
      console.error('Error scraping website:', error);
      
      // Show more specific error messages
      if (error.message?.includes('timed out') || error.message?.includes('ETIMEDOUT')) {
        toasts.error('Website took too long to respond. Try again or enter details manually.');
      } else if (error.message?.includes('Invalid URL')) {
        toasts.error('Please enter a valid website URL (include https://)');
      } else if (error.message?.includes('fetch failed')) {
        toasts.error('Network error when fetching website. Check your internet connection.');
      } else {
        toasts.error(`Website scraping failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsScrapingWebsite(false);
    }
  };
  
  // Fix the generateProposalContent function to properly handle errors
  const generateProposalContent = async () => {
    setIsGenerating(true);
    
    try {
      // First confirm we have the minimum required data
      if (!clientName) {
        toasts.error('Please enter a client name');
        setIsGenerating(false);
        return;
      }
      
      // Prepare the data for AI generation with more details
      const promptData = {
        clientName,
        clientIndustry: clientMetadata.industry || 'business',
        clientGoals: clientMetadata.primaryGoal || 'improve business operations',
        sections: sections.map(s => s.title),
        clientWebsite: clientMetadata.website,
        companySize: clientMetadata.companySize
      };
      
      console.log('Sending data to generate proposal:', promptData);
      
      // Call the AI generation endpoint with better error handling
      const response = await fetch('/api/generate-proposal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData)
      });
      
      // Log the raw response for debugging
      console.log('AI generation status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Try to parse as JSON, fall back to plain text if needed
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown server error' };
        }
        
        throw new Error(errorData.error || `Server error (${response.status})`);
      }
      
      const data = await response.json();
      console.log('AI generation response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate proposal content');
      }
      
      // Update sections with generated content
      if (data.sections && Array.isArray(data.sections)) {
        const newSections = [...sections];
        
        // Loop through each section and update content
        data.sections.forEach((content: string, index: number) => {
          if (index < newSections.length) {
            newSections[index].content = content;
          }
        });
        
        setSections(newSections);
        toasts.success('Proposal content generated successfully');
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (error: any) {
      console.error('Error generating proposal content:', error);
      toasts.error(`Generation failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Navigation functions
  const nextStep = () => {
    if (currentStep === 'client') {
      if (!clientName.trim()) {
        toasts.error('Please enter a client name');
        return;
      }
      if (!title.trim()) {
        // Use client name as title if not provided
        setTitle(`${clientName} Proposal`);
      }
      setCurrentStep('services');
    } else if (currentStep === 'services') {
      setCurrentStep('sections');
    } else if (currentStep === 'sections') {
      setCurrentStep('branding');
    } else if (currentStep === 'branding') {
      setCurrentStep('review');
    }
  };
  
  const prevStep = () => {
    if (currentStep === 'services') {
      setCurrentStep('client');
    } else if (currentStep === 'sections') {
      setCurrentStep('services');
    } else if (currentStep === 'branding') {
      setCurrentStep('sections');
    } else if (currentStep === 'review') {
      setCurrentStep('branding');
    }
  };
  
  // Handle section updates
  const updateSection = (index: number, field: keyof ProposalSection, value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = { ...updatedSections[index], [field]: value };
    setSections(updatedSections);
  };
  
  // Add a new section
  const addSection = () => {
    setSections([...sections, { title: 'New Section', content: '', layout: 'full-width' }]);
  };
  
  // Remove a section
  const removeSection = (index: number) => {
    if (sections.length <= 1) {
      toasts.error('You need at least one section');
      return;
    }
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    setSections(updatedSections);
  };
  
  // Save the proposal
  const handleSaveProposal = async () => {
    if (!clientName.trim()) {
      toasts.error('Please enter a client name');
      return;
    }
    
    if (!title.trim()) {
      toasts.error('Please enter a proposal title');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create the proposal data
      const proposalData = {
        title,
        clientName,
        clientLogo,
        sections,
        brandProfile: selectedBrandId && selectedBrandId !== "none" ? getActiveBrand() : undefined,
        status: 'draft' as const,
        // Include selected products
        products: selectedProductIds
      };
      
      // Save to the database
      const proposalId = await createProposal(proposalData);
      
      toasts.success('Proposal saved successfully');
      
      // Navigate to the proposals list
      router.push('/proposals');
    } catch (error) {
      console.error('Error saving proposal:', error);
      toasts.error('Failed to save proposal');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render step indicators
  const renderStepIndicator = () => {
    const steps = [
      { id: 'client', label: 'Client Details' },
      { id: 'services', label: 'Services & Goals' },
      { id: 'sections', label: 'Proposal Sections' },
      { id: 'branding', label: 'Branding' },
      { id: 'review', label: 'Review & Generate' }
    ];
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center ${
                step.id === currentStep 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  step.id === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <span className="text-sm">{step.label}</span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="w-full h-px bg-border mx-2 mt-4" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'client':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Client Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proposal-title">Proposal Title</Label>
                  <Input 
                    id="proposal-title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Business Services Proposal"
                  />
                </div>
                
                <div>
                  <Label htmlFor="client-name">Client Name</Label>
                  <Input 
                    id="client-name" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Company Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="client-logo">Client Logo URL (Optional)</Label>
                  <Input 
                    id="client-logo" 
                    value={clientLogo} 
                    onChange={(e) => setClientLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                  {clientLogo && (
                    <div className="mt-2 p-2 border rounded flex justify-center">
                      <img 
                        src={clientLogo} 
                        alt={`${clientName} logo`} 
                        className="max-h-16 object-contain"
                        onError={() => {
                          toasts.error('Failed to load logo image');
                          setClientLogo('');
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client-industry">Industry</Label>
                  <Input 
                    id="client-industry" 
                    value={clientMetadata.industry || ''} 
                    onChange={(e) => setClientMetadata({...clientMetadata, industry: e.target.value})}
                    placeholder="Technology, Healthcare, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="client-website">Client Website (Optional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="client-website" 
                      value={clientMetadata.website || ''} 
                      onChange={(e) => setClientMetadata({
                        ...clientMetadata,
                        website: e.target.value
                      })}
                      placeholder="https://example.com"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleScrapeWebsite}
                      disabled={isScrapingWebsite || !clientMetadata.website}
                    >
                      {isScrapingWebsite ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Globe className="h-4 w-4 mr-2" />
                      )}
                      Import
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="client-contact">Primary Contact</Label>
                  <Input 
                    id="client-contact" 
                    value={clientMetadata.contact || ''} 
                    onChange={(e) => setClientMetadata({...clientMetadata, contact: e.target.value})}
                    placeholder="John Doe, CEO"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'services':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Services & Client Goals</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="primary-goal">Primary Goal</Label>
                  <Input 
                    id="primary-goal" 
                    value={clientMetadata.primaryGoal || ''} 
                    onChange={(e) => setClientMetadata({...clientMetadata, primaryGoal: e.target.value})}
                    placeholder="What's the main objective for this client?"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company-size">Company Size</Label>
                  <Select
                    onValueChange={(value) => setClientMetadata({...clientMetadata, companySize: value})}
                    value={clientMetadata.companySize || 'unknown'}
                  >
                    <SelectTrigger id="company-size">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                      <SelectItem value="small">Small (11-50 employees)</SelectItem>
                      <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                      <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="services-overview">Services Overview</Label>
                  <Textarea 
                    id="services-overview" 
                    rows={4}
                    placeholder="Describe the main services you're proposing for this client..."
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Include Products</h3>
              <p className="text-muted-foreground mb-4">
                Select products from your catalog to include in this proposal
              </p>
              
              {products.length === 0 ? (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">
                        No products available. Create products first to include them in proposals.
                      </p>
                      <Button variant="outline" onClick={() => router.push('/products/create')}>
                        Create Products
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(product => (
                    <Card 
                      key={product.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedProductIds.includes(product.id) 
                        ? 'border-primary bg-primary/5' 
                        : ''
                      }`}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <div className="w-5 h-5 rounded-full border">
                            {selectedProductIds.includes(product.id) && (
                              <div className="w-full h-full rounded-full bg-primary"></div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        {product.pricingModel && product.pricingModel.length > 0 && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 text-xs bg-muted rounded">
                              {typeof product.pricingModel[0].price === 'number'
                                ? `$${product.pricingModel[0].price}`
                                : product.pricingModel[0].price}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'sections':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Proposal Sections</h2>
              <Button variant="outline" onClick={generateProposalContent} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-6">
              {sections.map((section, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <Input 
                          value={section.title} 
                          onChange={(e) => updateSection(index, 'title', e.target.value)}
                          className="font-semibold text-lg"
                        />
                      </div>
                      <div className="flex items-center ml-4">
                        <Select
                          value={section.layout || 'full-width'}
                          onValueChange={(value: any) => updateSection(index, 'layout', value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Layout" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-width">Full Width</SelectItem>
                            <SelectItem value="two-column">Two Column</SelectItem>
                            <SelectItem value="image-left">Image Left</SelectItem>
                            <SelectItem value="image-right">Image Right</SelectItem>
                            <SelectItem value="centered">Centered</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeSection(index)}
                          className="ml-2"
                        >
                          <span className="sr-only">Remove</span>
                          <span className="text-xl text-muted-foreground">×</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={section.content} 
                      onChange={(e) => updateSection(index, 'content', e.target.value)}
                      rows={6}
                      placeholder="Enter section content here..."
                    />
                    {(section.layout === 'image-left' || section.layout === 'image-right') && (
                      <div className="mt-2">
                        <Label htmlFor={`image-url-${index}`}>Image URL</Label>
                        <Input 
                          id={`image-url-${index}`}
                          value={section.imageUrl || ''}
                          onChange={(e) => updateSection(index, 'imageUrl', e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                variant="outline" 
                onClick={addSection}
                className="w-full py-6"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>
          </div>
        );
      
      case 'branding':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Branding & Visual Identity</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Select Brand Profile</CardTitle>
                <CardDescription>
                  Choose a brand profile to apply to this proposal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brands.length > 0 ? (
                  <Select
                    value={selectedBrandId || 'none'}
                    onValueChange={setSelectedBrandId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">No brand profiles found</p>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/company')}
                    >
                      Create Brand Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {brandProfile && selectedBrandId !== 'none' && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Brand: {brandProfile.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Colors</h3>
                      <div className="flex flex-wrap gap-2">
                        <div>
                          <div 
                            className="w-10 h-10 rounded border" 
                            style={{backgroundColor: brandProfile.visualIdentity.colorPalette.primary}}
                          />
                          <span className="text-xs">Primary</span>
                        </div>
                        <div>
                          <div 
                            className="w-10 h-10 rounded border" 
                            style={{backgroundColor: brandProfile.visualIdentity.colorPalette.secondary}}
                          />
                          <span className="text-xs">Secondary</span>
                        </div>
                        <div>
                          <div 
                            className="w-10 h-10 rounded border" 
                            style={{backgroundColor: brandProfile.visualIdentity.colorPalette.accent}}
                          />
                          <span className="text-xs">Accent</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Typography</h3>
                      <p className="text-sm">
                        Headings: {brandProfile.visualIdentity.typography.headingFont}
                      </p>
                      <p className="text-sm">
                        Body: {brandProfile.visualIdentity.typography.bodyFont}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">Review & Save</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/20">
                  <h3 className="text-lg font-medium mb-2">Client Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Client</dt>
                      <dd className="font-medium">{clientName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Industry</dt>
                      <dd className="font-medium">{clientMetadata.industry || 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Primary Goal</dt>
                      <dd className="font-medium">{clientMetadata.primaryGoal || 'Not specified'}</dd>
                    </div>
                  </dl>
                </div>
                
                <div className="p-4 border rounded-md bg-muted/20">
                  <h3 className="text-lg font-medium mb-2">Proposal Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Title</dt>
                      <dd className="font-medium">{title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Sections</dt>
                      <dd className="font-medium">{sections.length} sections</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Brand Profile</dt>
                      <dd className="font-medium">{brandProfile && selectedBrandId !== 'none' ? brandProfile.name : 'None'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Products</dt>
                      <dd className="font-medium">{selectedProductIds.length} selected</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-4">Section Overview</h3>
                  <ul className="space-y-2">
                    {sections.map((section, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{section.title}</span>
                        <span className="text-muted-foreground text-sm">
                          {section.layout || 'default'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {selectedProductIds.length > 0 && (
                  <div className="p-4 border rounded-md">
                    <h3 className="text-lg font-medium mb-4">Products</h3>
                    <ul className="space-y-2">
                      {products
                        .filter(p => selectedProductIds.includes(p.id))
                        .map(product => (
                          <li key={product.id} className="flex justify-between">
                            <span>{product.name}</span>
                            <span className="text-muted-foreground text-sm">
                              {product.pricingModel && product.pricingModel.length > 0
                                ? `$${product.pricingModel[0].price}`
                                : ''}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-start gap-2 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push('/proposals')}>
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Proposal</h1>
          <p className="text-muted-foreground">Create a professional proposal for your client</p>
        </div>
      </div>
      
      {renderStepIndicator()}
      
      <div className="bg-card border rounded-lg p-6 mb-8">
        {renderCurrentStep()}
      </div>
      
      <div className="flex justify-between">
        {currentStep !== 'client' && (
          <Button variant="outline" onClick={prevStep}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous Step
          </Button>
        )}
        
        <div className="ml-auto flex gap-3">
          {currentStep === 'review' ? (
            <Button onClick={handleSaveProposal} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Proposal'
              )}
            </Button>
          ) : (
            <Button onClick={nextStep}>
              Next Step
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 