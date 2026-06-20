package handler

import (
	"context"
	"errors"

	gen "github.com/yanagi93/cloud-collection/backend/internal/api/gen"
	"github.com/yanagi93/cloud-collection/backend/internal/api/middleware"
	"github.com/yanagi93/cloud-collection/backend/internal/service"
)

func (h *Handler) PickupTimelineAnimals(ctx context.Context, params gen.PickupTimelineAnimalsParams) (gen.PickupTimelineAnimalsRes, error) {
	userID, ok := middleware.CurrentUserID(ctx)
	if !ok {
		return pickupTimelineAnimalsUnauthorized(), nil
	}

	items, err := h.animals.PickupTimeline(ctx, service.TimelinePickupInput{
		ViewerUserID: userID,
		CreatedFrom:  params.CreatedFrom,
		CreatedTo:    params.CreatedTo,
		Count:        params.Count,
	})
	if errors.Is(err, service.ErrInvalidAnimalRequest) {
		return pickupTimelineAnimalsBadRequest(), nil
	}
	if err != nil {
		return nil, err
	}

	res := gen.TimelinePickup{
		Items: make([]gen.Animal, 0, len(items)),
	}
	for _, item := range items {
		res.Items = append(res.Items, animalResponse(item))
	}
	return &res, nil
}

func pickupTimelineAnimalsBadRequest() *gen.PickupTimelineAnimalsBadRequest {
	return &gen.PickupTimelineAnimalsBadRequest{
		Code:    "INVALID_TIMELINE_PICKUP_REQUEST",
		Message: "期間と取得件数を確認してください",
	}
}

func pickupTimelineAnimalsUnauthorized() *gen.PickupTimelineAnimalsUnauthorized {
	return &gen.PickupTimelineAnimalsUnauthorized{
		Code:    "UNAUTHORIZED",
		Message: "認証が必要です",
	}
}
