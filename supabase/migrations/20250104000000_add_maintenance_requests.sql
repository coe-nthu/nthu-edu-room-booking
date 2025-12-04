-- Create maintenance_requests table for issue reporting and construction requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    applicant_name TEXT NOT NULL,
    affiliation TEXT NOT NULL CHECK (affiliation IN ('student', 'teacher', 'staff')),
    unit TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    location TEXT NOT NULL,
    occurrence_time TIMESTAMP WITH TIME ZONE,
    description TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_user_id ON maintenance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created_at ON maintenance_requests(created_at DESC);

-- Enable RLS
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own requests
CREATE POLICY "Users can create maintenance requests"
ON maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own maintenance requests"
ON maintenance_requests
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Policy: Only admins can update requests
CREATE POLICY "Admins can update maintenance requests"
ON maintenance_requests
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Policy: Only admins can delete requests
CREATE POLICY "Admins can delete maintenance requests"
ON maintenance_requests
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_maintenance_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintenance_requests_updated_at
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_requests_updated_at();

-- Create storage bucket for maintenance files (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'maintenance-files',
    'maintenance-files',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for maintenance-files bucket
CREATE POLICY "Authenticated users can upload maintenance files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'maintenance-files');

CREATE POLICY "Anyone can view maintenance files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'maintenance-files');

CREATE POLICY "Admins can delete maintenance files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'maintenance-files'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

