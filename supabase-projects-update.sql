-- Add progress column to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0; 