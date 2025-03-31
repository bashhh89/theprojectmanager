-- Migrate existing projects to use the project_members table
-- For each existing project, add the user_id as an 'owner' in project_members

-- This query will only execute if the invite_accepted column exists
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if the invite_accepted column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'project_members'
    AND column_name = 'invite_accepted'
  ) INTO column_exists;

  -- Insert with different columns based on what exists
  IF column_exists THEN
    -- Column exists, include it in the INSERT
    EXECUTE '
      INSERT INTO project_members (
        project_id,
        user_id,
        role,
        invite_accepted,
        created_at,
        updated_at
      )
      SELECT 
        id as project_id,
        user_id,
        ''owner'' as role,
        TRUE as invite_accepted,
        now() as created_at,
        now() as updated_at
      FROM 
        projects p
      WHERE 
        NOT EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = p.id AND pm.user_id = p.user_id
        )
    ';
  ELSE
    -- Column doesn't exist, exclude it from the INSERT
    EXECUTE '
      INSERT INTO project_members (
        project_id,
        user_id,
        role,
        created_at,
        updated_at
      )
      SELECT 
        id as project_id,
        user_id,
        ''owner'' as role,
        now() as created_at,
        now() as updated_at
      FROM 
        projects p
      WHERE 
        NOT EXISTS (
          SELECT 1 FROM project_members pm 
          WHERE pm.project_id = p.id AND pm.user_id = p.user_id
        )
    ';
  END IF;
END $$; 