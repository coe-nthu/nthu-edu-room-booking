-- Enable public access to maintenance records
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own maintenance requests" ON maintenance_requests;

-- Create new policy allowing everyone to view all requests
CREATE POLICY "Anyone can view maintenance requests"
ON maintenance_requests
FOR SELECT
TO public
USING (true);

-- Ensure authenticated users can still see their own requests (implicit in 'public' but good to be clear if we were using authenticated role)
-- The above policy covers everyone, including authenticated users and anon users.

