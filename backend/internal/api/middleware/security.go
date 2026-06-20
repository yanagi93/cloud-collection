package middleware

import (
	"context"

	ht "github.com/ogen-go/ogen/http"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
)

type SecurityHandler struct{}

func NewSecurityHandler() SecurityHandler {
	return SecurityHandler{}
}

func (SecurityHandler) HandleBearerAuth(ctx context.Context, operationName gen.OperationName, t gen.BearerAuth) (context.Context, error) {
	return ctx, ht.ErrNotImplemented
}
