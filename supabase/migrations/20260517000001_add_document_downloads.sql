-- Public document download page settings and files.
CREATE TABLE IF NOT EXISTS document_download_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  body TEXT NOT NULL DEFAULT '請下載並參考下方文件。',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

INSERT INTO document_download_settings (id, body)
VALUES (TRUE, '請下載並參考下方文件。')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE document_download_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document download settings are viewable by everyone"
ON document_download_settings
FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage document download settings"
ON document_download_settings
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE TABLE IF NOT EXISTS document_download_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_download_files_visible_order
ON document_download_files(is_visible, sort_order, created_at DESC);

ALTER TABLE document_download_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible document download files are viewable by everyone"
ON document_download_files
FOR SELECT
USING (is_visible = TRUE OR is_admin());

CREATE POLICY "Admins can manage document download files"
ON document_download_files
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION update_document_downloads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_download_settings_updated_at ON document_download_settings;
CREATE TRIGGER document_download_settings_updated_at
  BEFORE UPDATE ON document_download_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_document_downloads_updated_at();

DROP TRIGGER IF EXISTS document_download_files_updated_at ON document_download_files;
CREATE TRIGGER document_download_files_updated_at
  BEFORE UPDATE ON document_download_files
  FOR EACH ROW
  EXECUTE FUNCTION update_document_downloads_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('document-downloads', 'document-downloads', TRUE, 52428800)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Give public access to document downloads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'document-downloads');

CREATE POLICY "Admins can upload document downloads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'document-downloads' AND is_admin());

CREATE POLICY "Admins can update document downloads"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'document-downloads' AND is_admin())
WITH CHECK (bucket_id = 'document-downloads' AND is_admin());

CREATE POLICY "Admins can delete document downloads"
ON storage.objects
FOR DELETE
USING (bucket_id = 'document-downloads' AND is_admin());
