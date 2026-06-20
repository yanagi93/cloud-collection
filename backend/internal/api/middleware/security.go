package middleware

import (
	"context"

	"github.com/google/uuid"
	"github.com/ogen-go/ogen/ogenerrors"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/service"
)

type currentUserIDKey struct{}

type SecurityHandler struct {
	auth *service.AuthService
}

func NewSecurityHandler(auth *service.AuthService) SecurityHandler {
	return SecurityHandler{auth: auth}
}

func CurrentUserID(ctx context.Context) (uuid.UUID, bool) {
	userID, ok := ctx.Value(currentUserIDKey{}).(uuid.UUID)
	return userID, ok
}

func (h SecurityHandler) HandleBearerAuth(ctx context.Context, operationName gen.OperationName, t gen.BearerAuth) (context.Context, error) {
	userID, err := h.auth.VerifyAccessToken(t.Token)
	if err != nil {
		return ctx, ogenerrors.ErrSecurityRequirementIsNotSatisfied
	}
	return context.WithValue(ctx, currentUserIDKey{}, userID), nil
}
