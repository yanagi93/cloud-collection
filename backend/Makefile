.PHONY: generate ogen test tidy

OPENAPI_SPEC ?= ../docs/openapi.yaml
OGEN_TARGET ?= internal/api/gen

generate:
	go generate ./...

ogen:
	go run github.com/ogen-go/ogen/cmd/ogen --target $(OGEN_TARGET) --clean $(OPENAPI_SPEC)

test:
	go test ./...

tidy:
	go mod tidy
