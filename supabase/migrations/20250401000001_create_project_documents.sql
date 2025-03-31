-- Create the project_documents table for tracking documents uploaded to AnythingLLM
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
  anythingllm_doc_id TEXT,
  tokens INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own documents
CREATE POLICY "Users can view their own documents"
  ON project_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to select documents from their projects
CREATE POLICY "Users can view documents from their projects"
  ON project_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy for users to insert their own documents
CREATE POLICY "Users can insert their own documents"
  ON project_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own documents
CREATE POLICY "Users can update their own documents"
  ON project_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON project_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS project_documents_project_id_idx ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS project_documents_user_id_idx ON project_documents(user_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_project_documents_updated_at
BEFORE UPDATE ON project_documents
FOR EACH ROW
EXECUTE FUNCTION update_project_documents_updated_at(); 