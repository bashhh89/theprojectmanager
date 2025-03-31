-- Update Row Level Security policies to use the project_members table instead of direct user_id checks

-- 1. Drop existing RLS policies on projects table
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- 2. Create new RLS policies for projects based on project_members
CREATE POLICY "Users can view projects they are members of"
  ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
    )
  );

CREATE POLICY "Users can insert their own projects"
  ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project members can update projects based on role"
  ON projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Only owners can delete projects"
  ON projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role = 'owner'
    )
  );

-- 3. Update RLS policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks from their projects" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Create new task policies
CREATE POLICY "Project members can view tasks"
  ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
    )
  );

CREATE POLICY "Project members can insert tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = NEW.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project members can update tasks"
  ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project members can delete tasks"
  ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

-- 4. Update RLS policies for milestones
DROP POLICY IF EXISTS "Users can view milestones from their projects" ON milestones;
DROP POLICY IF EXISTS "Users can insert milestones" ON milestones;
DROP POLICY IF EXISTS "Users can update milestones" ON milestones;
DROP POLICY IF EXISTS "Users can delete milestones" ON milestones;

-- Create new milestone policies
CREATE POLICY "Project members can view milestones"
  ON milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = milestones.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
    )
  );

CREATE POLICY "Project members can insert milestones"
  ON milestones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = NEW.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project members can update milestones"
  ON milestones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = milestones.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project members can delete milestones"
  ON milestones
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = milestones.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

-- 5. Update RLS policies for project_documents
DROP POLICY IF EXISTS "Users can view their own documents" ON project_documents;
DROP POLICY IF EXISTS "Users can view documents from their projects" ON project_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON project_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON project_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON project_documents;

-- Create new document policies
CREATE POLICY "Project members can view documents"
  ON project_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_documents.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
    )
  );

CREATE POLICY "Project members can insert documents"
  ON project_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = NEW.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project members can update documents"
  ON project_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_documents.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project members can delete documents"
  ON project_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_documents.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.invite_accepted = true
      AND project_members.role IN ('owner', 'editor')
    )
  ); 