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
