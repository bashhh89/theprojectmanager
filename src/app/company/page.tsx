'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BrandProfileForm } from '@/components/brand/BrandProfileForm';
import { BrandProfilePreview } from '@/components/brand/BrandProfilePreview';
import { LogoManagement } from '@/components/brand/LogoManagement';
import { useBrandStore } from '@/store/brandStore';
import { useProductStore } from '@/store/productStore';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Pencil, Building, Briefcase, Info, Share, Download, FileText } from 'lucide-react';
import Link from 'next/link';

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

interface AboutInfo {
  companyHistory: string;
  mission: string;
  vision: string;
  values: string[];
  teamMembers: { name: string; role: string; bio?: string }[];
  companyAchievements: string[];
}

export default function CompanyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isGeneratingAbout, setIsGeneratingAbout] = useState(false);
  
  // Get brand and product data from stores
  const { 
    brands, 
    activeBrandId, 
    setActiveBrand, 
    addBrand, 
    updateBrand, 
    deleteBrand,
    getActiveBrand
  } = useBrandStore();
  
  const { products, fetchProducts, isLoading: productsLoading } = useProductStore();
  
  // About section state
  const [aboutInfo, setAboutInfo] = useState<AboutInfo>({
    companyHistory: '',
    mission: '',
    vision: '',
    values: [],
    teamMembers: [],
    companyAchievements: []
  });
  
  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    setMounted(true);
  }, [fetchProducts]);
  
  // If not mounted yet, show placeholder
  if (!mounted) {
    return <div className="container py-8">Loading company information...</div>;
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
    setActiveTab('profile');
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
  
  const handleGenerateAbout = async () => {
    if (!currentBrand) {
      toasts.error('Please create a brand profile first');
      return;
    }
    
    setIsGeneratingAbout(true);
    
    try {
      // We'll use the brand data to generate relevant about information
      const response = await fetch('/api/generate-about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandName: currentBrand.name,
          valueProposition: currentBrand.positioning.valueProposition,
          targetAudiences: currentBrand.positioning.targetAudiences,
          competitiveAdvantages: currentBrand.positioning.competitiveAdvantages,
          industry: currentBrand.positioning.industryKeywords?.[0] || ''
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate about information');
      }
      
      const data = await response.json();
      setAboutInfo(data);
      
      toasts.success('Company information generated successfully');
    } catch (error) {
      console.error('Error generating about information:', error);
      toasts.error('Failed to generate company information');
    } finally {
      setIsGeneratingAbout(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Company Profile</h1>
          <p className="text-muted-foreground">
            Manage your company information, branding, and products in one place
          </p>
        </div>
        <div className="flex gap-2">
          {!editMode && currentBrand && (
            <>
              <ButtonWrapper 
                variant="outline" 
                onClick={() => {
                  setEditMode(true);
                  setActiveTab('brand-edit');
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
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
                setActiveTab('brand-edit');
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

      <TabsWrapper value={activeTab} onValueChange={setActiveTab}>
        <TabsListWrapper className="grid w-full max-w-md grid-cols-4">
          <TabsTriggerWrapper value="profile" disabled={editMode}>
            <Building className="h-4 w-4 mr-2" />
            Profile
          </TabsTriggerWrapper>
          <TabsTriggerWrapper value="brand-edit" disabled={!editMode}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Brand
          </TabsTriggerWrapper>
          <TabsTriggerWrapper value="products">
            <Briefcase className="h-4 w-4 mr-2" />
            Products
          </TabsTriggerWrapper>
          <TabsTriggerWrapper value="about">
            <Info className="h-4 w-4 mr-2" />
            About
          </TabsTriggerWrapper>
        </TabsListWrapper>
        
        <TabsContentWrapper value="profile" className="mt-6">
          {currentBrand ? (
            <BrandProfilePreview 
              brand={currentBrand} 
              onEdit={() => {
                setEditMode(true);
                setActiveTab('brand-edit');
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
                    setActiveTab('brand-edit');
                  }}
                >
                  Create Brand Profile
                </ButtonWrapper>
              </CardFooterWrapper>
            </CardWrapper>
          )}
        </TabsContentWrapper>
        
        <TabsContentWrapper value="brand-edit" className="mt-6">
          <BrandProfileForm 
            initialData={convertToFormData(currentBrand)}
            onSubmit={handleSaveBrand}
            onCancel={() => {
              setEditMode(false);
              setActiveTab('profile');
            }}
          />
        </TabsContentWrapper>
        
        <TabsContentWrapper value="products" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardWrapper className="h-auto">
              <CardHeaderWrapper>
                <CardTitleWrapper>Products & Services</CardTitleWrapper>
                <CardDescriptionWrapper>
                  Manage your product and service offerings
                </CardDescriptionWrapper>
              </CardHeaderWrapper>
              <CardContentWrapper>
                {productsLoading ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : products.length > 0 ? (
                  <div className="space-y-4">
                    {products.slice(0, 5).map(product => (
                      <div key={product.id} className="flex justify-between items-center border-b pb-3">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground truncate max-w-sm">
                            {product.description.substring(0, 100)}...
                          </p>
                        </div>
                        <Button variant="ghost" asChild size="sm">
                          <Link href={`/products/${product.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    ))}
                    
                    {products.length > 5 && (
                      <div className="pt-2 text-center">
                        <Button variant="link" asChild>
                          <Link href="/products">
                            View all {products.length} products
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground mb-4">No products or services defined yet</p>
                  </div>
                )}
              </CardContentWrapper>
              <CardFooterWrapper>
                <ButtonWrapper asChild>
                  <Link href="/products/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Product
                  </Link>
                </ButtonWrapper>
                <ButtonWrapper variant="outline" asChild className="ml-2">
                  <Link href="/products">
                    <Briefcase className="h-4 w-4 mr-2" />
                    View All Products
                  </Link>
                </ButtonWrapper>
              </CardFooterWrapper>
            </CardWrapper>
            
            <CardWrapper className="h-auto">
              <CardHeaderWrapper>
                <CardTitleWrapper>Export Options</CardTitleWrapper>
                <CardDescriptionWrapper>
                  Generate documents based on your company profile
                </CardDescriptionWrapper>
              </CardHeaderWrapper>
              <CardContentWrapper>
                <div className="space-y-4">
                  <div className="border rounded-md p-4 hover:bg-accent/5 cursor-pointer">
                    <div className="flex items-center">
                      <Share className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <h3 className="font-medium">Company Presentation</h3>
                        <p className="text-sm text-muted-foreground">
                          Generate a professional presentation about your company
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-accent/5 cursor-pointer">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <h3 className="font-medium">Company Fact Sheet</h3>
                        <p className="text-sm text-muted-foreground">
                          Create a one-page fact sheet with key information
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 hover:bg-accent/5 cursor-pointer">
                    <div className="flex items-center">
                      <Download className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <h3 className="font-medium">Export Company Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Download all company information as JSON
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContentWrapper>
            </CardWrapper>
          </div>
        </TabsContentWrapper>
        
        <TabsContentWrapper value="about" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <CardWrapper>
              <CardHeaderWrapper className="flex flex-row items-center justify-between">
                <div>
                  <CardTitleWrapper>About Your Company</CardTitleWrapper>
                  <CardDescriptionWrapper>
                    Build your company story and share your mission, vision, and values
                  </CardDescriptionWrapper>
                </div>
                <ButtonWrapper 
                  variant="outline"
                  onClick={handleGenerateAbout}
                  disabled={isGeneratingAbout || !currentBrand}
                >
                  {isGeneratingAbout ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </ButtonWrapper>
              </CardHeaderWrapper>
              
              <CardContentWrapper>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Company History</h3>
                    <Textarea 
                      value={aboutInfo.companyHistory}
                      onChange={(e) => setAboutInfo({...aboutInfo, companyHistory: e.target.value})}
                      placeholder="Describe the history and founding of your company..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Mission</h3>
                      <Textarea 
                        value={aboutInfo.mission}
                        onChange={(e) => setAboutInfo({...aboutInfo, mission: e.target.value})}
                        placeholder="Your company's mission statement..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Vision</h3>
                      <Textarea 
                        value={aboutInfo.vision}
                        onChange={(e) => setAboutInfo({...aboutInfo, vision: e.target.value})}
                        placeholder="Your company's vision for the future..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Values</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {aboutInfo.values.map((value, index) => (
                        <div key={index} className="bg-primary/10 rounded-full px-3 py-1 text-sm flex items-center">
                          {value}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 ml-1 hover:bg-transparent"
                            onClick={() => {
                              const newValues = [...aboutInfo.values];
                              newValues.splice(index, 1);
                              setAboutInfo({...aboutInfo, values: newValues});
                            }}
                          >
                            <span className="sr-only">Remove</span>
                            <span className="text-xs">×</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add a core value..." 
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            e.preventDefault();
                            setAboutInfo({
                              ...aboutInfo, 
                              values: [...aboutInfo.values, e.currentTarget.value.trim()]
                            });
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.previousSibling as HTMLInputElement;
                          if (input && input.value.trim()) {
                            setAboutInfo({
                              ...aboutInfo, 
                              values: [...aboutInfo.values, input.value.trim()]
                            });
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContentWrapper>
              
              <CardFooterWrapper>
                <ButtonWrapper>Save Company Information</ButtonWrapper>
              </CardFooterWrapper>
            </CardWrapper>
          </div>
        </TabsContentWrapper>
      </TabsWrapper>
    </div>
  );
} 