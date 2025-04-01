'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrandProfileForm } from '@/components/brand/BrandProfileForm';
import { BrandProfilePreview } from '@/components/brand/BrandProfilePreview';
import { LogoManagement } from '@/components/brand/LogoManagement';
import { useBrandStore } from '@/store/brandStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toasts } from '@/components/ui/toast-wrapper';
import { BrandProfile } from '@/types/brand';
import { 
  ButtonProps, 
  TabsProps, 
  TabsListProps, 
  TabsTriggerProps, 
  TabsContentProps,
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
  AnyComponent
} from '@/types/ui';

// Create wrapper components
const ButtonWrapper: AnyComponent<ButtonProps> = (props) => <Button {...props} />;
const TabsWrapper: AnyComponent<TabsProps> = (props) => <Tabs {...props} />;
const TabsListWrapper: AnyComponent<TabsListProps> = (props) => <TabsList {...props} />;
const TabsTriggerWrapper: AnyComponent<TabsTriggerProps> = (props) => <TabsTrigger {...props} />;
const TabsContentWrapper: AnyComponent<TabsContentProps> = (props) => <TabsContent {...props} />;
const CardWrapper: AnyComponent<CardProps> = (props) => <Card {...props} />;
const CardHeaderWrapper: AnyComponent<CardHeaderProps> = (props) => <CardHeader {...props} />;
const CardTitleWrapper: AnyComponent<CardTitleProps> = (props) => <CardTitle {...props} />;
const CardDescriptionWrapper: AnyComponent<CardDescriptionProps> = (props) => <CardDescription {...props} />;
const CardContentWrapper: AnyComponent<CardContentProps> = (props) => <CardContent {...props} />;
const CardFooterWrapper: AnyComponent<CardFooterProps> = (props) => <CardFooter {...props} />;

// Helper to convert BrandProfile to SimplifiedBrandProfile
const convertToFormData = (brandProfile: BrandProfile | undefined) => {
  if (!brandProfile) return undefined;
  
  return {
    name: brandProfile.name,
    visualIdentity: {
      logos: {
        primary: brandProfile.visualIdentity.logos.primary,
        alternative: brandProfile.visualIdentity.logos.alternate?.[0] || brandProfile.visualIdentity.logos.alternative,
      },
      colorPalette: {
        primary: brandProfile.visualIdentity.colorPalette.primary,
        secondary: brandProfile.visualIdentity.colorPalette.secondary,
        accent: brandProfile.visualIdentity.colorPalette.accent,
        text: brandProfile.visualIdentity.colorPalette.text,
        background: brandProfile.visualIdentity.colorPalette.background,
      },
      typography: {
        headingFont: brandProfile.visualIdentity.typography.headingFont,
        bodyFont: brandProfile.visualIdentity.typography.bodyFont,
        baseSize: brandProfile.visualIdentity.typography.baseSize,
        headingWeight: String(brandProfile.visualIdentity.typography.headingWeight),
      },
      imageStyle: {
        style: brandProfile.visualIdentity.imageStyle.style,
        preferredSubjects: brandProfile.visualIdentity.imageStyle.preferredSubjects || [],
        filterSettings: brandProfile.visualIdentity.imageStyle.filterStyle,
      },
    },
    voice: {
      tone: brandProfile.voice.tone,
      vocabulary: {
        preferred: brandProfile.voice.vocabulary.preferred,
        avoided: brandProfile.voice.vocabulary.avoided,
      },
      examples: brandProfile.voice.examples,
    },
    positioning: {
      valueProposition: brandProfile.positioning.valueProposition,
      targetAudiences: brandProfile.positioning.targetAudiences,
      competitiveAdvantages: brandProfile.positioning.competitiveAdvantages,
      industryKeywords: brandProfile.positioning.industryKeywords || [],
    },
    contactInfo: brandProfile.contactInfo,
  };
};

