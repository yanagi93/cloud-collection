package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/repository"
)

var ErrAnimalNotFound = errors.New("animal not found")
var ErrAnimalConflict = errors.New("animal conflict")
var ErrAnimalSourceNotFound = errors.New("animal source not found")
var ErrInvalidAnimalRequest = errors.New("invalid animal request")

type AnimalService struct {
	animals *repository.AnimalRepository
	photos  *CloudPhotoService
}

func NewAnimalService(animals *repository.AnimalRepository, photos *CloudPhotoService) *AnimalService {
	return &AnimalService{
		animals: animals,
		photos:  photos,
	}
}

type CreateAnimalInput struct {
	UserID             uuid.UUID
	PhotoID            uuid.UUID
	Name               string
	UseSuggestedAnimal bool
	Species            string
	SpeciesSet         bool
	Hp                 int32
	Attack             int32
	Evasion            int32
	Defense            int32
}

type UpdateAnimalInput struct {
	UserID     uuid.UUID
	AnimalID   uuid.UUID
	Name       string
	NameSet    bool
	Species    string
	SpeciesSet bool
}

type AnimalListResult struct {
	Items      []dbgen.Animal
	Page       int
	PageSize   int
	TotalItems int
	TotalPages int
}

type TimelinePickupInput struct {
	ViewerUserID uuid.UUID
	CreatedFrom  time.Time
	CreatedTo    time.Time
	Count        int
}

type AnimalSort string

const (
	AnimalSortCreatedAtDesc AnimalSort = "created_at_desc"
	AnimalSortCreatedAtAsc  AnimalSort = "created_at_asc"
	AnimalSortNameAsc       AnimalSort = "name_asc"
	AnimalSortNameDesc      AnimalSort = "name_desc"
)

func (s *AnimalService) Create(ctx context.Context, input CreateAnimalInput) (dbgen.Animal, error) {
	name := strings.TrimSpace(input.Name)
	if !validAnimalText(name) {
		return dbgen.Animal{}, ErrInvalidAnimalRequest
	}

	var species pgtype.Text
	if !input.UseSuggestedAnimal {
		manualSpecies := strings.TrimSpace(input.Species)
		if !input.SpeciesSet || !validAnimalText(manualSpecies) {
			return dbgen.Animal{}, ErrInvalidAnimalRequest
		}
		species = pgtype.Text{String: manualSpecies, Valid: true}
	}

	if _, err := s.photos.Get(ctx, input.UserID, input.PhotoID); err != nil {
		if errors.Is(err, ErrCloudPhotoNotFound) {
			return dbgen.Animal{}, ErrAnimalSourceNotFound
		}
		return dbgen.Animal{}, err
	}

	animal, err := s.animals.CreateFromCompletedJob(ctx, dbgen.CreateAnimalFromCompletedJobParams{
		Name:    name,
		Species: species,
		Hp:      input.Hp,
		Attack:  input.Attack,
		Evasion: input.Evasion,
		Defense: input.Defense,
		PhotoID: input.PhotoID,
		UserID:  input.UserID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return dbgen.Animal{}, ErrAnimalConflict
	}
	if isUniqueViolationCode(err) {
		return dbgen.Animal{}, ErrAnimalConflict
	}
	return animal, err
}

func (s *AnimalService) Get(ctx context.Context, userID, animalID uuid.UUID) (dbgen.Animal, error) {
	animal, err := s.animals.GetByID(ctx, animalID, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return dbgen.Animal{}, ErrAnimalNotFound
	}
	return animal, err
}

func (s *AnimalService) List(ctx context.Context, userID uuid.UUID, page, pageSize int, sort AnimalSort, q string) (AnimalListResult, error) {
	if page < 1 || pageSize < 1 || pageSize > 100 {
		return AnimalListResult{}, ErrInvalidAnimalRequest
	}

	query := text(strings.TrimSpace(q), strings.TrimSpace(q) != "")
	total, err := s.animals.Count(ctx, userID, query)
	if err != nil {
		return AnimalListResult{}, err
	}

	limit := int32(pageSize)
	offset := int32((page - 1) * pageSize)
	var items []dbgen.Animal
	switch sort {
	case AnimalSortCreatedAtAsc:
		items, err = s.animals.ListCreatedAtAsc(ctx, userID, limit, offset, query)
	case AnimalSortNameAsc:
		items, err = s.animals.ListNameAsc(ctx, userID, limit, offset, query)
	case AnimalSortNameDesc:
		items, err = s.animals.ListNameDesc(ctx, userID, limit, offset, query)
	default:
		items, err = s.animals.ListCreatedAtDesc(ctx, userID, limit, offset, query)
	}
	if err != nil {
		return AnimalListResult{}, err
	}

	return AnimalListResult{
		Items:      items,
		Page:       page,
		PageSize:   pageSize,
		TotalItems: int(total),
		TotalPages: totalPages(int(total), pageSize),
	}, nil
}

func (s *AnimalService) PickupTimeline(ctx context.Context, input TimelinePickupInput) ([]dbgen.Animal, error) {
	if input.Count < 1 || input.Count > 100 || input.CreatedFrom.After(input.CreatedTo) {
		return nil, ErrInvalidAnimalRequest
	}

	return s.animals.PickupTimeline(ctx, dbgen.PickupTimelineAnimalsParams{
		ViewerUserID: input.ViewerUserID,
		CreatedFrom:  pgtype.Timestamptz{Time: input.CreatedFrom, Valid: true},
		CreatedTo:    pgtype.Timestamptz{Time: input.CreatedTo, Valid: true},
		LimitCount:   int32(input.Count),
	})
}

func (s *AnimalService) Update(ctx context.Context, input UpdateAnimalInput) (dbgen.Animal, error) {
	if !input.NameSet && !input.SpeciesSet {
		return dbgen.Animal{}, ErrInvalidAnimalRequest
	}

	var name pgtype.Text
	if input.NameSet {
		trimmed := strings.TrimSpace(input.Name)
		if !validAnimalText(trimmed) {
			return dbgen.Animal{}, ErrInvalidAnimalRequest
		}
		name = pgtype.Text{String: trimmed, Valid: true}
	}

	var species pgtype.Text
	if input.SpeciesSet {
		trimmed := strings.TrimSpace(input.Species)
		if !validAnimalText(trimmed) {
			return dbgen.Animal{}, ErrInvalidAnimalRequest
		}
		species = pgtype.Text{String: trimmed, Valid: true}
	}

	animal, err := s.animals.Update(ctx, dbgen.UpdateAnimalParams{
		Name:    name,
		Species: species,
		ID:      input.AnimalID,
		UserID:  input.UserID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return dbgen.Animal{}, ErrAnimalNotFound
	}
	return animal, err
}

func (s *AnimalService) Delete(ctx context.Context, userID, animalID uuid.UUID) error {
	rows, err := s.animals.Delete(ctx, animalID, userID)
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrAnimalNotFound
	}
	return nil
}

func validAnimalText(value string) bool {
	length := len([]rune(value))
	return length >= 1 && length <= 30
}

func isForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}
