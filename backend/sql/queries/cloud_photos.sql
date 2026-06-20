-- name: CreateCloudPhoto :one
INSERT INTO cloud_photos (
    user_id,
    original_image_url,
    captured_at,
    latitude,
    longitude
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;

-- name: GetCloudPhotoByID :one
SELECT *
FROM cloud_photos
WHERE id = $1
  AND user_id = $2;

-- name: GetCloudPhotoDetailByID :one
SELECT
    cp.id,
    cp.user_id,
    cp.original_image_url,
    cp.status,
    cp.captured_at,
    cp.latitude,
    cp.longitude,
    cp.created_at,
    cp.updated_at,
    pj.id AS processing_job_id,
    pj.status AS processing_status,
    pj.suggested_animal,
    pj.confidence,
    pj.description,
    pj.doodle_image_url,
    pj.composite_image_url,
    pj.error_code,
    pj.error_message,
    pj.started_at,
    pj.completed_at,
    pj.created_at AS processing_created_at,
    a.id AS animal_id
FROM cloud_photos cp
LEFT JOIN LATERAL (
    SELECT *
    FROM processing_jobs
    WHERE photo_id = cp.id
    ORDER BY created_at DESC
    LIMIT 1
) pj ON true
LEFT JOIN animals a ON a.photo_id = cp.id
WHERE cp.id = $1
  AND cp.user_id = $2;

-- name: ListCloudPhotos :many
SELECT
    cp.id,
    cp.user_id,
    cp.original_image_url,
    cp.status,
    cp.captured_at,
    cp.latitude,
    cp.longitude,
    cp.created_at,
    cp.updated_at,
    a.id AS animal_id
FROM cloud_photos cp
LEFT JOIN animals a ON a.photo_id = cp.id
WHERE cp.user_id = $1
  AND (sqlc.narg('status')::processing_status IS NULL OR cp.status = sqlc.narg('status')::processing_status)
ORDER BY cp.created_at DESC, cp.id DESC
LIMIT $2 OFFSET $3;

-- name: CountCloudPhotos :one
SELECT count(*)
FROM cloud_photos
WHERE user_id = $1
  AND (sqlc.narg('status')::processing_status IS NULL OR status = sqlc.narg('status')::processing_status);

-- name: UpdateCloudPhotoStatus :one
UPDATE cloud_photos
SET
    status = $2,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteCloudPhotoIfUnregistered :execrows
DELETE FROM cloud_photos cp
WHERE cp.id = $1
  AND cp.user_id = $2
  AND NOT EXISTS (
      SELECT 1
      FROM animals a
      WHERE a.photo_id = cp.id
  );
