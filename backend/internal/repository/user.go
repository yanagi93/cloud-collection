package repository

import (
	"context"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
)

type UserRepository struct {
	queries *dbgen.Queries
}

func NewUserRepository(queries *dbgen.Queries) *UserRepository {
	return &UserRepository{queries: queries}
}

func (r *UserRepository) Create(ctx context.Context, email, passwordHash, displayName string) (dbgen.User, error) {
	return r.queries.CreateUser(ctx, dbgen.CreateUserParams{
		Email:        email,
		PasswordHash: passwordHash,
		DisplayName:  displayName,
	})
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (dbgen.User, error) {
	return r.queries.GetUserByEmail(ctx, email)
}
