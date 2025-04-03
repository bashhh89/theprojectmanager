import { useState, useCallback } from 'react';
import { ContentService, Content, CreateContentInput, UpdateContentInput } from '@/lib/services/contentService';
import { useToast } from '@/components/ui/use-toast';

export function useContent() {
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const createContent = useCallback(async (input: CreateContentInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const newContent = await ContentService.create(input);
      setContent(newContent);
      toast({
        title: 'Content created',
        description: 'Your content has been saved successfully.',
      });
      return newContent;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'Failed to create content. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateContent = useCallback(async (input: UpdateContentInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedContent = await ContentService.update(input);
      setContent(updatedContent);
      toast({
        title: 'Content updated',
        description: 'Your changes have been saved successfully.',
      });
      return updatedContent;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'Failed to update content. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteContent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await ContentService.delete(id);
      setContent(null);
      toast({
        title: 'Content deleted',
        description: 'Your content has been deleted successfully.',
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'Failed to delete content. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getContent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedContent = await ContentService.getById(id);
      setContent(fetchedContent);
      return fetchedContent;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch content. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const listContent = useCallback(async (options: {
    status?: 'draft' | 'published';
    limit?: number;
    offset?: number;
  } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const contentList = await ContentService.list(options);
      return contentList;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'Failed to fetch content list. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateMetadata = useCallback(async (id: string, metadata: Content['metadata']) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedContent = await ContentService.updateMetadata(id, metadata);
      setContent(updatedContent);
      toast({
        title: 'Metadata updated',
        description: 'Your metadata has been updated successfully.',
      });
      return updatedContent;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'Failed to update metadata. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const publishContent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const publishedContent = await ContentService.publish(id);
      setContent(publishedContent);
      toast({
        title: 'Content published',
        description: 'Your content has been published successfully.',
      });
      return publishedContent;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'Failed to publish content. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const unpublishContent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const unpublishedContent = await ContentService.unpublish(id);
      setContent(unpublishedContent);
      toast({
        title: 'Content unpublished',
        description: 'Your content has been unpublished successfully.',
      });
      return unpublishedContent;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: 'Error',
        description: 'Failed to unpublish content. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    content,
    isLoading,
    error,
    createContent,
    updateContent,
    deleteContent,
    getContent,
    listContent,
    updateMetadata,
    publishContent,
    unpublishContent,
  };
} 