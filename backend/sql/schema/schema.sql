CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE processing_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email citext NOT NULL UNIQUE,
    password_hash text NOT NULL,
    display_name varchar(50) NOT NULL CHECK (length(display_name) BETWEEN 1 AND 50),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cloud_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_image_url text NOT NULL,
    status processing_status NOT NULL DEFAULT 'pending',
    captured_at timestamptz,
    latitude double precision,
    longitude double precision,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE TABLE processing_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id uuid NOT NULL REFERENCES cloud_photos(id) ON DELETE CASCADE,
    status processing_status NOT NULL DEFAULT 'pending',
    suggested_animal varchar(30),
    confidence double precision,
    description text,
    composite_image_url text,
    error_code text,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    CHECK (
        status <> 'completed'
        OR (
            suggested_animal IS NOT NULL
            AND confidence IS NOT NULL
            AND composite_image_url IS NOT NULL
            AND completed_at IS NOT NULL
        )
    ),
    CHECK (
        status <> 'failed'
        OR (error_code IS NOT NULL AND error_message IS NOT NULL AND completed_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX processing_jobs_one_unfinished_or_completed_per_photo_idx
    ON processing_jobs(photo_id)
    WHERE status IN ('pending', 'processing', 'completed');

CREATE TABLE animals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id uuid NOT NULL UNIQUE REFERENCES cloud_photos(id) ON DELETE RESTRICT,
    processing_job_id uuid NOT NULL REFERENCES processing_jobs(id) ON DELETE RESTRICT,
    name varchar(30) NOT NULL CHECK (length(name) BETWEEN 1 AND 30),
    species varchar(30) NOT NULL CHECK (length(species) BETWEEN 1 AND 30),
    original_image_url text NOT NULL,
    composite_image_url text NOT NULL,
    confidence double precision NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    description text,
    hp integer NOT NULL DEFAULT 0,
    attack integer NOT NULL DEFAULT 0,
    evasion integer NOT NULL DEFAULT 0,
    defense integer NOT NULL DEFAULT 0,
    captured_at timestamptz,
    latitude double precision,
    longitude double precision,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE INDEX cloud_photos_user_created_at_idx ON cloud_photos(user_id, created_at DESC);
CREATE INDEX cloud_photos_user_status_created_at_idx ON cloud_photos(user_id, status, created_at DESC);
CREATE INDEX processing_jobs_photo_created_at_idx ON processing_jobs(photo_id, created_at DESC);
CREATE INDEX animals_user_created_at_idx ON animals(user_id, created_at DESC);
CREATE INDEX animals_user_name_idx ON animals(user_id, name);
CREATE INDEX animals_user_species_idx ON animals(user_id, species);
