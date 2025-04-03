'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Image, 
  Link, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  Sparkles,
  History,
  Share2,
  Calendar,
  BarChart
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  metadata: {
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    analytics?: {
      views?: number;
      engagement?: number;
    };
  };
}

export default function ContentEditor() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('write');
  const [content, setContent] = useState<Content>({
    id: '',
    title: '',
    content: '',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {}
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save functionality
  useEffect(() => {
    const saveTimeout = setTimeout(async () => {
      if (content.title || content.content) {
        await saveContent();
      }
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [content]);

  const saveContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .upsert({
          ...content,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setContent(data);
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      // Call AI service to generate content
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content.title })
      });
      const data = await response.json();
      
      setContent(prev => ({
        ...prev,
        content: data.content
      }));
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Content Editor</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button size="sm">
              Publish
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Editor */}
          <div className="col-span-8">
            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <Input
                placeholder="Enter title..."
                value={content.title}
                onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold mb-4 bg-transparent border-0 focus-visible:ring-0"
              />
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>

                <TabsContent value="write" className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex items-center gap-2 p-2 bg-zinc-700 rounded-lg">
                    <Button variant="ghost" size="sm">
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <List className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Quote className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Image className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Link className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Code className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Heading1 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Heading2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Heading3 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Editor */}
                  <Textarea
                    ref={editorRef}
                    value={content.content}
                    onChange={(e) => setContent(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[500px] bg-transparent border-0 focus-visible:ring-0"
                    placeholder="Start writing..."
                  />
                </TabsContent>

                <TabsContent value="preview">
                  <div className="prose prose-invert max-w-none">
                    <h1>{content.title}</h1>
                    <div dangerouslySetInnerHTML={{ __html: content.content }} />
                  </div>
                </TabsContent>

                <TabsContent value="seo">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Meta Title</label>
                      <Input
                        value={content.metadata.seo?.title || ''}
                        onChange={(e) => setContent(prev => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            seo: { ...prev.metadata.seo, title: e.target.value }
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Meta Description</label>
                      <Textarea
                        value={content.metadata.seo?.description || ''}
                        onChange={(e) => setContent(prev => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            seo: { ...prev.metadata.seo, description: e.target.value }
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Keywords</label>
                      <Input
                        value={content.metadata.seo?.keywords?.join(', ') || ''}
                        onChange={(e) => setContent(prev => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            seo: {
                              ...prev.metadata.seo,
                              keywords: e.target.value.split(',').map(k => k.trim())
                            }
                          }
                        }))}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* AI Assistant */}
            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h2 className="text-xl font-bold mb-4">AI Assistant</h2>
              <Button
                className="w-full"
                onClick={generateContent}
                disabled={isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Content'}
              </Button>
            </Card>

            {/* Content Stats */}
            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h2 className="text-xl font-bold mb-4">Content Stats</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400">Word Count</label>
                  <p className="text-2xl font-bold">
                    {content.content.split(/\s+/).filter(Boolean).length}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">Reading Time</label>
                  <p className="text-2xl font-bold">
                    {Math.ceil(content.content.split(/\s+/).filter(Boolean).length / 200)} min
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">Last Saved</label>
                  <p className="text-sm">
                    {new Date(content.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 