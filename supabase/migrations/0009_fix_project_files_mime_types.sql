-- Phase 8 hotfix: the project-files bucket allowlist used wildcard entries
-- ('image/*', 'video/*'). Wildcard matching depends on the storage-api
-- version; on engines that compare exact strings, every image/video upload
-- is rejected with 415. Replace with an explicit list (wildcards kept too —
-- harmless where supported, and they future-proof uncommon subtypes).
-- Run this in the Supabase SQL Editor after 0008_project_files.sql.

update storage.buckets
set allowed_mime_types = array[
  -- images
  'image/*',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/svg+xml',
  'image/avif',
  -- video
  'video/*',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/x-msvideo',
  'video/x-m4v',
  'video/3gpp',
  -- documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'project-files';