export default function BrandPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('view');
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Get brand data from store
  const { 
    brands, 
    activeBrandId, 
    setActiveBrand, 
    addBrand, 
    updateBrand, 
    deleteBrand,
    getActiveBrand
  } = useBrandStore();
  
  // Set mounted state for client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // If not mounted yet, show placeholder
  if (!mounted) {
    return <div className="container py-8">Loading brand information...</div>;
  }
  
  const currentBrand = getActiveBrand();

  const handleSaveBrand = (brandData: any) => {
    if (currentBrand) {
      // Update existing brand
      updateBrand(currentBrand.id, brandData);
      toasts.success('Brand updated successfully');
    } else {
      // Add new brand
      const newId = addBrand(brandData);
      setActiveBrand(newId);
      toasts.success('New brand created');
    }
    
    setEditMode(false);
    setActiveTab('view');
  };

  const handleApplyBrand = () => {
    if (currentBrand) {
      // Navigate to content generation with this brand applied
      router.push(`/tools/presentation-generator?brandId=${currentBrand.id}`);
    }
  };
  
  const handleDeleteBrand = () => {
    if (currentBrand && brands.length > 1) {
      deleteBrand(currentBrand.id);
      toasts.success('Brand deleted successfully');
    } else {
      toasts.error('Cannot delete the only brand');
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Brand Management</h1>
          <p className="text-muted-foreground">Create and manage your brand profiles for consistent content</p>
        </div>
        <div className="flex gap-2">
          {!editMode && currentBrand && (
            <>
              <ButtonWrapper 
                variant="outline" 
                onClick={() => {
                  setEditMode(true);
                  setActiveTab('edit');
                }}
              >
                Edit Brand
              </ButtonWrapper>
              {brands.length > 1 && (
                <ButtonWrapper 
                  variant="destructive" 
                  onClick={handleDeleteBrand}
                >
                  Delete Brand
                </ButtonWrapper>
              )}
            </>
          )}
          
          {!editMode && !currentBrand && (
            <ButtonWrapper 
              onClick={() => {
                setEditMode(true);
                setActiveTab('edit');
              }}
            >
              Create Brand
            </ButtonWrapper>
          )}
          
          {brands.length > 1 && !editMode && (
            <div className="ml-4">
              <select 
                value={activeBrandId || undefined}
                onChange={(e) => setActiveBrand(e.target.value)}
                className="rounded-md border border-input bg-background px-3 h-9 text-sm"
              >
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <TabsWrapper value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsListWrapper className="grid w-full max-w-md grid-cols-3">
          <TabsTriggerWrapper value="view" disabled={editMode}>View Brand</TabsTriggerWrapper>
          <TabsTriggerWrapper value="logos" disabled={!editMode}>Logos</TabsTriggerWrapper>
          <TabsTriggerWrapper value="edit">Edit</TabsTriggerWrapper>
        </TabsListWrapper>
        
        <TabsContentWrapper value="view" className="mt-6">
          {currentBrand ? (
            <BrandProfilePreview 
              brand={currentBrand} 
              onEdit={() => {
                setEditMode(true);
                setActiveTab('edit');
              }}
              onApply={handleApplyBrand}
            />
          ) : (
            <CardWrapper>
              <CardHeaderWrapper>
                <CardTitleWrapper>No Brand Profile</CardTitleWrapper>
                <CardDescriptionWrapper>You haven't created a brand profile yet</CardDescriptionWrapper>
              </CardHeaderWrapper>
              <CardContentWrapper>
                <p>Create a brand profile to ensure consistency across all your generated content.</p>
              </CardContentWrapper>
              <CardFooterWrapper>
                <ButtonWrapper 
                  onClick={() => {
                    setEditMode(true);
                    setActiveTab('edit');
                  }}
                >
                  Create Brand Profile
                </ButtonWrapper>
              </CardFooterWrapper>
            </CardWrapper>
          )}
        </TabsContentWrapper>
        
        <TabsContentWrapper value="logos" className="mt-6">
          {currentBrand && (
            <LogoManagement 
              primaryLogo={currentBrand.visualIdentity.logos.primary}
              alternativeLogo={currentBrand.visualIdentity.logos.alternative || ''}
              onPrimaryLogoChange={(url) => {
                const updatedBrand = {
                  ...currentBrand,
                  visualIdentity: {
                    ...currentBrand.visualIdentity,
                    logos: {
                      ...currentBrand.visualIdentity.logos,
                      primary: url
                    }
                  }
                };
                useBrandStore.getState().updateBrand(updatedBrand.id, updatedBrand);
              }}
              onAlternativeLogoChange={(url) => {
                const updatedBrand = {
                  ...currentBrand,
                  visualIdentity: {
                    ...currentBrand.visualIdentity, 
                    logos: {
                      ...currentBrand.visualIdentity.logos,
                      alternate: [url]
                    }
                  }
                };
                useBrandStore.getState().updateBrand(updatedBrand.id, updatedBrand);
              }}
            />
          )}
        </TabsContentWrapper>
        
        <TabsContentWrapper value="edit" className="mt-6">
          <BrandProfileForm 
            initialData={convertToFormData(currentBrand)}
            onSubmit={handleSaveBrand}
            onCancel={() => {
              setEditMode(false);
              setActiveTab('view');
            }}
          />
        </TabsContentWrapper>
      </TabsWrapper>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">What can you do with Brand Profiles?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardWrapper>
            <CardHeaderWrapper>
              <CardTitleWrapper>Content Generation</CardTitleWrapper>
            </CardHeaderWrapper>
            <CardContentWrapper>
              <p>Apply your brand style to all AI-generated content automatically. Create on-brand presentations, emails, and social media posts.</p>
            </CardContentWrapper>
            <CardFooterWrapper>
              <ButtonWrapper variant="outline" onClick={() => router.push('/tools/presentation-generator')}>
                Create Presentation
              </ButtonWrapper>
            </CardFooterWrapper>
          </CardWrapper>
          
          <CardWrapper>
            <CardHeaderWrapper>
              <CardTitleWrapper>Brand Consistency</CardTitleWrapper>
            </CardHeaderWrapper>
            <CardContentWrapper>
              <p>Maintain a consistent voice, style and visual identity across all your marketing materials and customer touchpoints.</p>
            </CardContentWrapper>
          </CardWrapper>
          
          <CardWrapper>
            <CardHeaderWrapper>
              <CardTitleWrapper>Multi-Brand Management</CardTitleWrapper>
            </CardHeaderWrapper>
            <CardContentWrapper>
              <p>Create and manage multiple brand profiles for different products, services, or client accounts.</p>
            </CardContentWrapper>
            <CardFooterWrapper>
              <ButtonWrapper 
                variant="outline" 
                onClick={() => {
                  setEditMode(true);
                  setActiveTab('edit');
                  // Reset form for new brand
                  useBrandStore.setState(state => ({
                    ...state,
                    activeBrandId: null
                  }));
                }}
              >
                Add New Brand
              </ButtonWrapper>
            </CardFooterWrapper>
          </CardWrapper>
        </div>
      </div>
    </div>
  );
} 