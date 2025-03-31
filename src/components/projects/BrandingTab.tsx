'use client';

import React, { useState } from 'react';

interface BrandingData {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    fontPairings?: Array<{
      heading: string;
      body: string;
      usage: string;
    }>;
  };
  logoSuggestions?: Array<{
    description: string;
    prompt: string;
    style: string;
  }>;
  brandVoice?: {
    tone?: string;
    personality?: string[];
    keywords?: string[];
    samplePhrases?: string[];
  };
}

// Sample data for empty states
const SAMPLE_BRANDING: BrandingData = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#8B5CF6',
    background: '#1F2937',
    text: '#F9FAFB'
  },
  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    fontPairings: [
      {
        heading: 'Poppins',
        body: 'Inter',
        usage: 'Website & Digital'
      },
      {
        heading: 'Montserrat',
        body: 'Open Sans',
        usage: 'Print Materials'
      }
    ]
  },
  logoSuggestions: [
    {
      description: 'Modern abstract logo with geometric elements',
      prompt: 'Create a minimalist logo with blue and purple gradient triangular shapes representing growth and innovation',
      style: 'Minimal'
    },
    {
      description: 'Wordmark with creative typography',
      prompt: 'Design a sophisticated wordmark logo with custom typography and a subtle icon element',
      style: 'Typography'
    }
  ],
  brandVoice: {
    tone: 'Professional yet approachable, with a focus on clarity and expertise without being overly technical or formal',
    personality: ['Innovative', 'Trustworthy', 'Forward-thinking', 'Helpful'],
    keywords: ['Transform', 'Simplify', 'Empower', 'Connect', 'Future-ready'],
    samplePhrases: [
      'Transforming challenges into opportunities',
      'Simplifying complexity for real results',
      'Your success is our mission',
      'Building tomorrow\'s solutions today'
    ]
  }
};

