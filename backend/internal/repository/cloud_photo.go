package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
)

type CloudPhotoRepository struct {
	db      dbgen.DBTX
	queries *dbgen.Queries
}

func NewCloudPhotoRepository(db dbgen.DBTX, queries *dbgen.Queries) *CloudPhotoRepository {
	return &CloudPhotoRepository{
		db:      db,
		queries: queries,
	}
}

type CloudPhotoDetail struct {
	ID                  uuid.UUID
	UserID              uuid.UUID
	OriginalImageURL    string
	Status              dbgen.ProcessingStatus
	CapturedAt          pgtype.Timestamptz
	Latitude            pgtype.Float8
	Longitude           pgtype.Float8
	CreatedAt           pgtype.Timestamptz
	UpdatedAt           pgtype.Timestamptz
	ProcessingJobID     pgtype.UUID
	ProcessingStatus    pgtype.Text
	SuggestedAnimal     pgtype.Text
	Confidence          pgtype.Float8
	Description         pgtype.Text
	CompositeImageURL   pgtype.Text
	ErrorCode           pgtype.Text
	ErrorMessage        pgtype.Text
	StartedAt           pgtype.Timestamptz
	CompletedAt         pgtype.Timestamptz
	ProcessingCreatedAt pgtype.Timestamptz
	AnimalID            pgtype.UUID
}

type CloudPhotoListItem struct {
	ID               uuid.UUID
	UserID           uuid.UUID
	OriginalImageURL string
	Status           dbgen.ProcessingStatus
	CapturedAt       pgtype.Timestamptz
	Latitude         pgtype.Float8
	Longitude        pgtype.Float8
	CreatedAt        pgtype.Timestamptz
	UpdatedAt        pgtype.Timestamptz
	AnimalID         pgtype.UUID
}

func (r *CloudPhotoRepository) Create(ctx context.Context, arg dbgen.CreateCloudPhotoParams) (dbgen.CloudPhoto, error) {
	return r.queries.CreateCloudPhoto(ctx, arg)
}

func (r *CloudPhotoRepository) GetByID(ctx context.Context, id, userID uuid.UUID) (CloudPhotoDetail, error) {
	const query = `
SELECT
    cp.id,
    cp.user_id,
    cp.original_image_url,
    cp.status,
    cp.captured_at,
    cp.latitude,
    cp.longitude,
    cp.created_at,
    cp.updated_at,
    pj.id AS processing_job_id,
    pj.status::text AS processing_status,
    pj.suggested_animal,
    pj.confidence,
    pj.description,
    pj.composite_image_url,
    pj.error_code,
    pj.error_message,
    pj.started_at,
    pj.completed_at,
    pj.created_at AS processing_created_at,
    a.id AS animal_id
FROM cloud_photos cp
LEFT JOIN LATERAL (
    SELECT *
    FROM processing_jobs
    WHERE photo_id = cp.id
    ORDER BY created_at DESC
    LIMIT 1
) pj ON true
LEFT JOIN animals a ON a.photo_id = cp.id
WHERE cp.id = $1
  AND cp.user_id = $2`

	var item CloudPhotoDetail
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&item.ID,
		&item.UserID,
		&item.OriginalImageURL,
		&item.Status,
		&item.CapturedAt,
		&item.Latitude,
		&item.Longitude,
		&item.CreatedAt,
		&item.UpdatedAt,
		&item.ProcessingJobID,
		&item.ProcessingStatus,
		&item.SuggestedAnimal,
		&item.Confidence,
		&item.Description,
		&item.CompositeImageURL,
		&item.ErrorCode,
		&item.ErrorMessage,
		&item.StartedAt,
		&item.CompletedAt,
		&item.ProcessingCreatedAt,
		&item.AnimalID,
	)
	return item, err
}

func (r *CloudPhotoRepository) List(ctx context.Context, userID uuid.UUID, limit, offset int32, status dbgen.NullProcessingStatus) ([]CloudPhotoListItem, error) {
	rows, err := r.queries.ListCloudPhotos(ctx, dbgen.ListCloudPhotosParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
		Status: status,
	})
	if err != nil {
		return nil, err
	}

	items := make([]CloudPhotoListItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, CloudPhotoListItem{
			ID:               row.ID,
			UserID:           row.UserID,
			OriginalImageURL: row.OriginalImageUrl,
			Status:           row.Status,
			CapturedAt:       row.CapturedAt,
			Latitude:         row.Latitude,
			Longitude:        row.Longitude,
			CreatedAt:        row.CreatedAt,
			UpdatedAt:        row.UpdatedAt,
			AnimalID:         row.AnimalID,
		})
	}
	return items, nil
}

func (r *CloudPhotoRepository) Count(ctx context.Context, userID uuid.UUID, status dbgen.NullProcessingStatus) (int64, error) {
	return r.queries.CountCloudPhotos(ctx, dbgen.CountCloudPhotosParams{
		UserID: userID,
		Status: status,
	})
}

func (r *CloudPhotoRepository) DeleteIfUnregistered(ctx context.Context, id, userID uuid.UUID) (int64, error) {
	return r.queries.DeleteCloudPhotoIfUnregistered(ctx, dbgen.DeleteCloudPhotoIfUnregisteredParams{
		ID:     id,
		UserID: userID,
	})
}
