-- Create the generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  model_used TEXT,
  generation_settings JSONB DEFAULT '{}'::JSONB
);

-- Add RLS policies
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view only their own generated images
CREATE POLICY "Users can view their own generated images"
  ON generated_images
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own generated images
CREATE POLICY "Users can insert their own generated images"
  ON generated_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own generated images
CREATE POLICY "Users can update their own generated images"
  ON generated_images
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own generated images
CREATE POLICY "Users can delete their own generated images"
  ON generated_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create an index on user_id for faster lookups
CREATE INDEX generated_images_user_id_idx ON generated_images(user_id);

-- Create an index on created_at for faster sorting
CREATE INDEX generated_images_created_at_idx ON generated_images(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_generated_images_updated_at
  BEFORE UPDATE
  ON generated_images
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 