-- Create the tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to select tasks from their projects
CREATE POLICY "Users can view tasks from their projects"
  ON public.tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy for users to insert their own tasks
CREATE POLICY "Users can insert their own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own tasks
CREATE POLICY "Users can update their own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create an index on project_id for better performance
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks (project_id);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks (user_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on tasks table to update the updated_at column
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to update project progress when tasks are changed
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  progress_percentage INTEGER;
BEGIN
  -- Get total tasks count for the project
  SELECT COUNT(*) INTO total_tasks 
  FROM tasks 
  WHERE project_id = NEW.project_id OR project_id = OLD.project_id;
  
  -- Get completed tasks count
  SELECT COUNT(*) INTO completed_tasks 
  FROM tasks 
  WHERE project_id = NEW.project_id OR project_id = OLD.project_id
  AND status = 'completed';
  
  -- Calculate percentage (avoid division by zero)
  IF total_tasks = 0 THEN
    progress_percentage := 0;
  ELSE
    progress_percentage := (completed_tasks * 100) / total_tasks;
  END IF;
  
  -- Update the project progress
  UPDATE projects 
  SET progress = progress_percentage,
      updated_at = now()
  WHERE id = NEW.project_id OR id = OLD.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update project progress
CREATE TRIGGER update_project_progress_on_insert
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_progress();

CREATE TRIGGER update_project_progress_on_update
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_progress();

CREATE TRIGGER update_project_progress_on_delete
AFTER DELETE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_project_progress(); 