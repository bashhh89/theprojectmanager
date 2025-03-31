'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ProjectTabs } from '@/components/projects/ProjectTabs';
import { OverviewTab } from '@/components/projects/OverviewTab';
import { MilestonesTab } from '@/components/projects/MilestonesTab';
import { BrandingTab } from '@/components/projects/BrandingTab';
import { MarketingTab } from '@/components/projects/MarketingTab';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  due_date: string | null;
  milestone_id?: string;
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

interface Project {
  id: string;
  title: string;
  name: string;
  description: string;
  status: string;
  type?: string;
  timeline?: string;
  objectives?: string[];
  risks?: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  metrics?: {
    keyPerformanceIndicators?: string[];
    successCriteria?: string[];
    healthChecks?: string[];
  };
  branding?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      text?: string;
    };
    typography?: {
      headingFont?: string;
      bodyFont?: string;
      fontPairings?: Array<{
        heading: string;
        body: string;
        usage: string;
      }>;
    };
    logoSuggestions?: Array<{
      description: string;
      prompt: string;
      style: string;
    }>;
    brandVoice?: {
      tone?: string;
      personality?: string[];
      keywords?: string[];
      samplePhrases?: string[];
    };
  };
  marketing?: {
    socialMedia?: {
      platforms?: any[];
      contentCalendar?: any[];
    };
    emailMarketing?: {
      campaigns?: any[];
      automations?: any[];
    };
  };
  created_at: string;
  updated_at: string;
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const projectId = unwrappedParams.id;
  
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/login');
          return;
        }
        
        // Set user state
        setUser(user);
        
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        
        if (projectError) {
          throw new Error(projectError.message);
        }
        
        if (!projectData) {
          throw new Error('Project not found');
        }
        
        setProject(projectData);
        
        // Fetch milestones for this project
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('milestones')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });
          
        if (milestonesError) {
          console.error('Error fetching milestones:', milestonesError);
        } else {
          const milestoneIds = milestonesData ? milestonesData.map(m => m.id) : [];
          
          // Fetch tasks for this project
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('priority', { ascending: false })
            .order('status', { ascending: true });
          
          if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
          } else {
            setTasks(tasksData || []);
            
            // Calculate project progress
            if (tasksData && tasksData.length > 0) {
              const completedTasks = tasksData.filter(task => task.status === 'completed').length;
              setProgress(Math.round((completedTasks / tasksData.length) * 100));
            }
            
            // Group tasks by milestone
            const milestonesWithTasks = milestonesData ? milestonesData.map(milestone => ({
              ...milestone,
              tasks: tasksData ? tasksData.filter(task => task.milestone_id === milestone.id) : []
            })) : [];
            
            setMilestones(milestonesWithTasks);
          }
        }
      } catch (err: any) {
        console.error('Error loading project:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [projectId, router]);
  
  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    { 
      id: 'milestones', 
      label: 'Milestones & Tasks',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'branding', 
      label: 'Branding',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    { 
      id: 'marketing', 
      label: 'Marketing',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    }
  ];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="mb-4">
          <a href="/projects" className="text-gray-400 hover:text-white mb-2 flex items-center">
            ← Back to Projects
          </a>
        </div>
        <h1 className="text-2xl font-bold text-red-500">Error Loading Project</h1>
        <p className="mt-4">Failed to load project details.</p>
        <p className="mt-2 text-gray-400">{error}</p>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="p-8">
        <div className="mb-4">
          <a href="/projects" className="text-gray-400 hover:text-white mb-2 flex items-center">
            ← Back to Projects
          </a>
        </div>
        <h1 className="text-2xl font-bold text-amber-500">Project Not Found</h1>
        <p className="mt-4">The project you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen">
      <div className="mb-6">
        <a href="/projects" className="text-blue-400 hover:text-blue-300 mb-2 flex items-center transition-colors duration-200">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Projects
        </a>
      </div>
      
      {/* Project Header */}
      <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {project.title || project.name}
          </h1>
          <span className={`px-4 py-2 rounded-full text-sm font-medium
            ${project.status === 'active' ? 'bg-green-900/40 text-green-400 border border-green-800/50' : 
              project.status === 'completed' ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50' : 
              'bg-amber-900/40 text-amber-400 border border-amber-800/50'}
          `}>
            {project.status}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-gray-300">Progress</h2>
            <span className="text-sm font-medium text-blue-400">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-8">
        <ProjectTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          projectId={projectId}
          tabs={tabs}
        />
      </div>
      
      {/* Tab Content */}
      <div className="bg-gray-800/40 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-gray-700/50 shadow-lg">
        {activeTab === 'overview' && (
          <OverviewTab project={project} />
        )}
        
        {activeTab === 'milestones' && (
          <MilestonesTab 
            milestones={milestones}
            projectId={projectId}
          />
        )}
        
        {activeTab === 'branding' && (
          <BrandingTab brandingData={project.branding} />
        )}
        
        {activeTab === 'marketing' && (
          <MarketingTab marketingData={project.marketing} />
        )}
      </div>
    </div>
  );
} 