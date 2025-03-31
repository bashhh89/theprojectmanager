'use client';

import React from 'react';

interface ProjectData {
  id: string;
  title: string;
  description: string;
  status: string;
  objectives?: string[];
  timeline?: string;
  type?: string;
  metrics?: {
    keyPerformanceIndicators?: string[];
    successCriteria?: string[];
    healthChecks?: string[];
  };
  risks?: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
}

export function OverviewTab({ project }: { project: ProjectData }) {
  return (
    <div className="space-y-8">
      {/* Project Description Section */}
      <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
        <h3 className="text-2xl font-semibold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Project Description</h3>
        <p className="text-gray-300 leading-relaxed">{project.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {project.type && (
            <div className="bg-gray-900/50 rounded-lg p-4 flex items-center border border-gray-800/50 shadow-inner">
              <div className="mr-4 bg-gray-800 p-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <span className="text-gray-500 text-sm block">Project Type</span>
                <span className="font-medium text-gray-300 capitalize">{project.type}</span>
              </div>
            </div>
          )}
          
          {project.timeline && (
            <div className="bg-gray-900/50 rounded-lg p-4 flex items-center border border-gray-800/50 shadow-inner">
              <div className="mr-4 bg-gray-800 p-2 rounded-lg">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <span className="text-gray-500 text-sm block">Timeline</span>
                <span className="font-medium text-gray-300">{project.timeline}</span>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Objectives Section */}
      {project.objectives && project.objectives.length > 0 && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Key Objectives</h3>
          </div>
          <div className="space-y-4">
            {project.objectives.map((objective, index) => (
              <div key={index} className="flex items-start p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
                <div className="min-w-8 h-8 flex items-center justify-center bg-blue-900/40 text-blue-400 rounded-full mr-4 font-bold text-lg border border-blue-800/50">
                  {index + 1}
                </div>
                <p className="text-gray-300 pt-1">{objective}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Metrics Section */}
      {project.metrics && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Metrics & KPIs</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {project.metrics.keyPerformanceIndicators && project.metrics.keyPerformanceIndicators.length > 0 && (
              <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50">
                <h4 className="text-lg font-medium mb-3 text-blue-400">Key Performance Indicators</h4>
                <ul className="space-y-2 text-gray-300">
                  {project.metrics.keyPerformanceIndicators.map((kpi, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{kpi}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {project.metrics.successCriteria && project.metrics.successCriteria.length > 0 && (
              <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50">
                <h4 className="text-lg font-medium mb-3 text-purple-400">Success Criteria</h4>
                <ul className="space-y-2 text-gray-300">
                  {project.metrics.successCriteria.map((criteria, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {project.metrics.healthChecks && project.metrics.healthChecks.length > 0 && (
              <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/50">
                <h4 className="text-lg font-medium mb-3 text-green-400">Health Checks</h4>
                <ul className="space-y-2 text-gray-300">
                  {project.metrics.healthChecks.map((check, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
      
      {/* Risks Section */}
      {project.risks && project.risks.length > 0 && (
        <section className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-gray-600/50">
          <div className="flex items-center mb-5">
            <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Risks & Mitigation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.risks.map((risk, index) => (
              <div key={index} className="bg-gray-900/50 p-5 rounded-lg shadow-lg border border-gray-800/50 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex justify-between mb-3">
                  <h4 className="font-medium text-lg">{risk.title}</h4>
                  <span className={`px-3 py-1 text-xs rounded-full flex items-center
                    ${risk.severity === 'high' ? 'bg-red-900/40 text-red-400 border border-red-800/50' : 
                      risk.severity === 'medium' ? 'bg-amber-900/40 text-amber-400 border border-amber-800/50' : 
                      'bg-green-900/40 text-green-400 border border-green-800/50'}
                  `}>
                    <span className={`w-2 h-2 rounded-full mr-1 ${
                      risk.severity === 'high' ? 'bg-red-400' : 
                      risk.severity === 'medium' ? 'bg-amber-400' : 
                      'bg-green-400'
                    }`}></span>
                    {risk.severity} severity
                  </span>
                </div>
                <p className="text-gray-400 mb-4">{risk.description}</p>
                <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/50">
                  <span className="text-gray-400 font-medium block mb-1">Mitigation Strategy: </span>
                  <span className="text-gray-300">{risk.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
} 