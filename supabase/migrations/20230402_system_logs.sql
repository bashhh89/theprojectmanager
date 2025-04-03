-- Create system logs table for centralized error logging
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  context TEXT,
  data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_info JSONB -- Store browser, OS, etc.
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS system_logs_level_idx ON system_logs(level);
CREATE INDEX IF NOT EXISTS system_logs_created_at_idx ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS system_logs_user_id_idx ON system_logs(user_id);

-- Create a policy to allow users to view only their own logs
CREATE POLICY "Users can view their own logs" ON system_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create a policy to allow system to insert logs
CREATE POLICY "System can insert logs" ON system_logs
  FOR INSERT WITH CHECK (true);

-- Create policy for admins to view all logs
CREATE POLICY "Admins can view all logs" ON system_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT au.id 
      FROM auth.users au 
      JOIN user_profiles up ON au.id = up.user_id 
      WHERE up.role = 'admin'
    )
  );

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY; 