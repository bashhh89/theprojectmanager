'use client';

import React from 'react';
import { BrandProfile } from '@/types/brand';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { LogoUpload } from '@/components/ui/logo-upload';

// Create a schema for brand profiles
const brandProfileSchema = z.object({
  name: z.string().min(2, {
    message: "Brand name must be at least 2 characters.",
  }),
  
  // Visual Identity
  visualIdentity: z.object({
    logos: z.object({
      primary: z.string().optional(),
      alternative: z.string().optional(),
    }),
    colorPalette: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      text: z.string(),
      background: z.string(),
    }),
    typography: z.object({
      headingFont: z.string(),
      bodyFont: z.string(),
      baseSize: z.string(),
      headingWeight: z.string(),
    }),
    imageStyle: z.object({
      style: z.string(),
      preferredSubjects: z.array(z.string()).optional(),
      filterSettings: z.string().optional(),
    }),
  }),
  
  // Voice and Messaging
  voice: z.object({
    tone: z.array(z.string()),
    vocabulary: z.object({
      preferred: z.array(z.string()),
      avoided: z.array(z.string()),
    }),
    examples: z.array(z.string()),
  }),
  
  // Strategic Positioning
  positioning: z.object({
    valueProposition: z.string(),
    targetAudiences: z.array(z.string()),
    competitiveAdvantages: z.array(z.string()),
    industryKeywords: z.array(z.string()).optional(),
  }),
  
  // Optional contact info
  contactInfo: z.object({
    website: z.string().url().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
});

// Simplify the type for now to match what we need
type SimplifiedBrandProfile = {
  name: string;
  visualIdentity: {
    logos: {
      primary: string;
      alternative?: string;
    };
    colorPalette: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      background: string;
    };
    typography: {
      headingFont: string;
      bodyFont: string;
      baseSize: string;
      headingWeight: string;
    };
    imageStyle: {
      style: string;
      preferredSubjects: string[];
      filterSettings?: string;
    };
  };
  voice: {
    tone: string[];
    vocabulary: {
      preferred: string[];
      avoided: string[];
    };
    examples: string[];
  };
  positioning: {
    valueProposition: string;
    targetAudiences: string[];
    competitiveAdvantages: string[];
    industryKeywords?: string[];
  };
  contactInfo?: {
    website?: string;
    email?: string;
    phone?: string;
  };
};

interface BrandProfileFormProps {
  initialData?: Partial<SimplifiedBrandProfile>;
  onSubmit: (data: SimplifiedBrandProfile) => void;
  onCancel?: () => void;
}

// Make sure field is properly typed
type FieldProps = ControllerRenderProps<SimplifiedBrandProfile, any>;

