import React, { useEffect, useState } from 'react';

interface BrandingPreviewProps {
  brandStyle?: string;
  projectType?: string;
}

export function BrandingPreview({ brandStyle, projectType }: BrandingPreviewProps) {
  const [colors, setColors] = useState({
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#7dd3fc',
  });

  useEffect(() => {
    // Generate preview colors based on inputs
    setColors(generatePreviewColors(brandStyle, projectType));
  }, [brandStyle, projectType]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-700 bg-gray-800 p-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Branding Preview</h3>
      
      <div className="flex flex-col space-y-3">
        {/* Color Swatches */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center">
            <div 
              className="w-full h-10 rounded" 
              style={{ backgroundColor: colors.primary }}
            />
            <span className="text-xs text-gray-400 mt-1">Primary</span>
          </div>
          <div className="flex flex-col items-center">
            <div 
              className="w-full h-10 rounded" 
              style={{ backgroundColor: colors.secondary }}
            />
            <span className="text-xs text-gray-400 mt-1">Secondary</span>
          </div>
          <div className="flex flex-col items-center">
            <div 
              className="w-full h-10 rounded" 
              style={{ backgroundColor: colors.accent }}
            />
            <span className="text-xs text-gray-400 mt-1">Accent</span>
          </div>
        </div>
        
        {/* UI Preview */}
        <div className="rounded overflow-hidden" style={{ backgroundColor: colors.secondary }}>
          <div className="p-3 flex items-center justify-between" style={{ backgroundColor: colors.primary }}>
            <div className="font-bold text-white">Brand Preview</div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
              <div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
          <div className="p-4">
            <div className="bg-black bg-opacity-30 rounded-lg p-3 mb-3">
              <h4 className="text-white text-sm font-medium mb-1">Sample Header</h4>
              <p className="text-white text-xs opacity-80">This is what content might look like with your brand colors.</p>
            </div>
            <div className="flex justify-end">
              <button 
                className="px-3 py-1 text-xs rounded-full text-white" 
                style={{ backgroundColor: colors.accent, color: getBestTextColor(colors.accent) }}
              >
                Button
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mt-2">
        Final branding will be customized further based on all your project details.
      </p>
    </div>
  );
}

// Helper function to generate preview colors based on inputs
function generatePreviewColors(brandStyle?: string, projectType?: string): { primary: string, secondary: string, accent: string } {
  // Default colors if no preferences are provided
  const defaults = {
    business: { primary: '#2563eb', secondary: '#1e40af', accent: '#7dd3fc' },
    software: { primary: '#6366f1', secondary: '#4338ca', accent: '#a5b4fc' },
    personal: { primary: '#ec4899', secondary: '#be185d', accent: '#f9a8d4' },
    other: { primary: '#10b981', secondary: '#065f46', accent: '#6ee7b7' }
  };
  
  // Start with defaults based on project type
  const baseColors = defaults[projectType as keyof typeof defaults] || defaults.other;
  
  // Modify colors based on brand style if provided
  if (brandStyle) {
    const brandStyleLower = brandStyle.toLowerCase();
    
    // Color modifications based on brand style keywords
    if (brandStyleLower.includes('modern') || brandStyleLower.includes('minimal')) {
      return { 
        primary: '#3b82f6', 
        secondary: '#1e40af', 
        accent: '#93c5fd' 
      };
    }
    
    if (brandStyleLower.includes('playful') || brandStyleLower.includes('creative') || brandStyleLower.includes('vibrant')) {
      return { 
        primary: '#ec4899', 
        secondary: '#db2777', 
        accent: '#f472b6' 
      };
    }
    
    if (brandStyleLower.includes('luxury') || brandStyleLower.includes('premium') || brandStyleLower.includes('elegant')) {
      return { 
        primary: '#6b7280', 
        secondary: '#111827', 
        accent: '#f59e0b' 
      };
    }
    
    if (brandStyleLower.includes('trust') || brandStyleLower.includes('professional') || brandStyleLower.includes('corporate')) {
      return { 
        primary: '#1e40af', 
        secondary: '#1e3a8a', 
        accent: '#60a5fa' 
      };
    }
    
    if (brandStyleLower.includes('eco') || brandStyleLower.includes('green') || brandStyleLower.includes('sustain')) {
      return { 
        primary: '#059669', 
        secondary: '#065f46', 
        accent: '#34d399' 
      };
    }
    
    if (brandStyleLower.includes('tech') || brandStyleLower.includes('future') || brandStyleLower.includes('innov')) {
      return { 
        primary: '#3b82f6', 
        secondary: '#1e40af', 
        accent: '#6ee7b7' 
      };
    }
  }
  
  return baseColors;
}

// Helper function to determine if black or white text shows better on a given background color
function getBestTextColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance (perceived brightness)
  // Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for bright backgrounds, white for dark ones
  return luminance > 0.5 ? '#000000' : '#ffffff';
} 