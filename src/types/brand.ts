/**
 * Brand Management System Type Definitions
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface Typography {
  headingFont: string;
  bodyFont: string;
  monoFont?: string;
  headingWeight: number | string;
  bodyWeight?: number | string;
  baseSize: string;
}

export interface ImageStyleGuide {
  style: 'photographic' | 'illustrated' | 'minimalist' | 'abstract' | 'custom' | string;
  filterStyle?: string;
  colorTreatment?: string;
  cornerStyle?: 'rounded' | 'square' | 'circular';
  preferredSubjects?: string[];
  filterSettings?: string;
}

export interface BrandVoice {
  tone: string[];
  vocabulary: {
    preferred: string[];
    avoided: string[];
  };
  examples: string[];
}

/**
 * BrandProfile - The core model for the brand management system
 */
export interface BrandProfile {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Visual Identity
  visualIdentity: {
    logos: { 
      primary: string;
      alternate?: string[];
      alternative?: string;
      favicon?: string;
    };
    colorPalette: ColorPalette;
    typography: Typography;
    imageStyle: ImageStyleGuide;
  };
  
  // Brand Voice & Messaging
  voice: BrandVoice;
  
  // Strategic Elements
  positioning: {
    valueProposition: string;
    targetAudiences: string[];
    competitiveAdvantages: string[];
    industryPosition: string;
    industryKeywords?: string[];
  };
  
  // Contact Information
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    socialMedia?: {
      [platform: string]: string;
    };
  };
  
  // Additional Assets
  assets?: {
    images?: string[];
    documents?: string[];
    videos?: string[];
  };
}

export interface BrandContentSettings {
  headlineStyle: string;
  storyFrameworks: string[];
  contentFormats: string[];
  callToActionStyle: string;
}

export interface BrandTheme {
  id: string;
  brandId: string;
  name: string;
  colorPalette: ColorPalette;
  typography: Typography;
  isDefault: boolean;
} 