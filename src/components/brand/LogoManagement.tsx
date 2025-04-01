'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Wand2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { AnyComponent, InputProps, ButtonProps, LabelProps, IconProps, ImageProps } from '@/types/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Create wrapper components to fix linting errors
const InputWrapper: AnyComponent<InputProps> = (props: InputProps) => <Input {...props} />;
const ButtonWrapper: AnyComponent<ButtonProps> = (props: ButtonProps) => <Button {...props} />;
const LabelWrapper: AnyComponent<LabelProps> = (props: LabelProps) => <Label {...props} />;
const UploadWrapper: AnyComponent<IconProps> = (props: IconProps) => <Upload {...props} />;
const Wand2Wrapper: AnyComponent<IconProps> = (props: IconProps) => <Wand2 {...props} />;
const Loader2Wrapper: AnyComponent<IconProps> = (props: IconProps) => <Loader2 {...props} />;
const ImageWrapper: AnyComponent<ImageProps> = (props: ImageProps) => <Image {...props} />;

interface LogoManagementProps {
  primaryLogo: string;
  alternativeLogo: string;
  onPrimaryLogoChange: (url: string) => void;
  onAlternativeLogoChange: (url: string) => void;
}

export function LogoManagement({
  primaryLogo,
  alternativeLogo,
  onPrimaryLogoChange,
  onAlternativeLogoChange
}: LogoManagementProps) {
  // For primary logo
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState(primaryLogo || '');
  const [primaryLogoMode, setPrimaryLogoMode] = useState<'url' | 'upload' | 'generate'>('url');
  const [primaryLogoPrompt, setPrimaryLogoPrompt] = useState('');
  const [isGeneratingPrimary, setIsGeneratingPrimary] = useState(false);
  const [isUploadingPrimary, setIsUploadingPrimary] = useState(false);
  
  // For alternative logo
  const [alternativeLogoUrl, setAlternativeLogoUrl] = useState(alternativeLogo || '');
  const [alternativeLogoMode, setAlternativeLogoMode] = useState<'url' | 'upload' | 'generate'>('url');
  const [alternativeLogoPrompt, setAlternativeLogoPrompt] = useState('');
  const [isGeneratingAlternative, setIsGeneratingAlternative] = useState(false);
  const [isUploadingAlternative, setIsUploadingAlternative] = useState(false);
  
  useEffect(() => {
    setPrimaryLogoUrl(primaryLogo || '');
  }, [primaryLogo]);
  
  useEffect(() => {
    setAlternativeLogoUrl(alternativeLogo || '');
  }, [alternativeLogo]);
  
  // Handle primary logo URL change
  const handlePrimaryUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPrimaryLogoUrl(url);
    onPrimaryLogoChange(url);
  };
  
  // Handle alternative logo URL change
  const handleAlternativeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAlternativeLogoUrl(url);
    onAlternativeLogoChange(url);
  };
  
  // Handle primary logo upload
  const handlePrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingPrimary(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setPrimaryLogoUrl(data.url);
      onPrimaryLogoChange(data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingPrimary(false);
    }
  };
  
  // Handle alternative logo upload
  const handleAlternativeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAlternative(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setAlternativeLogoUrl(data.url);
      onAlternativeLogoChange(data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingAlternative(false);
    }
  };
  
  // Generate primary logo
  const generatePrimaryLogo = async () => {
    if (!primaryLogoPrompt.trim()) {
      alert('Please enter a prompt for the primary logo.');
      return;
    }
    
    setIsGeneratingPrimary(true);
    
    try {
      const response = await fetch('/api/generate-logo-pollinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: primaryLogoPrompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Generation failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.logos && data.logos.length > 0) {
        setPrimaryLogoUrl(data.logos[0]);
        onPrimaryLogoChange(data.logos[0]);
      } else {
        throw new Error('No logos returned from API');
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      alert(`Failed to generate logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPrimary(false);
    }
  };
  
  // Generate alternative logo
  const generateAlternativeLogo = async () => {
    if (!alternativeLogoPrompt.trim()) {
      alert('Please enter a prompt for the alternative logo.');
      return;
    }
    
    setIsGeneratingAlternative(true);
    
    try {
      const response = await fetch('/api/generate-logo-pollinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: alternativeLogoPrompt }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Generation failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.logos && data.logos.length > 0) {
        setAlternativeLogoUrl(data.logos[0]);
        onAlternativeLogoChange(data.logos[0]);
      } else {
        throw new Error('No logos returned from API');
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      alert(`Failed to generate logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingAlternative(false);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Primary Logo */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Primary Logo</h3>
        
        <div className="flex gap-4 items-center">
          {primaryLogoUrl && (
            <div className="relative h-24 w-24 border rounded bg-white">
              <ImageWrapper 
                src={primaryLogoUrl} 
                alt="Primary Logo" 
                width={96}
                height={96}
                className="object-contain w-full h-full p-2" 
              />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPrimaryLogoMode('url')}
                className={`px-2 py-1 text-sm rounded ${primaryLogoMode === 'url' ? 'bg-primary text-white' : 'bg-secondary'}`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setPrimaryLogoMode('upload')}
                className={`px-2 py-1 text-sm rounded flex items-center ${primaryLogoMode === 'upload' ? 'bg-primary text-white' : 'bg-secondary'}`}
              >
                <UploadWrapper className="h-3 w-3 mr-1" /> Upload
              </button>
              <button
                type="button"
                onClick={() => setPrimaryLogoMode('generate')}
                className={`px-2 py-1 text-sm rounded flex items-center ${primaryLogoMode === 'generate' ? 'bg-primary text-white' : 'bg-secondary'}`}
              >
                <Wand2Wrapper className="h-3 w-3 mr-1" /> Generate
              </button>
            </div>
            
            {primaryLogoMode === 'url' && (
              <InputWrapper
                placeholder="https://example.com/logo.png"
                value={primaryLogoUrl}
                onChange={handlePrimaryUrlChange}
              />
            )}
            
            {primaryLogoMode === 'upload' && (
              <div>
                <InputWrapper
                  type="file"
                  accept="image/*"
                  onChange={handlePrimaryUpload}
                  disabled={isUploadingPrimary}
                />
                {isUploadingPrimary && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Loader2Wrapper className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            )}
            
            {primaryLogoMode === 'generate' && (
              <div className="space-y-2">
                <InputWrapper
                  placeholder="Modern tech company logo with blue colors"
                  value={primaryLogoPrompt}
                  onChange={(e) => setPrimaryLogoPrompt(e.target.value)}
                />
                <ButtonWrapper 
                  type="button"
                  onClick={generatePrimaryLogo}
                  disabled={isGeneratingPrimary || !primaryLogoPrompt.trim()}
                  className="w-full"
                >
                  {isGeneratingPrimary ? (
                    <>
                      <Loader2Wrapper className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2Wrapper className="h-4 w-4 mr-2" />
                      Generate Logo
                    </>
                  )}
                </ButtonWrapper>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Alternative Logo */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Alternative Logo (Optional)</h3>
        
        <div className="flex gap-4 items-center">
          {alternativeLogoUrl && (
            <div className="relative h-24 w-24 border rounded bg-white">
              <ImageWrapper 
                src={alternativeLogoUrl} 
                alt="Alternative Logo" 
                width={96}
                height={96}
                className="object-contain w-full h-full p-2" 
              />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setAlternativeLogoMode('url')}
                className={`px-2 py-1 text-sm rounded ${alternativeLogoMode === 'url' ? 'bg-primary text-white' : 'bg-secondary'}`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setAlternativeLogoMode('upload')}
                className={`px-2 py-1 text-sm rounded flex items-center ${alternativeLogoMode === 'upload' ? 'bg-primary text-white' : 'bg-secondary'}`}
              >
                <UploadWrapper className="h-3 w-3 mr-1" /> Upload
              </button>
              <button
                type="button"
                onClick={() => setAlternativeLogoMode('generate')}
                className={`px-2 py-1 text-sm rounded flex items-center ${alternativeLogoMode === 'generate' ? 'bg-primary text-white' : 'bg-secondary'}`}
              >
                <Wand2Wrapper className="h-3 w-3 mr-1" /> Generate
              </button>
            </div>
            
            {alternativeLogoMode === 'url' && (
              <InputWrapper
                placeholder="https://example.com/logo-alt.png"
                value={alternativeLogoUrl}
                onChange={handleAlternativeUrlChange}
              />
            )}
            
            {alternativeLogoMode === 'upload' && (
              <div>
                <InputWrapper
                  type="file"
                  accept="image/*"
                  onChange={handleAlternativeUpload}
                  disabled={isUploadingAlternative}
                />
                {isUploadingAlternative && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Loader2Wrapper className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            )}
            
            {alternativeLogoMode === 'generate' && (
              <div className="space-y-2">
                <InputWrapper
                  placeholder="Modern tech company logo with white background"
                  value={alternativeLogoPrompt}
                  onChange={(e) => setAlternativeLogoPrompt(e.target.value)}
                />
                <ButtonWrapper 
                  type="button"
                  onClick={generateAlternativeLogo}
                  disabled={isGeneratingAlternative || !alternativeLogoPrompt.trim()}
                  className="w-full"
                >
                  {isGeneratingAlternative ? (
                    <>
                      <Loader2Wrapper className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2Wrapper className="h-4 w-4 mr-2" />
                      Generate Logo
                    </>
                  )}
                </ButtonWrapper>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 