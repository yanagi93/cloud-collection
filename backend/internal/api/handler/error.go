package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-faster/errors"
	"github.com/ogen-go/ogen/ogenerrors"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
)

func ErrorHandler(ctx context.Context, w http.ResponseWriter, r *http.Request, err error) {
	if ogenerrors.ErrorCode(err) == http.StatusUnauthorized {
		writeAPIError(w, http.StatusUnauthorized, unauthorizedError())
		return
	}

	var ogenErr ogenerrors.Error
	if errors.As(err, &ogenErr) {
		writeAPIError(w, ogenErr.Code(), &gen.Error{
			Code:    "REQUEST_ERROR",
			Message: err.Error(),
		})
		return
	}

	ogenerrors.DefaultErrorHandler(ctx, w, r, err)
}

func writeAPIError(w http.ResponseWriter, status int, apiErr *gen.Error) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(apiErr)
}
