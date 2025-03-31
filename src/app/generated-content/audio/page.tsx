'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/authUtils';

interface GeneratedAudio {
  id: string;
  created_at: string;
  text: string;
  audio_url: string;
  project_id?: string;
  task_id?: string;
  project_title?: string;
  task_title?: string;
}

export default function GeneratedAudioPage() {
  const [audioItems, setAudioItems] = useState<GeneratedAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // 'all', 'projects', 'tasks'
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);

  useEffect(() => {
    async function loadAudioItems() {
      try {
        setLoading(true);
        
        // Ensure user is authenticated
        const currentUser = await requireAuth();
        if (!currentUser) return;
        
        // Fetch generated audio with project and task relations
        const { data, error: fetchError } = await supabase
          .from('generated_audio')
          .select(`
            *,
            projects:project_id (id, title),
            tasks:task_id (id, title)
          `)
          .order('created_at', { ascending: false });
        
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        
        // Format the data to include project and task titles
        const formattedAudio = data?.map(item => ({
          id: item.id,
          created_at: item.created_at,
          text: item.text,
          audio_url: item.audio_url,
          project_id: item.project_id,
          task_id: item.task_id,
          project_title: item.projects?.title,
          task_title: item.tasks?.title
        })) || [];
        
        setAudioItems(formattedAudio);
      } catch (err: any) {
        console.error('Error loading audio items:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadAudioItems();
  }, []);
  
  // Filter audio items based on selected filter
  const filteredAudioItems = audioItems.filter(audio => {
    if (filter === 'all') return true;
    if (filter === 'projects') return !!audio.project_id;
    if (filter === 'tasks') return !!audio.task_id;
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Generated Audio ({audioItems.length})</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium 
              ${filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('projects')}
            className={`px-4 py-2 rounded-lg text-sm font-medium 
              ${filter === 'projects' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Projects
          </button>
          <button
            onClick={() => setFilter('tasks')}
            className={`px-4 py-2 rounded-lg text-sm font-medium 
              ${filter === 'tasks' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Tasks
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
          <p className="mt-4 text-gray-400">Loading your audio items...</p>
        </div>
      ) : filteredAudioItems.length === 0 ? (
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
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <h3 className="text-xl font-medium mb-2">No Audio Found</h3>
          <p className="text-gray-400 mb-6">
            {filter === 'all' 
              ? "You haven't generated any audio yet." 
              : filter === 'projects'
                ? "You haven't generated any audio for projects yet."
                : "You haven't generated any audio for tasks yet."}
          </p>
          <a
            href="/text-to-speech"
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
            Generate New Audio
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAudioItems.map((audio) => (
            <div key={audio.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-2">
                    {new Date(audio.created_at).toLocaleDateString()} • 
                    {new Date(audio.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-sm line-clamp-2 mb-3">{audio.text}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {audio.project_id && (
                      <a 
                        href={`/projects/${audio.project_id}`}
                        className="px-3 py-1 text-xs rounded-full bg-blue-900/50 text-blue-200 hover:bg-blue-800/50"
                      >
                        Project: {audio.project_title}
                      </a>
                    )}
                    
                    {audio.task_id && (
                      <a 
                        href={`/tasks/${audio.task_id}`}
                        className="px-3 py-1 text-xs rounded-full bg-green-900/50 text-green-200 hover:bg-green-800/50"
                      >
                        Task: {audio.task_title}
                      </a>
                    )}
                    
                    {!audio.project_id && !audio.task_id && (
                      <span className="px-3 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                        No relation
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setCurrentAudio(currentAudio === audio.audio_url ? null : audio.audio_url)}
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    {currentAudio === audio.audio_url ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {currentAudio === audio.audio_url && (
                <div className="mt-4 bg-gray-900 rounded-lg p-3">
                  <audio controls className="w-full" autoPlay>
                    <source src={audio.audio_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 