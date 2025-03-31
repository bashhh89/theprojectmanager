'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function GeneratedContentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <a href="/dashboard" className="text-blue-400 hover:text-blue-300 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold mt-4">Generated Content</h1>
        </div>
        
        <div className="flex border-b border-gray-700 mb-8">
          <a 
            href="/generated-content/images"
            className={`px-6 py-3 inline-block ${
              pathname === '/generated-content/images' 
                ? 'border-b-2 border-blue-500 text-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Images
          </a>
          <a 
            href="/generated-content/audio"
            className={`px-6 py-3 inline-block ${
              pathname === '/generated-content/audio' 
                ? 'border-b-2 border-blue-500 text-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Audio
          </a>
        </div>
        
        {children}
      </div>
    </div>
  );
} 