'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/authUtils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  project_id: string;
}

export default function EditTaskPage({ params }: { params: { id: string, taskId: string } }) {
  const router = useRouter();
  
  // TODO: In future Next.js versions, we'll need to use React.use(params) instead of direct access
  // This works for now but will need to be updated in the future
  const projectId = params.id;
  const taskId = params.taskId;
  
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    due_date: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadTask() {
      try {
        setLoading(true);
        
        // Use requireAuth utility - it will redirect if not authenticated
        const currentUser = await requireAuth();
        if (!currentUser) return;
        
        // Fetch the task
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();
        
        if (taskError) {
          throw taskError;
        }
        
        if (!taskData) {
          router.push(`/projects/${projectId}`);
          return;
        }
        
        // Verify this task belongs to the specified project
        if (taskData.project_id !== projectId) {
          router.push(`/projects/${projectId}`);
          return;
        }
        
        setTask(taskData);
        setFormData({
          title: taskData.title || '',
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          status: taskData.status || 'pending',
          due_date: taskData.due_date ? new Date(taskData.due_date).toISOString().split('T')[0] : ''
        });
        
      } catch (err: any) {
        console.error('Error loading task:', err);
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    }
    
    loadTask();
  }, [taskId, projectId, router]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use requireAuth utility - it will redirect if not authenticated
      const currentUser = await requireAuth();
      if (!currentUser) {
        setError('You must be logged in to update this task');
        setIsSubmitting(false);
        return;
      }
      
      // Update the task
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
        })
        .eq('id', taskId)
        .select();
      
      if (updateError) {
        throw updateError;
      }
      
      // Redirect back to project page
      router.push(`/projects/${projectId}`);
      
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="p-8">
        <div className="mb-4">
          <a 
            href={`/projects/${projectId}`}
            className="text-gray-400 hover:text-white mb-2 flex items-center"
          >
            ← Back to Project
          </a>
        </div>
        <h1 className="text-2xl font-bold text-red-500">Task Not Found</h1>
        <p className="mt-4">The task you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="mb-4">
        <a 
          href={`/projects/${projectId}`}
          className="text-gray-400 hover:text-white mb-2 flex items-center"
        >
          ← Back to Project
        </a>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Edit Task</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Task Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            placeholder="Enter task title"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            placeholder="Enter task description"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <a
            href={`/projects/${projectId}`}
            className="mr-4 px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 