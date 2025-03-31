'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        // Get unique projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .order('updated_at', { ascending: false });

        if (projectsError) {
          throw projectsError;
        }

        // Remove duplicates by name
        const uniqueProjects = projectsData?.reduce((acc: Project[], current) => {
          const exists = acc.find(p => p.name === current.name);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []) || [];

        setProjects(uniqueProjects);
      } catch (err: any) {
        console.error('Error loading projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600">
            Manage Your Projects with Ease
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Organize tasks, track progress, and collaborate with your team in one powerful platform
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <a 
            href="/chat"
            className="bg-gray-800/30 rounded-lg p-5 border border-gray-700/50 hover:bg-gray-800/50 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Recent Chats</p>
                <h3 className="text-2xl font-bold mt-1 group-hover:text-blue-400 transition-colors">12</h3>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"></path>
                  <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>
                </svg>
              </div>
            </div>
          </a>

          <a 
            href="/projects"
            className="bg-gray-800/30 rounded-lg p-5 border border-gray-700/50 hover:bg-gray-800/50 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Active Projects</p>
                <h3 className="text-2xl font-bold mt-1 group-hover:text-purple-400 transition-colors">{projects.length}</h3>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M2 9V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"></path>
                </svg>
              </div>
            </div>
          </a>
          
          <a 
            href="/image-generator"
            className="bg-gray-800/30 rounded-lg p-5 border border-gray-700/50 hover:bg-gray-800/50 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Images Created</p>
                <h3 className="text-2xl font-bold mt-1 group-hover:text-green-400 transition-colors">27</h3>
              </div>
              <div className="p-2 bg-green-500/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
              </div>
            </div>
          </a>

          <a 
            href="/text-to-speech"
            className="bg-gray-800/30 rounded-lg p-5 border border-gray-700/50 hover:bg-gray-800/50 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Audio Generated</p>
                <h3 className="text-2xl font-bold mt-1 group-hover:text-amber-400 transition-colors">8</h3>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <path d="M12 6v12"></path>
                  <path d="M8 10v4"></path>
                  <path d="M16 10v4"></path>
                  <path d="M20 10v4"></path>
                  <path d="M4 10v4"></path>
                </svg>
              </div>
            </div>
          </a>
        </div>

        {/* Projects Section */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Projects</h2>
            <a 
              href="/projects/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Project
            </a>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium
                    ${project.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                      project.status === 'completed' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 
                      'bg-amber-900/30 text-amber-400 border border-amber-800'}
                  `}>
                    {project.status}
                  </span>
                </div>
                
                {project.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                )}

                <div className="text-xs text-gray-500">
                  Last updated: {new Date(project.updated_at).toLocaleDateString()}
                </div>
              </a>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No projects found</p>
              <a 
                href="/projects/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Project
              </a>
            </div>
          )}
        </div>

        {/* AI Tools Section */}
        <div className="mt-8 bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-6">AI Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a href="/image-generator" className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
              </div>
              <span className="font-medium">Image Generator</span>
            </a>

            <a href="/text-to-speech" className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M12 6v12"></path>
                  <path d="M8 10v4"></path>
                  <path d="M16 10v4"></path>
                  <path d="M20 10v4"></path>
                  <path d="M4 10v4"></path>
                </svg>
              </div>
              <span className="font-medium">Text to Speech</span>
            </a>

            <a href="/agents" className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span className="font-medium">Create Agent</span>
            </a>

            <a href="/test-tools" className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-amber-500/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </div>
              <span className="font-medium">Test Tools</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 