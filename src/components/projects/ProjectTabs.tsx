'use client';

import React, { useState } from 'react';

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  projectId: string;
  tabs: { id: string; label: string; icon: React.ReactNode }[];
}

export function ProjectTabs({ activeTab, onTabChange, projectId, tabs }: ProjectTabsProps) {
  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
      <div className="flex space-x-1 p-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out
              ${activeTab === tab.id 
                ? 'bg-gray-700/70 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'}`}
          >
            <span className={`mr-2 transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className={`transition-all duration-200 ${activeTab === tab.id ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 