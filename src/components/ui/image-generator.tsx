"use client"

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card } from './card'
import { Loader2, Download, Trash2 } from 'lucide-react'
import { useImageStore, GeneratedImage } from '@/store/imageStore'
import { ScrollArea } from './scroll-area'

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { addImage, getRecentImages, deleteImage } = useImageStore()
  const recentImages = getRecentImages(50)

  // Handle mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const generateImage = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    try {
      // Format the prompt for URL
      const formattedPrompt = prompt
        .replace(/\s+/g, '%20')
        .replace(/[^a-zA-Z0-9%20-]/g, '')
      
      // Add style keywords for better results
      const enhancedPrompt = `${formattedPrompt},%20cinematic%20lighting,%20hyperrealistic,%20highly%20detailed,%20professional%20photography,%208k%20uhd,%20sharp%20focus,%20dramatic%20lighting,%20studio%20quality`

      const imageUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1280&height=1024&nologo=true`
      setCurrentImage(imageUrl)
      
      // Save to store
      addImage({
        url: imageUrl,
        prompt: prompt,
        tags: ['generated', 'pollinations']
      })
    } catch (error) {
      console.error('Error generating image:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Image Generator</h1>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Generator */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Image Generator</h1>
            <p className="text-muted-foreground">
              Generate high-quality images using AI. Enter a detailed description of what you want to create.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Image Description</Label>
              <Input
                id="prompt"
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full"
              />
            </div>

            <Button 
              onClick={generateImage} 
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Image'
              )}
            </Button>
          </div>

          {currentImage && (
            <Card className="p-4">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Current Generation</h2>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <img
                    src={currentImage}
                    alt={prompt}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadImage(currentImage)}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(currentImage, '_blank')}
                    className="flex-1"
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Gallery */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Generations</h2>
            <span className="text-sm text-muted-foreground">
              {recentImages.length} images
            </span>
          </div>
          
          <ScrollArea className="h-[800px] rounded-md border p-4">
            <div className="grid grid-cols-2 gap-4">
              {recentImages.map((image: GeneratedImage) => (
                <Card key={image.id} className="overflow-hidden">
                  <div className="relative group">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => downloadImage(image.url)}
                        className="h-8 w-8"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteImage(image.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {image.prompt}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
} 