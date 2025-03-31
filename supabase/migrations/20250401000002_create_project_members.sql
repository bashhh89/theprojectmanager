-- Create project_members table to handle collaboration roles
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  invite_accepted BOOLEAN DEFAULT FALSE,
  UNIQUE(project_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own memberships
CREATE POLICY "Users can view their own memberships"
  ON project_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for project owners to select all memberships of their projects
CREATE POLICY "Project owners can view all project memberships"
  ON project_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members owner_check
      WHERE owner_check.project_id = project_members.project_id
      AND owner_check.user_id = auth.uid()
      AND owner_check.role = 'owner'
    )
  );

-- Create policy for project owners to insert new memberships
CREATE POLICY "Project owners can add members"
  ON project_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members owner_check
      WHERE owner_check.project_id = project_members.project_id
      AND owner_check.user_id = auth.uid()
      AND owner_check.role = 'owner'
    ) OR auth.uid() = user_id
  );

-- Create policy for project owners to update memberships
CREATE POLICY "Project owners can update memberships"
  ON project_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members owner_check
      WHERE owner_check.project_id = project_members.project_id
      AND owner_check.user_id = auth.uid()
      AND owner_check.role = 'owner'
    )
  );

-- Create policy for project owners to delete memberships
CREATE POLICY "Project owners can delete memberships"
  ON project_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members owner_check
      WHERE owner_check.project_id = project_members.project_id
      AND owner_check.user_id = auth.uid()
      AND owner_check.role = 'owner'
    )
  );

-- Members can update their own membership (e.g., to accept invites)
CREATE POLICY "Members can update their own membership"
  ON project_members
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    -- Only allow updating specific fields, not role
    OLD.role = NEW.role
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS project_members_project_id_idx ON project_members(project_id);
CREATE INDEX IF NOT EXISTS project_members_user_id_idx ON project_members(user_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_project_members_updated_at
BEFORE UPDATE ON project_members
FOR EACH ROW
EXECUTE FUNCTION update_project_members_updated_at(); 