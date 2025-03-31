export interface Task {
  id: string;
  title: string;
  description: string;
  project_id: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
} 