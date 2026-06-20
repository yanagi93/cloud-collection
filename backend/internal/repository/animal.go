package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
)

type AnimalRepository struct {
	queries *dbgen.Queries
}

func NewAnimalRepository(queries *dbgen.Queries) *AnimalRepository {
	return &AnimalRepository{queries: queries}
}

func (r *AnimalRepository) CreateFromCompletedJob(ctx context.Context, arg dbgen.CreateAnimalFromCompletedJobParams) (dbgen.Animal, error) {
	return r.queries.CreateAnimalFromCompletedJob(ctx, arg)
}

func (r *AnimalRepository) GetByID(ctx context.Context, id, userID uuid.UUID) (dbgen.Animal, error) {
	return r.queries.GetAnimalByID(ctx, dbgen.GetAnimalByIDParams{
		ID:     id,
		UserID: userID,
	})
}

func (r *AnimalRepository) GetByPhotoID(ctx context.Context, photoID, userID uuid.UUID) (dbgen.Animal, error) {
	return r.queries.GetAnimalByPhotoID(ctx, dbgen.GetAnimalByPhotoIDParams{
		PhotoID: photoID,
		UserID:  userID,
	})
}

func (r *AnimalRepository) ListCreatedAtDesc(ctx context.Context, userID uuid.UUID, limit, offset int32, q pgtype.Text) ([]dbgen.Animal, error) {
	return r.queries.ListAnimalsCreatedAtDesc(ctx, dbgen.ListAnimalsCreatedAtDescParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
		Q:      q,
	})
}

func (r *AnimalRepository) ListCreatedAtAsc(ctx context.Context, userID uuid.UUID, limit, offset int32, q pgtype.Text) ([]dbgen.Animal, error) {
	return r.queries.ListAnimalsCreatedAtAsc(ctx, dbgen.ListAnimalsCreatedAtAscParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
		Q:      q,
	})
}

func (r *AnimalRepository) ListNameAsc(ctx context.Context, userID uuid.UUID, limit, offset int32, q pgtype.Text) ([]dbgen.Animal, error) {
	return r.queries.ListAnimalsNameAsc(ctx, dbgen.ListAnimalsNameAscParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
		Q:      q,
	})
}

func (r *AnimalRepository) ListNameDesc(ctx context.Context, userID uuid.UUID, limit, offset int32, q pgtype.Text) ([]dbgen.Animal, error) {
	return r.queries.ListAnimalsNameDesc(ctx, dbgen.ListAnimalsNameDescParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
		Q:      q,
	})
}

func (r *AnimalRepository) Count(ctx context.Context, userID uuid.UUID, q pgtype.Text) (int64, error) {
	return r.queries.CountAnimals(ctx, dbgen.CountAnimalsParams{
		UserID: userID,
		Q:      q,
	})
}

func (r *AnimalRepository) PickupTimeline(ctx context.Context, arg dbgen.PickupTimelineAnimalsParams) ([]dbgen.Animal, error) {
	return r.queries.PickupTimelineAnimals(ctx, arg)
}

func (r *AnimalRepository) Update(ctx context.Context, arg dbgen.UpdateAnimalParams) (dbgen.Animal, error) {
	return r.queries.UpdateAnimal(ctx, arg)
}

func (r *AnimalRepository) Delete(ctx context.Context, id, userID uuid.UUID) (int64, error) {
	return r.queries.DeleteAnimal(ctx, dbgen.DeleteAnimalParams{
		ID:     id,
		UserID: userID,
	})
}
