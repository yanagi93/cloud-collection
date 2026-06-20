.PHONY: generate ogen sqlc run test tidy

OPENAPI_SPEC ?= ../docs/openapi.yaml
OGEN_TARGET ?= internal/api/gen
SQLC_VERSION ?= v1.31.1

generate: ogen sqlc

ogen:
	go run github.com/ogen-go/ogen/cmd/ogen --target $(OGEN_TARGET) --clean $(OPENAPI_SPEC)

sqlc:
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@$(SQLC_VERSION) generate

run:
	go run ./cmd/server

test:
	go test ./...

tidy:
	go mod tidy
