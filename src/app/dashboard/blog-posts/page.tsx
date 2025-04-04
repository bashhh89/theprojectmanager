'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBlogStore } from '@/store/blogStore';
import { formatDistanceToNow } from 'date-fns';

export default function BlogPostsPage() {
  const router = useRouter();
  const { posts, initialize, isInitialized } = useBlogStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Blog Posts</h1>
        <button 
          onClick={() => router.push('/dashboard/blog-posts/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          Create New Post
        </button>
      </div>

      <div className="bg-zinc-800 border border-zinc-700 rounded-lg">
        <div className="p-6">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400 mb-4">No blog posts yet</p>
              <button 
                onClick={() => router.push('/dashboard/blog-posts/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Title</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Author</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Last Updated</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-zinc-700/50 hover:bg-zinc-700/30">
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-100">{post.title}</div>
                        <div className="text-sm text-zinc-400">{post.excerpt.slice(0, 100)}...</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{post.author}</td>
                      <td className="py-3 px-4 text-zinc-300">
                        {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => router.push(`/dashboard/blog-posts/${post.id}`)}
                          className="px-3 py-1 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => router.push(`/blog/${post.id}`)}
                          className="px-3 py-1 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 