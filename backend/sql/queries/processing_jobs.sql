-- name: CreateProcessingJob :one
INSERT INTO processing_jobs (
    photo_id,
    status
) VALUES (
    $1,
    'pending'
)
RETURNING *;

-- name: GetProcessingJobByID :one
SELECT pj.*
FROM processing_jobs pj
JOIN cloud_photos cp ON cp.id = pj.photo_id
WHERE pj.id = $1
  AND cp.user_id = $2;

-- name: GetLatestProcessingJobByPhotoID :one
SELECT pj.*
FROM processing_jobs pj
JOIN cloud_photos cp ON cp.id = pj.photo_id
WHERE pj.photo_id = $1
  AND cp.user_id = $2
ORDER BY pj.created_at DESC
LIMIT 1;

-- name: ListPendingProcessingJobs :many
SELECT *
FROM processing_jobs
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT $1;

-- name: MarkProcessingJobStarted :one
UPDATE processing_jobs
SET
    status = 'processing',
    started_at = coalesce(started_at, now()),
    updated_at = now()
WHERE id = $1
  AND status = 'pending'
RETURNING *;

-- name: CompleteProcessingJob :one
UPDATE processing_jobs
SET
    status = 'completed',
    suggested_animal = $2,
    confidence = $3,
    description = $4,
    composite_image_url = sqlc.arg('composite_image_url'),
    error_code = NULL,
    error_message = NULL,
    completed_at = now(),
    updated_at = now()
WHERE id = $1
  AND status IN ('pending', 'processing')
RETURNING *;

-- name: FailProcessingJob :one
UPDATE processing_jobs
SET
    status = 'failed',
    error_code = $2,
    error_message = $3,
    completed_at = now(),
    updated_at = now()
WHERE id = $1
  AND status IN ('pending', 'processing')
RETURNING *;

-- name: SyncCloudPhotoStatusFromLatestJob :one
UPDATE cloud_photos cp
SET
    status = pj.status,
    updated_at = now()
FROM processing_jobs pj
WHERE cp.id = pj.photo_id
  AND pj.id = $1
RETURNING cp.*;
