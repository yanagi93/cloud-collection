-- name: CreateAnimalFromCompletedJob :one
INSERT INTO animals (
    user_id,
    photo_id,
    processing_job_id,
    name,
    species,
    original_image_url,
    doodle_image_url,
    composite_image_url,
    confidence,
    description,
    captured_at,
    latitude,
    longitude
)
SELECT
    cp.user_id,
    cp.id,
    pj.id,
    sqlc.arg('name'),
    coalesce(sqlc.narg('species')::text, pj.suggested_animal),
    cp.original_image_url,
    pj.doodle_image_url,
    pj.composite_image_url,
    pj.confidence,
    pj.description,
    cp.captured_at,
    cp.latitude,
    cp.longitude
FROM cloud_photos cp
JOIN processing_jobs pj ON pj.photo_id = cp.id
WHERE cp.id = sqlc.arg('photo_id')
  AND cp.user_id = sqlc.arg('user_id')
  AND pj.status = 'completed'
  AND pj.suggested_animal IS NOT NULL
  AND pj.confidence IS NOT NULL
  AND pj.doodle_image_url IS NOT NULL
  AND pj.composite_image_url IS NOT NULL
ORDER BY pj.completed_at DESC, pj.created_at DESC
LIMIT 1
RETURNING *;

-- name: GetAnimalByID :one
SELECT *
FROM animals
WHERE id = $1
  AND user_id = $2;

-- name: GetAnimalByPhotoID :one
SELECT *
FROM animals
WHERE photo_id = $1
  AND user_id = $2;

-- name: ListAnimalsCreatedAtDesc :many
SELECT *
FROM animals
WHERE user_id = $1
  AND (
      sqlc.narg('q')::text IS NULL
      OR name ILIKE '%' || sqlc.narg('q')::text || '%'
      OR species ILIKE '%' || sqlc.narg('q')::text || '%'
  )
ORDER BY created_at DESC, id DESC
LIMIT $2 OFFSET $3;

-- name: ListAnimalsCreatedAtAsc :many
SELECT *
FROM animals
WHERE user_id = $1
  AND (
      sqlc.narg('q')::text IS NULL
      OR name ILIKE '%' || sqlc.narg('q')::text || '%'
      OR species ILIKE '%' || sqlc.narg('q')::text || '%'
  )
ORDER BY created_at ASC, id ASC
LIMIT $2 OFFSET $3;

-- name: ListAnimalsNameAsc :many
SELECT *
FROM animals
WHERE user_id = $1
  AND (
      sqlc.narg('q')::text IS NULL
      OR name ILIKE '%' || sqlc.narg('q')::text || '%'
      OR species ILIKE '%' || sqlc.narg('q')::text || '%'
  )
ORDER BY name ASC, id ASC
LIMIT $2 OFFSET $3;

-- name: ListAnimalsNameDesc :many
SELECT *
FROM animals
WHERE user_id = $1
  AND (
      sqlc.narg('q')::text IS NULL
      OR name ILIKE '%' || sqlc.narg('q')::text || '%'
      OR species ILIKE '%' || sqlc.narg('q')::text || '%'
  )
ORDER BY name DESC, id DESC
LIMIT $2 OFFSET $3;

-- name: CountAnimals :one
SELECT count(*)
FROM animals
WHERE user_id = $1
  AND (
      sqlc.narg('q')::text IS NULL
      OR name ILIKE '%' || sqlc.narg('q')::text || '%'
      OR species ILIKE '%' || sqlc.narg('q')::text || '%'
  );

-- name: UpdateAnimal :one
UPDATE animals
SET
    name = coalesce(sqlc.narg('name')::text, name),
    species = coalesce(sqlc.narg('species')::text, species),
    updated_at = now()
WHERE id = sqlc.arg('id')
  AND user_id = sqlc.arg('user_id')
RETURNING *;

-- name: DeleteAnimal :execrows
DELETE FROM animals
WHERE id = $1
  AND user_id = $2;
