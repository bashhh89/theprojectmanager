'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface GeneratedImage {
  id: string;
  created_at: string;
  prompt: string;
  image_url: string;
  user_id: string;
}

export default function GeneratedImagesPage() {
  const router = useRouter();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadImages() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data: imagesData, error: imagesError } = await supabase
          .from('generated_images')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (imagesError) {
          throw imagesError;
        }

        setImages(imagesData || []);
      } catch (err: any) {
        console.error('Error loading images:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Generated Images</h1>
        <a 
          href="/image-generator"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Image
        </a>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-8">
          <p>{error}</p>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
          <p className="text-gray-400 mb-4">No generated images found</p>
          <a 
            href="/image-generator"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Your First Image
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-900">
                <img
                  src={image.image_url}
                  alt={image.prompt}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 mb-2">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm line-clamp-2">{image.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 