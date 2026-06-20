# Backend

Go backend workspace for the Cloud Collection API.

## Generate API Code

The OpenAPI contract lives at `../docs/openapi.yaml`. Generate ogen server/client types into `internal/api/gen`:

```sh
make ogen
```

Equivalent `go generate` entrypoint:

```sh
go generate ./...
```

Run all generators:

```sh
make generate
```

After changing the OpenAPI spec or regenerating code, run:

```sh
go mod tidy
go test ./...
```

## Generate Database Code

SQL schema and queries for sqlc live under `sql/`.

```sh
make sqlc
```

Generated database code is written to `internal/db/gen`.

## Docker

Run the backend and PostgreSQL from the repository root:

```sh
cp backend/.env.docker.example backend/.env.docker
docker compose up --build
```

Docker loads backend and PostgreSQL environment variables from ignored local file `backend/.env.docker`.
The backend is reachable from the host at `localhost:8080`.
PostgreSQL initializes a fresh volume with `sql/schema/schema.sql`.
The database is reachable from the host at `localhost:5433` and from Compose services at `postgres:5432`.

## Run Server

Create `backend/.env` or export the same environment variables in your shell. Shell environment variables take precedence over `.env`.

```sh
DATABASE_URL=postgres://user:password@localhost:5432/cloud_collection?sslmode=disable
JWT_SECRET=change-me
PORT=8080
JWT_EXPIRES_IN_SECONDS=3600
```

```sh
make run
```

`POST /auth/register` and `POST /auth/login` have handwritten implementations at this stage. Other OpenAPI operations remain unimplemented.
