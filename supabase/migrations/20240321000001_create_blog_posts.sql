-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  coverImage TEXT,
  coverImageType TEXT DEFAULT 'url',
  author TEXT NOT NULL,
  publishDate DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy for reading blog posts
CREATE POLICY "Allow public read access to published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Policy for authenticated users to read all posts
CREATE POLICY "Allow authenticated users to read all posts"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to create posts
CREATE POLICY "Allow authenticated users to create posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for users to update their own posts
CREATE POLICY "Allow users to update their own posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for users to delete their own posts
CREATE POLICY "Allow users to delete their own posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create indexes
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_author_idx ON blog_posts(author);
CREATE INDEX IF NOT EXISTS blog_posts_publish_date_idx ON blog_posts(publishDate);
CREATE INDEX IF NOT EXISTS blog_posts_categories_idx ON blog_posts USING GIN(categories);
CREATE INDEX IF NOT EXISTS blog_posts_tags_idx ON blog_posts USING GIN(tags); 