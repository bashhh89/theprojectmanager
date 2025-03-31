-- Add AnythingLLM fields to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS anythingllm_workspace_id TEXT,
ADD COLUMN IF NOT EXISTS anythingllm_workspace_slug TEXT;

-- Create an index for faster lookups by workspace slug
CREATE INDEX IF NOT EXISTS projects_anythingllm_workspace_slug_idx ON projects(anythingllm_workspace_slug); 