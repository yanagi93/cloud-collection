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

After changing the OpenAPI spec or regenerating code, run:

```sh
go mod tidy
go test ./...
```
