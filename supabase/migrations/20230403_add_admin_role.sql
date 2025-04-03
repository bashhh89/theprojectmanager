-- Add role column to user_profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
        ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Create policy to allow users to read their own role
CREATE POLICY "Users can read their own role"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Create policy to allow admins to read all roles
CREATE POLICY "Admins can read all roles"
    ON user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Update your user to be an admin (replace YOUR_USER_ID with your actual user ID)
-- You'll need to run this manually in the Supabase SQL editor with your user ID
-- UPDATE user_profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID'; 