"use client"

import { useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { toasts } from '@/components/ui/toast-wrapper'

export default function PresentationGenerator() {
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [presentationMarkdown, setPresentationMarkdown] = useState('')
  const { activeTextModel } = useSettingsStore()

  const generatePresentation = async () => {
    if (!topic.trim()) {
      toasts.error('Please enter a topic for your presentation')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          model: activeTextModel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate presentation')
      }

      const data = await response.json()
      setPresentationMarkdown(data.markdown)
      toasts.success('Presentation generated successfully!')
    } catch (error) {
      console.error('Error generating presentation:', error)
      toasts.error('Failed to generate presentation. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Presentation Generator</h1>
        
        {/* Input Form */}
        <div className="mb-8 bg-card p-6 rounded-lg border border-border">
          <div className="mb-4">
            <label htmlFor="topic" className="block text-sm font-medium mb-2">
              Presentation Topic or Prompt
            </label>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your presentation topic or detailed prompt..."
              className="w-full h-32 px-3 py-2 text-sm rounded-md border border-input bg-background"
              disabled={isGenerating}
            />
          </div>
          
          <button
            onClick={generatePresentation}
            disabled={isGenerating}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Presentation'}
          </button>
        </div>

        {/* Preview Area */}
        {presentationMarkdown && (
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-4">Generated Presentation</h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap">{presentationMarkdown}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 