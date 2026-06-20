package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/repository"
)

const maxCloudPhotoImageSize = 10 << 20

var ErrCloudPhotoNotFound = errors.New("cloud photo not found")
var ErrCloudPhotoConflict = errors.New("cloud photo conflict")
var ErrInvalidCloudPhotoRequest = errors.New("invalid cloud photo request")
var ErrCloudPhotoTooLarge = errors.New("cloud photo too large")

type CloudPhotoService struct {
	photos      *repository.CloudPhotoRepository
	uploadsRoot string
	now         func() time.Time
}

func NewCloudPhotoService(photos *repository.CloudPhotoRepository, uploadsRoot string) *CloudPhotoService {
	return &CloudPhotoService{
		photos:      photos,
		uploadsRoot: uploadsRoot,
		now:         time.Now,
	}
}

type CreateCloudPhotoInput struct {
	UserID         uuid.UUID
	Filename       string
	Image          io.Reader
	Size           int64
	CapturedAt     time.Time
	CapturedAtSet  bool
	Latitude       float64
	LatitudeSet    bool
	Longitude      float64
	LongitudeSet   bool
	AutoProcess    bool
	AutoProcessSet bool
}

type CloudPhotoListResult struct {
	Items      []repository.CloudPhotoListItem
	Page       int
	PageSize   int
	TotalItems int
	TotalPages int
}

func (s *CloudPhotoService) Create(ctx context.Context, input CreateCloudPhotoInput) (repository.CloudPhotoDetail, error) {
	filename := strings.TrimSpace(input.Filename)
	if filename == "" {
		return repository.CloudPhotoDetail{}, ErrInvalidCloudPhotoRequest
	}
	if input.Image == nil {
		return repository.CloudPhotoDetail{}, ErrInvalidCloudPhotoRequest
	}
	if input.Size > maxCloudPhotoImageSize {
		return repository.CloudPhotoDetail{}, ErrCloudPhotoTooLarge
	}
	if input.LatitudeSet != input.LongitudeSet {
		return repository.CloudPhotoDetail{}, ErrInvalidCloudPhotoRequest
	}
	if input.LatitudeSet && (input.Latitude < -90 || input.Latitude > 90 || input.Longitude < -180 || input.Longitude > 180) {
		return repository.CloudPhotoDetail{}, ErrInvalidCloudPhotoRequest
	}

	originalURL, err := s.writeOriginalImage(input.UserID, filename, input.Image)
	if err != nil {
		return repository.CloudPhotoDetail{}, err
	}

	photo, err := s.photos.Create(ctx, dbgen.CreateCloudPhotoParams{
		UserID:           input.UserID,
		OriginalImageUrl: originalURL,
		CapturedAt:       timestamptz(input.CapturedAt, input.CapturedAtSet),
		Latitude:         float8(input.Latitude, input.LatitudeSet),
		Longitude:        float8(input.Longitude, input.LongitudeSet),
	})
	if err != nil {
		return repository.CloudPhotoDetail{}, err
	}

	return s.Get(ctx, input.UserID, photo.ID)
}

func (s *CloudPhotoService) Get(ctx context.Context, userID, photoID uuid.UUID) (repository.CloudPhotoDetail, error) {
	photo, err := s.photos.GetByID(ctx, photoID, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return repository.CloudPhotoDetail{}, ErrCloudPhotoNotFound
	}
	return photo, err
}

func (s *CloudPhotoService) List(ctx context.Context, userID uuid.UUID, page, pageSize int, status dbgen.NullProcessingStatus) (CloudPhotoListResult, error) {
	if page < 1 || pageSize < 1 || pageSize > 100 {
		return CloudPhotoListResult{}, ErrInvalidCloudPhotoRequest
	}

	total, err := s.photos.Count(ctx, userID, status)
	if err != nil {
		return CloudPhotoListResult{}, err
	}

	items, err := s.photos.List(ctx, userID, int32(pageSize), int32((page-1)*pageSize), status)
	if err != nil {
		return CloudPhotoListResult{}, err
	}

	return CloudPhotoListResult{
		Items:      items,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: int(total),
		TotalPages: totalPages(int(total), pageSize),
	}, nil
}

func (s *CloudPhotoService) Delete(ctx context.Context, userID, photoID uuid.UUID) error {
	if _, err := s.Get(ctx, userID, photoID); err != nil {
		return err
	}

	rows, err := s.photos.DeleteIfUnregistered(ctx, photoID, userID)
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrCloudPhotoConflict
	}
	return nil
}

func (s *CloudPhotoService) writeOriginalImage(userID uuid.UUID, filename string, image io.Reader) (string, error) {
	now := s.now().UTC()
	rel := originalImageRelativePath(userID, filename, now)
	fullPath := filepath.Join(s.uploadsRoot, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(fullPath), 0o755); err != nil {
		return "", err
	}

	file, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	limited := io.LimitReader(image, maxCloudPhotoImageSize+1)
	written, err := io.Copy(file, limited)
	if err != nil {
		return "", err
	}
	if written > maxCloudPhotoImageSize {
		return "", ErrCloudPhotoTooLarge
	}
	return "/uploads/" + rel, nil
}

func originalImageRelativePath(userID uuid.UUID, filename string, now time.Time) string {
	escapedFilename := url.PathEscape(path.Base(filename))
	return fmt.Sprintf("cloud-photos/%s/%d-%s", userID, now.UnixNano(), escapedFilename)
}

func totalPages(totalItems, pageSize int) int {
	if totalItems == 0 {
		return 0
	}
	return (totalItems + pageSize - 1) / pageSize
}

func timestamptz(value time.Time, valid bool) pgtype.Timestamptz {
	if !valid {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: value, Valid: true}
}

func float8(value float64, valid bool) pgtype.Float8 {
	if !valid {
		return pgtype.Float8{}
	}
	return pgtype.Float8{Float64: value, Valid: true}
}
