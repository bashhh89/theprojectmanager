export interface Project {
  id: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'completed';
  progress: number;
} 