import React from 'react';
import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'QanDu AI | Foundational Partner Opportunity',
  description: 'QanDu AI - Foundational Partner Investment Opportunity for MENA entrepreneurs platform',
};

// This custom layout prevents the main app sidebar from showing
export default function FoundationalPartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="foundational-partner-layout">
      {children}
    </div>
  );
} 