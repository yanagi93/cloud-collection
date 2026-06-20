package repository

import (
	"context"

	"github.com/google/uuid"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
)

type ProcessingJobRepository struct {
	queries *dbgen.Queries
}

func NewProcessingJobRepository(queries *dbgen.Queries) *ProcessingJobRepository {
	return &ProcessingJobRepository{queries: queries}
}

func (r *ProcessingJobRepository) Create(ctx context.Context, photoID uuid.UUID) (dbgen.ProcessingJob, error) {
	return r.queries.CreateProcessingJob(ctx, photoID)
}

func (r *ProcessingJobRepository) GetLatestByPhotoID(ctx context.Context, photoID, userID uuid.UUID) (dbgen.ProcessingJob, error) {
	return r.queries.GetLatestProcessingJobByPhotoID(ctx, dbgen.GetLatestProcessingJobByPhotoIDParams{
		PhotoID: photoID,
		UserID:  userID,
	})
}

func (r *ProcessingJobRepository) MarkStarted(ctx context.Context, id uuid.UUID) (dbgen.ProcessingJob, error) {
	return r.queries.MarkProcessingJobStarted(ctx, id)
}

func (r *ProcessingJobRepository) Complete(ctx context.Context, arg dbgen.CompleteProcessingJobParams) (dbgen.ProcessingJob, error) {
	return r.queries.CompleteProcessingJob(ctx, arg)
}

func (r *ProcessingJobRepository) Fail(ctx context.Context, arg dbgen.FailProcessingJobParams) (dbgen.ProcessingJob, error) {
	return r.queries.FailProcessingJob(ctx, arg)
}

func (r *ProcessingJobRepository) SyncPhotoStatus(ctx context.Context, id uuid.UUID) (dbgen.CloudPhoto, error) {
	return r.queries.SyncCloudPhotoStatusFromLatestJob(ctx, id)
}
