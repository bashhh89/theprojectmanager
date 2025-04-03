"use client";

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">This is a simple test page to check if routing and rendering are working correctly.</p>
      <div className="p-4 bg-blue-100 rounded">
        If you can see this page with styling, the basic application is working.
      </div>
    </div>
  );
} 