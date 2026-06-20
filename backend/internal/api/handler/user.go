package handler

import (
	"context"
	"errors"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/service"
)

type Handler struct {
	gen.UnimplementedHandler
	auth *service.AuthService
}

func New(auth *service.AuthService) *Handler {
	return &Handler{auth: auth}
}

func (h *Handler) RegisterUser(ctx context.Context, req *gen.RegisterRequest) (gen.RegisterUserRes, error) {
	result, err := h.auth.Register(ctx, req.Email, req.Password, req.DisplayName)
	if errors.Is(err, service.ErrEmailAlreadyRegistered) {
		return &gen.RegisterUserConflict{
			Code:    "EMAIL_ALREADY_REGISTERED",
			Message: "このメールアドレスは既に登録されています",
		}, nil
	}
	if errors.Is(err, service.ErrInvalidCredentials) {
		return &gen.RegisterUserBadRequest{
			Code:    "INVALID_REQUEST",
			Message: "メールアドレス、パスワード、表示名を入力してください",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	return authResponse(result), nil
}

func (h *Handler) LoginUser(ctx context.Context, req *gen.LoginRequest) (gen.LoginUserRes, error) {
	result, err := h.auth.Login(ctx, req.Email, req.Password)
	if errors.Is(err, service.ErrInvalidCredentials) {
		return &gen.Error{
			Code:    "INVALID_CREDENTIALS",
			Message: "メールアドレスまたはパスワードが正しくありません",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	return authResponse(result), nil
}

func authResponse(result service.LoginResult) *gen.AuthResponse {
	return &gen.AuthResponse{
		AccessToken: result.AccessToken,
		TokenType:   gen.AuthResponseTokenTypeBearer,
		ExpiresIn:   result.ExpiresIn,
		User: gen.User{
			ID:          result.User.ID,
			Email:       result.User.Email,
			DisplayName: result.User.DisplayName,
			CreatedAt:   result.User.CreatedAt.Time,
		},
	}
}
