'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/authUtils';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number, completed: number }>>({});
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Use requireAuth utility - it will redirect if not authenticated
        const currentUser = await requireAuth();
        if (!currentUser) return;
        
        // Fetch user's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (projectsError) {
          throw new Error(projectsError.message);
        }
        
        setProjects(projectsData || []);
        
        // Fetch task counts for each project
        const projectIds = projectsData ? projectsData.map(p => p.id) : [];
        const counts: Record<string, { total: number, completed: number }> = {};
        
        if (projectIds.length > 0) {
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('project_id, status')
            .in('project_id', projectIds);
          
          if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
          } else if (tasks) {
            // Initialize counts for all projects
            projectIds.forEach(id => {
              counts[id] = { total: 0, completed: 0 };
            });
            
            // Count tasks by project
            tasks.forEach(task => {
              counts[task.project_id].total++;
              if (task.status === 'completed') {
                counts[task.project_id].completed++;
              }
            });
            
            setTaskCounts(counts);
          }
        }
      } catch (err: any) {
        console.error('Error loading projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [router]);
  
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
        <h1 className="text-2xl font-bold text-red-500">Error Loading Projects</h1>
        <p className="mt-4">Failed to load your projects.</p>
        <p className="mt-2 text-gray-400">{error}</p>
        <a href="/dashboard" className="mt-4 text-blue-500 hover:underline">Back to Dashboard</a>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Projects</h1>
          
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/projects/json-import')}
              className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Import from JSON
            </button>
            
            <button
              onClick={() => router.push('/projects/new')}
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Project
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="text-xl font-medium mb-2">No Projects Yet</h3>
            <p className="text-gray-400 mb-6">Create your first project to get started</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/projects/new')}
                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Your First Project
              </button>
              <button
                onClick={() => router.push('/projects/json-import')}
                className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Import from JSON
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const taskCount = taskCounts[project.id] || { total: 0, completed: 0 };
              const progress = taskCount.total > 0 
                ? Math.round((taskCount.completed / taskCount.total) * 100) 
                : 0;
              
              return (
                <div
                  key={project.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${project.status === 'active' ? 'bg-green-900/50 text-green-200' :
                          project.status === 'completed' ? 'bg-blue-900/50 text-blue-200' :
                          'bg-yellow-900/50 text-yellow-200'}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${project.priority === 'high' ? 'bg-red-900/50 text-red-200' :
                          project.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-200' :
                          'bg-green-900/50 text-green-200'}`}>
                        {project.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 