'use client';

import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  estimated_hours?: number;
  requirements?: string[];
  skills?: string[];
  subtasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: Task[];
}

export function MilestonesTab({ 
  milestones,
  projectId
}: { 
  milestones: Milestone[];
  projectId: string;
}) {
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  
  const toggleMilestone = (id: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const getMilestoneProgress = (milestone: Milestone) => {
    if (!milestone.tasks || milestone.tasks.length === 0) return 0;
    const completedTasks = milestone.tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / milestone.tasks.length) * 100);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Project Milestones</h2>
        <a 
          href={`/projects/${projectId}/add-milestone`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Add Milestone
        </a>
      </div>
      
      {milestones.length === 0 ? (
        <div className="bg-gray-800/50 p-8 rounded-lg border border-gray-700 text-center">
          <h3 className="text-lg font-medium mb-2">No Milestones Yet</h3>
          <p className="text-gray-400 mb-4">Add milestones to track major project phases and goals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const progress = getMilestoneProgress(milestone);
            const isExpanded = expandedMilestones[milestone.id] || false;
            
            return (
              <div key={milestone.id} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800"
                  onClick={() => toggleMilestone(milestone.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">{milestone.title}</h3>
                      <span className={`ml-3 px-2 py-0.5 text-xs rounded-full
                        ${milestone.status === 'completed' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                          milestone.status === 'in_progress' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 
                          'bg-amber-900/30 text-amber-400 border border-amber-800'}
                      `}>
                        {milestone.status.replace('_', ' ')}
                      </span>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
                    )}
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <span>{milestone.tasks.length} tasks</span>
                      <span className="mx-2">•</span>
                      <span>{progress}% complete</span>
                      {milestone.deadline && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Due: {new Date(milestone.deadline).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-700 rounded-full h-2 mr-4">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <svg 
                      className={`h-5 w-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-gray-700 p-4">
                    <h4 className="text-sm font-medium mb-3 text-gray-400">Tasks</h4>
                    <div className="space-y-2">
                      {milestone.tasks.length > 0 ? (
                        milestone.tasks.map(task => (
                          <div key={task.id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                            <div>
                              <div className="flex items-center">
                                <h5 className="font-medium">{task.title}</h5>
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full
                                  ${task.priority === 'high' ? 'bg-red-900/30 text-red-400 border border-red-800' : 
                                    task.priority === 'medium' ? 'bg-amber-900/30 text-amber-400 border border-amber-800' : 
                                    'bg-green-900/30 text-green-400 border border-green-800'}
                                `}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.description && (
                                <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 text-xs rounded-full
                              ${task.status === 'completed' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                                task.status === 'in_progress' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 
                                'bg-amber-900/30 text-amber-400 border border-amber-800'}
                            `}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-2">
                          No tasks for this milestone yet
                        </div>
                      )}
                    </div>
                    <a 
                      href={`/projects/${projectId}/milestones/${milestone.id}/add-task`}
                      className="mt-3 text-sm text-blue-400 inline-block hover:text-blue-300"
                    >
                      + Add Task to Milestone
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 