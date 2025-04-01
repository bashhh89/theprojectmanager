'use client';

import React from 'react';
import Image from 'next/image';
import { BrandProfile } from '@/types/brand';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BrandProfilePreviewProps {
  brand: BrandProfile;
  onEdit?: () => void;
  onApply?: () => void;
}

export function BrandProfilePreview({ brand, onEdit, onApply }: BrandProfilePreviewProps) {
  // Derive some styles from the brand colors
  const styles = {
    header: {
      backgroundColor: brand.visualIdentity.colorPalette.primary,
      color: brand.visualIdentity.colorPalette.text
    },
    accent: {
      backgroundColor: brand.visualIdentity.colorPalette.accent,
      color: brand.visualIdentity.colorPalette.background
    },
    text: {
      fontFamily: brand.visualIdentity.typography.bodyFont,
      color: brand.visualIdentity.colorPalette.text
    },
    heading: {
      fontFamily: brand.visualIdentity.typography.headingFont,
      fontWeight: brand.visualIdentity.typography.headingWeight,
      color: brand.visualIdentity.colorPalette.primary
    },
    colorSwatch: {
      width: '50px',
      height: '50px',
      borderRadius: '4px',
      display: 'inline-block',
      margin: '4px'
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader style={styles.header}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl">{brand.name}</CardTitle>
            <CardDescription className="opacity-90">Brand Profile</CardDescription>
          </div>
          <div className="flex-shrink-0 h-16 w-16 relative">
            {brand.visualIdentity.logos.primary && (
              <Image 
                src={brand.visualIdentity.logos.primary}
                alt={`${brand.name} logo`}
                fill
                style={{ objectFit: 'contain' }}
              />
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="visual">
          <TabsList className="mb-4">
            <TabsTrigger value="visual">Visual Identity</TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
            <TabsTrigger value="positioning">Positioning</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visual" className="space-y-4">
            <div>
              <h3 style={styles.heading} className="text-lg font-semibold mb-2">Color Palette</h3>
              <div className="flex flex-wrap gap-2">
                <div>
                  <div style={{...styles.colorSwatch, backgroundColor: brand.visualIdentity.colorPalette.primary}}></div>
                  <span className="text-xs block text-center">Primary</span>
                </div>
                <div>
                  <div style={{...styles.colorSwatch, backgroundColor: brand.visualIdentity.colorPalette.secondary}}></div>
                  <span className="text-xs block text-center">Secondary</span>
                </div>
                <div>
                  <div style={{...styles.colorSwatch, backgroundColor: brand.visualIdentity.colorPalette.accent}}></div>
                  <span className="text-xs block text-center">Accent</span>
                </div>
                <div>
                  <div style={{...styles.colorSwatch, backgroundColor: brand.visualIdentity.colorPalette.text}}></div>
                  <span className="text-xs block text-center">Text</span>
                </div>
                <div>
                  <div style={{...styles.colorSwatch, backgroundColor: brand.visualIdentity.colorPalette.background, border: '1px solid #eee'}}></div>
                  <span className="text-xs block text-center">Background</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 style={styles.heading} className="text-lg font-semibold mb-2">Typography</h3>
              <div className="space-y-2">
                <p>Heading: <span style={{fontFamily: brand.visualIdentity.typography.headingFont, fontWeight: brand.visualIdentity.typography.headingWeight}}>{brand.visualIdentity.typography.headingFont}</span></p>
                <p>Body: <span style={{fontFamily: brand.visualIdentity.typography.bodyFont}}>{brand.visualIdentity.typography.bodyFont}</span></p>
                <p>Base size: {brand.visualIdentity.typography.baseSize}</p>
              </div>
            </div>
            
            <div>
              <h3 style={styles.heading} className="text-lg font-semibold mb-2">Image Style</h3>
              <Badge style={styles.accent} className="mb-2">{brand.visualIdentity.imageStyle.style}</Badge>
              {brand.visualIdentity.imageStyle.preferredSubjects && (
                <div className="mt-2">
                  <p className="text-sm mb-1">Preferred subjects:</p>
                  <div className="flex flex-wrap gap-1">
                    {brand.visualIdentity.imageStyle.preferredSubjects.map((subject, i) => (
                      <Badge key={i} variant="outline">{subject}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="messaging" className="space-y-4">
            <div>
              <h3 style={styles.heading} className="text-lg font-semibold mb-2">Brand Voice</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {brand.voice.tone.map((tone, i) => (
                  <Badge key={i} variant="secondary">{tone}</Badge>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium mb-1">Preferred terms:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {brand.voice.vocabulary.preferred.slice(0, 5).map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Avoided terms:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {brand.voice.vocabulary.avoided.slice(0, 5).map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {brand.voice.examples.length > 0 && (
              <div>
                <h3 style={styles.heading} className="text-lg font-semibold mb-2">Example Messaging</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="italic text-sm">{brand.voice.examples[0]}</p>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="positioning" className="space-y-4">
            <div>
              <h3 style={styles.heading} className="text-lg font-semibold mb-2">Value Proposition</h3>
              <p className="text-sm">{brand.positioning.valueProposition}</p>
            </div>
            
            <div>
              <h3 style={styles.heading} className="text-lg font-semibold mb-2">Target Audiences</h3>
              <div className="flex flex-wrap gap-1">
                {brand.positioning.targetAudiences.map((audience, i) => (
                  <Badge key={i} variant="outline">{audience}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={styles.heading} className="text-lg font-semibold mb-2">Competitive Advantages</h3>
              <ul className="list-disc pl-5 text-sm">
                {brand.positioning.competitiveAdvantages.map((advantage, i) => (
                  <li key={i}>{advantage}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2 bg-gray-50 p-4">
        {onEdit && (
          <Button variant="outline" onClick={onEdit}>
            Edit Brand
          </Button>
        )}
        {onApply && (
          <Button onClick={onApply}>
            Apply to Content
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 