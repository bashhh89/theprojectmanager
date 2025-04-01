import React from 'react';
import Link from 'next/link';

// This layout will wrap the editor for a specific site
const SiteEditorLayout = ({ 
  children,
  params
}: { 
  children: React.ReactNode;
  params: { siteId: string };
}) => {
  const { siteId } = params;

  return (
    <div>
      {/* Add editor-specific navigation (Pages, Settings, Preview, etc.) */}
      <nav className="mb-4 border-b pb-2">
        <ul className="flex space-x-4">
          {/* Use Link component */}
          <li>
            <Link href={`/website-builder/${siteId}/pages`} className="text-blue-600 hover:underline">
              Pages
            </Link>
          </li>
          <li>
            <Link href={`/website-builder/${siteId}/settings`} className="text-blue-600 hover:underline">
              Settings
            </Link>
          </li>
          <li>
            {/* Preview can still be a standard link if needed to open in new tab easily */}
            <a href={`/website-builder/${siteId}/preview`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Preview
            </a>
          </li>
          {/* Add more editor sections as needed */}
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  );
};

export default SiteEditorLayout; 