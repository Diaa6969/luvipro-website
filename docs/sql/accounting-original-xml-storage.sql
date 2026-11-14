-- Apply only after verifying the existing private bookkeeping bucket and its policies.
BEGIN;
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'application/xml')
WHERE id = 'luvipro-accounting'
  AND public = false
  AND allowed_mime_types IS NOT NULL
  AND NOT ('application/xml' = ANY (allowed_mime_types));
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'luvipro-accounting' AND public = false
      AND (allowed_mime_types IS NULL OR 'application/xml' = ANY (allowed_mime_types))
  ) THEN
    RAISE EXCEPTION 'Existing private accounting bucket is missing';
  END IF;
END $$;
COMMIT;