export function BrandingTab({ brandingData }: { brandingData?: BrandingData }) {
  const [showSampleData, setShowSampleData] = useState(false);
  
  // Use either the actual data or sample data if showing samples
  const displayData = brandingData || (showSampleData ? SAMPLE_BRANDING : undefined);
  
  if (!displayData) {
    return (
      <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg text-center">
        <svg className="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <h3 className="text-xl font-semibold mb-3 text-gray-300">No Branding Information Available</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">This project doesn't have any branding details defined yet. Add branding information to establish your project's visual identity.</p>
        <button
          onClick={() => setShowSampleData(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center mx-auto"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview Sample Branding
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header with switcher if showing sample */}
      {showSampleData && !brandingData && (
        <div className="bg-blue-900/30 border border-blue-800/40 text-blue-200 p-4 rounded-lg flex items-center justify-between mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Viewing sample branding data for preview purposes only</span>
          </div>
          <button 
            onClick={() => setShowSampleData(false)}
            className="text-blue-300 hover:text-blue-200 text-sm"
          >
            Hide Sample
          </button>
        </div>
      )}
      
      {/* Color Palette Section */}
      {displayData.colors && Object.keys(displayData.colors).length > 0 && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Color Palette</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {displayData.colors.primary && (
              <div className="bg-gray-900/50 rounded-lg overflow-hidden shadow-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                <div 
                  className="h-32 w-full" 
                  style={{ backgroundColor: displayData.colors.primary }}
                ></div>
                <div className="p-4">
                  <h4 className="font-medium text-sm mb-1">Primary</h4>
                  <p className="text-xs text-gray-400 font-mono">{displayData.colors.primary}</p>
                </div>
              </div>
            )}
            
            {displayData.colors.secondary && (
              <div className="bg-gray-900/50 rounded-lg overflow-hidden shadow-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                <div 
                  className="h-32 w-full" 
                  style={{ backgroundColor: displayData.colors.secondary }}
                ></div>
                <div className="p-4">
                  <h4 className="font-medium text-sm mb-1">Secondary</h4>
                  <p className="text-xs text-gray-400 font-mono">{displayData.colors.secondary}</p>
                </div>
              </div>
            )}
            
            {displayData.colors.accent && (
              <div className="bg-gray-900/50 rounded-lg overflow-hidden shadow-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                <div 
                  className="h-32 w-full" 
                  style={{ backgroundColor: displayData.colors.accent }}
                ></div>
                <div className="p-4">
                  <h4 className="font-medium text-sm mb-1">Accent</h4>
                  <p className="text-xs text-gray-400 font-mono">{displayData.colors.accent}</p>
                </div>
              </div>
            )}
            
            {displayData.colors.background && (
              <div className="bg-gray-900/50 rounded-lg overflow-hidden shadow-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                <div 
                  className="h-32 w-full" 
                  style={{ backgroundColor: displayData.colors.background }}
                ></div>
                <div className="p-4">
                  <h4 className="font-medium text-sm mb-1">Background</h4>
                  <p className="text-xs text-gray-400 font-mono">{displayData.colors.background}</p>
                </div>
              </div>
            )}
            
            {displayData.colors.text && (
              <div className="bg-gray-900/50 rounded-lg overflow-hidden shadow-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                <div 
                  className="h-32 w-full" 
                  style={{ backgroundColor: displayData.colors.text }}
                ></div>
                <div className="p-4">
                  <h4 className="font-medium text-sm mb-1">Text</h4>
                  <p className="text-xs text-gray-400 font-mono">{displayData.colors.text}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      
      {/* Typography Section */}
      {displayData.typography && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Typography</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {displayData.typography.headingFont && (
              <div className="bg-gray-900/50 p-5 rounded-lg shadow-lg border border-gray-800/50">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Heading Font</h4>
                <p className="text-3xl mb-2" style={{ fontFamily: displayData.typography.headingFont }}>
                  {displayData.typography.headingFont}
                </p>
                <div className="p-4 bg-gray-800/60 rounded-lg">
                  <p className="text-2xl mb-2" style={{ fontFamily: displayData.typography.headingFont }}>
                    The quick brown fox
                  </p>
                  <p className="text-lg" style={{ fontFamily: displayData.typography.headingFont }}>
                    Jumps over the lazy dog
                  </p>
                </div>
              </div>
            )}
            
            {displayData.typography.bodyFont && (
              <div className="bg-gray-900/50 p-5 rounded-lg shadow-lg border border-gray-800/50">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Body Font</h4>
                <p className="text-2xl mb-2" style={{ fontFamily: displayData.typography.bodyFont }}>
                  {displayData.typography.bodyFont}
                </p>
                <div className="p-4 bg-gray-800/60 rounded-lg">
                  <p className="mb-2" style={{ fontFamily: displayData.typography.bodyFont }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  </p>
                  <p className="text-sm text-gray-400" style={{ fontFamily: displayData.typography.bodyFont }}>
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {displayData.typography.fontPairings && displayData.typography.fontPairings.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-300">Font Pairings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayData.typography.fontPairings.map((pair, index) => (
                  <div key={index} className="bg-gray-900/50 p-5 rounded-lg shadow-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xl font-medium" style={{ fontFamily: pair.heading }}>
                          {pair.heading}
                        </p>
                        <p className="text-gray-400 mt-1" style={{ fontFamily: pair.body }}>
                          {pair.body}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-purple-900/30 rounded-full text-xs text-purple-400 border border-purple-800/40">
                        {pair.usage}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-800/60 rounded-lg">
                      <h5 className="text-xl mb-2" style={{ fontFamily: pair.heading }}>
                        Sample Heading
                      </h5>
                      <p className="text-gray-300" style={{ fontFamily: pair.body }}>
                        This is what text looks like using this font pairing. The heading uses {pair.heading} while the body text uses {pair.body}.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      
      {/* Logo Suggestions Section */}
      {displayData.logoSuggestions && displayData.logoSuggestions.length > 0 && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Logo Suggestions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayData.logoSuggestions.map((logo, index) => (
              <div key={index} className="bg-gray-900/50 p-5 rounded-lg shadow-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-lg">{logo.description}</h4>
                  <span className="px-3 py-1 bg-green-900/30 rounded-full text-xs text-green-400 border border-green-800/40">
                    {logo.style}
                  </span>
                </div>
                <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700/50 mt-4">
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Generation Prompt</h5>
                  <p className="text-gray-300 text-sm">{logo.prompt}</p>
                </div>
                <div className="mt-4 bg-gradient-to-r from-gray-800 to-gray-900 h-40 rounded-lg border border-gray-700/50 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Logo visualization placeholder</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Brand Voice Section */}
      {displayData.brandVoice && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Brand Voice</h3>
          </div>
          
          {displayData.brandVoice.tone && (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3 text-gray-300">Tone</h4>
              <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50 text-gray-300 leading-relaxed">
                <svg className="h-6 w-6 text-yellow-500 float-left mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                {displayData.brandVoice.tone}
              </div>
            </div>
          )}
          
          {displayData.brandVoice.personality && displayData.brandVoice.personality.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3 text-gray-300">Personality Traits</h4>
              <div className="flex flex-wrap gap-2">
                {displayData.brandVoice.personality.map((trait, index) => (
                  <span key={index} className="px-4 py-2 bg-blue-900/30 rounded-full text-blue-400 border border-blue-800/40 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {displayData.brandVoice.keywords && displayData.brandVoice.keywords.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3 text-gray-300">Key Words & Phrases</h4>
              <div className="flex flex-wrap gap-2">
                {displayData.brandVoice.keywords.map((keyword, index) => (
                  <span key={index} className="px-4 py-2 bg-green-900/30 rounded-full text-green-400 border border-green-800/40 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {displayData.brandVoice.samplePhrases && displayData.brandVoice.samplePhrases.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-3 text-gray-300">Sample Phrases</h4>
              <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayData.brandVoice.samplePhrases.map((phrase, index) => (
                    <div key={index} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700/50">
                      <svg className="h-5 w-5 text-yellow-500 float-left mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <p className="text-gray-300 italic">{phrase}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
