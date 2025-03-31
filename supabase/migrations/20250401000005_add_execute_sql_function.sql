-- Create a function to execute SQL with proper permissions
-- This is used for migrations and admin operations that need to be executed via the API
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Create a temporary table to store results
  CREATE TEMP TABLE temp_results (data JSONB);
  
  -- Execute the query and capture the results
  EXECUTE 'WITH results AS (' || sql_query || ') 
           INSERT INTO temp_results 
           SELECT jsonb_agg(row_to_json(results)) FROM results';
  
  -- Get results from the temporary table
  SELECT COALESCE(data, '[]'::JSONB) INTO result FROM temp_results;
  
  -- Clean up
  DROP TABLE temp_results;
  
  -- Return the results
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- If temp table was created, drop it
  DROP TABLE IF EXISTS temp_results;
  
  -- Return error information
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'state', SQLSTATE,
    'query', sql_query
  );
END;
$$;

-- Add row level security policy for this function
REVOKE ALL ON FUNCTION execute_sql(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;

-- Create policy to control who can use this function
CREATE OR REPLACE FUNCTION can_execute_sql()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if the current user is an admin
  SELECT COALESCE(is_admin, false) INTO is_admin 
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN is_admin;
END;
$$;

-- Create policy for the execute_sql function
CREATE OR REPLACE FUNCTION check_execute_sql_policy()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT can_execute_sql() THEN
    RAISE EXCEPTION 'Permission denied: Only admins can execute SQL';
  END IF;
  RETURN 'authorized';
END;
$$;

-- Override the execute_sql function to check permission first
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  permission TEXT;
BEGIN
  -- Check permission first
  permission := check_execute_sql_policy();
  
  -- Create a temporary table to store results
  CREATE TEMP TABLE temp_results (data JSONB);
  
  -- Execute the query and capture the results
  EXECUTE 'WITH results AS (' || sql_query || ') 
           INSERT INTO temp_results 
           SELECT jsonb_agg(row_to_json(results)) FROM results';
  
  -- Get results from the temporary table
  SELECT COALESCE(data, '[]'::JSONB) INTO result FROM temp_results;
  
  -- Clean up
  DROP TABLE temp_results;
  
  -- Return the results
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- If temp table was created, drop it
  DROP TABLE IF EXISTS temp_results;
  
  -- Return error information
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'state', SQLSTATE,
    'query', sql_query
  );
END;
$$; 