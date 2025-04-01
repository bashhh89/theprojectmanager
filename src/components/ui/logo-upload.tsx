'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Wand2 } from 'lucide-react';
import Image from 'next/image';

interface LogoUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  className?: string;
}

export function LogoUpload({ value = '', onChange, onBlur, name, className }: LogoUploadProps) {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState(value);

  // Keep the form field value in sync with our internal state
  useEffect(() => {
    setLogoUrl(value);
  }, [value]);

  const handleChange = (url: string) => {
    setLogoUrl(url);
    if (onChange) {
      onChange(url);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to your API
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      handleChange(data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const generateLogos = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description for your logo');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedLogos([]);
    
    try {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) throw new Error('Generation failed');
      
      const data = await response.json();
      setGeneratedLogos(data.logos);
    } catch (error) {
      console.error('Error generating logos:', error);
      alert('Failed to generate logos. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectLogo = (url: string) => {
    handleChange(url);
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Logo
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Wand2 className="h-4 w-4 mr-2" />
            Generate with AI
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {logoUrl && (
              <div className="relative h-32 w-32 border rounded">
                <Image 
                  src={logoUrl} 
                  alt="Logo" 
                  fill 
                  className="object-contain p-2" 
                />
              </div>
            )}
            
            <div className="w-full">
              <Label htmlFor={`logo-upload-${name}`}>Upload Logo Image</Label>
              <Input
                id={`logo-upload-${name}`}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="mt-1"
                name={name}
                onBlur={onBlur}
              />
              {isUploading && (
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="generate" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor={`logo-prompt-${name}`}>Describe Your Logo</Label>
              <Input
                id={`logo-prompt-${name}`}
                placeholder="e.g., Modern tech company logo with blue and green colors"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={generateLogos} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              type="button"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Logos
                </>
              )}
            </Button>
            
            {generatedLogos.length > 0 && (
              <div className="mt-4">
                <Label>Select a Logo</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {generatedLogos.map((url, index) => (
                    <div 
                      key={index}
                      className={`relative h-40 border rounded p-2 cursor-pointer hover:border-primary transition-colors ${logoUrl === url ? 'border-primary ring-2 ring-primary/20' : ''}`}
                      onClick={() => selectLogo(url)}
                    >
                      <Image 
                        src={url} 
                        alt={`Generated logo ${index + 1}`} 
                        fill
                        className="object-contain p-2" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 