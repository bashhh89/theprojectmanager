-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    command VARCHAR(255),
    prompt TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all prompts
CREATE POLICY "Allow authenticated users to read prompts"
    ON public.prompts
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow authenticated users to insert their own prompts
CREATE POLICY "Allow authenticated users to insert prompts"
    ON public.prompts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update their own prompts
CREATE POLICY "Allow authenticated users to update prompts"
    ON public.prompts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy to allow authenticated users to delete their own prompts
CREATE POLICY "Allow authenticated users to delete prompts"
    ON public.prompts
    FOR DELETE
    TO authenticated
    USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS prompts_command_idx ON public.prompts (command);
CREATE INDEX IF NOT EXISTS prompts_created_at_idx ON public.prompts (created_at DESC);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prompts_handle_updated_at
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 