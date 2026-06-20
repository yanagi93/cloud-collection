package handler

import (
	"context"
	"errors"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/api/middleware"
	dbgen "github.com/yanagi93/cloud-collection/backend/internal/db/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/service"
)

func (h *Handler) ListAnimals(ctx context.Context, params gen.ListAnimalsParams) (gen.ListAnimalsRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return unauthorizedError(), nil
	}

	result, err := h.animals.List(
		ctx,
		userID,
		params.Page.Or(1),
		params.PageSize.Or(20),
		animalSort(params.Sort.Or(gen.ListAnimalsSortCreatedAtDesc)),
		params.Q.Or(""),
	)
	if errors.Is(err, service.ErrInvalidAnimalRequest) {
		return &gen.Error{
			Code:    "INVALID_REQUEST",
			Message: "page は 1 以上、page_size は 1〜100 で指定してください",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	items := make([]gen.Animal, 0, len(result.Items))
	for _, item := range result.Items {
		items = append(items, animalResponse(item))
	}

	return &gen.AnimalList{
		Items: items,
		Pagination: gen.Pagination{
			Page:       result.Page,
			PageSize:   result.PageSize,
			TotalItems: result.TotalItems,
			TotalPages: result.TotalPages,
		},
	}, nil
}

func (h *Handler) CreateAnimal(ctx context.Context, req *gen.CreateAnimalRequest) (gen.CreateAnimalRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return createAnimalUnauthorized(), nil
	}

	useSuggestedAnimal := req.UseSuggestedAnimal.Or(true)
	animal, err := h.animals.Create(ctx, service.CreateAnimalInput{
		UserID:             userID,
		PhotoID:            req.PhotoID,
		Name:               req.Name,
		UseSuggestedAnimal: useSuggestedAnimal,
		Species:            req.Species.Value,
		SpeciesSet:         req.Species.Set,
	})
	if errors.Is(err, service.ErrInvalidAnimalRequest) {
		return createAnimalBadRequest(), nil
	}
	if errors.Is(err, service.ErrAnimalSourceNotFound) {
		return createAnimalNotFound(), nil
	}
	if errors.Is(err, service.ErrAnimalConflict) {
		return &gen.CreateAnimalConflict{
			Code:    "ANIMAL_CREATE_CONFLICT",
			Message: "処理が完了していない、または既に登録済みです",
		}, nil
	}
	if err != nil {
		return nil, err
	}

	res := animalResponse(animal)
	return &res, nil
}

func (h *Handler) GetAnimal(ctx context.Context, params gen.GetAnimalParams) (gen.GetAnimalRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return getAnimalUnauthorized(), nil
	}

	animal, err := h.animals.Get(ctx, userID, params.AnimalId)
	if errors.Is(err, service.ErrAnimalNotFound) {
		return getAnimalNotFound(), nil
	}
	if err != nil {
		return nil, err
	}

	res := animalResponse(animal)
	return &res, nil
}

func (h *Handler) UpdateAnimal(ctx context.Context, req *gen.UpdateAnimalRequest, params gen.UpdateAnimalParams) (gen.UpdateAnimalRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return updateAnimalUnauthorized(), nil
	}

	animal, err := h.animals.Update(ctx, service.UpdateAnimalInput{
		UserID:     userID,
		AnimalID:   params.AnimalId,
		Name:       req.Name.Value,
		NameSet:    req.Name.Set,
		Species:    req.Species.Value,
		SpeciesSet: req.Species.Set,
	})
	if errors.Is(err, service.ErrInvalidAnimalRequest) {
		return updateAnimalBadRequest(), nil
	}
	if errors.Is(err, service.ErrAnimalNotFound) {
		return updateAnimalNotFound(), nil
	}
	if err != nil {
		return nil, err
	}

	res := animalResponse(animal)
	return &res, nil
}

func (h *Handler) DeleteAnimal(ctx context.Context, params gen.DeleteAnimalParams) (gen.DeleteAnimalRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return deleteAnimalUnauthorized(), nil
	}

	err := h.animals.Delete(ctx, userID, params.AnimalId)
	if errors.Is(err, service.ErrAnimalNotFound) {
		return deleteAnimalNotFound(), nil
	}
	if err != nil {
		return nil, err
	}

	return &gen.DeleteAnimalNoContent{}, nil
}

func animalResponse(animal dbgen.Animal) gen.Animal {
	return gen.Animal{
		ID:                animal.ID,
		UserID:            animal.UserID,
		PhotoID:           animal.PhotoID,
		Name:              animal.Name,
		Species:           animal.Species,
		OriginalImageURL:  gen.NewOptURI(urlValue(animal.OriginalImageUrl)),
		CompositeImageURL: urlValue(animal.CompositeImageUrl),
		Confidence:        gen.NewOptFloat32(float32(animal.Confidence)),
		Description:       apiString(animal.Description),
		CapturedAt:        apiNilDateTime(animal.CapturedAt),
		Location:          apiLocation(animal.Latitude, animal.Longitude),
		CreatedAt:         animal.CreatedAt.Time,
		UpdatedAt:         gen.NewOptDateTime(animal.UpdatedAt.Time),
	}
}

func animalSort(sort gen.ListAnimalsSort) service.AnimalSort {
	return service.AnimalSort(sort)
}

func createAnimalBadRequest() *gen.CreateAnimalBadRequest {
	return &gen.CreateAnimalBadRequest{
		Code:    "INVALID_REQUEST",
		Message: "名前、写真 ID、動物種別の指定を確認してください",
	}
}

func updateAnimalBadRequest() *gen.UpdateAnimalBadRequest {
	return &gen.UpdateAnimalBadRequest{
		Code:    "INVALID_REQUEST",
		Message: "名前または動物種別の指定を確認してください",
	}
}

func createAnimalUnauthorized() *gen.CreateAnimalUnauthorized {
	return &gen.CreateAnimalUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func getAnimalUnauthorized() *gen.GetAnimalUnauthorized {
	return &gen.GetAnimalUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func updateAnimalUnauthorized() *gen.UpdateAnimalUnauthorized {
	return &gen.UpdateAnimalUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func deleteAnimalUnauthorized() *gen.DeleteAnimalUnauthorized {
	return &gen.DeleteAnimalUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}

func createAnimalNotFound() *gen.CreateAnimalNotFound {
	return &gen.CreateAnimalNotFound{
		Code:    "CLOUD_PHOTO_NOT_FOUND",
		Message: "雲の写真が見つかりません",
	}
}

func getAnimalNotFound() *gen.GetAnimalNotFound {
	return &gen.GetAnimalNotFound{
		Code:    "ANIMAL_NOT_FOUND",
		Message: "動物が見つかりません",
	}
}

func updateAnimalNotFound() *gen.UpdateAnimalNotFound {
	return &gen.UpdateAnimalNotFound{
		Code:    "ANIMAL_NOT_FOUND",
		Message: "動物が見つかりません",
	}
}

func deleteAnimalNotFound() *gen.DeleteAnimalNotFound {
	return &gen.DeleteAnimalNotFound{
		Code:    "ANIMAL_NOT_FOUND",
		Message: "動物が見つかりません",
	}
}
