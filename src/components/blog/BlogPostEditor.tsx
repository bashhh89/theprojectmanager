'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBlogStore, type BlogPost } from '@/store/blogStore';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { generateText } from '@/lib/pollinationsApi';

interface BlogPostEditorProps {
  postId?: string;
}

export default function BlogPostEditor({ postId }: BlogPostEditorProps) {
  const router = useRouter();
  const { user } = useUser();
  const { getPost, createPost, updatePost, isSaving, isInitialized } = useBlogStore();
  const { toast } = useToast();
  const isEditing = !!postId;

  // State for the blog post
  const [post, setPost] = useState<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    coverImageType: 'url',
    author: user?.user_metadata?.full_name || 'AI Assistant',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    categories: [],
    tags: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentLength, setContentLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize blog store
  useEffect(() => {
    useBlogStore.getState().initialize();
  }, []);

  // Fetch existing post if editing
  useEffect(() => {
    if (isEditing && postId) {
      setIsLoading(true);
      const existingPost = getPost(postId);
      if (existingPost) {
        const { id, createdAt, updatedAt, ...postData } = existingPost;
        setPost(postData);
      }
      setIsLoading(false);
    }
  }, [postId, isEditing, getPost]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'publish' = 'draft') => {
    e.preventDefault();

    if (!isInitialized) {
      toast({
        title: "System Initializing",
        description: "Please wait while the system initializes. This may take a few seconds.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validate required fields
      if (!post.title.trim()) {
        toast({
          title: "Missing Title",
          description: "Please enter a title for your post",
          variant: "destructive"
        });
        return;
      }
      if (!post.excerpt.trim()) {
        toast({
          title: "Missing Excerpt",
          description: "Please enter an excerpt for your post",
          variant: "destructive"
        });
        return;
      }
      if (!post.content.trim()) {
        toast({
          title: "Missing Content",
          description: "Please enter content for your post",
          variant: "destructive"
        });
        return;
      }

      // Set the status based on the action
      const updatedPost = {
        ...post,
        status: action === 'publish' ? 'published' : 'draft'
      };

      let newPostId;
      if (isEditing && postId) {
        await updatePost(postId, updatedPost);
        newPostId = postId;
      } else {
        newPostId = await createPost(updatedPost, user);
      }

      // Show success message
      toast({
        title: "Success",
        description: `Post successfully ${action === 'publish' ? 'published' : 'saved as draft'}!`
      });

      // Navigate based on status
      if (action === 'publish') {
        router.push(`/blog/${newPostId}`);
      } else {
        router.push('/dashboard/blog-posts');
      }
    } catch (error: any) {
      console.error('Failed to save post:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to save post. Please try again.',
        variant: "destructive"
      });
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPost(prev => ({ ...prev, [name]: value }));
  };

  // Handle array input changes (categories, tags)
  const handleArrayChange = (name: string, value: string) => {
    setPost(prev => ({
      ...prev,
      [name]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  // AI Generation Functions
  const generateTitle = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Create 3 engaging blog post titles for a business intelligence platform.
        Focus on AI technology, analytics, or digital transformation.
        Format exactly as:
        1. [First Title]
        2. [Second Title]
        3. [Third Title]`;

      const response = await generateText(prompt);
      const titles = response
        .split('\n')
        .filter(line => /^\d\./.test(line))
        .map(line => line.replace(/^\d\.\s+/, '').trim());

      if (titles.length > 0) {
        setPost(prev => ({ ...prev, title: titles[0] }));
        await generateSuggestionsByTitle(titles[0]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to generate title suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSuggestionsByTitle = async (title: string) => {
    setIsGenerating(true);
    try {
      const prompt = `Based on this blog post title: "${title}"
        Create content suggestions for a business intelligence blog post.
        Format your response exactly as:
        
        EXCERPT:
        [2-3 compelling sentences that summarize the main points]

        CATEGORIES:
        [3-4 relevant categories, comma-separated]

        TAGS:
        [5-8 relevant tags, comma-separated]`;

      const response = await generateText(prompt);
      
      const excerptMatch = response.match(/EXCERPT:\s*\n([\s\S]*?)(?=\n\s*CATEGORIES:|$)/);
      const categoriesMatch = response.match(/CATEGORIES:\s*\n([\s\S]*?)(?=\n\s*TAGS:|$)/);
      const tagsMatch = response.match(/TAGS:\s*\n([\s\S]*?)(?=$)/);

      const excerpt = excerptMatch ? excerptMatch[1].trim() : '';
      const categories = categoriesMatch ? 
        categoriesMatch[1].split(',').map(c => c.trim()).filter(Boolean) : [];
      const tags = tagsMatch ?
        tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [];

      setPost(prev => ({
        ...prev,
        excerpt,
        categories,
        tags
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to generate suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateArticle = async () => {
    if (!post.title) return;
    
    setIsGenerating(true);
    try {
      const lengthGuide = {
        short: '500-800 words',
        medium: '1000-1500 words',
        long: '2000-2500 words'
      }[contentLength];

      const prompt = `Write a ${lengthGuide} blog post about: "${post.title}"
        Use this excerpt as guidance: "${post.excerpt}"
        
        Write in a professional but engaging tone. Focus on providing actionable insights and real-world applications.
        Format the article using markdown with:
        - Clear headings and subheadings
        - Bullet points for key concepts
        - Numbered lists for steps
        - Brief paragraphs for readability`;

      const response = await generateText(prompt);
      setPost(prev => ({
        ...prev,
        content: response.trim()
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to generate article content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">
          {isLoading ? 'Loading post...' : 'Initializing storage system...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard/blog-posts')}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setPreviewMode(true)}>
                Preview
              </Button>
              <Button disabled={isSaving} onClick={(e) => handleSubmit(e, 'publish')}>
                {isSaving ? 'Saving...' : isEditing ? 'Update Post' : 'Publish Post'}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="title"
                    value={post.title}
                    onChange={handleChange}
                    className="flex-1 p-2 border rounded"
                    placeholder="Enter post title"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateTitle}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Title'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Excerpt</label>
                <textarea
                  name="excerpt"
                  value={post.excerpt}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="Enter post excerpt"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={contentLength}
                    onChange={(e) => setContentLength(e.target.value as 'short' | 'medium' | 'long')}
                    className="p-2 border rounded"
                  >
                    <option value="short">Short (500-800 words)</option>
                    <option value="medium">Medium (1000-1500 words)</option>
                    <option value="long">Long (2000-2500 words)</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateArticle}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Content'}
                  </Button>
                </div>
                <textarea
                  name="content"
                  value={post.content}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  rows={15}
                  placeholder="Enter post content"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categories</label>
                <input
                  type="text"
                  value={post.categories.join(', ')}
                  onChange={(e) => handleArrayChange('categories', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter categories, separated by commas"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <input
                  type="text"
                  value={post.tags.join(', ')}
                  onChange={(e) => handleArrayChange('tags', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter tags, separated by commas"
                />
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
} 