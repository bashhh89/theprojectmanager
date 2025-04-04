'use client';

import React, { useEffect, useState, useRef } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Poppins, Noto_Sans_Arabic } from 'next/font/google';
import './rtl-support.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
});

// Define types for section refs
type SectionRefs = {
  [key: string]: HTMLElement | null;
};

const FoundationalPartnerContent = () => {
  const { translations, toggleLanguage, isRtl } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>('hero');
  const sectionRefs = useRef<SectionRefs>({});

  // Register section refs
  const registerSection = (id: string, ref: HTMLElement | null) => {
    sectionRefs.current[id] = ref;
  };

  // Scroll to section when clicking on sidebar link
  const scrollToSection = (sectionId: string) => {
    const section = sectionRefs.current[sectionId];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset to trigger a bit earlier

      // Find the section that's currently in view
      const currentSection = Object.keys(sectionRefs.current).find((sectionId) => {
        const section = sectionRefs.current[sectionId];
        if (!section) return false;
        
        const offsetTop = section.offsetTop;
        const offsetHeight = section.offsetHeight;
        
        return scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight;
      });

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Define the navigation items
  const navigationItems = [
    { id: 'hero', label: translations.language === 'en' ? 'Opportunity' : 'الفرصة' },
    { id: 'intro', label: translations.language === 'en' ? 'Introduction' : 'المقدمة' },
    { id: 'vision', label: translations.language === 'en' ? 'Vision & Platform' : 'الرؤية والمنصة' },
    { id: 'opportunity', label: translations.language === 'en' ? 'Launch Opportunity' : 'فرصة الإطلاق' },
    { id: 'offer', label: translations.language === 'en' ? 'Partner Offer' : 'عرض الشراكة' },
    { id: 'funds', label: translations.language === 'en' ? 'Use of Funds' : 'استخدام التمويل' },
    { id: 'cta', label: translations.language === 'en' ? 'Take Action' : 'المشاركة' },
  ];

  return (
    <div className={cn(
      "w-full text-white", 
      isRtl ? "rtl" : "ltr",
      poppins.variable, 
      notoSansArabic.variable
    )}>
      {/* Language Toggle Bar */}
      <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          {translations.language === 'en' ? 'Foundational Partner Opportunity' : 'فرصة الشراكة التأسيسية'}
        </h1>
        <Button 
          variant="outline" 
          onClick={toggleLanguage} 
          className="text-white border-gray-600 hover:bg-gray-800"
          size="lg"
        >
          {translations.switchLanguage}
        </Button>
      </div>

      {/* Page Content */}
      <div className="flex">
        {/* Section Navigation */}
        <div className="w-64 bg-gray-900/80 border-r border-gray-800 sticky top-[73px] h-[calc(100vh-73px)] overflow-auto">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "w-full text-left py-2 px-4 rounded transition-colors",
                      activeSection === item.id
                        ? "bg-blue-900/50 text-blue-400"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-grow px-4 py-6">
          {/* Hero Section */}
          <section 
            id="hero" 
            ref={(el) => registerSection('hero', el)}
            className="py-12 bg-gradient-to-b from-black to-gray-900 text-center"
          >
            <div className="max-w-4xl mx-auto px-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 inline-block text-transparent bg-clip-text">
                {translations.headline}
              </h1>
            </div>
          </section>

          {/* Introduction Section */}
          <section 
            id="intro" 
            ref={(el) => registerSection('intro', el)}
            className="py-12 px-6 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-blue-400">
              {translations.introTitle}
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 leading-relaxed">
                {translations.introduction}
              </p>
            </div>
          </section>

          {/* Vision & Platform Section */}
          <section 
            id="vision" 
            ref={(el) => registerSection('vision', el)}
            className="py-12 px-6 max-w-4xl mx-auto bg-gray-900/50"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-blue-400">
              {translations.visionTitle}
            </h2>
            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-lg text-gray-300 leading-relaxed">
                {translations.visionText}
              </p>
              <h3 className="text-xl font-medium text-blue-300">
                {translations.advantageTitle}
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                {translations.advantageText}
              </p>
            </div>
          </section>

          {/* Opportunity Section */}
          <section 
            id="opportunity" 
            ref={(el) => registerSection('opportunity', el)}
            className="py-12 px-6 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-blue-400">
              {translations.opportunityTitle}
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 leading-relaxed">
                {translations.opportunityText}
              </p>
            </div>
          </section>

          {/* Foundational Partner Offer Section */}
          <section 
            id="offer" 
            ref={(el) => registerSection('offer', el)}
            className="py-12 px-6 max-w-4xl mx-auto bg-gray-900/50"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-blue-400">
              {translations.offerTitle}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bronze Tier */}
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="border-b border-gray-800 bg-gradient-to-r from-amber-700 to-amber-900">
                  <CardTitle className="text-center">{translations.tierBronzeTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="font-semibold">{translations.tierBronzeContribution}</p>
                  <p>{translations.tierBronzeReturn}</p>
                  <p className="text-blue-400">{translations.tierBronzeBonus}</p>
                </CardContent>
              </Card>
              
              {/* Silver Tier */}
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="border-b border-gray-800 bg-gradient-to-r from-gray-500 to-gray-700">
                  <CardTitle className="text-center">{translations.tierSilverTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="font-semibold">{translations.tierSilverContribution}</p>
                  <p>{translations.tierSilverReturn}</p>
                  <p className="text-blue-400">{translations.tierSilverBonus}</p>
                </CardContent>
              </Card>
              
              {/* Gold Tier */}
              <Card className="bg-gray-900 border-gray-800 text-white">
                <CardHeader className="border-b border-gray-800 bg-gradient-to-r from-yellow-500 to-yellow-700">
                  <CardTitle className="text-center">{translations.tierGoldTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="font-semibold">{translations.tierGoldContribution}</p>
                  <p>{translations.tierGoldReturn}</p>
                  <p className="text-blue-400">{translations.tierGoldBonus}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-medium text-blue-300">
                {translations.repaymentTitle}
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                {translations.repaymentText}
              </p>
              
              <h3 className="text-xl font-medium text-blue-300">
                {translations.whyOfferTitle}
              </h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                {translations.whyOfferText}
              </p>
            </div>
          </section>

          {/* Use of Funds Section */}
          <section 
            id="funds" 
            ref={(el) => registerSection('funds', el)}
            className="py-12 px-6 max-w-4xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-blue-400">
              {translations.fundsTitle}
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 leading-relaxed">
                {translations.fundsText}
              </p>
            </div>
          </section>

          {/* Call to Action Section */}
          <section 
            id="cta" 
            ref={(el) => registerSection('cta', el)}
            className="py-12 px-6 max-w-4xl mx-auto bg-gray-900/50 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-blue-400">
              {translations.ctaTitle}
            </h2>
            <div className="prose prose-invert max-w-none space-y-4">
              <p className="text-lg text-gray-300 leading-relaxed">
                {translations.ctaText}
              </p>
              <div className="flex flex-col items-center justify-center space-y-2 my-6">
                <p className="text-xl text-white">{translations.ctaEmail}</p>
                <p className="text-xl text-white">{translations.ctaPhone}</p>
              </div>
              <p className="text-lg text-amber-500 font-semibold">
                {translations.ctaUrgency}
              </p>
            </div>
            <Button 
              size="lg" 
              className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6 px-8"
            >
              {translations.language === 'en' ? 'Contact Ahmad Directly' : 'تواصل مع أحمد مباشرة'}
            </Button>
          </section>

          {/* Disclaimer Section */}
          <section className="py-12 px-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
              {translations.disclaimerTitle}
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-sm text-gray-400 leading-relaxed">
                {translations.disclaimerText}
              </p>
            </div>
          </section>
          
          {/* Footer */}
          <footer className="py-8 border-t border-gray-800">
            <div className="max-w-4xl mx-auto px-6 text-center text-gray-500">
              <p>© 2023 QanDu AI. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default function FoundationalPartnerPage() {
  return (
    <LanguageProvider>
      <FoundationalPartnerContent />
    </LanguageProvider>
  );
} 