export function BrandProfileForm({ initialData, onSubmit, onCancel }: BrandProfileFormProps) {
  // Create empty default values
  const defaultValues: Partial<SimplifiedBrandProfile> = {
    name: '',
    visualIdentity: {
      logos: {
        primary: '',
        alternative: '',
      },
      colorPalette: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#F59E0B',
        text: '#111827',
        background: '#FFFFFF',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseSize: '16px',
        headingWeight: '600',
      },
      imageStyle: {
        style: 'Modern',
        preferredSubjects: [''],
        filterSettings: '',
      },
    },
    voice: {
      tone: ['Professional'],
      vocabulary: {
        preferred: [''],
        avoided: [''],
      },
      examples: [''],
    },
    positioning: {
      valueProposition: '',
      targetAudiences: [''],
      competitiveAdvantages: [''],
      industryKeywords: [''],
    },
    contactInfo: {
      website: '',
      email: '',
      phone: '',
    },
    ...initialData,
  };

  const form = useForm<SimplifiedBrandProfile>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues,
  });

  const handleSubmit = (data: SimplifiedBrandProfile) => {
    onSubmit(data);
  };

  // Helper function to handle array fields
  const handleArrayItem = (
    fieldName: string, 
    index: number, 
    value: string
  ) => {
    const currentValues = form.getValues(fieldName as any) as string[];
    const newValues = [...currentValues];
    newValues[index] = value;
    form.setValue(fieldName as any, newValues, { shouldValidate: true });
  };

  // Helper function to add array item
  const handleAddArrayItem = (fieldName: string) => {
    const currentValues = form.getValues(fieldName as any) as string[];
    form.setValue(fieldName as any, [...currentValues, ''], { shouldValidate: true });
  };

  // Helper function to remove array item
  const handleRemoveArrayItem = (fieldName: string, index: number) => {
    const currentValues = form.getValues(fieldName as any) as string[];
    const newValues = currentValues.filter((_, i) => i !== index);
    form.setValue(fieldName as any, newValues, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Brand Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: FieldProps }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter brand name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="visual" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="visual">Visual Identity</TabsTrigger>
            <TabsTrigger value="voice">Voice & Messaging</TabsTrigger>
            <TabsTrigger value="positioning">Positioning & Contact</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="visualIdentity.logos.primary"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>Primary Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualIdentity.logos.alternative"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>Alternative Logo URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo-alt.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Color Palette</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="visualIdentity.colorPalette.primary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <ColorPicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualIdentity.colorPalette.secondary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <FormControl>
                        <ColorPicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualIdentity.colorPalette.accent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accent Color</FormLabel>
                      <FormControl>
                        <ColorPicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualIdentity.colorPalette.text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Color</FormLabel>
                      <FormControl>
                        <ColorPicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualIdentity.colorPalette.background"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Color</FormLabel>
                      <FormControl>
                        <ColorPicker {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="visualIdentity.typography.headingFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heading Font</FormLabel>
                      <FormControl>
                        <Input placeholder="Inter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualIdentity.typography.bodyFont"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Font</FormLabel>
                      <FormControl>
                        <Input placeholder="Inter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualIdentity.typography.baseSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Font Size</FormLabel>
                      <FormControl>
                        <Input placeholder="16px" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualIdentity.typography.headingWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heading Weight</FormLabel>
                      <FormControl>
                        <Input placeholder="600" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Voice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <FormLabel>Tone</FormLabel>
                    <p className="text-xs text-muted-foreground mb-2">What characteristics define your brand's communication style?</p>
                    
                    {form.watch('voice.tone')?.map((_, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <Input 
                          value={form.watch(`voice.tone.${index}`)}
                          onChange={(e) => handleArrayItem('voice.tone', index, e.target.value)}
                          placeholder="Professional, Friendly, etc."
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoveArrayItem('voice.tone', index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddArrayItem('voice.tone')}
                    >
                      Add Tone
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FormLabel>Preferred Terms</FormLabel>
                      <p className="text-xs text-muted-foreground mb-2">Words your brand prefers to use</p>
                      
                      {form.watch('voice.vocabulary.preferred')?.map((_, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <Input 
                            value={form.watch(`voice.vocabulary.preferred.${index}`)}
                            onChange={(e) => handleArrayItem('voice.vocabulary.preferred', index, e.target.value)}
                            placeholder="innovative, solution, etc."
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveArrayItem('voice.vocabulary.preferred', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddArrayItem('voice.vocabulary.preferred')}
                      >
                        Add Term
                      </Button>
                    </div>
                    
                    <div>
                      <FormLabel>Avoided Terms</FormLabel>
                      <p className="text-xs text-muted-foreground mb-2">Words your brand avoids using</p>
                      
                      {form.watch('voice.vocabulary.avoided')?.map((_, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <Input 
                            value={form.watch(`voice.vocabulary.avoided.${index}`)}
                            onChange={(e) => handleArrayItem('voice.vocabulary.avoided', index, e.target.value)}
                            placeholder="cheap, problem, etc."
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveArrayItem('voice.vocabulary.avoided', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddArrayItem('voice.vocabulary.avoided')}
                      >
                        Add Term
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <FormLabel>Example Messages</FormLabel>
                    <p className="text-xs text-muted-foreground mb-2">Example content that demonstrates your brand's voice</p>
                    
                    {form.watch('voice.examples')?.map((_, index) => (
                      <div key={index} className="flex items-start gap-2 mb-2">
                        <Textarea 
                          value={form.watch(`voice.examples.${index}`)}
                          onChange={(e) => handleArrayItem('voice.examples', index, e.target.value)}
                          placeholder="Our innovative solutions transform how businesses operate..."
                          className="min-h-[80px]"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoveArrayItem('voice.examples', index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddArrayItem('voice.examples')}
                    >
                      Add Example
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="positioning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Strategic Positioning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="positioning.valueProposition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value Proposition</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="We help businesses..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Target Audiences</FormLabel>
                  <p className="text-xs text-muted-foreground mb-2">Who are your ideal customers?</p>
                  
                  {form.watch('positioning.targetAudiences')?.map((_, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input 
                        value={form.watch(`positioning.targetAudiences.${index}`)}
                        onChange={(e) => handleArrayItem('positioning.targetAudiences', index, e.target.value)}
                        placeholder="Small Business Owners, etc."
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveArrayItem('positioning.targetAudiences', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddArrayItem('positioning.targetAudiences')}
                  >
                    Add Audience
                  </Button>
                </div>
                
                <div>
                  <FormLabel>Competitive Advantages</FormLabel>
                  <p className="text-xs text-muted-foreground mb-2">What sets your brand apart from competitors?</p>
                  
                  {form.watch('positioning.competitiveAdvantages')?.map((_, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <Input 
                        value={form.watch(`positioning.competitiveAdvantages.${index}`)}
                        onChange={(e) => handleArrayItem('positioning.competitiveAdvantages', index, e.target.value)}
                        placeholder="24/7 Customer Support, etc."
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveArrayItem('positioning.competitiveAdvantages', index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddArrayItem('positioning.competitiveAdvantages')}
                  >
                    Add Advantage
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Information (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactInfo.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactInfo.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactInfo.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">
            Save Brand Profile
          </Button>
        </div>
      </form>
    </Form>
  );
} 