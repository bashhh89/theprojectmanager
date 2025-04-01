import React from 'react';

const WebsiteBuilderLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="p-4">
      {/* Potentially add a sub-navigation or header specific to the website builder */}
      <h1 className="text-2xl font-bold mb-4">Website Builder</h1>
      <main>{children}</main>
    </div>
  );
};

export default WebsiteBuilderLayout; 