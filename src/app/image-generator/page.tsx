'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store/settingsStore';
import { Loader2, Image as ImageIcon, Download, RefreshCw, ArrowLeft } from 'lucide-react';

const imageModels = [
  { id: 'flux', name: 'Flux - High Quality' },
  { id: 'turbo', name: 'Turbo - Fast Generation' },
];

const presetPrompts = [
  'A serene mountain landscape with a lake at sunset',
  'A futuristic city with flying cars and tall skyscrapers',
  'A photorealistic portrait of a cat wearing a space helmet',
  'An abstract painting with vibrant colors and geometric shapes',
  'A sci-fi spaceship in orbit around an alien planet'
];

const stylePresets = [
  { name: 'Photorealistic', prompt: 'photorealistic, detailed, high resolution' },
  { name: 'Cinematic', prompt: 'cinematic, film grain, dramatic lighting, movie still' },
  { name: 'Digital Art', prompt: 'digital art, vibrant colors, high contrast, detailed' },
  { name: 'Anime', prompt: 'anime style, cel shading, vibrant' },
  { name: 'Oil Painting', prompt: 'oil painting style, detailed brushstrokes, canvas texture' },
];

export default function ImageGeneratorPage() {
  const router = useRouter();
  const { darkMode, setDarkMode } = useSettingsStore();

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState('turbo');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageResults, setImageResults] = useState<{url: string, model: string, prompt: string, timestamp: number}[]>([]);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [numSteps, setNumSteps] = useState(30);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [seed, setSeed] = useState('');
  const [activeTab, setActiveTab] = useState('generate');

  // Ensure dark mode is applied
  useEffect(() => {
    if (!darkMode) {
      setDarkMode(true);
    }
    
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, [darkMode, setDarkMode]);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/image-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          model,
          width,
          height,
          safety: false,
          nologo: true,
          numSteps: useAdvanced ? numSteps : undefined,
          guidanceScale: useAdvanced ? guidanceScale : undefined,
          seed: useAdvanced && seed ? parseInt(seed) : undefined
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      // Add the new result to the beginning of the array
      setImageResults(prev => [
        { 
          url: data.image, 
          model, 
          prompt,
          timestamp: Date.now()
        },
        ...prev
      ]);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating image:', error);
      setIsGenerating(false);
    }
  };

  const applyStylePreset = (promptTemplate: string) => {
    setPrompt(prev => {
      // Extract the core content without any style keywords
      const basePrompt = prev.split(',')
        .filter(part => 
          !stylePresets.some(preset => 
            preset.prompt.split(',').some(style => 
              part.trim().toLowerCase().includes(style.trim().toLowerCase())
            )
          )
        )
        .join(',')
        .trim();
      
      // If there's no content yet, just use the template
      if (!basePrompt) return promptTemplate;
      
      // Otherwise, combine the content with the new style
      return basePrompt + ', ' + promptTemplate;
    });
  };

  const downloadImage = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-image-${index}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetForm = () => {
    setPrompt('');
    setNegativePrompt('');
    setModel('turbo');
    setWidth(512);
    setHeight(512);
    setUseAdvanced(false);
    setNumSteps(30);
    setGuidanceScale(7.5);
    setSeed('');
  };

  return (
    <div className="container mx-auto py-8 px-4 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <div className="flex items-center mb-8 gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.push('/test-tools')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Image Generator</h1>
          <p className="text-muted-foreground">
            Test image generation with different models and prompts
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex flex-wrap gap-2 my-2">
                {stylePresets.map((style) => (
                  <Button 
                    key={style.name} 
                    variant="outline" 
                    size="sm"
                    onClick={() => applyStylePreset(style.prompt)}
                  >
                    {style.name}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width: {width}px</Label>
                  <Slider
                    id="width"
                    defaultValue={[512]}
                    max={1024}
                    min={256}
                    step={64}
                    onValueChange={(value) => setWidth(value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height: {height}px</Label>
                  <Slider
                    id="height"
                    defaultValue={[512]}
                    max={1024}
                    min={256}
                    step={64}
                    onValueChange={(value) => setHeight(value[0])}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced"
                  checked={useAdvanced}
                  onCheckedChange={setUseAdvanced}
                />
                <Label htmlFor="advanced">Advanced Settings</Label>
              </div>

              {useAdvanced && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="negative-prompt">Negative Prompt</Label>
                    <Textarea
                      id="negative-prompt"
                      placeholder="Things to avoid in the generated image..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="steps">Steps: {numSteps}</Label>
                    <Slider
                      id="steps"
                      defaultValue={[30]}
                      max={50}
                      min={10}
                      step={1}
                      onValueChange={(value) => setNumSteps(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guidance">Guidance Scale: {guidanceScale}</Label>
                    <Slider
                      id="guidance"
                      defaultValue={[7.5]}
                      max={15}
                      min={1}
                      step={0.1}
                      onValueChange={(value) => setGuidanceScale(value[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seed">Seed (optional)</Label>
                    <Input
                      id="seed"
                      placeholder="Leave empty for random seed"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={resetForm}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={generateImage} disabled={isGenerating || !prompt.trim()}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {imageResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img 
                      src={imageResults[0].url} 
                      alt={`Generated from prompt: ${imageResults[0].prompt}`}
                      className="max-w-full h-auto rounded-md border dark:border-gray-700"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                      onClick={() => downloadImage(imageResults[0].url, 0)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground max-w-prose">
                    <p><strong>Prompt:</strong> {imageResults[0].prompt}</p>
                    <p><strong>Model:</strong> {imageResults[0].model}</p>
                    <p><strong>Size:</strong> {width}×{height}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {imageResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imageResults.map((result, index) => (
                    <div key={result.timestamp} className="relative group">
                      <img 
                        src={result.url} 
                        alt={`Generated from prompt: ${result.prompt}`}
                        className="w-full aspect-square object-cover rounded-md border dark:border-gray-700"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-md">
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-background/80 backdrop-blur-sm"
                          onClick={() => downloadImage(result.url, index)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground truncate">
                        {result.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No images yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Generate some images to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compare Models</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Generate the same prompt across different models to compare results
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="compare-prompt">Prompt</Label>
                  <Textarea
                    id="compare-prompt"
                    placeholder="Describe what you want to generate..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {imageModels.slice(0, 4).map((model) => (
                    <Button 
                      key={model.id} 
                      variant="outline"
                      className="flex-1"
                      disabled={true}
                    >
                      {model.name}
                    </Button>
                  ))}
                </div>
                
                <Button className="w-full" disabled={true}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Compare Models
                </Button>
                
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Model comparison coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 