-- name: CreateUser :one
INSERT INTO users (
    email,
    password_hash,
    display_name
) VALUES (
    $1,
    $2,
    $3
)
RETURNING *;

-- name: GetUserByID :one
SELECT *
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT *
FROM users
WHERE email = $1;

-- name: UpdateUserDisplayName :one
UPDATE users
SET
    display_name = $2,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateUserPasswordHash :one
UPDATE users
SET
    password_hash = $2,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;
