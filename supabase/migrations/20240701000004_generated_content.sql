-- Create generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL
);

-- Create generated_audio table
CREATE TABLE IF NOT EXISTS generated_audio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL
);

-- Create RLS policies for generated_images
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated images"
  ON generated_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated images"
  ON generated_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated images"
  ON generated_images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated images"
  ON generated_images FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for generated_audio
ALTER TABLE generated_audio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated audio"
  ON generated_audio FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated audio"
  ON generated_audio FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated audio"
  ON generated_audio FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated audio"
  ON generated_audio FOR DELETE
  USING (auth.uid() = user_id);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS generated_images_user_id_idx ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS generated_images_project_id_idx ON generated_images(project_id);
CREATE INDEX IF NOT EXISTS generated_images_task_id_idx ON generated_images(task_id);

CREATE INDEX IF NOT EXISTS generated_audio_user_id_idx ON generated_audio(user_id);
CREATE INDEX IF NOT EXISTS generated_audio_project_id_idx ON generated_audio(project_id);
CREATE INDEX IF NOT EXISTS generated_audio_task_id_idx ON generated_audio(task_id); 